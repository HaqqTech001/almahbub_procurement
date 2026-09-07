import { Router } from "express";

import type { RequestHandler } from "express";

import {
  requireAnyPermission,
  requirePermission,
} from "../../../../shared/auth/require-permission.js";
import { QuotationController } from "./quotation-controller.js";
import { requireQuotationTransitionPermission } from "./quotation-transition-auth.js";
import type { QuotationService } from "../application/quotation-service.js";

const QUOTATION_READ = requireAnyPermission(["quotation:read", "request:read"]);

export function createQuotationRouter(
  authenticate: RequestHandler,
  service: QuotationService,
): Router {
  const router = Router();
  const controller = new QuotationController(service);

  router.use(authenticate);
  router.get("/", QUOTATION_READ, controller.list);
  router.post("/", requirePermission("quotation:create"), controller.create);
  router.get("/:quotationId", QUOTATION_READ, controller.get);
  router.patch(
    "/:quotationId",
    requirePermission("quotation:update"),
    controller.updateDraft,
  );
  router.post(
    "/:quotationId/transitions",
    requireQuotationTransitionPermission(),
    controller.transition,
  );
  router.post(
    "/:quotationId/revise",
    requirePermission("quotation:revise"),
    controller.revise,
  );
  router.get("/:quotationId/history", QUOTATION_READ, controller.history);
  return router;
}
