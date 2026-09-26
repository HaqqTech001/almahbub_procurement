import type { RequestHandler } from "express";
import { z } from "zod";

import { WEDDING_WAITING_AUDIO_MAX_BYTES } from "@hamd/constants";

import { AppError } from "../../../lib/app-error.js";
import { parseMultipartFiles, parseMultipartUpload } from "../../../shared/uploads/multipart.js";
import type { WeddingCampaignService } from "../application/wedding-campaign-service.js";

const invitationPatchSchema = z
  .object({
    coupleNames: z.string().max(200).optional(),
    familyLine: z.string().max(200).optional(),
    invitationHeading: z.string().max(200).optional(),
    invitationBody: z.string().max(500).optional(),
    eventAt: z.string().min(10).max(40).optional(),
    streamAt: z.string().min(10).max(40).optional(),
    venue: z.string().max(200).optional(),
    venueAddress: z.string().max(300).optional(),
    modalEnabled: z.boolean().optional(),
    commentsEnabled: z.boolean().optional(),
    galleryEnabled: z.boolean().optional(),
    recordingDownloadEnabled: z.boolean().optional(),
  })
  .strict();

const galleryPatchSchema = z
  .object({
    title: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
    featured: z.boolean().optional(),
    downloadable: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .strict();

const waitingAudioPatchSchema = z
  .object({
    title: z.string().max(200).optional(),
    caption: z.string().max(500).optional(),
    enabled: z.boolean().optional(),
    isEnabled: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
    position: z.number().int().min(0).max(999).optional(),
  })
  .strict();

const waitingAudioReorderSchema = z
  .object({
    ids: z.array(z.string().min(1).max(80)).min(1).max(50),
  })
  .strict();

const waitingMusicConfigSchema = z
  .object({
    enabled: z.boolean().optional(),
    loop: z.boolean().optional(),
  })
  .strict();

export class WeddingCampaignController {
  public constructor(private readonly service: WeddingCampaignService) {}

  public readonly getCampaign: RequestHandler = async (request, response, next) => {
    try {
      await this.service.refreshCampaign();
      const campaign = this.service.getCampaign(request.auth);
      const ops = Boolean(request.auth?.permissionKeys.has("ops:access"));
      response.json({
        data: ops
          ? {
              ...campaign,
              testControlsEnabled: this.service.areTestControlsEnabled(),
              livekitConfigured: this.service.isLiveKitConfigured(),
            }
          : campaign,
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateCampaign: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const patch = invitationPatchSchema.parse(request.body ?? {});
      await this.service.refreshCampaign();
      const data = this.service.updateInvitation(request.auth, patch);
      await this.service.flushCampaignPersistence();
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly startLive: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const mode = request.body?.mode === "test" ? "test" : "production";
      const feedLabel = typeof request.body?.feedLabel === "string" ? request.body.feedLabel : undefined;
      const captureWidth = Number(request.body?.captureWidth);
      const captureHeight = Number(request.body?.captureHeight);
      const captureFps = Number(request.body?.captureFps);
      const extras: {
        feedLabel?: string;
        captureWidth?: number;
        captureHeight?: number;
        captureFps?: number;
      } = {};
      if (feedLabel) extras.feedLabel = feedLabel;
      if (Number.isFinite(captureWidth)) extras.captureWidth = captureWidth;
      if (Number.isFinite(captureHeight)) extras.captureHeight = captureHeight;
      if (Number.isFinite(captureFps)) extras.captureFps = captureFps;
      const data = this.service.startLive(request.auth, mode, extras);
      await this.service.flushCampaignPersistence();
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly setWaiting: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      await this.service.refreshCampaign();
      const data = this.service.setStreamStatus(request.auth, "upcoming");
      await this.service.flushCampaignPersistence();
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly endLive: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      response.json({ data: await this.service.endLive(request.auth) });
    } catch (error) {
      next(error);
    }
  };

  public readonly stopMyBroadcast: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      response.json({ data: await this.service.stopMyBroadcast(request.auth) });
    } catch (error) {
      next(error);
    }
  };

  public readonly setPrimaryFeed: RequestHandler = (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      response.json({
        data: this.service.setPrimaryFeed(request.auth, String(request.body?.feedId ?? "")),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly liveStatus: RequestHandler = (_request, response) => {
    response.json({ data: this.service.liveStatus() });
  };

  public readonly liveToken: RequestHandler = async (request, response, next) => {
    try {
      const requestedRole = request.body?.role === "host" ? "host" : "viewer";
      if (requestedRole === "host" && !request.auth) throw unauthenticated();
      const mode = request.body?.mode === "test" ? "test" : request.body?.mode === "production" ? "production" : undefined;
      const feedLabel = typeof request.body?.feedLabel === "string" ? request.body.feedLabel : undefined;
      response.json({ data: await this.service.liveToken(request.auth, requestedRole, mode, { feedLabel }) });
    } catch (error) {
      next(error);
    }
  };

  public readonly viewers: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      response.json({ data: await this.service.viewerSummary(request.auth) });
    } catch (error) {
      next(error);
    }
  };

  public readonly listComments: RequestHandler = (request, response) => {
    const includeHidden = Boolean(request.auth?.permissionKeys.has("ops:access"));
    const eligible = this.service.isTestBroadcastEligible(request.auth);
    const queryChannel = request.query.channel === "test" ? "test" : request.query.channel === "production" ? "production" : undefined;
    const campaign = this.service.getCampaign(request.auth);
    const channel =
      queryChannel ??
      (eligible && (campaign.liveMode === "test" || campaign.endedKind === "test") ? "test" : "production");
    response.json({ data: { items: this.service.listComments(includeHidden, channel) } });
  };

  public readonly createComment: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      response.status(201).json({
        data: await this.service.addComment(request.auth, String(request.body?.message ?? "")),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly hideComment: RequestHandler = (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const id = String(request.params.id ?? "");
      response.json({
        data: this.service.moderateComment(request.auth, id, true),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly listGallery: RequestHandler = async (_request, response, next) => {
    try {
      response.json({ data: { items: await this.service.listGallery() } });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadGallery: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const files = await parseMultipartFiles(request, {
        maxFileBytes: 10 * 1024 * 1024,
        maxFiles: 1,
      });
      const file = files[0];
      if (!file) {
        throw new AppError({
          statusCode: 422,
          code: "VALIDATION_ERROR",
          message: "A gallery file is required.",
        });
      }
      response.status(201).json({
        data: await this.service.addGalleryItem(request.auth, file, {
          title: String(request.body?.title ?? ""),
          caption: String(request.body?.caption ?? ""),
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly recording: RequestHandler = (request, response, next) => {
    try {
      const row = this.service.getRecording();
      if (!row) {
        response.json({ data: null });
        return;
      }
      const ops = Boolean(request.auth?.permissionKeys.has("ops:access"));
      if (!row.downloadable && !ops && !request.auth) {
        response.json({ data: { status: row.status, downloadable: false } });
        return;
      }
      response.json({ data: row });
    } catch (error) {
      next(error);
    }
  };

  public readonly downloadRecording: RequestHandler = (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const row = this.service.getRecording();
      if (!row?.downloadable || !row.publicUrl || row.status !== "ready") {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Recording is not available for download.",
        });
      }
      response.redirect(302, row.publicUrl);
    } catch (error) {
      next(error);
    }
  };

  public readonly patchGallery: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const id = String(request.params.id ?? "");
      const patch = galleryPatchSchema.parse(request.body ?? {});
      response.json({ data: await this.service.updateGalleryItem(request.auth, id, patch) });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteGallery: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      await this.service.removeGalleryItem(request.auth, String(request.params.id ?? ""));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly listWaitingAudio: RequestHandler = async (request, response, next) => {
    try {
      const ops = Boolean(request.auth?.permissionKeys.has("ops:access"));
      response.json({ data: { items: await this.service.listWaitingTracks(ops) } });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadWaitingAudio: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const { files, fields } = await parseMultipartUpload(request, {
        maxFileBytes: WEDDING_WAITING_AUDIO_MAX_BYTES,
        maxFiles: 1,
      });
      const file = files[0];
      if (!file) {
        throw new AppError({
          statusCode: 422,
          code: "VALIDATION_ERROR",
          message: "An audio file is required.",
        });
      }
      const duration = Number(fields.durationSeconds ?? request.body?.durationSeconds);
      const meta: { title: string; caption: string; durationSeconds?: number } = {
        title: fields.title ?? String(request.body?.title ?? ""),
        caption: fields.caption ?? String(request.body?.caption ?? ""),
      };
      if (Number.isFinite(duration) && duration > 0) meta.durationSeconds = duration;
      response.status(201).json({
        data: await this.service.addWaitingTrack(request.auth, file, meta),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly patchWaitingAudio: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const parsed = waitingAudioPatchSchema.parse(request.body ?? {});
      const patch: Partial<{
        title: string;
        caption: string;
        enabled: boolean;
        isEnabled: boolean;
        sortOrder: number;
        position: number;
      }> = {};
      if (parsed.title !== undefined) patch.title = parsed.title;
      if (parsed.caption !== undefined) patch.caption = parsed.caption;
      if (parsed.enabled !== undefined) patch.enabled = parsed.enabled;
      if (parsed.isEnabled !== undefined) patch.isEnabled = parsed.isEnabled;
      if (parsed.sortOrder !== undefined) patch.sortOrder = parsed.sortOrder;
      if (parsed.position !== undefined) patch.position = parsed.position;
      response.json({
        data: await this.service.updateWaitingTrack(request.auth, String(request.params.id ?? ""), patch),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly reorderWaitingAudio: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const body = waitingAudioReorderSchema.parse(request.body ?? {});
      response.json({ data: { items: await this.service.reorderWaitingTracks(request.auth, body.ids) } });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteWaitingAudio: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      await this.service.removeWaitingTrack(request.auth, String(request.params.id ?? ""));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly waitingMusicEnabled: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const parsed = waitingMusicConfigSchema.parse(request.body ?? {});
      const patch: { enabled?: boolean; loop?: boolean } = {};
      if (parsed.enabled !== undefined) patch.enabled = parsed.enabled;
      if (parsed.loop !== undefined) patch.loop = parsed.loop;
      response.json({
        data: await this.service.setWaitingMusicEnabled(request.auth, patch),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly testControl: RequestHandler = async (request, response, next) => {
    try {
      if (!request.auth) throw unauthenticated();
      const data = this.service.applyTestControl(request.auth, String(request.body?.action ?? ""));
      await this.service.flushCampaignPersistence();
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };
}

function unauthenticated(): AppError {
  return new AppError({
    statusCode: 401,
    code: "UNAUTHENTICATED",
    message: "Authentication is required.",
  });
}
