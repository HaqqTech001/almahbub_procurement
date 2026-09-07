import type { Request, RequestHandler } from "express";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { parseMultipartFiles } from "../../../../shared/uploads/multipart.js";
import type { ParityService } from "../application/parity-service.js";
import {
  announcementIdOrSlugSchema,
  autoRespondSchema,
  announcementReplyBodySchema,
  announcementReplyIdSchema,
  announcementReactionBodySchema,
  createAnnouncementSchema,
  createKnowledgeArticleSchema,
  createPlatformServiceSchema,
  knowledgeArticleIdSchema,
  marketingContactSchema,
  platformServiceIdSchema,
  supportMessageIdSchema,
  supportMessageSchema,
  updateAnnouncementSchema,
  updateKnowledgeArticleSchema,
  updatePlatformServiceSchema,
  moderateAnnouncementReplySchema,
} from "./parity-schemas.js";
import { z } from "zod";

const announcementIdSchema = z.object({ id: z.string().uuid() });
const announcementMediaParamsSchema = z.object({
  id: z.string().uuid(),
  mediaId: z.string().uuid(),
});
const threadIdSchema = z.object({ threadId: z.string().uuid() });
const opsReplySchema = supportMessageSchema.extend({
  threadId: z.string().uuid(),
});

export class ParityController {
  public constructor(private readonly service: ParityService) {}

  public readonly listAnnouncements: RequestHandler = async (
    _request,
    response,
    next,
  ) => {
    try {
      response.json({ data: await this.service.listPublishedAnnouncements() });
    } catch (error) {
      next(error);
    }
  };

  public readonly listAnnouncementsAdmin: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.listAnnouncementsAdmin(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly getAnnouncement: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { idOrSlug } = announcementIdOrSlugSchema.parse(request.params);
      response.json({ data: await this.service.getAnnouncement(idOrSlug) });
    } catch (error) {
      next(error);
    }
  };

  public readonly listAnnouncementReplies: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { idOrSlug } = announcementIdOrSlugSchema.parse(request.params);
      const cursor =
        typeof request.query.cursor === "string" ? request.query.cursor : undefined;
      const limitRaw = request.query.limit ? Number(request.query.limit) : undefined;
      response.json({
        data: await this.service.listAnnouncementReplies(idOrSlug, {
          ...(cursor ? { cursor } : {}),
          ...(limitRaw && Number.isFinite(limitRaw) ? { limit: limitRaw } : {}),
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly createAnnouncementReply: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { idOrSlug } = announcementIdOrSlugSchema.parse(request.params);
      const { body } = announcementReplyBodySchema.parse(request.body);
      response.status(201).json({
        data: await this.service.createAnnouncementReply(auth(request), idOrSlug, body),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly listAnnouncementReactions: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { idOrSlug } = announcementIdOrSlugSchema.parse(request.params);
      response.json({
        data: await this.service.listAnnouncementReactions(
          idOrSlug,
          request.auth?.userId,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly toggleAnnouncementReaction: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { idOrSlug } = announcementIdOrSlugSchema.parse(request.params);
      const fromQuery =
        typeof request.query.emoji === "string" ? request.query.emoji : undefined;
      const { emoji } = announcementReactionBodySchema.parse(
        request.body && typeof request.body === "object" && "emoji" in request.body
          ? request.body
          : { emoji: fromQuery ?? "" },
      );
      response.json({
        data: await this.service.toggleAnnouncementReaction(
          auth(request),
          idOrSlug,
          emoji,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly moderateAnnouncementReply: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { replyId } = announcementReplyIdSchema.parse(request.params);
      const { hidden } = moderateAnnouncementReplySchema.parse(request.body);
      response.json({
        data: await this.service.moderateAnnouncementReply(auth(request), replyId, hidden),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly createAnnouncement: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.status(201).json({
        data: await this.service.createAnnouncement(
          auth(request),
          createAnnouncementSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateAnnouncement: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = announcementIdSchema.parse(request.params);
      response.json({
        data: await this.service.updateAnnouncement(
          auth(request),
          id,
          updateAnnouncementSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteAnnouncement: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = announcementIdSchema.parse(request.params);
      await this.service.deleteAnnouncement(auth(request), id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly attachAnnouncementMedia: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = announcementIdSchema.parse(request.params);
      const files = await parseMultipartFiles(request);
      response.status(201).json({
        data: await this.service.attachAnnouncementMedia(
          auth(request),
          id,
          files,
          String(response.locals.requestId ?? ""),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteAnnouncementMedia: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, mediaId } = announcementMediaParamsSchema.parse(
        request.params,
      );
      response.json({
        data: await this.service.deleteAnnouncementMedia(
          auth(request),
          id,
          mediaId,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly streamAnnouncementMedia: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, mediaId } = announcementMediaParamsSchema.parse(
        request.params,
      );
      const { document, filename } =
        await this.service.openAnnouncementMedia(id, mediaId, request.auth);
      response.setHeader("Content-Type", document.mimeType);
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(filename)}"`,
      );
      response.setHeader("Content-Length", String(document.sizeBytes));
      response.setHeader(
        "Cache-Control",
        document.mimeType.startsWith("image/") ||
          document.mimeType.startsWith("video/")
          ? "public, max-age=86400"
          : "private, no-store",
      );
      this.service.openMediaStream(document).pipe(response);
    } catch (error) {
      next(error);
    }
  };

  /** Public featured catalog for homepage / marketing surfaces. */
  public readonly featuredCatalog: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const limitRaw = Number(request.query.limit ?? 6);
      const limit = Number.isFinite(limitRaw)
        ? Math.min(Math.max(Math.trunc(limitRaw), 1), 24)
        : 6;
      response.json({ data: this.service.featuredCatalog(limit) });
    } catch (error) {
      next(error);
    }
  };

  public readonly marketingContact: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.status(201).json({
        data: await this.service.submitMarketingContact(
          marketingContactSchema.parse(request.body),
          request.auth,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly listMarketingInquiries: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.listMarketingInquiries(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly getOrCreateThread: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.getOrCreateSupportThread(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly sendMessage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.status(201).json({
        data: await this.service.sendSupportMessage(
          auth(request),
          supportMessageSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly markRead: RequestHandler = async (request, response, next) => {
    try {
      const { id } = supportMessageIdSchema.parse(request.params);
      response.json({
        data: await this.service.markMessageRead(auth(request), id),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly unreadCount: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({ data: await this.service.unreadCount(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly listSupportThreads: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.listOrgSupportThreads(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly getSupportThread: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { threadId } = threadIdSchema.parse(request.params);
      response.json({
        data: await this.service.getSupportThreadForOps(auth(request), threadId),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly opsReply: RequestHandler = async (request, response, next) => {
    try {
      const input = opsReplySchema.parse(request.body);
      response.status(201).json({
        data: await this.service.replyAsOps(auth(request), input.threadId, {
          body: input.body,
        }),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly autoRespond: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.autoRespond(
          auth(request),
          autoRespondSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly listServices: RequestHandler = async (
    _request,
    response,
    next,
  ) => {
    try {
      response.json({ data: await this.service.listActiveServices() });
    } catch (error) {
      next(error);
    }
  };

  public readonly listKnowledge: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.listKnowledgeArticles(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly createKnowledge: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.status(201).json({
        data: await this.service.createKnowledgeArticle(
          auth(request),
          createKnowledgeArticleSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateKnowledge: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = knowledgeArticleIdSchema.parse(request.params);
      response.json({
        data: await this.service.updateKnowledgeArticle(
          auth(request),
          id,
          updateKnowledgeArticleSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteKnowledge: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = knowledgeArticleIdSchema.parse(request.params);
      await this.service.deleteKnowledgeArticle(auth(request), id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly listServicesAdmin: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.listPlatformServicesAdmin(auth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly createService: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.status(201).json({
        data: await this.service.createPlatformService(
          auth(request),
          createPlatformServiceSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateService: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = platformServiceIdSchema.parse(request.params);
      response.json({
        data: await this.service.updatePlatformService(
          auth(request),
          id,
          updatePlatformServiceSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteService: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = platformServiceIdSchema.parse(request.params);
      await this.service.deletePlatformService(auth(request), id);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

function auth(request: Request): AuthContext {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return request.auth;
}
