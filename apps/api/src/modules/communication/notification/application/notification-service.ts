import type { OutboxEvent, Prisma } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { composeActivityEmail } from "../../email/activity-email.js";
import { createEmailBrand, type EmailBrand } from "../../email/email-brand.js";
import { resolveActivityPath } from "../../email/email-paths.js";
import type { CreateTemplateInput, ListNotificationsInput, ReviseTemplateInput, UpdatePreferencesInput } from "../api/notification-schemas.js";
import { NotificationRepository, type NotificationRecord } from "../infrastructure/notification-repository.js";
import { type EmailGateway } from "./notification-gateways.js";
import { assertNotificationPermission, assertTemplatePermission, isMandatoryNotification, mergeNotificationPreferenceDefaults } from "./notification-policy.js";

const priorityByType = { account: "high", procurement: "high", quotation: "high", invoice: "high", payment: "high", shipment: "normal", announcement: "low", support: "high", system: "critical", security: "critical" } as const;
const typeByAggregate = {
  procurement: "procurement",
  quotation: "quotation",
  invoice: "invoice",
  payment: "payment",
  shipment: "shipment",
  announcement: "announcement",
  support: "support",
} as const;

/** Internal/job events must not create customer mail or fail the dispatcher. */
const SKIP_NOTIFICATION_EVENT_TYPES = new Set([
  "invoice.pdf.prepare",
  "invoice.email.prepare",
  "purchase_order.issued",
  "quotation.issue",
  "quotation.accept",
  "procurement.request.assigned",
]);

export class NotificationService {
  private readonly repository: NotificationRepository;
  private readonly brand: EmailBrand;

  public constructor(
    private readonly database: DatabaseClient,
    private readonly emailGateway?: EmailGateway,
    brand?: EmailBrand,
  ) {
    this.repository = new NotificationRepository(database);
    this.brand = brand ?? createEmailBrand({});
  }

  public async list(context: AuthContext, input: ListNotificationsInput): Promise<readonly NotificationRecord[]> {
    assertNotificationPermission(context, "notification:read");
    return this.repository.listInbox(context.userId, input);
  }

  public async unreadCount(context: AuthContext): Promise<number> {
    assertNotificationPermission(context, "notification:read");
    return this.database.notification.count({ where: { recipientUserId: context.userId, status: "unread", deletedAt: null } });
  }

  public async markRead(context: AuthContext, notificationIds: readonly string[], requestId: string): Promise<void> {
    assertNotificationPermission(context, "notification:read");
    await this.database.$transaction(async (transaction) => {
      await transaction.notification.updateMany({ where: { id: { in: [...notificationIds] }, recipientUserId: context.userId, deletedAt: null, status: "unread" }, data: { status: "read", readAt: new Date() } });
      await audit(transaction, context, "notification.read", requestId, notificationIds[0] ?? context.userId, { count: notificationIds.length });
    });
  }

  public async markAllRead(context: AuthContext, requestId: string): Promise<{ count: number }> {
    assertNotificationPermission(context, "notification:read");
    return this.database.$transaction(async (transaction) => {
      const result = await transaction.notification.updateMany({
        where: {
          recipientUserId: context.userId,
          deletedAt: null,
          status: "unread",
        },
        data: { status: "read", readAt: new Date() },
      });
      await audit(transaction, context, "notification.read_all", requestId, context.userId, {
        count: result.count,
      });
      return { count: result.count };
    });
  }

  public async markUnread(context: AuthContext, notificationId: string, requestId: string): Promise<NotificationRecord> {
    assertNotificationPermission(context, "notification:read");
    const notification = await this.repository.findInboxItem(context.userId, notificationId);
    if (!notification) throw notFound();
    await this.database.$transaction(async (transaction) => {
      await transaction.notification.update({ where: { id: notification.id }, data: { status: "unread", readAt: null } });
      await audit(transaction, context, "notification.unread", requestId, notification.id);
    });
    return this.get(context, notificationId);
  }

  public async archive(context: AuthContext, notificationId: string, archived: boolean, requestId: string): Promise<NotificationRecord> {
    assertNotificationPermission(context, "notification:read");
    const notification = await this.repository.findInboxItem(context.userId, notificationId);
    if (!notification) throw notFound();
    await this.database.$transaction(async (transaction) => {
      await transaction.notification.update({ where: { id: notification.id }, data: archived ? { status: "archived", archivedAt: new Date() } : { status: notification.readAt ? "read" : "unread", archivedAt: null } });
      await audit(transaction, context, archived ? "notification.archived" : "notification.unarchived", requestId, notification.id);
    });
    return this.get(context, notificationId);
  }

  public async delete(context: AuthContext, notificationId: string, requestId: string): Promise<void> {
    assertNotificationPermission(context, "notification:read");
    const notification = await this.repository.findInboxItem(context.userId, notificationId);
    if (!notification) throw notFound();
    await this.database.$transaction(async (transaction) => {
      await transaction.notification.update({ where: { id: notification.id }, data: { status: "deleted", deletedAt: new Date() } });
      await audit(transaction, context, "notification.deleted", requestId, notification.id);
    });
  }

  public async getInboxItem(context: AuthContext, notificationId: string): Promise<NotificationRecord> {
    assertNotificationPermission(context, "notification:read");
    return this.get(context, notificationId);
  }

  public async preferences(context: AuthContext) {
    assertNotificationPermission(context, "notification:read");
    const stored = await this.database.notificationPreference.findMany({
      where: { organizationId: context.organizationId, userId: context.userId },
      orderBy: [{ type: "asc" }, { channel: "asc" }],
    });
    return mergeNotificationPreferenceDefaults(stored);
  }

  public async updatePreferences(context: AuthContext, input: UpdatePreferencesInput, requestId: string) {
    assertNotificationPermission(context, "notification:read");
    for (const preference of input.preferences) {
      if (!preference.enabled && isMandatoryNotification(preference.type)) {
        throw new AppError({ statusCode: 422, code: "VALIDATION_ERROR", message: "Account, system, and security notifications cannot be disabled." });
      }
    }
    await this.database.$transaction(async (transaction) => {
      for (const preference of input.preferences) {
        await transaction.notificationPreference.upsert({
          where: { organizationId_userId_type_channel: { organizationId: context.organizationId, userId: context.userId, type: preference.type, channel: preference.channel } },
          create: { organizationId: context.organizationId, userId: context.userId, type: preference.type, channel: preference.channel, enabled: preference.enabled, ...(preference.locale !== undefined ? { locale: preference.locale } : {}) },
          update: { enabled: preference.enabled, ...(preference.locale !== undefined ? { locale: preference.locale } : {}) },
        });
      }
      await audit(transaction, context, "notification.preferences_updated", requestId, context.userId, { count: input.preferences.length });
    });
    return this.preferences(context);
  }

  public async createTemplate(context: AuthContext, input: CreateTemplateInput, requestId: string) {
    assertTemplatePermission(context, "communication:manage");
    const template = await this.database.$transaction(async (transaction) => {
      const created = await transaction.communicationTemplate.create({ data: { organizationId: context.organizationId, key: input.key, type: input.type, channel: input.channel, locale: input.locale, createdById: context.userId } });
      await transaction.communicationTemplateVersion.create({ data: { templateId: created.id, version: 1, ...(input.subject !== undefined ? { subject: input.subject } : {}), title: input.title, body: input.body, ...(input.variableSchema !== undefined ? { variableSchema: input.variableSchema } : {}) } });
      await audit(transaction, context, "communication.template_created", requestId, created.id);
      return created;
    });
    return this.template(context, template.id);
  }

  public async reviseTemplate(context: AuthContext, templateId: string, input: ReviseTemplateInput, requestId: string) {
    assertTemplatePermission(context, "communication:manage");
    const template = await this.template(context, templateId);
    if (template.status === "archived") throw new AppError({ statusCode: 409, code: "POLICY_VIOLATION", message: "Archived templates cannot be revised." });
    await this.database.$transaction(async (transaction) => {
      const latest = await transaction.communicationTemplateVersion.aggregate({ where: { templateId }, _max: { version: true } });
      await transaction.communicationTemplateVersion.create({ data: { templateId, version: (latest._max.version ?? 0) + 1, ...(input.subject !== undefined ? { subject: input.subject } : {}), title: input.title, body: input.body, ...(input.variableSchema !== undefined ? { variableSchema: input.variableSchema } : {}) } });
      await audit(transaction, context, "communication.template_revised", requestId, templateId);
    });
    return this.template(context, templateId);
  }

  public async publishTemplate(context: AuthContext, templateId: string, requestId: string) {
    assertTemplatePermission(context, "communication:publish");
    const template = await this.template(context, templateId);
    if (template.createdById === context.userId) throw new AppError({ statusCode: 409, code: "POLICY_VIOLATION", message: "A template author cannot publish their own template." });
    await this.database.$transaction(async (transaction) => {
      const latest = await transaction.communicationTemplateVersion.findFirstOrThrow({ where: { templateId }, orderBy: { version: "desc" } });
      await transaction.communicationTemplateVersion.update({ where: { id: latest.id }, data: { status: "published", publishedAt: new Date(), publishedById: context.userId } });
      await transaction.communicationTemplate.update({ where: { id: templateId }, data: { status: "published" } });
      await audit(transaction, context, "communication.template_published", requestId, templateId);
    });
    return this.template(context, templateId);
  }

  public async listTemplates(context: AuthContext) {
    assertTemplatePermission(context, "communication:manage");
    return this.database.communicationTemplate.findMany({ where: { organizationId: context.organizationId }, include: { versions: { orderBy: { version: "desc" } } }, orderBy: { updatedAt: "desc" } });
  }

  public async template(context: AuthContext, templateId: string) {
    assertTemplatePermission(context, "communication:manage");
    const template = await this.database.communicationTemplate.findFirst({ where: { id: templateId, organizationId: context.organizationId }, include: { versions: { orderBy: { version: "desc" } } } });
    if (!template) throw notFound();
    return template;
  }

  public async dispatchPending(limit = 25): Promise<number> {
    const outboxEvents = await this.database.outboxEvent.findMany({ where: { publishedAt: null }, orderBy: { occurredAt: "asc" }, take: limit });
    let processed = 0;
    for (const event of outboxEvents) {
      try {
        await this.dispatch(event);
        processed += 1;
      } catch (error) {
        await this.database.outboxEvent.update({ where: { id: event.id }, data: { attempts: { increment: 1 }, lastError: error instanceof Error ? error.message.slice(0, 1_000) : "Notification dispatch failed." } });
      }
    }
    return processed;
  }

  public async consumeOutboxEvent(event: OutboxEvent): Promise<void> {
    await this.dispatch(event);
  }

  private async dispatch(event: OutboxEvent): Promise<void> {
    if (SKIP_NOTIFICATION_EVENT_TYPES.has(event.eventType)) {
      await this.markOutboxPublished(event.id);
      return;
    }
    const payload = event.payload as Record<string, unknown>;
    const type = inferType(event.aggregateType);
    if (type === "announcement") {
      if (
        event.eventType.includes("reply") ||
        event.eventType.includes("reaction")
      ) {
        await this.markOutboxPublished(event.id);
        return;
      }
      await this.dispatchAnnouncementPublished(event);
      return;
    }
    const related = await this.resolveRelatedRequest(payload);
    const remapToRequester =
      type === "invoice" ||
      type === "payment" ||
      type === "shipment" ||
      type === "quotation";
    const statedRecipient =
      typeof payload.recipientUserId === "string" ? payload.recipientUserId : undefined;
    const recipientUserId =
      remapToRequester && related.requesterId ? related.requesterId : statedRecipient;
    if (!recipientUserId) {
      await this.markOutboxPublished(event.id);
      return;
    }
    const recipient = await this.database.user.findFirst({
      where: { id: recipientUserId },
      select: { id: true, email: true, locale: true, firstName: true, displayName: true },
    });
    if (!recipient) throw new Error(`Notification recipient ${recipientUserId} was not found.`);
    const notificationEvent = await this.database.notificationEvent.upsert({ where: { outboxEventId: event.id }, create: { organizationId: event.organizationId, outboxEventId: event.id, eventType: event.eventType }, update: {} });
    const fallbackTitle = event.eventType.replaceAll(".", " ");
    const content = await this.resolveContent(event.organizationId, type, recipient.locale, payload, fallbackTitle);
    const activity = composeActivityEmail({
      brand: this.brand,
      eventType: event.eventType,
      notificationType: type,
      payload,
      recipient,
      publicCode: related.publicCode ?? null,
      requestTitle: related.title ?? null,
    });
    const deepLink = resolveActivityPath(type, {
      ...payload,
      ...(related.requestId ? { requestId: related.requestId } : {}),
    });
    const notification = await this.database.notification.upsert({
      where: { notificationEventId_recipientUserId: { notificationEventId: notificationEvent.id, recipientUserId } },
      create: {
        organizationId: event.organizationId,
        recipientUserId,
        notificationEventId: notificationEvent.id,
        type,
        priority: priorityByType[type],
        title: activity.subject,
        body: content.body && content.body !== fallbackTitle ? content.body : activity.preheader,
        locale: recipient.locale,
        metadata: payload as Prisma.InputJsonValue,
        ...(deepLink ? { deepLink } : {}),
      },
      update: {},
    });
    const emailEnabled = isMandatoryNotification(type) || await this.channelEnabled(event.organizationId, recipientUserId, type, "email");
    if (emailEnabled && this.emailGateway) {
      const alreadySent = await this.database.notificationDelivery.findFirst({
        where: { notificationId: notification.id, channel: "email", status: "sent" },
        select: { id: true },
      });
      if (!alreadySent) {
        const lastDelivery = await this.database.notificationDelivery.aggregate({
          where: { notificationId: notification.id, channel: "email" },
          _max: { attempt: true },
        });
        const delivery = await this.database.notificationDelivery.create({
          data: { notificationId: notification.id, channel: "email", destination: recipient.email, attempt: (lastDelivery._max.attempt ?? 0) + 1 },
        });
        try {
          const sent = await this.emailGateway.send({
            to: recipient.email,
            subject: activity.subject,
            text: activity.text,
            html: activity.html,
          });
          await this.database.notificationDelivery.update({
            where: { id: delivery.id },
            data: { status: "sent", sentAt: new Date(), providerMessageId: sent.providerMessageId },
          });
          process.stdout.write(
            `[notification-email] event=${event.eventType} type=${type} recipient=${recipient.id} status=sent providerMessageId=${sent.providerMessageId}\n`,
          );
        } catch (error) {
          await this.database.notificationDelivery.update({
            where: { id: delivery.id },
            data: {
              status: "failed",
              failedAt: new Date(),
              errorCode: "EMAIL_SEND_FAILED",
              errorMessage: error instanceof Error ? error.message.slice(0, 1_000) : "Email delivery failed.",
            },
          });
          process.stdout.write(
            `[notification-email] event=${event.eventType} type=${type} recipient=${recipient.id} status=failed\n`,
          );
          throw error;
        }
      }
    }
    await this.database.$transaction(async (transaction) => {
      await transaction.notificationEvent.update({ where: { id: notificationEvent.id }, data: { status: "sent", attempts: { increment: 1 }, processedAt: new Date(), lastError: null } });
      await transaction.outboxEvent.update({ where: { id: event.id }, data: { publishedAt: new Date(), attempts: { increment: 1 }, lastError: null } });
    });
  }

  private async dispatchAnnouncementPublished(event: OutboxEvent): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const actorId = typeof payload.actorId === "string" ? payload.actorId : "";
    const members = await this.database.organizationMembership.findMany({
      where: { status: "active" },
      select: { userId: true, organizationId: true },
    });
    const seen = new Set<string>();
    for (const member of members) {
      if (member.userId === actorId || seen.has(member.userId)) continue;
      seen.add(member.userId);
      const synthetic: OutboxEvent = {
        ...event,
        organizationId: member.organizationId,
        payload: {
          ...payload,
          recipientUserId: member.userId,
        },
      };
      await this.createRecipientNotification(synthetic, member.userId, "announcement");
    }
    await this.markOutboxPublished(event.id);
  }

  private async createRecipientNotification(
    event: OutboxEvent,
    recipientUserId: string,
    type: keyof typeof priorityByType,
  ): Promise<void> {
    const payload = event.payload as Record<string, unknown>;
    const related = await this.resolveRelatedRequest(payload);
    const recipient = await this.database.user.findFirst({
      where: { id: recipientUserId },
      select: { id: true, email: true, locale: true, firstName: true, displayName: true },
    });
    if (!recipient) return;
    const notificationEvent = await this.database.notificationEvent.upsert({
      where: { outboxEventId: event.id },
      create: {
        organizationId: event.organizationId,
        outboxEventId: event.id,
        eventType: event.eventType,
      },
      update: {},
    });
    const fallbackTitle = event.eventType.replaceAll(".", " ");
    const content = await this.resolveContent(
      event.organizationId,
      type,
      recipient.locale,
      payload,
      fallbackTitle,
    );
    const activity = composeActivityEmail({
      brand: this.brand,
      eventType: event.eventType,
      notificationType: type,
      payload,
      recipient,
      publicCode: related.publicCode ?? null,
      requestTitle: related.title ?? null,
    });
    const deepLink = resolveActivityPath(type, {
      ...payload,
      ...(related.requestId ? { requestId: related.requestId } : {}),
    });
    await this.database.notification.upsert({
      where: {
        notificationEventId_recipientUserId: {
          notificationEventId: notificationEvent.id,
          recipientUserId,
        },
      },
      create: {
        organizationId: event.organizationId,
        recipientUserId,
        notificationEventId: notificationEvent.id,
        type,
        priority: priorityByType[type],
        title: activity.subject,
        body:
          content.body && content.body !== fallbackTitle
            ? content.body
            : activity.preheader,
        locale: recipient.locale,
        metadata: payload as Prisma.InputJsonValue,
        ...(deepLink ? { deepLink } : {}),
      },
      update: {},
    });
  }

  private async markOutboxPublished(outboxEventId: string): Promise<void> {
    await this.database.outboxEvent.update({
      where: { id: outboxEventId },
      data: { publishedAt: new Date(), lastError: null },
    });
  }

  private async resolveRelatedRequest(payload: Record<string, unknown>): Promise<{
    readonly requesterId?: string;
    readonly publicCode?: string;
    readonly title?: string;
    readonly requestId?: string;
  }> {
    const id = (...keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = payload[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return undefined;
    };
    const requestId = id("requestId", "procurementRequestId", "procurement_request_id");
    if (requestId) {
      const row = await this.database.procurementRequest.findFirst({
        where: { id: requestId },
        select: { id: true, publicCode: true, title: true, requesterId: true },
      });
      if (row) {
        return { requestId: row.id, publicCode: row.publicCode, title: row.title, requesterId: row.requesterId };
      }
    }
    const quotationId = id("quotationId", "quotation_id");
    if (quotationId) {
      const row = await this.database.quotation.findFirst({
        where: { id: quotationId },
        select: {
          request: { select: { id: true, publicCode: true, title: true, requesterId: true } },
        },
      });
      const request = row?.request;
      if (request) {
        return { requestId: request.id, publicCode: request.publicCode, title: request.title, requesterId: request.requesterId };
      }
    }
    const requestSelect = {
      request: { select: { id: true, publicCode: true, title: true, requesterId: true } },
    } as const;
    const invoiceId = id("invoiceId", "invoice_id");
    if (invoiceId) {
      const row = await this.database.invoice.findFirst({
        where: { id: invoiceId },
        select: { purchaseOrder: { select: requestSelect } },
      });
      const request = row?.purchaseOrder.request;
      if (request) {
        return { requestId: request.id, publicCode: request.publicCode, title: request.title, requesterId: request.requesterId };
      }
    }
    const shipmentId = id("shipmentId", "shipment_id");
    if (shipmentId) {
      const row = await this.database.shipment.findFirst({
        where: { id: shipmentId },
        select: { purchaseOrder: { select: requestSelect } },
      });
      const request = row?.purchaseOrder.request;
      if (request) {
        return { requestId: request.id, publicCode: request.publicCode, title: request.title, requesterId: request.requesterId };
      }
    }
    const paymentId = id("paymentId", "payment_id");
    if (paymentId) {
      const row = await this.database.paymentAllocation.findFirst({
        where: { paymentId },
        select: {
          invoice: { select: { purchaseOrder: { select: requestSelect } } },
        },
      });
      const request = row?.invoice.purchaseOrder.request;
      if (request) {
        return { requestId: request.id, publicCode: request.publicCode, title: request.title, requesterId: request.requesterId };
      }
    }
    return {};
  }

  private async channelEnabled(organizationId: string, userId: string, type: keyof typeof priorityByType, channel: "email"): Promise<boolean> {
    const preference = await this.database.notificationPreference.findUnique({ where: { organizationId_userId_type_channel: { organizationId, userId, type, channel } }, select: { enabled: true } });
    return preference?.enabled ?? true;
  }

  private async resolveContent(organizationId: string, type: keyof typeof priorityByType, locale: string, variables: Record<string, unknown>, fallbackTitle: string): Promise<{ readonly subject?: string; readonly title: string; readonly body: string }> {
    const template = await this.database.communicationTemplate.findFirst({
      where: { organizationId, type, channel: "email", locale, status: "published" },
      include: { versions: { where: { status: "published" }, orderBy: { version: "desc" }, take: 1 } },
    }) ?? await this.database.communicationTemplate.findFirst({
      where: { organizationId, type, channel: "email", locale: "en", status: "published" },
      include: { versions: { where: { status: "published" }, orderBy: { version: "desc" }, take: 1 } },
    });
    const version = template?.versions[0];
    if (!version) return { title: fallbackTitle, body: fallbackTitle };
    return {
      ...(version.subject ? { subject: renderTemplate(version.subject, variables) } : {}),
      title: renderTemplate(version.title, variables),
      body: renderTemplate(version.body, variables),
    };
  }

  private async get(context: AuthContext, notificationId: string): Promise<NotificationRecord> {
    const notification = await this.repository.findInboxItem(context.userId, notificationId);
    if (!notification) throw notFound();
    return notification;
  }
}

function inferType(aggregateType: string): keyof typeof priorityByType {
  const prefix = aggregateType.split("_")[0] ?? aggregateType;
  return prefix in typeByAggregate
    ? typeByAggregate[prefix as keyof typeof typeByAggregate]
    : "system";
}
async function audit(transaction: Prisma.TransactionClient, context: AuthContext, action: string, requestId: string, resourceId: string, metadata?: object): Promise<void> {
  await transaction.auditEvent.create({ data: { organizationId: context.organizationId, actorId: context.userId, action, resourceType: "notification", resourceId, requestId, ...(metadata ? { metadata } : {}) } });
}
function renderTemplate(value: string, variables: Record<string, unknown>): string {
  return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key: string) => {
    const variable = variables[key];
    return typeof variable === "string" || typeof variable === "number" ? String(variable) : "";
  });
}
function notFound(): AppError { return new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Notification resource not found." }); }
