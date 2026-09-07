import { z } from "zod";

const uuid = z.string().uuid();
const money = z.coerce.number().finite().nonnegative().max(999_999_999_999);
const quantity = z.coerce.number().finite().positive().max(1_000_000);
const currencyCode = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);

const item = z.object({
  purchaseOrderItemId: uuid.optional(),
  description: z.string().trim().min(2).max(2_000),
  quantity,
  unitAmount: money,
});

const financialFields = z.object({
  currencyCode: currencyCode.default("USD"),
  exchangeRate: z.coerce.number().finite().positive().max(999_999_999).optional(),
  dueAt: z.coerce.date().optional(),
  discountAmount: money.default(0),
  taxAmount: money.default(0),
  shippingAmount: money.default(0),
  dutyAmount: money.default(0),
  otherAmount: money.default(0),
  documentIds: z.array(uuid).max(50).default([]),
  items: z.array(item).min(1).max(100),
});

export const createInvoiceSchema = financialFields.extend({
  purchaseOrderId: uuid,
  invoiceNumber: z.string().trim().min(1).max(100),
});

export const updateInvoiceDraftSchema = financialFields
  .partial()
  .extend({
    invoiceNumber: z.string().trim().min(1).max(100).optional(),
    rowVersion: z.coerce.number().int().nonnegative(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== "rowVersion"), {
    message: "Provide at least one editable field.",
  });

export const invoiceIdSchema = z.object({ invoiceId: uuid });
export const issueInvoiceSchema = z.object({
  rowVersion: z.coerce.number().int().nonnegative(),
});
export const voidInvoiceSchema = z.object({
  rowVersion: z.coerce.number().int().nonnegative(),
  reason: z.string().trim().min(3).max(2_000),
});
export const listInvoicesSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["draft", "issued", "paid", "partially_paid", "overdue", "voided"]).optional(),
  purchaseOrderId: uuid.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(["createdAt", "dueAt", "issuedAt", "totalAmount"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDraftInput = z.infer<typeof updateInvoiceDraftSchema>;
export type ListInvoicesInput = z.infer<typeof listInvoicesSchema>;
