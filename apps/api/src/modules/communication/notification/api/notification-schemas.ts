import { z } from "zod";

const uuid = z.string().uuid();
const notificationTypes = ["account", "procurement", "quotation", "invoice", "payment", "shipment", "announcement", "support", "system", "security"] as const;
const notificationChannels = ["in_app", "email", "sms", "push"] as const;
const notificationPriorities = ["critical", "high", "normal", "low"] as const;

export const notificationIdSchema = z.object({ notificationId: uuid });
export const templateIdSchema = z.object({ templateId: uuid });
export const listNotificationsSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["unread", "read", "archived", "expired"]).optional(),
  type: z.enum(notificationTypes).optional(),
  priority: z.enum(notificationPriorities).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});
export const notificationIdsSchema = z.object({ notificationIds: z.array(uuid).min(1).max(100) });
export const preferenceSchema = z.object({
  type: z.enum(notificationTypes),
  channel: z.enum(notificationChannels),
  enabled: z.boolean(),
  locale: z.string().trim().min(2).max(20).optional(),
});
export const updatePreferencesSchema = z.object({ preferences: z.array(preferenceSchema).min(1).max(64) });
export const createTemplateSchema = z.object({
  key: z.string().trim().min(3).max(100).regex(/^[a-z0-9._-]+$/),
  type: z.enum(notificationTypes),
  channel: z.enum(notificationChannels),
  locale: z.string().trim().min(2).max(20).default("en"),
  subject: z.string().trim().min(1).max(250).optional(),
  title: z.string().trim().min(1).max(250),
  body: z.string().trim().min(1).max(20_000),
  variableSchema: z.record(z.string(), z.enum(["string", "number", "date", "url"])).optional(),
});
export const reviseTemplateSchema = createTemplateSchema.omit({ key: true, type: true, channel: true, locale: true });

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type ReviseTemplateInput = z.infer<typeof reviseTemplateSchema>;
