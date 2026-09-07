import { z } from "zod";

export const announcementIdOrSlugSchema = z.object({
  idOrSlug: z.string().trim().min(1).max(200),
});

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be URL-safe."),
  summary: z.string().trim().max(1000).optional(),
  body: z.string().trim().min(1).max(50_000),
  status: z.enum(["draft", "published", "archived"]).optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  pinned: z.boolean().optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const updateAnnouncementSchema = createAnnouncementSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one announcement field is required.",
  });

export const marketingContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z
    .string()
    .trim()
    .email()
    .max(320)
    .transform((value) => value.toLowerCase()),
  company: z.string().trim().max(200).optional(),
  subject: z.string().trim().max(300).optional(),
  message: z.string().trim().min(1).max(10_000),
});

export const supportMessageSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
});

export const supportMessageIdSchema = z.object({
  id: z.string().uuid(),
});

export const autoRespondSchema = z.object({
  message: z.string().trim().min(1).max(4000),
});

export const createKnowledgeArticleSchema = z.object({
  question: z.string().trim().min(1).max(500),
  answer: z.string().trim().min(1).max(20_000),
  keywords: z.array(z.string().trim().min(1).max(80)).max(40).optional(),
  active: z.boolean().optional(),
});

export const updateKnowledgeArticleSchema = createKnowledgeArticleSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one knowledge article field is required.",
  });

export const knowledgeArticleIdSchema = z.object({
  id: z.string().uuid(),
});

export const createPlatformServiceSchema = z.object({
  name: z.string().trim().min(1).max(200),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Slug must be URL-safe."),
  summary: z.string().trim().max(1000).optional(),
  body: z.string().trim().max(50_000).optional(),
  status: z.enum(["active", "inactive", "draft"]).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const updatePlatformServiceSchema = createPlatformServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one service field is required.",
  });

export const platformServiceIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type MarketingContactInput = z.infer<typeof marketingContactSchema>;
export type SupportMessageInput = z.infer<typeof supportMessageSchema>;
export type AutoRespondInput = z.infer<typeof autoRespondSchema>;
export type CreateKnowledgeArticleInput = z.infer<
  typeof createKnowledgeArticleSchema
>;
export type UpdateKnowledgeArticleInput = z.infer<
  typeof updateKnowledgeArticleSchema
>;
export type CreatePlatformServiceInput = z.infer<
  typeof createPlatformServiceSchema
>;
export type UpdatePlatformServiceInput = z.infer<
  typeof updatePlatformServiceSchema
>;

export const announcementReplyBodySchema = z.object({
  body: z.string().min(1).max(4000),
});

export const moderateAnnouncementReplySchema = z.object({
  hidden: z.boolean(),
});

export const announcementReplyIdSchema = z.object({
  replyId: z.string().uuid(),
});

export const announcementReactionBodySchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1)
    .max(16)
    .refine((value) => !/[<>]/.test(value), "Emoji must be plain text."),
});
