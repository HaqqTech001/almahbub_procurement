import { Router } from "express";
import type { RequestHandler } from "express";

import { ShipmentController } from "./shipment-controller.js";
import type { ShipmentService } from "../application/shipment-service.js";

export function createShipmentRouter(authenticate: RequestHandler, service: ShipmentService): Router {
  const router = Router();
  const controller = new ShipmentController(service);
  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:shipmentId", controller.get);
  router.patch("/:shipmentId", controller.update);
  router.post("/:shipmentId/transitions", controller.command);
  router.post("/:shipmentId/milestones", controller.milestone);
  router.post("/:shipmentId/containers", controller.container);
  router.post("/:shipmentId/tracking", controller.tracking);
  router.post("/:shipmentId/documents", controller.document);
  router.post("/:shipmentId/evidence", controller.evidence);
  router.post("/:shipmentId/inspections", controller.inspection);
  router.post("/:shipmentId/confirm-delivery", controller.confirmDelivery);
  router.get("/:shipmentId/timeline", controller.timeline);
  router.get("/:shipmentId/history", controller.history);
  return router;
}
