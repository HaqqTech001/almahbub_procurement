import { z } from "zod";

import { quotationCommands } from "../domain/quotation-state.js";

const money = z.coerce.number().finite().nonnegative().max(999_999_999_999);
const quantity = z.coerce.number().finite().positive().max(1_000_000);
const uuid = z.string().uuid();

const item = z.object({
  procurementRequestItemId: uuid.optional(),
  productVariantId: uuid.optional(),
  description: z.string().trim().min(2).max(2_000),
  quantity,
  unitAmount: money,
});

const commercialFields = z.object({
  supplierId: uuid.optional(),
  currencyCode: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).default("USD"),
  expiresAt: z.coerce.date().optional(),
  deliveryLeadTimeDays: z.coerce.number().int().nonnegative().max(3_650).optional(),
  minimumOrderQuantity: quantity.optional(),
  paymentTerms: z.string().trim().min(2).max(2_000).optional(),
  commercialTerms: z.string().trim().max(10_000).optional(),
  subtotalAmount: money.default(0),
  discountAmount: money.default(0),
  taxAmount: money.default(0),
  shippingAmount: money.default(0),
  dutyAmount: money.default(0),
  otherAmount: money.default(0),
  documentIds: z.array(uuid).max(50).default([]),
  items: z.array(item).min(1).max(100),
});

export const createQuotationSchema = commercialFields.extend({
  procurementRequestId: uuid,
});

export const updateQuotationDraftSchema = commercialFields
  .partial()
  .extend({ rowVersion: z.coerce.number().int().nonnegative() })
  .refine((value) => Object.keys(value).some((key) => key !== "rowVersion"), {
    message: "Provide at least one editable field.",
  });

export const listQuotationsSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  procurementRequestId: uuid.optional(),
  status: z
    .enum([
      "draft",
      "internally_reviewed",
      "issued",
      "accepted",
      "declined",
      "expired",
      "superseded",
    ])
    .optional(),
  supplierId: uuid.optional(),
  familyId: uuid.optional(),
});

export const quotationIdSchema = z.object({ quotationId: uuid });
export const quotationCommandSchema = z.object({
  command: z.enum(quotationCommands),
  rowVersion: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(3).max(2_000).optional(),
});
export const reviseQuotationSchema = z.object({
  rowVersion: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(3).max(2_000),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationDraftInput = z.infer<
  typeof updateQuotationDraftSchema
>;
export type ListQuotationsInput = z.infer<typeof listQuotationsSchema>;
