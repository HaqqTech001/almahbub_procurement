import { Router } from "express";

import type { RequestHandler } from "express";

import { ProcurementRequestController } from "./procurement-request-controller.js";
import { requireProcurementTransitionPermission } from "./procurement-transition-auth.js";
import type { ProcurementRequestService } from "../application/procurement-request-service.js";

export function createProcurementRequestRouter(
  authenticate: RequestHandler,
  service: ProcurementRequestService,
): Router {
  const router = Router();
  const controller = new ProcurementRequestController(service);

  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:requestId", controller.get);
  router.patch("/:requestId", controller.update);
  router.post(
    "/:requestId/transitions",
    requireProcurementTransitionPermission(),
    controller.transition,
  );
  router.post("/:requestId/assignments", controller.assign);
  router.post("/:requestId/archive", controller.archive);
  router.delete("/:requestId", controller.destroy);
  router.post("/:requestId/restore", controller.restore);
  router.post("/:requestId/duplicate", controller.duplicate);

  return router;
}
