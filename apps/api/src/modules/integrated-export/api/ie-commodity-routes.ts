import { Router } from "express";
import type { RequestHandler } from "express";

import { requirePermission } from "../../../shared/auth/require-permission.js";
import type { IeCommodityService } from "../application/ie-commodity-service.js";
import { IeCommodityController } from "./ie-commodity-controller.js";

const OPS_ACCESS = requirePermission("ops:access");

/**
 * Integrated Export commodity routes.
 * Namespace: /api/v1/integrated-export/commodities
 *
 * Public GET returns published rows only (unless Ops authenticated + includeUnpublished).
 * Writes require authenticate + ops:access.
 */
export function createIeCommodityRouter(
  authenticate: RequestHandler,
  optionalAuthenticate: RequestHandler,
  service: IeCommodityService,
): Router {
  const router = Router();
  const controller = new IeCommodityController(service);

  router.get("/", optionalAuthenticate, controller.list);
  router.get("/:slug", optionalAuthenticate, controller.getBySlug);

  router.post("/", authenticate, OPS_ACCESS, controller.create);
  router.post("/:id/hero", authenticate, OPS_ACCESS, controller.uploadHero);
  router.patch("/:id", authenticate, OPS_ACCESS, controller.update);
  router.delete("/:id", authenticate, OPS_ACCESS, controller.archive);

  return router;
}
