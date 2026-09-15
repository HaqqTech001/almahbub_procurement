import { Router } from "express";
import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../../../lib/app-error.js";
import type { WeddingParticipationService } from "../application/wedding-participation-service.js";

import { requirePermission } from "../../../shared/auth/require-permission.js";
import type { WeddingCampaignService } from "../application/wedding-campaign-service.js";
import { WeddingCampaignController } from "./wedding-controller.js";

const OPS = requirePermission("ops:access");

export function createWeddingRouter(
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
  service: WeddingCampaignService,
  participation?: WeddingParticipationService,
): Router {
  const router = Router();
  const controller = new WeddingCampaignController(service);

  if (participation) {
    const handle = (run: RequestHandler): RequestHandler => (req, res, next) => {
      Promise.resolve(run(req, res, next)).catch(next);
    };
    router.get("/participation", authenticate, handle(async (req, res) => {
      res.json({ data: await participation.state(req.auth!.userId) });
    }));
    router.put("/subscription", authenticate, handle(async (req, res) => {
      const { enabled } = z.object({ enabled: z.boolean() }).strict().parse(req.body);
      res.json({ data: await participation.change(req.auth!, "subscription", enabled) });
    }));
    router.put("/waiting-room", authenticate, handle(async (req, res) => {
      const { joined } = z.object({ joined: z.boolean() }).strict().parse(req.body);
      res.json({ data: await participation.change(req.auth!, "waiting", joined) });
    }));
    router.post("/waiting-room/heartbeat", authenticate, handle(async (req, res) => {
      res.json({ data: await participation.heartbeat(req.auth!.userId) });
    }));
    router.get("/participants", authenticate, OPS, handle(async (req, res) => {
      const query = z.object({ kind: z.enum(["subscription", "waiting"]),
        page: z.string().regex(/^[1-9][0-9]*$/).transform(Number).pipe(z.number().int().max(100000)).default("1") }).safeParse(req.query);
      if (!query.success) throw new AppError({ statusCode: 400, code: "INVALID_PARTICIPANTS_QUERY",
        message: "Choose subscription or waiting and a page between 1 and 100000." });
      const { kind, page } = query.data;
      res.json({ data: await participation.list(kind, page) });
    }));
  }

  router.get("/campaign", optionalAuthenticate, controller.getCampaign);
  router.patch("/campaign", authenticate, OPS, controller.updateCampaign);
  router.post("/live/start", authenticate, OPS, controller.startLive);
  router.post("/live/end", authenticate, OPS, controller.endLive);
  router.post("/live/stop-feed", authenticate, OPS, controller.stopMyBroadcast);
  router.post("/live/primary-feed", authenticate, OPS, controller.setPrimaryFeed);
  router.get("/live/status", authenticate, controller.liveStatus);
  router.post("/live/token", authenticate, controller.liveToken);
  router.get("/live/viewers", authenticate, OPS, controller.viewers);
  router.get("/waiting-audio", optionalAuthenticate, controller.listWaitingAudio);
  router.post("/waiting-audio", authenticate, OPS, controller.uploadWaitingAudio);
  router.post("/waiting-audio/reorder", authenticate, OPS, controller.reorderWaitingAudio);
  router.patch("/waiting-audio/:id", authenticate, OPS, controller.patchWaitingAudio);
  router.delete("/waiting-audio/:id", authenticate, OPS, controller.deleteWaitingAudio);
  router.post("/waiting-audio/enabled", authenticate, OPS, controller.waitingMusicEnabled);
  router.get("/comments", optionalAuthenticate, controller.listComments);
  router.post("/comments", authenticate, controller.createComment);
  router.post("/comments/:id/hide", authenticate, OPS, controller.hideComment);
  router.get("/gallery", optionalAuthenticate, controller.listGallery);
  router.post("/gallery", authenticate, OPS, controller.uploadGallery);
  router.patch("/gallery/:id", authenticate, OPS, controller.patchGallery);
  router.delete("/gallery/:id", authenticate, OPS, controller.deleteGallery);
  router.get("/recording", optionalAuthenticate, controller.recording);
  router.get("/recording/download", authenticate, controller.downloadRecording);
  router.post("/test", authenticate, OPS, controller.testControl);
  return router;
}
