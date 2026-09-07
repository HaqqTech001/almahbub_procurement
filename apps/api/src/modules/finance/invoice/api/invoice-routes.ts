import { Router } from "express";

import type { RequestHandler } from "express";

import { InvoiceController } from "./invoice-controller.js";
import type { InvoiceService } from "../application/invoice-service.js";

export function createInvoiceRouter(authenticate: RequestHandler, service: InvoiceService): Router {
  const router = Router();
  const controller = new InvoiceController(service);
  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:invoiceId", controller.get);
  router.patch("/:invoiceId", controller.update);
  router.post("/:invoiceId/issue", controller.issue);
  router.post("/:invoiceId/void", controller.void);
  router.get("/:invoiceId/history", controller.history);
  return router;
}
