import { Router } from "express";
import type { RequestHandler } from "express";

import { DocumentController } from "./document-controller.js";
import type { DocumentService } from "../application/document-service.js";

export function createDocumentRouter(
  authenticate: RequestHandler,
  service: DocumentService,
): Router {
  const router = Router();
  const controller = new DocumentController(service);
  router.use(authenticate);
  router.post("/", controller.upload);
  router.get("/:documentId", controller.download);
  return router;
}
