import type { InvoiceStatus, Prisma } from "@hamd/database";

import type {
  CreateInvoiceInput,
  ListInvoicesInput,
  UpdateInvoiceDraftInput,
} from "../api/invoice-schemas.js";
import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../../shared/events/domain-event-publisher.js";
import { assertInvoicePermission } from "./invoice-policy.js";
import { InvoiceRepository, type InvoiceRecord } from "../infrastructure/invoice-repository.js";
import { transitionInvoice } from "../domain/invoice-state.js";

export class InvoiceService {
  private readonly repository: InvoiceRepository;

  public constructor(private readonly database: DatabaseClient) {
    this.repository = new InvoiceRepository(database);
  }

  public async create(context: AuthContext, input: CreateInvoiceInput, requestId: string): Promise<InvoiceRecord> {
    assertInvoicePermission(context, "invoice:create");
    const created = await this.repository.create(context.organizationId, input);
    if (!created) throw policyViolation("Invoices may only be created from an issued purchase order.");
    await this.recordMaterial(context, created.id, "invoice.created", requestId);
    return created;
  }

  public async list(context: AuthContext, input: ListInvoicesInput): Promise<readonly InvoiceRecord[]> {
    assertInvoicePermission(context, "invoice:read");
    return this.repository.list(context.organizationId, input);
  }

  public async get(context: AuthContext, invoiceId: string): Promise<InvoiceRecord> {
    assertInvoicePermission(context, "invoice:read");
    return this.find(context.organizationId, invoiceId);
  }

  public async updateDraft(context: AuthContext, invoiceId: string, input: UpdateInvoiceDraftInput, requestId: string): Promise<InvoiceRecord> {
    assertInvoicePermission(context, "invoice:update");
    const invoice = await this.find(context.organizationId, invoiceId);
    if (invoice.status !== "draft") throw policyViolation("Only draft invoices can be edited.");
    const updated = await this.repository.updateDraft(invoice, input);
    if (!updated) throw conflict();
    await this.recordMaterial(context, invoiceId, "invoice.updated", requestId);
    return updated;
  }

  public async issue(context: AuthContext, invoiceId: string, rowVersion: number, requestId: string): Promise<InvoiceRecord> {
    assertInvoicePermission(context, "invoice:issue");
    const invoice = await this.find(context.organizationId, invoiceId);
    if (invoice.status !== "draft" || invoice.items.length === 0 || invoice.totalAmount.lessThanOrEqualTo(0)) {
      throw policyViolation("Only a draft invoice with items and a positive total can be issued.");
    }
    await this.transition(context, invoice, rowVersion, transitionInvoice(invoice.status, "issue"), "issue", undefined, requestId, {
      issuedAt: new Date(),
    });
    return this.find(context.organizationId, invoiceId);
  }

  public async void(context: AuthContext, invoiceId: string, rowVersion: number, reason: string, requestId: string): Promise<InvoiceRecord> {
    assertInvoicePermission(context, "invoice:void");
    const invoice = await this.find(context.organizationId, invoiceId);
    if (!["draft", "issued"].includes(invoice.status)) {
      throw policyViolation("Only draft or issued invoices can be voided.");
    }
    if (invoice.allocations.length > 0) {
      throw policyViolation("An invoice with payment allocations cannot be voided.");
    }
    await this.transition(context, invoice, rowVersion, transitionInvoice(invoice.status, "void"), "void", reason, requestId, {
      voidedAt: new Date(),
      voidReason: reason,
    });
    return this.find(context.organizationId, invoiceId);
  }

  public async history(context: AuthContext, invoiceId: string) {
    await this.get(context, invoiceId);
    return this.database.invoiceHistory.findMany({
      where: { invoiceId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  }

  private async transition(
    context: AuthContext, invoice: InvoiceRecord, rowVersion: number, targetStatus: InvoiceStatus,
    command: "issue" | "void", reason: string | undefined, requestId: string,
    data: Prisma.InvoiceUpdateManyMutationInput,
  ): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const changed = await transaction.invoice.updateMany({
        where: { id: invoice.id, organizationId: context.organizationId, status: invoice.status, rowVersion },
        data: { ...data, status: targetStatus, rowVersion: { increment: 1 } },
      });
      if (!changed.count) throw conflict();
      const updated = await transaction.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      await transaction.invoiceHistory.create({
        data: { invoiceId: invoice.id, fromStatus: invoice.status, toStatus: targetStatus, command, reason: reason ?? null, actorId: context.userId, rowVersion: updated.rowVersion },
      });
      await materialEvents(transaction, context, invoice.id, `invoice.${command}`, requestId, { fromStatus: invoice.status, toStatus: targetStatus });
      if (command === "issue") {
        await transaction.outboxEvent.createMany({
          data: [
            { organizationId: context.organizationId, aggregateType: "invoice", aggregateId: invoice.id, eventType: "invoice.pdf.prepare", payload: { invoiceId: invoice.id } },
            { organizationId: context.organizationId, aggregateType: "invoice", aggregateId: invoice.id, eventType: "invoice.email.prepare", payload: { invoiceId: invoice.id } },
          ],
        });
      }
    });
  }

  private async recordMaterial(context: AuthContext, invoiceId: string, action: string, requestId: string): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const invoice = await transaction.invoice.findFirstOrThrow({ where: { id: invoiceId, organizationId: context.organizationId }, select: { status: true, rowVersion: true } });
      await transaction.invoiceHistory.create({ data: { invoiceId, fromStatus: null, toStatus: invoice.status, command: action.replace("invoice.", ""), actorId: context.userId, rowVersion: invoice.rowVersion } });
      await materialEvents(transaction, context, invoiceId, action, requestId);
    });
  }

  private async find(organizationId: string, invoiceId: string): Promise<InvoiceRecord> {
    return (await this.repository.findById(organizationId, invoiceId)) ?? notFound();
  }
}

async function materialEvents(transaction: Prisma.TransactionClient, context: AuthContext, invoiceId: string, action: string, requestId: string, metadata?: object): Promise<void> {
  await transaction.auditEvent.create({ data: { organizationId: context.organizationId, actorId: context.userId, action, resourceType: "invoice", resourceId: invoiceId, requestId, ...(metadata ? { metadata } : {}) } });
  if (action === "invoice.issue") {
    await publishDomainEvent(transaction, { name: "finance.invoice_issued", organizationId: context.organizationId, aggregate: { type: "invoice", id: invoiceId }, actor: { type: "user", id: context.userId }, correlationId: requestId, payload: { invoiceId, actorId: context.userId, recipientUserId: context.userId, ...metadata }, legacyEventType: action });
    return;
  }
  await transaction.outboxEvent.create({ data: { organizationId: context.organizationId, aggregateType: "invoice", aggregateId: invoiceId, eventType: action, payload: { invoiceId, actorId: context.userId, ...metadata } } });
}

function notFound(): never { throw new AppError({ statusCode: 404, code: "NOT_FOUND", message: "Invoice not found." }); }
function conflict(): AppError { return new AppError({ statusCode: 409, code: "CONFLICT", message: "The invoice changed. Refresh and try again." }); }
function policyViolation(message: string): AppError { return new AppError({ statusCode: 409, code: "POLICY_VIOLATION", message }); }
