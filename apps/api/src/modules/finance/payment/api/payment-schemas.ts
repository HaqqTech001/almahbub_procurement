import { z } from "zod";

const uuid = z.string().uuid();
const money = z.coerce.number().finite().positive().max(999_999_999_999);
const currencyCode = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);

export const paymentIdSchema = z.object({ paymentId: uuid });
export const createPaymentSchema = z.object({
  amount: money,
  currencyCode: currencyCode.default("USD"),
  evidence: z.object({
    documentId: uuid.optional(),
    reference: z.string().trim().min(1).max(200),
    note: z.string().trim().max(2_000).optional(),
  }),
  allocations: z.array(z.object({ invoiceId: uuid, amount: money })).min(1).max(100),
});
export const rowVersionSchema = z.object({ rowVersion: z.coerce.number().int().nonnegative() });
export const listPaymentsSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(["draft", "pending_confirmation", "confirmed"]).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>;
