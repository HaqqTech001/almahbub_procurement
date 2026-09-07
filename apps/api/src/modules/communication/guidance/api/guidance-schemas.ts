import { z } from "zod";

export const guidanceModes = ["off", "guided", "training"] as const;
export const guidanceTourStatuses = ["draft", "published", "archived", "scheduled"] as const;
export const guidanceProgressStatuses = ["not_started", "in_progress", "completed", "skipped"] as const;
export const guidanceAudiences = [
  "client_workspace",
  "operations_console",
  "supplier_portal",
  "mobile",
  "all_authenticated",
] as const;

export const updatePreferenceSchema = z
  .object({
    mode: z.enum(guidanceModes).optional(),
    neverAutoStart: z.boolean().optional(),
    welcomeCompleted: z.boolean().optional(),
    locale: z.string().min(2).max(16).optional(),
  })
  .refine(
    (value) =>
      value.mode !== undefined ||
      value.neverAutoStart !== undefined ||
      value.welcomeCompleted !== undefined ||
      value.locale !== undefined,
    { message: "At least one preference field is required." },
  );

export const upsertProgressSchema = z.object({
  tourId: z.string().uuid(),
  status: z.enum(guidanceProgressStatuses),
  currentStepKey: z.string().max(120).nullable().optional(),
  completedSteps: z.number().int().min(0).max(500).optional(),
  totalSteps: z.number().int().min(0).max(500).optional(),
});

export const dismissTipSchema = z.object({
  tipId: z.string().uuid(),
});

export const resetProgressSchema = z.object({
  scope: z.enum(["current", "all"]),
  tourId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export const tourIdSchema = z.object({
  tourId: z.string().uuid(),
});

export const tipIdSchema = z.object({
  tipId: z.string().uuid(),
});

const stepSchema = z.object({
  stepKey: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(4000),
  targetSelector: z.string().max(300).optional(),
  placement: z.enum(["auto", "top", "bottom", "left", "right", "center"]).optional(),
  requireAction: z.boolean().optional(),
  actionEvent: z.string().max(40).optional(),
  actionLabel: z.string().max(200).optional(),
  imageHref: z.string().url().max(2000).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
});

export const createTourSchema = z.object({
  key: z.string().min(1).max(120).regex(/^[a-z0-9_:-]+$/i),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  audience: z.enum(guidanceAudiences),
  pageKey: z.string().min(1).max(120),
  mandatory: z.boolean().optional(),
  estimatedMinutes: z.number().int().min(1).max(180).optional(),
  locale: z.string().min(2).max(16).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
  steps: z.array(stepSchema).min(1).max(50),
});

export const updateTourSchema = createTourSchema
  .partial()
  .extend({
    status: z.enum(guidanceTourStatuses).optional(),
    steps: z.array(stepSchema).min(1).max(50).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one tour field is required.",
  });

export const scheduleTourSchema = z.object({
  scheduledFor: z.string().datetime(),
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;
export type UpsertProgressInput = z.infer<typeof upsertProgressSchema>;
export type CreateTourInput = z.infer<typeof createTourSchema>;
export type UpdateTourInput = z.infer<typeof updateTourSchema>;
export type ResetProgressInput = z.infer<typeof resetProgressSchema>;
