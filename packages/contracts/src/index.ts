import { z } from "zod";

/**
 * Shared contract primitives only. Domain-specific schemas belong to the
 * module that owns their lifecycle and are introduced with that module.
 */
export const apiVersion = "v1" as const;
export const apiServiceName = "hamd-api" as const;

export const requestIdSchema = z.string().uuid();

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(25),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const domainEventNames = [
  "identity.user_registered", "identity.email_verified", "procurement.requested",
  "sourcing.rfq_created", "commercial.quotation_submitted", "commercial.quotation_approved",
  "commercial.purchase_order_approved", "finance.invoice_issued", "finance.payment_recorded",
  "logistics.shipment_created", "logistics.shipment_delivered",
] as const;
export const domainEventNameSchema = z.enum(domainEventNames);
export type DomainEventName = z.infer<typeof domainEventNameSchema>;

const uuid = z.string().uuid();
export const domainEventEnvelopeSchema = z.object({
  id: uuid,
  name: domainEventNameSchema,
  version: z.literal(1),
  occurredAt: z.coerce.date(),
  organizationId: uuid,
  aggregate: z.object({ type: z.string().min(1).max(100), id: uuid }),
  actor: z.object({ type: z.literal("user"), id: uuid }).optional(),
  correlationId: uuid.optional(),
  causationId: uuid.optional(),
  payload: z.record(z.string(), z.unknown()),
  metadata: z.object({ schemaVersion: z.literal(1) }).default({ schemaVersion: 1 }),
});
export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;
