import { Router } from "express";
import type { RequestHandler } from "express";

import { GuidanceController } from "./guidance-controller.js";
import type { GuidanceService } from "../application/guidance-service.js";

export function createGuidanceRouter(
  authenticate: RequestHandler,
  service: GuidanceService,
): Router {
  const router = Router();
  const controller = new GuidanceController(service);
  router.use(authenticate);
  router.get("/preferences", controller.preference);
  router.patch("/preferences", controller.updatePreference);
  router.get("/tours", controller.tours);
  router.get("/tips", controller.tips);
  router.get("/progress", controller.progress);
  router.put("/progress", controller.upsertProgress);
  router.get("/tips/dismissed", controller.dismissedTips);
  router.post("/tips/dismiss", controller.dismissTip);
  router.post("/progress/reset", controller.resetProgress);
  return router;
}

export function createGuidanceAdminRouter(
  authenticate: RequestHandler,
  service: GuidanceService,
): Router {
  const router = Router();
  const controller = new GuidanceController(service);
  router.use(authenticate);
  router.get("/tours", controller.adminTours);
  router.post("/tours", controller.createTour);
  router.patch("/tours/:tourId", controller.updateTour);
  router.post("/tours/:tourId/publish", controller.publishTour);
  router.post("/tours/:tourId/unpublish", controller.unpublishTour);
  router.post("/tours/:tourId/schedule", controller.scheduleTour);
  router.get("/analytics", controller.analytics);
  router.post("/users/:userId/reset-progress", controller.resetUserProgress);
  return router;
}
