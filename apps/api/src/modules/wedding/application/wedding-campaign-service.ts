import { AccessToken, RoomServiceClient, TrackSource } from "livekit-server-sdk";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_CAMPAIGN_ID,
  WEDDING_MEDIA_STORAGE_ID,
  WEDDING_CAMPAIGN_SLUG,
  WEDDING_COMMENT_MAX_CHARS,
  WEDDING_GALLERY_MAX_BYTES,
  WEDDING_LIVEKIT_ROOM,
  WEDDING_WAITING_AUDIO_MAX_BYTES,
  deriveWeddingModalEndsAt,
  type WeddingBroadcastFeed,
  type WeddingCampaignRecord,
  type WeddingLiveMode,
  type WeddingStreamStatus,
  type WeddingWaitingTrack,
} from "@hamd/constants";

import { AppError } from "../../../lib/app-error.js";
import type { Environment } from "../../../config/env.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import {
  type DatabaseClient,
  weddingCampaignDelegate,
  weddingWaitingTrackDelegate,
} from "../../../shared/database/database-client.js";
import type { UploadedFileInput } from "../../media/document/application/document-service.js";
import {
  catalogMediaKindFromMime,
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "../../catalog/infrastructure/catalog-media-policy.js";
import {
  createCatalogMediaStore,
  type CatalogMediaStore,
} from "../../catalog/infrastructure/catalog-media-store.js";

export type WeddingCommentDto = {
  id: string;
  displayName: string;
  message: string;
  createdAt: string;
  hidden?: boolean;
};

export type WeddingGalleryItemDto = {
  id: string;
  kind: "image" | "video";
  src: string;
  title: string;
  caption: string;
  featured: boolean;
  downloadable: boolean;
  sortOrder: number;
};

export type WeddingRecordingDto = {
  id: string;
  storageKey: string;
  publicUrl: string | null;
  durationSeconds: number | null;
  sizeBytes: number | null;
  mimeType: string;
  status: "starting" | "recording" | "ready" | "failed";
  downloadable: boolean;
  createdAt: string;
};

const commentWindow = new Map<string, number>();
const viewers = new Map<
  string,
  { id: string; displayName: string; email: string | null; joinedAt: string; state: "watching" }
>();
const feeds = new Map<string, WeddingBroadcastFeed>();
const waitingTracks: WeddingWaitingTrack[] = [];
let waitingHydrated = false;
let waitingHydratePromise: Promise<void> | null = null;
const CANONICAL_WEDDING_EVENT_DATE = DEFAULT_WEDDING_CAMPAIGN.eventAt;

/**
 * The catalog media store requires a UUID-shaped productId for its object-key namespace.
 * Keep this separate from WEDDING_CAMPAIGN_ID, which is the logical/database campaign id.
 */
// const WEDDING_MEDIA_STORAGE_ID = "9c7f5d2e-8a61-4c95-b1d7-2f8a6e3c4b90";

function canonicalizeWeddingEventDate(campaign: WeddingCampaignRecord): WeddingCampaignRecord {
  // Rowdotul HAMD'26 has one authoritative production start:
  // 26 Sep 2026, 09:00 WAT (UTC+01:00). Do not allow an older persisted
  // Ops value or browser timezone formatting to move the countdown target.
  const eventAt = CANONICAL_WEDDING_EVENT_DATE;
  const streamAt = CANONICAL_WEDDING_EVENT_DATE;
  const parsed = Date.parse(eventAt);
  const modalEndsAt = Number.isNaN(parsed)
    ? campaign.modalEndsAt
    : new Date(parsed + 3 * 24 * 60 * 60 * 1000).toISOString();
  return { ...campaign, eventAt, streamAt, modalEndsAt };
}

let overlay: WeddingCampaignRecord = canonicalizeWeddingEventDate({ ...DEFAULT_WEDDING_CAMPAIGN });
let campaignHydrated = false;
let campaignHydratePromise: Promise<void> | null = null;
let campaignPersistChain: Promise<void> = Promise.resolve();
const comments: WeddingCommentDto[] = [];
const testComments: WeddingCommentDto[] = [];
const gallery: WeddingGalleryItemDto[] = [];
let recording: WeddingRecordingDto | null = null;

function isOps(auth?: AuthContext): boolean {
  return Boolean(auth?.permissionKeys.has("ops:access"));
}

export function isPublicWeddingWaitingTrackUsable(
  row: Pick<WeddingWaitingTrack, "src">,
  nodeEnv: string,
): boolean {
  const src = row.src.trim();
  if (!src) return false;

  // Local catalog-media URLs are valid in development/test, where the local
  // media store is supported. Production forbids the local media driver, so
  // persisted relative URLs point at ephemeral/stale local files and must not
  // be exposed to public listeners.
  if (nodeEnv !== "production") return true;

  try {
    const url = new URL(src);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function weddingHostIdentity(userId: string, sessionId: string): string {
  return `host:${userId}:${sessionId}`;
}

function sanitizeWeddingFeedLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const allowed = ["Main Stage", "Venue View", "Family View", "Reception"];
  if (allowed.includes(trimmed)) return trimmed;
  if (trimmed.length < 3 || trimmed.length > 40) return "Main Stage";
  if (!/^[A-Za-z][A-Za-z0-9 '.-]*$/.test(trimmed)) return "Main Stage";
  if (/^(admin|user|camera)\b/i.test(trimmed)) return "Main Stage";
  return trimmed;
}

function displayNameFromAuth(auth: AuthContext): string {
  return auth.userId.slice(0, 8);
}

export class WeddingCampaignService {
  public constructor(
    private readonly environment: Environment,
    private readonly database?: DatabaseClient,
    private readonly media: CatalogMediaStore = createCatalogMediaStore({
      uploadRoot: environment.UPLOAD_ROOT,
      driver: environment.CATALOG_MEDIA_DRIVER,
      nodeEnv: environment.NODE_ENV,
      s3Bucket: environment.CATALOG_MEDIA_S3_BUCKET,
      s3Region: environment.AWS_REGION,
      s3AccessKeyId: environment.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
      s3PublicBaseUrl: environment.CATALOG_MEDIA_S3_PUBLIC_BASE_URL,
      supabaseUrl: environment.CATALOG_MEDIA_SUPABASE_URL,
      supabaseServiceRoleKey: environment.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
      supabaseBucket: environment.CATALOG_MEDIA_SUPABASE_BUCKET,
    }),
  ) {}

  public areTestControlsEnabled(): boolean {
    return Boolean(this.environment.WEDDING_TEST_CONTROLS) && this.environment.NODE_ENV !== "production";
  }

  public isTestBroadcastEligible(auth?: AuthContext): boolean {
    return isOps(auth) || this.areTestControlsEnabled();
  }

  public async ensureCampaignHydrated(): Promise<void> {
    if (!this.database) {
      campaignHydrated = true;
      return;
    }
    if (campaignHydrated) return;
    if (!campaignHydratePromise) {
      campaignHydratePromise = this.hydrateCampaignFromDatabase().finally(() => {
        campaignHydrated = true;
      });
    }
    await campaignHydratePromise;
  }

  /** Refresh persisted campaign switches across API instances. */
  public async refreshCampaign(): Promise<void> {
    await this.flushCampaignPersistence();
    await this.hydrateCampaignFromDatabase();
  }

  public getCampaign(auth?: AuthContext): WeddingCampaignRecord {
    const eligible = this.isTestBroadcastEligible(auth);
    let campaign = canonicalizeWeddingEventDate(overlay);
    // An "ended" value persisted before the scheduled wedding cannot represent
    // the real celebration ending. Treat that legacy/rehearsal state as waiting.
    // After the scheduled stream time, only the explicit Ops End Live action
    // persists the genuine production-ended state.
    const streamStartsAt = Date.parse(campaign.streamAt);
    if (
      campaign.streamStatus === "ended" &&
      Number.isFinite(streamStartsAt) &&
      Date.now() < streamStartsAt
    ) {
      campaign = {
        ...campaign,
        streamStatus: "upcoming",
        campaignStatus: "upcoming",
        liveMode: "none",
        endedKind: "none",
      };
    }
    // A completed test broadcast is historical rehearsal metadata only. It must
    // never make the normal guest live route look concluded.
    if (campaign.endedKind === "test" && campaign.streamStatus !== "live") {
      campaign = {
        ...campaign,
        streamStatus: "upcoming",
        liveMode: "none",
      };
    }
    if (!isOps(auth) && campaign.campaignStatus === "draft") {
      campaign = { ...campaign, modalEnabled: false };
    }
    if (campaign.liveMode === "test" && !eligible) {
      campaign = {
        ...campaign,
        streamStatus: campaign.streamStatus === "ended" ? "ended" : "upcoming",
        liveMode: "none",
        endedKind: campaign.endedKind === "test" ? "none" : campaign.endedKind,
      };
    }
    return {
      ...campaign,
      testBroadcastEligible: eligible,
      waitingMusicEnabled: campaign.waitingMusicEnabled ?? false,
      waitingMusicLoop: campaign.waitingMusicLoop !== false,
      primaryFeedId: campaign.primaryFeedId ?? null,
      feeds: [...feeds.values()].map((row) =>
        isOps(auth)
          ? row
          : {
              feedId: row.feedId,
              label: row.label,
              identity: "",
              primary: row.primary,
              status: row.status,
            },
      ),
    };
  }

  public updateInvitation(
    auth: AuthContext,
    patch: Partial<{
      coupleNames: string | undefined;
      familyLine: string | undefined;
      invitationHeading: string | undefined;
      invitationBody: string | undefined;
      eventAt: string | undefined;
      streamAt: string | undefined;
      venue: string | undefined;
      venueAddress: string | undefined;
      modalEnabled: boolean | undefined;
      commentsEnabled: boolean | undefined;
      galleryEnabled: boolean | undefined;
      recordingDownloadEnabled: boolean | undefined;
    }>,
  ): WeddingCampaignRecord {
    this.assertOps(auth);
    const defined = Object.fromEntries(
      Object.entries(patch).filter((entry) => entry[1] !== undefined),
    );
    const next = canonicalizeWeddingEventDate({
      ...overlay,
      ...defined,
      id: WEDDING_CAMPAIGN_ID,
      slug: overlay.slug,
    });
    if (patch.eventAt) {
      next.modalEndsAt = deriveWeddingModalEndsAt(next.eventAt);
    }
    overlay = next;
    this.persistCampaign();
    return overlay;
  }

  public setStreamStatus(auth: AuthContext, status: WeddingStreamStatus): WeddingCampaignRecord {
    this.assertOps(auth);
    overlay = {
      ...overlay,
      streamStatus: status,
      campaignStatus: status === "live" || status === "ended" ? status : overlay.campaignStatus,
      liveMode: status === "live" ? "production" : "none",
      endedKind: status === "ended" ? "production" : status === "live" ? "none" : overlay.endedKind,
      recordingAvailable:
        status === "ended"
          ? Boolean(recording && recording.status === "ready")
          : overlay.recordingAvailable,
    };
    if (status !== "live") {
      viewers.clear();
      feeds.clear();
    }
    this.persistCampaign();
    return overlay;
  }

  public startLive(
    auth: AuthContext,
    mode: "test" | "production" = "production",
    options: { feedLabel?: string; captureWidth?: number; captureHeight?: number; captureFps?: number } = {},
  ): WeddingCampaignRecord {
    this.assertOps(auth);
    if (mode === "test" && this.environment.NODE_ENV === "production") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Test broadcasts are not available in production.",
      });
    }
    const alreadyLive = overlay.streamStatus === "live" && overlay.liveMode === mode;
    overlay = {
      ...overlay,
      streamStatus: "live",
      campaignStatus: mode === "production" ? "live" : overlay.campaignStatus,
      liveMode: mode,
      endedKind: "none",
    };
    if (!alreadyLive) {
      viewers.clear();
      feeds.clear();
    }
    const identity = weddingHostIdentity(auth.userId, auth.sessionId);
    const label = sanitizeWeddingFeedLabel(options.feedLabel ?? "Main Stage");
    const existing = feeds.get(identity);
    const feedId = existing?.feedId ?? randomUUID();
    const primary = feeds.size === 0 || overlay.primaryFeedId === feedId;
    const feed: WeddingBroadcastFeed = {
      feedId,
      label,
      identity,
      primary,
      status: "live",
    };
    if (options.captureWidth !== undefined) feed.captureWidth = options.captureWidth;
    if (options.captureHeight !== undefined) feed.captureHeight = options.captureHeight;
    if (options.captureFps !== undefined) feed.captureFps = options.captureFps;
    feeds.set(identity, feed);
    if (primary) {
      for (const row of feeds.values()) row.primary = row.feedId === feedId;
      overlay = { ...overlay, primaryFeedId: feedId };
    }
    this.persistCampaign();
    return this.getCampaign(auth);
  }

  public applyTestControl(auth: AuthContext, action: string): WeddingCampaignRecord {
    this.assertOps(auth);
    if (!this.environment.WEDDING_TEST_CONTROLS || this.environment.NODE_ENV === "production") {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Wedding test controls are disabled.",
      });
    }
    if (action === "upcoming") return this.setStreamStatus(auth, "upcoming");
    if (action === "live") return this.setStreamStatus(auth, "live");
    if (action === "ended") return this.setStreamStatus(auth, "ended");
    if (action === "disable-modal") {
      overlay = { ...overlay, modalEnabled: false };
      this.persistCampaign();
      return overlay;
    }
    if (action === "enable-modal") {
      overlay = { ...overlay, modalEnabled: true };
      this.persistCampaign();
      return overlay;
    }
    throw new AppError({
      statusCode: 400,
      code: "VALIDATION_ERROR",
      message: "Unknown test action.",
    });
  }

  public isLiveKitConfigured(): boolean {
    return Boolean(
      this.environment.LIVEKIT_URL &&
        this.environment.LIVEKIT_API_KEY &&
        this.environment.LIVEKIT_API_SECRET,
    );
  }

  public liveStatus(): { configured: boolean } {
    return { configured: this.isLiveKitConfigured() };
  }

  public async liveToken(
    auth: AuthContext,
    requestedRole: "host" | "viewer",
    requestedMode?: "test" | "production",
    extras: { feedLabel?: string } = {},
  ): Promise<{
    url: string;
    serverUrl: string;
    token: string;
    role: "host" | "viewer";
    room: string;
    identity: string;
  }> {
    const url = this.environment.LIVEKIT_URL;
    const apiKey = this.environment.LIVEKIT_API_KEY;
    const apiSecret = this.environment.LIVEKIT_API_SECRET;
    if (!url || !apiKey || !apiSecret) {
      throw new AppError({
        statusCode: 503,
        code: "LIVEKIT_UNAVAILABLE",
        message: "We couldn't connect to the live-streaming service.",
      });
    }
    const host = requestedRole === "host" && isOps(auth);
    const role = host ? "host" : "viewer";
    const mode: WeddingLiveMode =
      requestedMode ?? (overlay.liveMode === "test" ? "test" : "production");
    if (mode === "test" && !this.isTestBroadcastEligible(auth)) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "This test broadcast is not available.",
      });
    }
    if (role === "viewer") {
      if (overlay.streamStatus !== "live" || overlay.liveMode !== mode) {
        throw new AppError({
          statusCode: 409,
          code: "LIVE_NOT_ACTIVE",
          message: "The live celebration has not started.",
        });
      }
      const named = await this.resolveGuest(auth);
      viewers.set(auth.userId, named);
    }
    const room = mode === "test" ? `${WEDDING_LIVEKIT_ROOM}-test` : WEDDING_LIVEKIT_ROOM;
    const identity =
      role === "host" ? weddingHostIdentity(auth.userId, auth.sessionId) : `viewer:${auth.userId}`;
    const label = role === "host" ? sanitizeWeddingFeedLabel(extras.feedLabel ?? "Main Stage") : undefined;
    const access = new AccessToken(apiKey, apiSecret, {
      identity,
      name: label ?? (await this.resolveDisplayName(auth)),
      metadata: JSON.stringify(
        role === "host"
          ? { kind: "host", feedId: identity, label, primary: overlay.primaryFeedId === identity }
          : { kind: "viewer" },
      ),
      ttl: "8h",
    });
    access.addGrant({
      roomJoin: true,
      room,
      canPublish: role === "host",
      canSubscribe: true,
      canPublishData: false,
      canPublishSources: role === "host" ? [TrackSource.CAMERA, TrackSource.MICROPHONE] : [],
    });
    const token = await access.toJwt();
    return { url, serverUrl: url, token, role, room, identity };
  }

  public async stopMyBroadcast(auth: AuthContext): Promise<WeddingCampaignRecord> {
    this.assertOps(auth);
    const identity = weddingHostIdentity(auth.userId, auth.sessionId);
    const feed = feeds.get(identity);
    if (feed) {
      feeds.delete(identity);
      if (overlay.primaryFeedId === identity) {
        const next = [...feeds.values()].find((row) => row.status === "live");
        overlay = { ...overlay, primaryFeedId: next?.feedId ?? null };
        if (next) {
          for (const row of feeds.values()) row.primary = row.feedId === next.feedId;
        }
      }
    }
    await this.removeLiveKitParticipant(identity);
    this.persistCampaign();
    return this.getCampaign(auth);
  }

  public setPrimaryFeed(auth: AuthContext, feedId: string): WeddingCampaignRecord {
    this.assertOps(auth);
    const feed = [...feeds.values()].find((row) => row.feedId === feedId);
    if (!feed) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Broadcast feed not found." });
    }
    for (const row of feeds.values()) row.primary = row.feedId === feedId;
    overlay = { ...overlay, primaryFeedId: feedId };
    this.persistCampaign();
    return this.getCampaign(auth);
  }

  public async endLive(auth: AuthContext): Promise<WeddingCampaignRecord> {
    this.assertOps(auth);
    const mode = overlay.liveMode === "test" ? "test" : "production";
    const room = mode === "test" ? `${WEDDING_LIVEKIT_ROOM}-test` : WEDDING_LIVEKIT_ROOM;
    if (mode === "test") {
      overlay = {
        ...overlay,
        streamStatus: "upcoming",
        liveMode: "none",
        endedKind: "test",
        campaignStatus: overlay.campaignStatus === "live" ? "upcoming" : overlay.campaignStatus,
      };
    } else {
      overlay = {
        ...overlay,
        streamStatus: "ended",
        campaignStatus: "ended",
        liveMode: "none",
        endedKind: "production",
        recordingAvailable: Boolean(recording && recording.status === "ready"),
      };
    }
    viewers.clear();
    feeds.clear();
    overlay = { ...overlay, primaryFeedId: null };
    await this.closeLiveKitRoom(room);
    this.persistCampaign();
    return overlay;
  }

  public async viewerSummary(auth: AuthContext) {
    this.assertOps(auth);
    const mode = overlay.liveMode === "test" ? "test" : "production";
    const room = mode === "test" ? `${WEDDING_LIVEKIT_ROOM}-test` : WEDDING_LIVEKIT_ROOM;
    let liveViewerCount = viewers.size;
    if (this.isLiveKitConfigured() && overlay.streamStatus === "live") {
      try {
        const client = new RoomServiceClient(
          this.environment.LIVEKIT_URL!,
          this.environment.LIVEKIT_API_KEY!,
          this.environment.LIVEKIT_API_SECRET!,
        );
        const participants = await client.listParticipants(room);
        liveViewerCount = participants.filter((participant) =>
          participant.identity.startsWith("viewer:"),
        ).length;
      } catch {
        // Keep the last application-side count if LiveKit presence is temporarily unavailable.
      }
    }
    return {
      viewerCount: liveViewerCount,
      guests: [...viewers.values()].map((row) => ({
        id: row.id,
        displayName: row.displayName,
        email: row.email,
        joinedAt: row.joinedAt,
        state: row.state,
      })),
    };
  }

  public async listWaitingTracks(includeDisabled = false): Promise<WeddingWaitingTrack[]> {
    await this.ensureWaitingTracksHydrated();
    return waitingTracks
      .filter((row) => includeDisabled || (row.isEnabled && this.isPublicWaitingTrackUsable(row)))
      .sort((a, b) => a.position - b.position)
      .map((row) => this.presentWaitingTrack(row, includeDisabled));
  }

  public async setWaitingMusicEnabled(
    auth: AuthContext,
    patch: { enabled?: boolean; loop?: boolean },
  ): Promise<WeddingCampaignRecord> {
    this.assertOps(auth);
    await this.ensureWaitingTracksHydrated();
    overlay = {
      ...overlay,
      waitingMusicEnabled: patch.enabled ?? overlay.waitingMusicEnabled ?? false,
      waitingMusicLoop: patch.loop ?? overlay.waitingMusicLoop !== false,
    };
    await this.persistWaitingPlaylist();
    return this.getCampaign(auth);
  }

  public async reorderWaitingTracks(auth: AuthContext, ids: string[]): Promise<WeddingWaitingTrack[]> {
    this.assertOps(auth);
    await this.ensureWaitingTracksHydrated();
    const now = new Date().toISOString();
    ids.forEach((id, index) => {
      const row = waitingTracks.find((item) => item.id === id);
      if (row) {
        row.position = index;
        row.sortOrder = index;
        row.updatedAt = now;
      }
    });
    await this.persistWaitingPlaylist();
    return this.listWaitingTracks(true);
  }

  public async addWaitingTrack(
    auth: AuthContext,
    file: UploadedFileInput,
    meta: { title?: string; caption?: string; durationSeconds?: number } = {},
  ): Promise<WeddingWaitingTrack> {
    this.assertOps(auth);
    await this.ensureWaitingTracksHydrated();
    const sniffed = sniffWeddingAudioMime(file.buffer);
    if (!sniffed) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_MIME",
        message: "Use an MP3 or M4A/AAC audio file.",
      });
    }
    if (file.sizeBytes > WEDDING_WAITING_AUDIO_MAX_BYTES) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_SIZE",
        message: `Each waiting-room track must be ${Math.round(WEDDING_WAITING_AUDIO_MAX_BYTES / (1024 * 1024))} MB or smaller.`,
      });
    }
    const stored = await this.media.put({
      productId: WEDDING_MEDIA_STORAGE_ID,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    const now = new Date().toISOString();
    const duration =
      typeof meta.durationSeconds === "number" && Number.isFinite(meta.durationSeconds) && meta.durationSeconds > 0
        ? Math.min(meta.durationSeconds, 4 * 60 * 60)
        : null;
    const row: WeddingWaitingTrack = {
      id: randomUUID(),
      weddingCampaignId: WEDDING_CAMPAIGN_ID,
      title: meta.title?.trim() || file.originalFilename.replace(/\.[^.]+$/, ""),
      caption: meta.caption?.trim() || "",
      storageKey: stored.filename,
      src: stored.publicUrl,
      mimeType: sniffed,
      fileSize: file.sizeBytes,
      durationSeconds: duration,
      position: waitingTracks.length,
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
      sortOrder: waitingTracks.length,
      enabled: true,
    };
    waitingTracks.push(row);
    overlay = { ...overlay, waitingMusicEnabled: true, waitingMusicLoop: overlay.waitingMusicLoop !== false };
    await this.persistWaitingPlaylist();
    return this.presentWaitingTrack(row, true);
  }

  public async updateWaitingTrack(
    auth: AuthContext,
    id: string,
    patch: Partial<{ title: string; caption: string; enabled: boolean; isEnabled: boolean; sortOrder: number; position: number }>,
  ): Promise<WeddingWaitingTrack> {
    this.assertOps(auth);
    await this.ensureWaitingTracksHydrated();
    const row = waitingTracks.find((item) => item.id === id);
    if (!row) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Waiting track not found." });
    }
    if (patch.title !== undefined) row.title = patch.title.trim() || row.title;
    if (patch.caption !== undefined) row.caption = patch.caption.trim();
    if (patch.enabled !== undefined || patch.isEnabled !== undefined) {
      row.isEnabled = patch.isEnabled ?? patch.enabled ?? row.isEnabled;
      row.enabled = row.isEnabled;
    }
    if (patch.sortOrder !== undefined || patch.position !== undefined) {
      row.position = patch.position ?? patch.sortOrder ?? row.position;
      row.sortOrder = row.position;
    }
    row.updatedAt = new Date().toISOString();
    await this.persistWaitingPlaylist();
    return this.presentWaitingTrack(row, true);
  }

  public async removeWaitingTrack(auth: AuthContext, id: string): Promise<void> {
    this.assertOps(auth);
    await this.ensureWaitingTracksHydrated();
    const index = waitingTracks.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Waiting track not found." });
    }
    const [removed] = waitingTracks.splice(index, 1);
    if (removed?.storageKey) {
      await this.media.remove({ productId: WEDDING_MEDIA_STORAGE_ID, filename: removed.storageKey });
    }
    waitingTracks.forEach((row, position) => {
      row.position = position;
      row.sortOrder = position;
    });
    await this.persistWaitingPlaylist();
  }

  public listComments(includeHidden = false, channel: "test" | "production" = "production"): WeddingCommentDto[] {
    const source = channel === "test" ? testComments : comments;
    return source.filter((row) => includeHidden || !row.hidden);
  }

  public async addComment(auth: AuthContext, message: string): Promise<WeddingCommentDto> {
    if (!overlay.commentsEnabled) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "Comments are disabled for this celebration.",
      });
    }
    const text = message.trim();
    if (!text || text.length > WEDDING_COMMENT_MAX_CHARS) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: `Comments must be between 1 and ${WEDDING_COMMENT_MAX_CHARS} characters.`,
      });
    }
    const last = commentWindow.get(auth.userId) ?? 0;
    if (Date.now() - last < 3000) {
      throw new AppError({
        statusCode: 429,
        code: "RATE_LIMITED",
        message: "Please wait a moment before sending another message.",
      });
    }
    commentWindow.set(auth.userId, Date.now());
    const row: WeddingCommentDto = {
      id: randomUUID(),
      displayName: await this.resolveDisplayName(auth),
      message: text,
      createdAt: new Date().toISOString(),
    };
    const channel = overlay.liveMode === "test" ? testComments : comments;
    channel.push(row);
    return row;
  }

  public moderateComment(auth: AuthContext, id: string, hidden: boolean): WeddingCommentDto {
    this.assertOps(auth);
    const row = comments.find((item) => item.id === id) ?? testComments.find((item) => item.id === id);
    if (!row) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Comment not found." });
    }
    row.hidden = hidden;
    return row;
  }

  public listGallery(): WeddingGalleryItemDto[] {
    return [...gallery].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public async addGalleryItem(
    auth: AuthContext,
    file: UploadedFileInput,
    meta: { title?: string; caption?: string; downloadable?: boolean },
  ): Promise<WeddingGalleryItemDto> {
    this.assertOps(auth);
    const sniffed = sniffCatalogMediaMime(file.buffer);
    const mime = sniffed ?? file.mimeType;
    const kind = catalogMediaKindFromMime(mime);
    if (!kind) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_MIME",
        message: "Use a JPEG, PNG, GIF, WebP, or MP4 file.",
      });
    }
    if (file.sizeBytes > WEDDING_GALLERY_MAX_BYTES) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_SIZE",
        message: "Each gallery file must be 10 MB or smaller.",
      });
    }
    const issues = validateCatalogMediaUpload({
      filename: file.originalFilename,
      mimeType: mime,
      sizeBytes: file.sizeBytes,
      kind,
      bytes: file.buffer,
    });
    const sizeIssue = issues.find((item) => item.code === "UPLOAD_SIZE");
    if (kind === "video" && file.sizeBytes > WEDDING_GALLERY_MAX_BYTES) {
      throw new AppError({
        statusCode: 422,
        code: "UPLOAD_SIZE",
        message: "Each gallery file must be 10 MB or smaller.",
      });
    }
    if (issues.some((item) => item.code !== "UPLOAD_SIZE") || (kind === "image" && sizeIssue)) {
      const first = issues[0];
      throw new AppError({
        statusCode: 422,
        code: first?.code ?? "VALIDATION_ERROR",
        message: first?.message ?? "Invalid gallery file.",
      });
    }
    const stored = await this.media.put({
      productId: WEDDING_MEDIA_STORAGE_ID,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    const item: WeddingGalleryItemDto = {
      id: randomUUID(),
      kind,
      src: stored.publicUrl,
      title: meta.title?.trim() || file.originalFilename.replace(/\.[^.]+$/, ""),
      caption: meta.caption?.trim() || "",
      featured: gallery.length === 0,
      downloadable: Boolean(meta.downloadable),
      sortOrder: gallery.length,
    };
    gallery.push(item);
    return item;
  }

  public updateGalleryItem(
    auth: AuthContext,
    id: string,
    patch: Partial<{
      title: string | undefined;
      caption: string | undefined;
      featured: boolean | undefined;
      downloadable: boolean | undefined;
      sortOrder: number | undefined;
    }>,
  ): WeddingGalleryItemDto {
    this.assertOps(auth);
    const item = gallery.find((row) => row.id === id);
    if (!item) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Gallery item not found." });
    }
    const defined = Object.fromEntries(
      Object.entries(patch).filter((entry) => entry[1] !== undefined),
    );
    Object.assign(item, defined);
    return item;
  }

  public removeGalleryItem(auth: AuthContext, id: string): void {
    this.assertOps(auth);
    const index = gallery.findIndex((row) => row.id === id);
    if (index === -1) {
      throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Gallery item not found." });
    }
    gallery.splice(index, 1);
  }

  public getRecording(): WeddingRecordingDto | null {
    return recording;
  }

  private async closeLiveKitRoom(room = WEDDING_LIVEKIT_ROOM): Promise<void> {
    if (!this.isLiveKitConfigured()) return;
    try {
      const url = this.environment.LIVEKIT_URL ?? "";
      const httpUrl = url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
      const client = new RoomServiceClient(
        httpUrl,
        this.environment.LIVEKIT_API_KEY ?? "",
        this.environment.LIVEKIT_API_SECRET ?? "",
      );
      await client.deleteRoom(room);
    } catch {
      process.stderr.write("[wedding-live] LiveKit room close was skipped.\n");
    }
  }

  private async removeLiveKitParticipant(identity: string): Promise<void> {
    if (!this.isLiveKitConfigured()) return;
    try {
      const url = this.environment.LIVEKIT_URL ?? "";
      const httpUrl = url.replace(/^wss:/i, "https:").replace(/^ws:/i, "http:");
      const client = new RoomServiceClient(
        httpUrl,
        this.environment.LIVEKIT_API_KEY ?? "",
        this.environment.LIVEKIT_API_SECRET ?? "",
      );
      const mode = overlay.liveMode === "test" ? "test" : "production";
      const room = mode === "test" ? `${WEDDING_LIVEKIT_ROOM}-test` : WEDDING_LIVEKIT_ROOM;
      await client.removeParticipant(room, identity);
    } catch {
      process.stderr.write("[wedding-live] LiveKit participant removal was skipped.\n");
    }
  }

  private async resolveGuest(auth: AuthContext): Promise<{
    id: string;
    displayName: string;
    email: string | null;
    joinedAt: string;
    state: "watching";
  }> {
    const existing = viewers.get(auth.userId);
    if (existing) return { ...existing, state: "watching" };
    let email: string | null = null;
    let displayName = await this.resolveDisplayName(auth);
    if (this.database) {
      try {
        const user = await this.database.user.findUnique({
          where: { id: auth.userId },
          select: { displayName: true, firstName: true, lastName: true, email: true },
        });
        email = user?.email ?? null;
        const named =
          user?.displayName?.trim() ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
        if (named) displayName = named;
      } catch {
        /* keep fallback */
      }
    }
    return {
      id: randomUUID(),
      displayName,
      email,
      joinedAt: new Date().toISOString(),
      state: "watching",
    };
  }

  private async resolveDisplayName(auth: AuthContext): Promise<string> {
    if (this.database) {
      try {
        const user = await this.database.user.findUnique({
          where: { id: auth.userId },
          select: { displayName: true, firstName: true, lastName: true },
        });
        const named =
          user?.displayName?.trim() ||
          [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
        if (named) return named;
      } catch {
        /* keep fallback */
      }
    }
    return displayNameFromAuth(auth);
  }

  private assertOps(auth?: AuthContext): asserts auth is AuthContext {
    if (!auth || !isOps(auth)) {
      throw new AppError({
        statusCode: 403,
        code: "FORBIDDEN",
        message: "You do not have permission to manage the wedding campaign.",
      });
    }
  }

  private isPublicWaitingTrackUsable(row: WeddingWaitingTrack): boolean {
    return isPublicWeddingWaitingTrackUsable(row, this.environment.NODE_ENV);
  }

  private presentWaitingTrack(row: WeddingWaitingTrack, includeStorage: boolean): WeddingWaitingTrack {
    const usable = includeStorage || this.isPublicWaitingTrackUsable(row);
    return {
      ...row,
      src: usable ? row.src : "",
      storageKey: includeStorage ? row.storageKey : "",
      sortOrder: row.position,
      enabled: usable && row.isEnabled,
      isEnabled: usable && row.isEnabled,
    };
  }

  private async ensureWaitingTracksHydrated(): Promise<void> {
    if (waitingHydrated) return;
    if (waitingHydratePromise) {
      await waitingHydratePromise;
      return;
    }
    waitingHydratePromise = this.loadWaitingTracks();
    await waitingHydratePromise;
  }

  private async loadWaitingTracks(): Promise<void> {
    try {
      const fromDb = await this.loadWaitingTracksFromDatabase();
      if (fromDb) {
        waitingTracks.length = 0;
        waitingTracks.push(...fromDb);
        await this.hydrateWaitingMusicConfig();
        waitingHydrated = true;
        return;
      }
      if (this.environment.NODE_ENV === "production") throw new Error("Waiting playlist database unavailable");
      const fromFile = await this.loadWaitingTracksFromFile();
      if (fromFile) {
        waitingTracks.length = 0;
        waitingTracks.push(...fromFile);
      }
      waitingHydrated = true;
    } catch {
      if (this.environment.NODE_ENV === "production") throw new AppError({
        statusCode: 503, code: "WEDDING_PERSISTENCE_UNAVAILABLE",
        message: "Waiting music is temporarily unavailable. Please retry.",
      });
      /* keep in-memory if durable stores are unavailable */
      waitingHydrated = true;
    } finally {
      waitingHydratePromise = null;
    }
  }

  private async loadWaitingTracksFromDatabase(): Promise<WeddingWaitingTrack[] | null> {
    if (!this.database) return null;
    try {
      const rows = await weddingWaitingTrackDelegate(this.database).findMany({
        where: { weddingCampaignId: WEDDING_CAMPAIGN_ID },
        orderBy: { position: "asc" },
      });
      return rows.map(fromPersistedTrack);
    } catch {
      return null;
    }
  }

  private async loadWaitingTracksFromFile(): Promise<WeddingWaitingTrack[] | null> {
    try {
      const raw = await readFile(this.waitingPlaylistPath(), "utf8");
      const parsed = JSON.parse(raw) as {
        tracks?: WeddingWaitingTrack[];
        loop?: boolean;
        enabled?: boolean;
      };
      if (!this.database) overlay = {
        ...overlay,
        waitingMusicLoop: parsed.loop ?? overlay.waitingMusicLoop !== false,
        waitingMusicEnabled: parsed.enabled ?? (Array.isArray(parsed.tracks) && parsed.tracks.length > 0),
      };
      if (!Array.isArray(parsed.tracks)) return null;
      return parsed.tracks.map((row) => normalizeWaitingTrack(row));
    } catch {
      return null;
    }
  }

  private campaignRowPayload(): Record<string, unknown> {
    const { feeds: _feeds, testBroadcastEligible: _eligible, ...stored } = overlay;
    void _feeds;
    void _eligible;
    return stored;
  }

  private async hydrateCampaignFromDatabase(): Promise<void> {
    if (!this.database) return;
    try {
      const row = await weddingCampaignDelegate(this.database).findUnique({
        where: { id: WEDDING_CAMPAIGN_ID },
      });
      if (row?.overlay && typeof row.overlay === "object") {
        const stored = row.overlay as Partial<WeddingCampaignRecord>;
        overlay = canonicalizeWeddingEventDate({
          ...DEFAULT_WEDDING_CAMPAIGN,
          ...stored,
          modalEnabled: stored.modalEnabled === true,
          id: WEDDING_CAMPAIGN_ID,
          slug: WEDDING_CAMPAIGN_SLUG,
          streamStatus:
            (row.streamStatus as WeddingStreamStatus | undefined) ??
            stored.streamStatus ??
            overlay.streamStatus,
        });
        return;
      }
      await this.writeCampaignRow();
    } catch (error) {
      if (this.environment.NODE_ENV === "production") throw error;
      /* Development can start before migrations are applied. */
    }
  }

  private async writeCampaignRow(): Promise<void> {
    if (!this.database) return;
    await weddingCampaignDelegate(this.database).upsert({
      where: { id: WEDDING_CAMPAIGN_ID },
      create: {
        id: WEDDING_CAMPAIGN_ID,
        slug: overlay.slug,
        streamStatus: overlay.streamStatus,
        overlay: this.campaignRowPayload(),
      },
      update: {
        slug: overlay.slug,
        streamStatus: overlay.streamStatus,
        overlay: this.campaignRowPayload(),
      },
    });
  }

  private persistCampaign(): void {
    if (!this.database) return;
    campaignPersistChain = campaignPersistChain
      .then(async () => {
        await this.ensureCampaignHydrated();
        await this.writeCampaignRow();
      })
      .catch((error: unknown) => { this.campaignPersistenceError = error; });
  }

  private campaignPersistenceError: unknown;

  public async flushCampaignPersistence(): Promise<void> {
    await this.ensureCampaignHydrated();
    await campaignPersistChain;
    if (this.campaignPersistenceError) {
      const error = this.campaignPersistenceError;
      this.campaignPersistenceError = undefined;
      throw error;
    }
  }

  private async persistWaitingPlaylist(): Promise<void> {
    const wroteDb = await this.persistWaitingTracksToDatabase();
    if (!wroteDb) {
      if (this.environment.NODE_ENV === "production") throw new AppError({
        statusCode: 503, code: "WEDDING_PERSISTENCE_UNAVAILABLE",
        message: "Waiting music could not be saved. Check database availability and applied migrations, then retry.",
      });
      try {
        await this.persistWaitingTracksToFile();
      } catch {
        /* in-memory remains the working set when disk is unavailable */
      }
    }
  }

  private async persistWaitingTracksToDatabase(): Promise<boolean> {
    if (!this.database) return false;
    try {
      await this.ensureCampaignHydrated();
      await this.writeCampaignRow();
      const ids = new Set(waitingTracks.map((row) => row.id));
      const existing = await weddingWaitingTrackDelegate(this.database).findMany({
        where: { weddingCampaignId: WEDDING_CAMPAIGN_ID },
      });
      for (const row of existing) {
        if (!ids.has(row.id)) {
          await weddingWaitingTrackDelegate(this.database).delete({ where: { id: row.id } });
        }
      }
      for (const row of waitingTracks) {
        await weddingWaitingTrackDelegate(this.database).upsert({
          where: { id: row.id },
          create: toPersistedTrack(row),
          update: toPersistedTrack(row),
        });
      }
      return true;
    } catch {
      return false;
    }
  }

  private async persistWaitingTracksToFile(): Promise<void> {
    const path = this.waitingPlaylistPath();
    await mkdir(join(this.environment.UPLOAD_ROOT, "wedding", WEDDING_CAMPAIGN_ID), { recursive: true });
    await writeFile(
      path,
      JSON.stringify(
        {
          loop: overlay.waitingMusicLoop !== false,
          enabled: overlay.waitingMusicEnabled ?? false,
          tracks: waitingTracks.map((row) => ({
            ...row,
            src: row.src.startsWith("blob:") ? "" : row.src,
          })),
        },
        null,
        2,
      ),
    );
  }

  private waitingPlaylistPath(): string {
    return join(this.environment.UPLOAD_ROOT, "wedding", WEDDING_CAMPAIGN_ID, "waiting-playlist.json");
  }

  private async hydrateWaitingMusicConfig(): Promise<void> {
    // Track availability never overrides the persisted master switch.
    await this.ensureCampaignHydrated();
  }

}

export function markWeddingWaitingTracksUnhydratedForTests(): void {
  waitingTracks.length = 0;
  waitingHydrated = false;
  waitingHydratePromise = null;
}

export function markWeddingCampaignUnhydratedForTests(): void {
  campaignHydrated = false;
  campaignHydratePromise = null;
  campaignPersistChain = Promise.resolve();
}

export function resetWeddingCampaignForTests(): void {
  overlay = canonicalizeWeddingEventDate({ ...DEFAULT_WEDDING_CAMPAIGN });
  campaignHydrated = true;
  campaignHydratePromise = null;
  campaignPersistChain = Promise.resolve();
  comments.length = 0;
  testComments.length = 0;
  gallery.length = 0;
  recording = null;
  viewers.clear();
  feeds.clear();
  waitingTracks.length = 0;
  waitingHydrated = true;
  waitingHydratePromise = null;
  commentWindow.clear();
}

export function sniffWeddingAudioMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return "audio/mpeg";
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const brand = bytes.toString("ascii", 8, 12);
    if (/^(M4A|M4B|mp4|iso|avc|dash)/i.test(brand)) {
      return "audio/mp4";
    }
  }
  return null;
}

function normalizeWaitingTrack(row: Partial<WeddingWaitingTrack> & { id?: string }): WeddingWaitingTrack {
  const position = row.position ?? row.sortOrder ?? 0;
  const enabled = row.isEnabled ?? row.enabled ?? true;
  const now = new Date().toISOString();
  return {
    id: row.id ?? randomUUID(),
    weddingCampaignId: row.weddingCampaignId ?? WEDDING_CAMPAIGN_ID,
    title: row.title?.trim() || "Waiting track",
    caption: row.caption ?? "",
    storageKey: row.storageKey ?? "",
    src: row.src && !row.src.startsWith("blob:") ? row.src : "",
    mimeType: row.mimeType ?? "audio/mpeg",
    fileSize: row.fileSize ?? 0,
    durationSeconds: row.durationSeconds ?? null,
    position,
    isEnabled: enabled,
    createdAt: row.createdAt ?? now,
    updatedAt: row.updatedAt ?? now,
    sortOrder: position,
    enabled,
  };
}

function fromPersistedTrack(row: {
  id: string;
  weddingCampaignId: string;
  title: string;
  caption: string;
  storageKey: string;
  src: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number | null;
  position: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}): WeddingWaitingTrack {
  return normalizeWaitingTrack({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function toPersistedTrack(row: WeddingWaitingTrack) {
  return {
    id: row.id,
    weddingCampaignId: row.weddingCampaignId,
    title: row.title,
    caption: row.caption,
    storageKey: row.storageKey,
    src: row.src,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    durationSeconds: row.durationSeconds,
    position: row.position,
    isEnabled: row.isEnabled,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}
