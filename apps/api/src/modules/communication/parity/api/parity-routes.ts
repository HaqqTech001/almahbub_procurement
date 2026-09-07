import { Router } from "express";
import type { RequestHandler } from "express";

import { requireAnyPermission } from "../../../../shared/auth/require-permission.js";
import { PARITY_MANAGE_PERMISSIONS } from "../application/parity-policy.js";
import { ParityController } from "./parity-controller.js";
import type { ParityService } from "../application/parity-service.js";

const PARITY_MANAGE = requireAnyPermission(PARITY_MANAGE_PERMISSIONS);

/**
 * Mounts RC7 parity routes under /api/v1 for announcements, support, AI,
 * services, and marketing.
 */
export function createParityRouters(
  authenticate: RequestHandler,
  service: ParityService,
  marketingLimiter?: RequestHandler,
  optionalAuthenticate: RequestHandler = (_request, _response, next) => next(),
): {
  announcements: Router;
  support: Router;
  ai: Router;
  services: Router;
  marketing: Router;
} {
  const controller = new ParityController(service);

  const announcements = Router();
  announcements.get("/", controller.listAnnouncements);
  announcements.get(
    "/admin",
    authenticate,
    PARITY_MANAGE,
    controller.listAnnouncementsAdmin,
  );
  announcements.post(
    "/:id/media",
    authenticate,
    PARITY_MANAGE,
    controller.attachAnnouncementMedia,
  );
  announcements.delete(
    "/:id/media/:mediaId",
    authenticate,
    PARITY_MANAGE,
    controller.deleteAnnouncementMedia,
  );
  announcements.get(
    "/:id/media/:mediaId",
    optionalAuthenticate,
    controller.streamAnnouncementMedia,
  );
  announcements.get("/:idOrSlug/replies", controller.listAnnouncementReplies);
  announcements.post(
    "/:idOrSlug/replies",
    authenticate,
    controller.createAnnouncementReply,
  );
  announcements.get(
    "/:idOrSlug/reactions",
    optionalAuthenticate,
    controller.listAnnouncementReactions,
  );
  announcements.post(
    "/:idOrSlug/reactions",
    authenticate,
    controller.toggleAnnouncementReaction,
  );
  announcements.delete(
    "/:idOrSlug/reactions",
    authenticate,
    controller.toggleAnnouncementReaction,
  );
  announcements.patch(
    "/replies/:replyId",
    authenticate,
    PARITY_MANAGE,
    controller.moderateAnnouncementReply,
  );
  announcements.get("/:idOrSlug", controller.getAnnouncement);
  announcements.post(
    "/",
    authenticate,
    PARITY_MANAGE,
    controller.createAnnouncement,
  );
  announcements.patch(
    "/:id",
    authenticate,
    PARITY_MANAGE,
    controller.updateAnnouncement,
  );
  announcements.delete(
    "/:id",
    authenticate,
    PARITY_MANAGE,
    controller.deleteAnnouncement,
  );

  const support = Router();
  support.use(authenticate);
  support.get("/thread", controller.getOrCreateThread);
  support.post("/thread", controller.getOrCreateThread);
  support.post("/messages", controller.sendMessage);
  support.post("/messages/:id/read", controller.markRead);
  support.get("/unread-count", controller.unreadCount);
  support.get("/threads", controller.listSupportThreads);
  support.get("/threads/:threadId", controller.getSupportThread);
  support.post("/reply", controller.opsReply);

  const ai = Router();
  ai.use(authenticate);
  ai.post("/auto-respond", controller.autoRespond);
  ai.get("/knowledge", controller.listKnowledge);
  ai.post("/knowledge", controller.createKnowledge);
  ai.patch("/knowledge/:id", controller.updateKnowledge);
  ai.delete("/knowledge/:id", controller.deleteKnowledge);

  const services = Router();
  services.get("/", controller.listServices);
  services.get("/admin", authenticate, controller.listServicesAdmin);
  services.post("/", authenticate, controller.createService);
  services.patch("/:id", authenticate, controller.updateService);
  services.delete("/:id", authenticate, controller.deleteService);

  const marketing = Router();
  marketing.get("/catalog/featured", controller.featuredCatalog);
  if (marketingLimiter) {
    marketing.post("/contact", marketingLimiter, controller.marketingContact);
  } else {
    marketing.post("/contact", controller.marketingContact);
  }
  marketing.get("/inquiries", authenticate, controller.listMarketingInquiries);

  return { announcements, support, ai, services, marketing };
}
