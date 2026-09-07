import { randomUUID } from "node:crypto";
import { Prisma } from "@hamd/database";

import type { CreatePaymentInput, ListPaymentsInput } from "../api/payment-schemas.js";
import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../../shared/events/domain-event-publisher.js";
import { assertDualControl, assertPaymentPermission } from "./payment-policy.js";
import { type PaymentGateway, ManualPaymentGateway } from "./payment-gateway.js";
import { PaymentRepository, type PaymentRecord } from "../infrastructure/payment-repository.js";
import { transitionPayment } from "../domain/payment-state.js";

export class PaymentService {
  private readonly repository: PaymentRepository;

  public constructor(
    private readonly database: DatabaseClient,
    private readonly gateway: PaymentGateway = new ManualPaymentGateway(),
  ) {
    this.repository = new PaymentRepository(database);
  }

  public async create(context: AuthContext, input: CreatePaymentInput, idempotencyKey: string, requestId: string): Promise<PaymentRecord> {
    assertPaymentPermission(context, "payment:create");
    const existing = await this.repository.findByIdempotencyKey(context.organizationId, idempotencyKey);
    if (existing) return existing;
    await this.assertAllocationsEligible(context.organizationId, input);
    const id = randomUUID();
    const { providerReference } = await this.gateway.createManualReference({ paymentId: id, idempotencyKey });
    const payment = await this.repository.create(id, context.organizationId, context.userId, idempotencyKey, input, providerReference);
    await this.materialEvent(context, payment.id, "payment.created", requestId);
    return payment;
  }

  public async list(context: AuthContext, input: ListPaymentsInput): Promise<readonly PaymentRecord[]> {
    assertPaymentPermission(context, "payment:read");
    return this.repository.list(context.organizationId, input);
  }

  public async get(context: AuthContext, paymentId: string): Promise<PaymentRecord> {
    assertPaymentPermission(context, "payment:read");
    return this.find(context.organizationId, paymentId);
  }

  public async submit(context: AuthContext, paymentId: string, rowVersion: number, requestId: string): Promise<PaymentRecord> {
    assertPaymentPermission(context, "payment:submit");
    const payment = await this.find(context.organizationId, paymentId);
    if (payment.createdById !== context.userId) throw forbidden("Only the payment creator may submit it for confirmation.");
    await this.transition(context, payment, rowVersion, "submit", requestId);
    return this.find(context.organizationId, paymentId);
  }

  public async confirm(context: AuthContext, paymentId: string, rowVersion: number, requestId: string): Promise<PaymentRecord> {
    assertPaymentPermission(context, "payment:confirm");
    const payment = await this.find(context.organizationId, paymentId);
    assertDualControl(payment.createdById, context.userId);
    const targetStatus = transitionPayment(payment.status, "confirm");

    await this.database.$transaction(async (transaction) => {
      const current = await transaction.payment.findFirst({
        where: { id: payment.id, organizationId: context.organizationId, status: payment.status, rowVersion },
        include: { allocations: true },
      });
      if (!current) throw conflict();
      const invoices = await transaction.invoice.findMany({
        where: {
          id: { in: current.allocations.map((allocation) => allocation.invoiceId) },
          organizationId: context.organizationId,
          currencyCode: current.currencyCode,
          status: { in: ["issued", "partially_paid"] },
        },
        include: { allocations: { where: { payment: { status: "confirmed" } } } },
      });
      if (invoices.length !== current.allocations.length) {
        throw policyViolation("Payments may be allocated only to issued or partially paid invoices in the same organization and currency.");
      }

      const allocated = new Map(current.allocations.map((allocation) => [allocation.invoiceId, allocation.allocatedAmount]));
      const totalAllocated = current.allocations.reduce((total, allocation) => total.plus(allocation.allocatedAmount), new Prisma.Decimal(0));
      if (!totalAllocated.equals(current.amount)) throw policyViolation("Confirmed payment allocations must equal the payment amount.");

      for (const invoice of invoices) {
        const nextAllocated = invoice.allocations.reduce((total, allocation) => total.plus(allocation.allocatedAmount), new Prisma.Decimal(0))
          .plus(allocated.get(invoice.id) ?? 0);
        if (nextAllocated.greaterThan(invoice.totalAmount)) throw policyViolation("Payment allocation exceeds the invoice outstanding amount.");
        const nextStatus = nextAllocated.equals(invoice.totalAmount) ? "paid" : "partially_paid";
        const changed = await transaction.invoice.updateMany({
          where: { id: invoice.id, organizationId: context.organizationId, status: invoice.status, rowVersion: invoice.rowVersion },
          data: { status: nextStatus, rowVersion: { increment: 1 } },
        });
        if (!changed.count) throw conflict();
        await transaction.invoiceHistory.create({
          data: {
            invoiceId: invoice.id, fromStatus: invoice.status, toStatus: nextStatus, command: "payment_allocation",
            actorId: context.userId, rowVersion: invoice.rowVersion + 1,
            metadata: { paymentId: payment.id, allocatedAmount: allocated.get(invoice.id)?.toString() },
          },
        });
      }

      const changedPayment = await transaction.payment.updateMany({
        where: { id: payment.id, organizationId: context.organizationId, status: payment.status, rowVersion },
        data: { status: targetStatus, confirmedById: context.userId, confirmedAt: new Date(), rowVersion: { increment: 1 } },
      });
      if (!changedPayment.count) throw conflict();
      await transaction.paymentHistory.create({
        data: { paymentId: payment.id, fromStatus: payment.status, toStatus: targetStatus, command: "confirm", actorId: context.userId, rowVersion: rowVersion + 1 },
      });
      await materialEvents(transaction, context, payment.id, "payment.confirmed", requestId, { allocationCount: invoices.length });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return this.find(context.organizationId, paymentId);
  }

  public async history(context: AuthContext, paymentId: string) {
    await this.get(context, paymentId);
    return this.database.paymentHistory.findMany({ where: { paymentId }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  }

  private async transition(context: AuthContext, payment: PaymentRecord, rowVersion: number, command: "submit", requestId: string): Promise<void> {
    const targetStatus = transitionPayment(payment.status, command);
    await this.database.$transaction(async (transaction) => {
      const changed = await transaction.payment.updateMany({
        where: { id: payment.id, organizationId: context.organizationId, status: payment.status, rowVersion },
        data: { status: targetStatus, rowVersion: { increment: 1 } },
      });
      if (!changed.count) throw conflict();
      await transaction.paymentHistory.create({
        data: { paymentId: payment.id, fromStatus: payment.status, toStatus: targetStatus, command, actorId: context.userId, rowVersion: rowVersion + 1 },
      });
      await materialEvents(transaction, context, payment.id, `payment.${command}ted`, requestId);
    });
  }

  private async assertAllocationsEligible(organizationId: string, input: CreatePaymentInput): Promise<void> {
    const total = input.allocations.reduce((sum, allocation) => sum.plus(allocation.amount), new Prisma.Decimal(0));
    if (!total.equals(input.amount)) throw policyViolation("Payment allocations must equal the payment amount.");
    const invoiceIds = input.allocations.map((allocation) => allocation.invoiceId);
    if (new Set(invoiceIds).size !== invoiceIds.length) throw policyViolation("An invoice may be allocated only once per payment.");
    const invoices = await this.database.invoice.findMany({
      where: { id: { in: invoiceIds }, organizationId, currencyCode: input.currencyCode, status: { in: ["issued", "partially_paid"] } },
      include: { allocations: { where: { payment: { status: "confirmed" } } } },
    });
    if (invoices.length !== invoiceIds.length) throw policyViolation("Payments may be allocated only to issued or partially paid invoices in the same organization and currency.");
    for (const invoice of invoices) {
      const allocation = input.allocations.find((item) => item.invoiceId === invoice.id);
      const settled = invoice.allocations.reduce((sum, item) => sum.plus(item.allocatedAmount), new Prisma.Decimal(0));
      if (settled.plus(allocation?.amount ?? 0).greaterThan(invoice.totalAmount)) throw policyViolation("Payment allocation exceeds the invoice outstanding amount.");
    }
  }

  private async materialEvent(context: AuthContext, paymentId: string, action: string, requestId: string): Promise<void> {
    await this.database.$transaction((transaction) => materialEvents(transaction, context, paymentId, action, requestId));
  }

  private async find(organizationId: string, paymentId: string): Promise<PaymentRecord> {
    return (await this.repository.findById(organizationId, paymentId)) ?? notFound();
  }
}

async function materialEvents(transaction: Prisma.TransactionClient, context: AuthContext, paymentId: string, action: string, requestId: string, metadata?: object): Promise<void> {
  await transaction.auditEvent.create({ data: { organizationId: context.organizationId, actorId: context.userId, action, resourceType: "payment", resourceId: paymentId, requestId, ...(metadata ? { metadata } : {}) } });
  await publishDomainEvent(transaction, {
    name: "finance.payment_recorded", organizationId: context.organizationId,
    aggregate: { type: "payment", id: paymentId }, actor: { type: "user", id: context.userId },
    correlationId: requestId, payload: { paymentId, actorId: context.userId, recipientUserId: context.userId, ...metadata },
    legacyEventType: action,
  });
}
function notFound(): never { throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Payment not found." }); }
function conflict(): AppError { return new AppError({ statusCode: 409, code: "CONFLICT", message: "The payment or an allocated invoice changed. Refresh and try again." }); }
function policyViolation(message: string): AppError { return new AppError({ statusCode: 409, code: "POLICY_VIOLATION", message }); }
function forbidden(message: string): AppError { return new AppError({ statusCode: 403, code: "FORBIDDEN", message }); }
