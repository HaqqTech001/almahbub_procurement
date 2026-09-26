/**
 * Canonical Rowdotul HAMD'26 campaign record.
 * Dates, copy, and switches live here (and in the matching DB row once migrated).
 * Do not duplicate event date/venue/names in React JSX.
 */

export const ROWDOTUL_HAMD_IDENTITY = "Rowdotul HAMD'26" as const;
export const WEDDING_CAMPAIGN_ID = "founder-wedding-september-2026" as const;
export const WEDDING_MEDIA_STORAGE_ID = "9c7f5d2e-8a61-4c95-b1d7-2f8a6e3c4b90" as const;
export const WEDDING_CAMPAIGN_SLUG = "rowdotul-hamd-26" as const;

export type WeddingStreamStatus =
  | "draft"
  | "upcoming"
  | "live"
  | "ended"
  | "archived";

export type WeddingLiveMode = "none" | "test" | "production";

export type WeddingCampaignRecord = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  coupleNames: string;
  familyLine: string;
  invitationHeading: string;
  invitationBody: string;
  eventAt: string;
  streamAt: string;
  venue: string;
  venueAddress: string;
  modalEnabled: boolean;
  modalStartsAt: string;
  modalEndsAt: string;
  streamStatus: WeddingStreamStatus;
  galleryEnabled: boolean;
  commentsEnabled: boolean;
  recordingAvailable: boolean;
  recordingDownloadEnabled: boolean;
  campaignStatus: WeddingStreamStatus;
  sitePath: string;
  livePath: string;
  liveMode: WeddingLiveMode;
  endedKind: WeddingLiveMode;
  testBroadcastEligible?: boolean;
  waitingMusicEnabled?: boolean;
  waitingMusicLoop?: boolean;
  primaryFeedId?: string | null;
  feeds?: WeddingBroadcastFeed[];
};

const EVENT_AT = "2026-09-26T09:00:00+01:00";
const MODAL_STARTS_AT = "2026-08-01T00:00:00+01:00";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function deriveWeddingModalEndsAt(eventAt: string): string {
  const parsed = Date.parse(eventAt);
  if (Number.isNaN(parsed)) return eventAt;
  return new Date(parsed + THREE_DAYS_MS).toISOString();
}

export const DEFAULT_WEDDING_CAMPAIGN: WeddingCampaignRecord = {
  id: WEDDING_CAMPAIGN_ID,
  slug: WEDDING_CAMPAIGN_SLUG,
  title: ROWDOTUL_HAMD_IDENTITY,
  tagline: "A beautiful union begins",
  coupleNames: "",
  familyLine: "Together with their families",
  invitationHeading: "Alhamdulillah",
  invitationBody: "cordially invite you to celebrate their wedding",
  eventAt: EVENT_AT,
  streamAt: EVENT_AT,
  venue: "",
  venueAddress: "",
  modalEnabled: false,
  modalStartsAt: MODAL_STARTS_AT,
  modalEndsAt: deriveWeddingModalEndsAt(EVENT_AT),
  streamStatus: "upcoming",
  galleryEnabled: true,
  commentsEnabled: true,
  recordingAvailable: false,
  recordingDownloadEnabled: false,
  campaignStatus: "upcoming",
  sitePath: `/${WEDDING_CAMPAIGN_SLUG}`,
  livePath: `/${WEDDING_CAMPAIGN_SLUG}/live`,
  liveMode: "none",
  endedKind: "none",
  waitingMusicEnabled: false,
  waitingMusicLoop: true,
  primaryFeedId: null,
  feeds: [],
};

export function isWeddingModalEligible(
  campaign: WeddingCampaignRecord,
  now: Date = new Date(),
): boolean {
  if (!campaign.modalEnabled) return false;
  if (campaign.campaignStatus === "archived") return false;
  const start = Date.parse(campaign.modalStartsAt);
  const end = Date.parse(campaign.modalEndsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

export type WeddingModalCta = {
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
};

export const WEDDING_MODAL_PUBLIC_DELAY_MS = 2500;

export function weddingModalDismissKey(campaignId: string): string {
  return `hamd.session.wedding-modal-dismissed:${campaignId}`;
}

export type WeddingNotificationKind =
  | "WEDDING_24_HOUR_REMINDER"
  | "WEDDING_1_HOUR_REMINDER"
  | "WEDDING_LIVE_STARTED"
  | "WEDDING_RECORDING_AVAILABLE";

export type WeddingReminderPreference = {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneE164: string | null;
  smsConsentedAt: string | null;
};

export const DEFAULT_WEDDING_REMINDER_PREFERENCE: WeddingReminderPreference = {
  inAppEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  phoneE164: null,
  smsConsentedAt: null,
};

export function weddingModalActions(
  campaign: WeddingCampaignRecord,
  _now: Date = new Date(),
): WeddingModalCta {
  void _now; // Retain the existing call signature for consumers.
  if (isWeddingProductionLive(campaign)) {
    return { primary: { href: campaign.livePath, label: "Join Live Now" } };
  }
  if (campaign.streamStatus === "ended" && campaign.endedKind === "production") {
    if (campaign.recordingAvailable) {
      return {
        primary: { href: campaign.sitePath, label: "View Wedding" },
        secondary: { href: campaign.sitePath, label: "Watch Celebration" },
      };
    }
    return {
      primary: { href: campaign.sitePath, label: "View Wedding" },
    };
  }
  return {
    primary: { href: campaign.sitePath, label: "View Wedding" },
    secondary: {
      href: campaign.livePath,
      label: "Join Live",
    },
  };
}

/** Nigeria-friendly E.164. Returns null when the number cannot be used for SMS. */
export function normalizeWeddingSmsPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const compact = trimmed.replace(/[()\s-]/g, "");
  let digits = compact.startsWith("+") ? compact.slice(1) : compact;
  digits = digits.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    digits = `234${digits.slice(1)}`;
  }
  if (digits.startsWith("234") && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
}

/** Termii alphanumeric sender IDs are 3–11 characters. Do not rewrite the configured value. */
export function isUsableTermiiSenderId(senderId: string): boolean {
  return /^[A-Za-z0-9 ]{3,11}$/.test(senderId.trim());
}

export function formatWeddingWhen(iso: string, _now?: Date): string {
  void _now;
  const trimmed = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatWeddingDate(trimmed);
  }
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(parsed));
}

export const WEDDING_GALLERY_MAX_BYTES = 10 * 1024 * 1024;
export const WEDDING_GALLERY_ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,video/mp4";
export const WEDDING_COMMENT_MAX_CHARS = 500;
export const WEDDING_LIVEKIT_ROOM = "rowdotul-hamd-26";
export const WEDDING_LIVEKIT_TEST_ROOM = "rowdotul-hamd-26-test";

export function formatWeddingDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(parsed));
}

export function weddingLiveKitRoom(mode: WeddingLiveMode): string {
  return mode === "test" ? WEDDING_LIVEKIT_TEST_ROOM : WEDDING_LIVEKIT_ROOM;
}

export function isWeddingProductionLive(campaign: WeddingCampaignRecord): boolean {
  return campaign.streamStatus === "live" && campaign.liveMode !== "test";
}

export function isWeddingTestLive(campaign: WeddingCampaignRecord): boolean {
  return campaign.streamStatus === "live" && campaign.liveMode === "test";
}

export function weddingCommentChannel(campaign: WeddingCampaignRecord): "test" | "production" {
  return campaign.liveMode === "test" || campaign.endedKind === "test" ? "test" : "production";
}

export function weddingGalleryKindFromMime(mime: string): "image" | "video" | null {
  const normalized = mime.trim().toLowerCase();
  if (
    normalized === "image/jpeg" ||
    normalized === "image/jpg" ||
    normalized === "image/png" ||
    normalized === "image/gif" ||
    normalized === "image/webp"
  ) {
    return "image";
  }
  if (normalized === "video/mp4") return "video";
  return null;
}

export function validateWeddingGalleryFile(file: { size: number; type: string }): string | null {
  if (file.size > WEDDING_GALLERY_MAX_BYTES) {
    return "This file is larger than the 10 MB upload limit.";
  }
  if (!weddingGalleryKindFromMime(file.type)) {
    return "Use a JPEG, PNG, GIF, WebP, or MP4 file.";
  }
  return null;
}

export function weddingWaitingAudioKind(file: { type: string; name?: string }): "mp3" | "m4a" | null {
  const mime = file.type.trim().toLowerCase();
  const name = (file.name ?? "").trim().toLowerCase();
  if (mime === "audio/mpeg" || mime === "audio/mp3" || name.endsWith(".mp3")) {
    return "mp3";
  }
  if (
    mime === "audio/mp4" ||
    mime === "audio/x-m4a" ||
    mime === "audio/m4a" ||
    mime === "audio/aac" ||
    mime === "audio/x-aac" ||
    name.endsWith(".m4a") ||
    name.endsWith(".aac")
  ) {
    return "m4a";
  }
  return null;
}

export function validateWeddingWaitingAudioFile(file: {
  size: number;
  type: string;
  name?: string;
}): string | null {
  if (file.size > WEDDING_WAITING_AUDIO_MAX_BYTES) {
    return `This audio file is larger than the ${WEDDING_WAITING_AUDIO_MAX_MB} MB upload limit.`;
  }
  if (!weddingWaitingAudioKind(file)) {
    return "Use an MP3 or M4A/AAC audio file.";
  }
  return null;
}

export function formatWeddingFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    const value = mb >= 10 ? Math.round(mb) : Math.round(mb * 10) / 10;
    return `${value} MB`;
  }
  const kb = bytes / 1024;
  if (kb >= 1) {
    const value = kb >= 10 ? Math.round(kb) : Math.round(kb * 10) / 10;
    return `${value} KB`;
  }
  return `${bytes} B`;
}
export const WEDDING_FEED_LABELS = ["Main Stage", "Venue View", "Family View", "Reception"] as const;
export type WeddingFeedLabel = (typeof WEDDING_FEED_LABELS)[number];

export type WeddingBroadcastFeed = {
  feedId: string;
  label: string;
  identity: string;
  primary: boolean;
  status: "live" | "offline";
  captureWidth?: number;
  captureHeight?: number;
  captureFps?: number;
};

export type WeddingWaitingTrack = {
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
  createdAt: string;
  updatedAt: string;
  sortOrder: number;
  enabled: boolean;
};

export const WEDDING_WAITING_AUDIO_MAX_MB = 25;
export const WEDDING_WAITING_AUDIO_MAX_BYTES = WEDDING_WAITING_AUDIO_MAX_MB * 1024 * 1024;
export const WEDDING_WAITING_AUDIO_ACCEPT =
  "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/aac,.mp3,.m4a,.aac";
export const WEDDING_WAITING_DEFAULT_VOLUME = 0.28;
export const WEDDING_WAITING_AUDIO_SESSION_MUTE_KEY = "hamd.session.wedding-waiting-muted";
export const WEDDING_WAITING_AUDIO_SESSION_VOLUME_KEY = "hamd.session.wedding-waiting-volume";

export function formatWeddingAudioDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function enabledWeddingWaitingTracks<T extends WeddingWaitingTrackLike>(tracks: T[]): T[] {
  return [...tracks]
    .filter((row) => row.isEnabled !== false && row.enabled !== false)
    .sort((a, b) => waitingTrackPosition(a) - waitingTrackPosition(b));
}

export function shouldPlayWeddingWaitingMusic(campaign: {
  streamStatus: WeddingStreamStatus;
}): boolean {
  return (
    campaign.streamStatus !== "live" &&
    campaign.streamStatus !== "ended" &&
    campaign.streamStatus !== "archived"
  );
}

export function nextWeddingWaitingTrackIndex(
  tracks: WeddingWaitingTrackLike[],
  currentIndex: number,
  options: { loop?: boolean; failedIds?: ReadonlySet<string> } = {},
): number {
  const loop = options.loop !== false;
  const playable = playableWaitingIndexes(tracks, options.failedIds);
  if (playable.length === 0) return -1;
  const currentPos = playable.indexOf(currentIndex);
  const start = currentPos >= 0 ? currentPos + 1 : 0;
  if (start < playable.length) return playable[start] ?? -1;
  return loop ? (playable[0] ?? -1) : -1;
}

export function recoverWeddingWaitingTrackIndex(
  tracks: WeddingWaitingTrackLike[],
  currentId: string | null,
  options: { failedIds?: ReadonlySet<string>; previousPosition?: number; loop?: boolean } = {},
): number {
  const playable = playableWaitingIndexes(tracks, options.failedIds);
  if (playable.length === 0) return -1;
  if (currentId) {
    const still = playable.find((index) => tracks[index]?.id === currentId);
    if (still !== undefined) return still;
  }
  const previous = options.previousPosition ?? 0;
  const after = playable.find((index) => waitingTrackPosition(tracks[index]) >= previous);
  if (after !== undefined) return after;
  return options.loop === false ? -1 : (playable[0] ?? -1);
}

type WeddingWaitingTrackLike = {
  id: string;
  isEnabled?: boolean;
  enabled?: boolean;
  position?: number;
  sortOrder?: number;
};

function waitingTrackPosition(track: WeddingWaitingTrackLike | undefined): number {
  return track?.position ?? track?.sortOrder ?? 0;
}

function playableWaitingIndexes(
  tracks: WeddingWaitingTrackLike[],
  failedIds?: ReadonlySet<string>,
): number[] {
  return tracks
    .map((track, index) => ({ track, index }))
    .filter(({ track }) => track.isEnabled !== false && track.enabled !== false)
    .filter(({ track }) => !failedIds?.has(track.id))
    .sort((a, b) => waitingTrackPosition(a.track) - waitingTrackPosition(b.track))
    .map(({ index }) => index);
}

export function sanitizeWeddingFeedLabel(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if ((WEDDING_FEED_LABELS as readonly string[]).includes(trimmed)) return trimmed;
  if (trimmed.length < 3 || trimmed.length > 40) {
    return "Main Stage";
  }
  if (!/^[A-Za-z][A-Za-z0-9 '.-]*$/.test(trimmed)) {
    return "Main Stage";
  }
  if (/^(admin|user|camera)\b/i.test(trimmed)) {
    return "Main Stage";
  }
  return trimmed;
}

export function weddingHostIdentity(userId: string, sessionId: string): string {
  return `host:${userId}:${sessionId}`;
}

export type WeddingCaptureChoice = "auto" | "hd" | "fhd";

export type WeddingCaptureAttempt = {
  width: number;
  height: number;
  frameRate: number;
};

export function weddingCaptureAttempts(choice: WeddingCaptureChoice): WeddingCaptureAttempt[] {
  const fhd = { width: 1920, height: 1080, frameRate: 30 };
  const hd = { width: 1280, height: 720, frameRate: 30 };
  const mid = { width: 960, height: 540, frameRate: 30 };
  if (choice === "hd") return [hd, mid];
  return [fhd, hd, mid];
}

export function formatWeddingCaptureLabel(settings: {
  width?: number;
  height?: number;
  frameRate?: number;
}): string {
  const width = Math.round(settings.width ?? 0);
  const height = Math.round(settings.height ?? 0);
  const fps = Math.round(settings.frameRate ?? 0);
  if (!width || !height) return "Camera not ready";
  const tier =
    height >= 1000 && width >= 1600 ? "1080p" : height >= 700 && width >= 1100 ? "720p" : `${width}×${height}`;
  return fps > 0 ? `${tier} · ${fps} fps` : `${width} × ${height}`;
}

export function shouldRequestWeddingLiveToken(state: {
  streamIsLive: boolean;
  configured: boolean;
  requestInFlight: boolean;
  alreadyConnected: boolean;
  unavailable: boolean;
}): boolean {
  return (
    state.streamIsLive &&
    state.configured &&
    !state.requestInFlight &&
    !state.alreadyConnected &&
    !state.unavailable
  );
}
