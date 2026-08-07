import { z } from "zod";

import { procurementRequestCommands } from "../domain/procurement-request-state.js";

const moneySchema = z.coerce
  .number()
  .finite()
  .nonnegative()
  .max(999_999_999_999);
const dateSchema = z.coerce.date();

export const procurementRequestItemSchema = z.object({
  productVariantId: z.string().uuid().optional(),
  description: z.string().trim().min(2).max(2_000),
  quantity: z.coerce.number().finite().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(32),
  targetUnitAmount: moneySchema.optional(),
});

export const createProcurementRequestSchema = z.object({
  title: z.string().trim().min(3).max(200),
  currencyCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
  notes: z.string().trim().max(10_000).optional(),
  destinationCountryCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  destinationAddress: z.string().trim().min(5).max(1_000).optional(),
  requiredByDate: dateSchema.optional(),
  budgetAmount: moneySchema.optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  restrictedGoodsDeclared: z.boolean().default(false),
  items: z.array(procurementRequestItemSchema).min(1).max(100),
  documentIds: z.array(z.string().uuid()).max(5).default([]),
});

export const updateProcurementRequestSchema = createProcurementRequestSchema
  .partial()
  .extend({
    rowVersion: z.coerce.number().int().nonnegative(),
  })
  .refine(
    (value) => Object.keys(value).some((key) => key !== "rowVersion"),
    "Provide at least one editable field.",
  );

export const listProcurementRequestsSchema = z.object({
  cursor: z.string().max(512).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().min(2).max(100).optional(),
  status: z
    .enum([
      "draft",
      "submitted",
      "needs_clarification",
      "accepted_for_sourcing",
      "sourcing",
      "quote_issued",
      "revision_requested",
      "approved",
      "declined",
      "expired",
      "purchase_in_progress",
      "fulfilled",
      "cancelled",
      "closed",
    ])
    .optional(),
  ownerId: z.string().uuid().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  includeArchived: z.coerce.boolean().default(false),
  sort: z
    .enum(["createdAt", "-createdAt", "requiredByDate", "-requiredByDate"])
    .default("-createdAt"),
});

export const procurementRequestIdSchema = z.object({
  requestId: z.string().uuid(),
});

export const transitionProcurementRequestSchema = z.object({
  command: z.enum(procurementRequestCommands),
  rowVersion: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(3).max(2_000).optional(),
});

export const assignProcurementRequestSchema = z.object({
  membershipId: z.string().uuid(),
  rowVersion: z.coerce.number().int().nonnegative(),
});

export const archiveProcurementRequestSchema = z.object({
  rowVersion: z.coerce.number().int().nonnegative(),
});

export type CreateProcurementRequestInput = z.infer<
  typeof createProcurementRequestSchema
>;
export type UpdateProcurementRequestInput = z.infer<
  typeof updateProcurementRequestSchema
>;
export type ListProcurementRequestsInput = z.infer<
  typeof listProcurementRequestsSchema
>;
