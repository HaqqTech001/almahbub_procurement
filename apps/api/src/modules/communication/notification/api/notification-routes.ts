import { Router } from "express";
import type { RequestHandler } from "express";

import { requirePermission } from "../../../../shared/auth/require-permission.js";
import { NotificationController } from "./notification-controller.js";
import type { NotificationService } from "../application/notification-service.js";

export function createNotificationRouter(authenticate: RequestHandler, service: NotificationService): Router {
  const router = Router();
  const controller = new NotificationController(service);
  router.use(authenticate);
  router.get("/", controller.list);
  router.get("/unread-count", controller.unreadCount);
  router.get("/:notificationId", controller.getOne);
  router.post("/read", controller.markRead);
  router.post("/read-all", controller.markAllRead);
  router.post("/:notificationId/unread", controller.markUnread);
  router.post("/:notificationId/archive", controller.archive);
  router.post("/:notificationId/unarchive", controller.unarchive);
  router.delete("/:notificationId", controller.delete);
  return router;
}

export function createCommunicationTemplateRouter(authenticate: RequestHandler, service: NotificationService): Router {
  const router = Router();
  const controller = new NotificationController(service);
  const manage = requirePermission("communication:manage");
  router.use(authenticate);
  router.get("/", manage, controller.listTemplates);
  router.post("/", manage, controller.createTemplate);
  router.get("/:templateId", manage, controller.template);
  router.post("/:templateId/revisions", manage, controller.reviseTemplate);
  router.post(
    "/:templateId/publish",
    requirePermission("communication:publish"),
    controller.publishTemplate,
  );
  return router;
}

export function createNotificationPreferenceRouter(authenticate: RequestHandler, service: NotificationService): Router {
  const router = Router();
  const controller = new NotificationController(service);
  router.use(authenticate);
  router.get("/", controller.preferences);
  router.patch("/", controller.updatePreferences);
  return router;
}
