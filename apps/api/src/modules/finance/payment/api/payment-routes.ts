import { Router } from "express";

import type { RequestHandler } from "express";
import { PaymentController } from "./payment-controller.js";
import type { PaymentService } from "../application/payment-service.js";

export function createPaymentRouter(authenticate: RequestHandler, service: PaymentService): Router {
  const router = Router();
  const controller = new PaymentController(service);
  router.use(authenticate);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:paymentId", controller.get);
  router.post("/:paymentId/submit", controller.submit);
  router.post("/:paymentId/confirm", controller.confirm);
  router.get("/:paymentId/history", controller.history);
  return router;
}
