import { Router } from "express";
import type { RequestHandler } from "express";

import type { CopilotService } from "../application/copilot-service.js";
import { CopilotController } from "./copilot-controller.js";

/**
 * Workflow-embedded AI Procurement Copilot routes under /api/v1/ai.
 * Mounted alongside RC7 knowledge routes on the same prefix.
 */
export function createCopilotRouter(
  authenticate: RequestHandler,
  service: CopilotService,
  aiLimiter?: RequestHandler,
): Router {
  const router = Router();
  const controller = new CopilotController(service);
  const limit = aiLimiter ?? ((_req, _res, next) => next());

  router.get("/copilot/status", controller.status);
  router.post(
    "/copilot/products/advise",
    authenticate,
    limit,
    controller.adviseProduct,
  );
  router.post(
    "/copilot/requests/draft-guidance",
    authenticate,
    limit,
    controller.guideRequestDraft,
  );
  router.post(
    "/copilot/requests/:id/guidance",
    authenticate,
    limit,
    controller.guideRequest,
  );
  router.post(
    "/copilot/quotations/compare",
    authenticate,
    limit,
    controller.compareQuotations,
  );
  router.post(
    "/copilot/quotations/:id/explain",
    authenticate,
    limit,
    controller.explainQuotation,
  );
  router.post(
    "/copilot/orders/advise",
    authenticate,
    limit,
    controller.adviseOrder,
  );

  return router;
}
