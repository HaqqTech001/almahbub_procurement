import { Router } from "express";
import type { RequestHandler } from "express";

import { requirePermission } from "../../../shared/auth/require-permission.js";
import type { WeddingCampaignService } from "../application/wedding-campaign-service.js";
import { WeddingCampaignController } from "./wedding-controller.js";

const OPS = requirePermission("ops:access");

export function createWeddingRouter(
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
  service: WeddingCampaignService,
): Router {
  const router = Router();
  const controller = new WeddingCampaignController(service);

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
