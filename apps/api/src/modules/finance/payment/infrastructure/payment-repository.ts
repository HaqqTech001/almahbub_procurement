import type { Prisma } from "@hamd/database";

import type { CreatePaymentInput, ListPaymentsInput } from "../api/payment-schemas.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";

const paymentInclude = {
  allocations: { include: { invoice: true } },
  history: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
} as const satisfies Prisma.PaymentInclude;

export type PaymentRecord = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

export class PaymentRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findById(organizationId: string, id: string): Promise<PaymentRecord | null> {
    return this.database.payment.findFirst({ where: { id, organizationId }, include: paymentInclude });
  }

  public list(organizationId: string, input: ListPaymentsInput): Promise<PaymentRecord[]> {
    return this.database.payment.findMany({
      where: { organizationId, ...(input.status ? { status: input.status } : {}) },
      include: paymentInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.pageSize + 1,
    });
  }

  public findByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<PaymentRecord | null> {
    return this.database.payment.findFirst({ where: { organizationId, idempotencyKey }, include: paymentInclude });
  }

  public async create(
    id: string, organizationId: string, creatorId: string, idempotencyKey: string, input: CreatePaymentInput,
    providerReference: string,
  ): Promise<PaymentRecord> {
    return this.database.payment.create({
      data: {
        id,
        organizationId,
        createdById: creatorId,
        idempotencyKey,
        providerReference,
        method: "manual_bank_transfer",
        amount: input.amount,
        currencyCode: input.currencyCode,
        evidence: input.evidence,
        allocations: { create: input.allocations.map((allocation) => ({ invoiceId: allocation.invoiceId, allocatedAmount: allocation.amount })) },
      },
      include: paymentInclude,
    });
  }
}
