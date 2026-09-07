import type { Request, RequestHandler, Response } from "express";

import { createTemplateSchema, listNotificationsSchema, notificationIdSchema, notificationIdsSchema, reviseTemplateSchema, templateIdSchema, updatePreferencesSchema } from "./notification-schemas.js";
import type { NotificationService } from "../application/notification-service.js";

export class NotificationController {
  public constructor(private readonly service: NotificationService) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listNotificationsSchema.parse(request.query);
      const notifications = await this.service.list(auth(request), input);
      response.json({ data: notifications.slice(0, input.pageSize).map(serialize), page: { hasMore: notifications.length > input.pageSize, nextCursor: null } });
    } catch (error) { next(error); }
  };
  public readonly unreadCount: RequestHandler = async (request, response, next) => {
    try { response.json({ data: { count: await this.service.unreadCount(auth(request)) } }); } catch (error) { next(error); }
  };
  public readonly getOne: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: serialize(await this.service.getInboxItem(auth(request), id(request))) });
    } catch (error) {
      next(error);
    }
  };
  public readonly markRead: RequestHandler = async (request, response, next) => {
    try { const input = notificationIdsSchema.parse(request.body); await this.service.markRead(auth(request), input.notificationIds, requestId(response)); response.status(204).end(); } catch (error) { next(error); }
  };
  public readonly markAllRead: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.markAllRead(auth(request), requestId(response)),
      });
    } catch (error) {
      next(error);
    }
  };
  public readonly markUnread: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.markUnread(auth(request), id(request), requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly archive: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.archive(auth(request), id(request), true, requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly unarchive: RequestHandler = async (request, response, next) => {
    try { response.json({ data: serialize(await this.service.archive(auth(request), id(request), false, requestId(response))) }); } catch (error) { next(error); }
  };
  public readonly delete: RequestHandler = async (request, response, next) => {
    try { await this.service.delete(auth(request), id(request), requestId(response)); response.status(204).end(); } catch (error) { next(error); }
  };
  public readonly preferences: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.preferences(auth(request)) }); } catch (error) { next(error); }
  };
  public readonly updatePreferences: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.updatePreferences(auth(request), updatePreferencesSchema.parse(request.body), requestId(response)) }); } catch (error) { next(error); }
  };
  public readonly listTemplates: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.listTemplates(auth(request)) }); } catch (error) { next(error); }
  };
  public readonly createTemplate: RequestHandler = async (request, response, next) => {
    try { response.status(201).json({ data: await this.service.createTemplate(auth(request), createTemplateSchema.parse(request.body), requestId(response)) }); } catch (error) { next(error); }
  };
  public readonly template: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.template(auth(request), templateId(request)) }); } catch (error) { next(error); }
  };
  public readonly reviseTemplate: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.reviseTemplate(auth(request), templateId(request), reviseTemplateSchema.parse(request.body), requestId(response)) }); } catch (error) { next(error); }
  };
  public readonly publishTemplate: RequestHandler = async (request, response, next) => {
    try { response.json({ data: await this.service.publishTemplate(auth(request), templateId(request), requestId(response)) }); } catch (error) { next(error); }
  };
}

function id(request: Request): string { return notificationIdSchema.parse(request.params).notificationId; }
function templateId(request: Request): string { return templateIdSchema.parse(request.params).templateId; }
function auth(request: Request): NonNullable<Request["auth"]> { if (!request.auth) throw new Error("Authentication middleware must run before notification controllers."); return request.auth; }
function requestId(response: Response): string { return response.locals.requestId as string; }
function serialize(notification: Awaited<ReturnType<NotificationService["markUnread"]>>) {
  return { id: notification.id, type: notification.type, priority: notification.priority, status: notification.status, title: notification.title, body: notification.body, deepLink: notification.deepLink, locale: notification.locale, metadata: notification.metadata, readAt: notification.readAt, archivedAt: notification.archivedAt, expiresAt: notification.expiresAt, createdAt: notification.createdAt, deliveries: notification.deliveries };
}
