import { randomUUID } from "node:crypto";

import type { Prisma, QuotationStatus } from "@hamd/database";

import type {
  CreateQuotationInput,
  ListQuotationsInput,
  UpdateQuotationDraftInput,
} from "../api/quotation-schemas.js";
import {
  type QuotationCommand,
  transitionQuotation,
} from "../domain/quotation-state.js";
import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../../shared/events/domain-event-publisher.js";
import {
  assertQuotationCommandPermission,
  assertQuotationPermission,
  assertQuotationRead,
} from "./quotation-policy.js";
import {
  QuotationRepository,
  type QuotationRecord,
} from "../infrastructure/quotation-repository.js";

export class QuotationService {
  private readonly repository: QuotationRepository;

  public constructor(private readonly database: DatabaseClient) {
    this.repository = new QuotationRepository(database);
  }

  public async create(
    context: AuthContext,
    input: CreateQuotationInput,
    requestId: string,
  ): Promise<QuotationRecord> {
    assertQuotationPermission(context, "quotation:create");
    const created = await this.repository.create(context.organizationId, input);
    if (!created) {
      throw new AppError({
        statusCode: 409,
        code: "POLICY_VIOLATION",
        message:
          "Quotations can only be created for an active sourcing request.",
      });
    }
    await this.recordMaterial(context, created.id, "quotation.created", requestId);
    return created;
  }

  public async list(
    context: AuthContext,
    input: ListQuotationsInput,
  ): Promise<readonly QuotationRecord[]> {
    assertQuotationRead(context);
    return this.repository.list(context.organizationId, input);
  }

  public async get(context: AuthContext, quotationId: string): Promise<QuotationRecord> {
    assertQuotationRead(context);
    const quotation = await this.repository.findById(
      context.organizationId,
      quotationId,
    );
    if (!quotation) throw notFound();
    return quotation;
  }

  public async updateDraft(
    context: AuthContext,
    quotationId: string,
    input: UpdateQuotationDraftInput,
    requestId: string,
  ): Promise<QuotationRecord> {
    assertQuotationPermission(context, "quotation:update");
    const quotation = await this.find(context.organizationId, quotationId);
    if (quotation.status !== "draft") throw editableDraftOnly();
    const updated = await this.repository.updateDraft(quotation, input);
    if (!updated) throw conflict();
    await this.recordMaterial(context, quotationId, "quotation.updated", requestId);
    return updated;
  }

  public async transition(
    context: AuthContext,
    quotationId: string,
    command: QuotationCommand,
    rowVersion: number,
    reason: string | undefined,
    requestId: string,
  ): Promise<QuotationRecord> {
    const quotation = await this.find(context.organizationId, quotationId);
    assertQuotationCommandPermission(
      context,
      command,
      quotation.request.requesterId,
    );
    if (command === "issue") validateReadyToIssue(quotation);
    if (command === "accept" && quotation.expiresAt && quotation.expiresAt <= new Date()) {
      throw new AppError({
        statusCode: 409,
        code: "POLICY_VIOLATION",
        message: "Expired quotations cannot be accepted.",
      });
    }
    if (command === "decline" && !reason) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "A reason is required to decline a quotation.",
      });
    }
    const targetStatus = transitionQuotation(quotation.status, command) as QuotationStatus;

    await this.database.$transaction(async (transaction) => {
      const changed = await transaction.quotation.updateMany({
        where: {
          id: quotation.id,
          organizationId: context.organizationId,
          status: quotation.status,
          rowVersion,
        },
        data: { status: targetStatus, rowVersion: { increment: 1 } },
      });
      if (!changed.count) throw conflict();
      const updated = await transaction.quotation.findUniqueOrThrow({
        where: { id: quotation.id },
      });
      if (command === "issue") {
        const requestChanged = await transaction.procurementRequest.updateMany({
          where: {
            id: quotation.procurementRequestId,
            organizationId: context.organizationId,
            status: "sourcing",
            deletedAt: null,
          },
          data: { status: "quote_issued", rowVersion: { increment: 1 } },
        });
        if (!requestChanged.count) {
          throw new AppError({
            statusCode: 409,
            code: "POLICY_VIOLATION",
            message: "The procurement request must be sourcing before issue.",
          });
        }
        const procurementRequest =
          await transaction.procurementRequest.findUniqueOrThrow({
            where: { id: quotation.procurementRequestId },
          });
        await transaction.procurementRequestStatusEvent.create({
          data: {
            procurementRequestId: procurementRequest.id,
            fromStatus: "sourcing",
            toStatus: "quote_issued",
            command: "quotation_issued",
            actorId: context.userId,
            rowVersion: procurementRequest.rowVersion,
          },
        });
        await transaction.auditEvent.create({
          data: {
            organizationId: context.organizationId,
            actorId: context.userId,
            action: "procurement_request.quote_issued",
            resourceType: "procurement_request",
            resourceId: procurementRequest.id,
            requestId,
            metadata: { quotationId: quotation.id },
          },
        });
        await transaction.outboxEvent.create({
          data: {
            organizationId: context.organizationId,
            aggregateType: "procurement_request",
            aggregateId: procurementRequest.id,
            eventType: "procurement.request.quote_issued",
            payload: {
              requestId: procurementRequest.id,
              quotationId: quotation.id,
              actorId: context.userId,
              recipientUserId: procurementRequest.requesterId,
              publicCode: procurementRequest.publicCode,
              title: procurementRequest.title,
            },
          },
        });
      }
      if (command === "accept") {
        const requestChanged = await transaction.procurementRequest.updateMany({
          where: {
            id: quotation.procurementRequestId,
            organizationId: context.organizationId,
            status: "quote_issued",
            deletedAt: null,
          },
          data: { status: "purchase_in_progress", rowVersion: { increment: 1 } },
        });
        if (!requestChanged.count) {
          throw new AppError({
            statusCode: 409,
            code: "POLICY_VIOLATION",
            message: "The procurement request must have an issued quotation before acceptance.",
          });
        }
        const procurementRequest =
          await transaction.procurementRequest.findUniqueOrThrow({
            where: { id: quotation.procurementRequestId },
          });
        const purchaseOrder = await transaction.purchaseOrder.create({
          data: {
            organizationId: context.organizationId,
            procurementRequestId: quotation.procurementRequestId,
            quotationId: quotation.id,
            supplierId: quotation.supplierId,
            publicCode: `PO-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
            status: "issued",
            currencyCode: quotation.currencyCode,
            totalAmount: quotation.totalAmount,
            items: {
              create: quotation.items.map((item) => ({
                procurementRequestItemId: item.procurementRequestItemId,
                description: item.description,
                quantity: item.quantity,
                unitAmount: item.unitAmount,
              })),
            },
          },
        });
        await transaction.procurementRequestStatusEvent.create({
          data: {
            procurementRequestId: procurementRequest.id,
            fromStatus: "quote_issued",
            toStatus: "purchase_in_progress",
            command: "quotation_accepted",
            actorId: context.userId,
            rowVersion: procurementRequest.rowVersion,
          },
        });
        await transaction.auditEvent.createMany({
          data: [
            {
              organizationId: context.organizationId,
              actorId: context.userId,
              action: "procurement_request.purchase_in_progress",
              resourceType: "procurement_request",
              resourceId: procurementRequest.id,
              requestId,
              metadata: { quotationId: quotation.id, purchaseOrderId: purchaseOrder.id },
            },
            {
              organizationId: context.organizationId,
              actorId: context.userId,
              action: "purchase_order.issued",
              resourceType: "purchase_order",
              resourceId: purchaseOrder.id,
              requestId,
              metadata: { quotationId: quotation.id },
            },
          ],
        });
        await transaction.outboxEvent.createMany({
          data: [
            {
              organizationId: context.organizationId,
              aggregateType: "procurement_request",
              aggregateId: procurementRequest.id,
              eventType: "procurement.request.purchase_in_progress",
              payload: {
                requestId: procurementRequest.id,
                quotationId: quotation.id,
                purchaseOrderId: purchaseOrder.id,
                actorId: context.userId,
                recipientUserId: procurementRequest.requesterId,
                publicCode: procurementRequest.publicCode,
                title: procurementRequest.title,
              },
            },
            {
              organizationId: context.organizationId,
              aggregateType: "purchase_order",
              aggregateId: purchaseOrder.id,
              eventType: "purchase_order.issued",
              payload: { purchaseOrderId: purchaseOrder.id, quotationId: quotation.id },
            },
          ],
        });
      }
      await transaction.quotationHistory.create({
        data: {
          quotationId: quotation.id,
          fromStatus: quotation.status,
          toStatus: targetStatus,
          command,
          reason: reason ?? null,
          actorId: context.userId,
          rowVersion: updated.rowVersion,
        },
      });
      await materialEvents(
        transaction,
        context,
        quotation.id,
        `quotation.${command}`,
        requestId,
        { fromStatus: quotation.status, toStatus: targetStatus },
      );
    });
    return (await this.repository.findById(context.organizationId, quotation.id)) ?? notFound();
  }

  public async revise(
    context: AuthContext,
    quotationId: string,
    rowVersion: number,
    reason: string,
    requestId: string,
  ): Promise<QuotationRecord> {
    assertQuotationPermission(context, "quotation:revise");
    const source = await this.find(context.organizationId, quotationId);
    if (source.status !== "issued") {
      throw new AppError({
        statusCode: 409,
        code: "POLICY_VIOLATION",
        message: "Only issued quotations can be revised.",
      });
    }
    const revisionId = await this.database.$transaction(async (transaction) => {
      const superseded = await transaction.quotation.updateMany({
        where: {
          id: source.id,
          organizationId: context.organizationId,
          status: "issued",
          rowVersion,
        },
        data: { status: "superseded", rowVersion: { increment: 1 } },
      });
      if (!superseded.count) throw conflict();
      const revision = await transaction.quotation.create({
        data: {
          organizationId: source.organizationId,
          procurementRequestId: source.procurementRequestId,
          supplierId: source.supplierId,
          familyId: source.familyId,
          supersedesId: source.id,
          versionNumber: source.versionNumber + 1,
          publicCode: `QT-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
          currencyCode: source.currencyCode,
          subtotalAmount: source.subtotalAmount,
          discountAmount: source.discountAmount,
          taxAmount: source.taxAmount,
          shippingAmount: source.shippingAmount,
          dutyAmount: source.dutyAmount,
          otherAmount: source.otherAmount,
          totalAmount: source.totalAmount,
          expiresAt: source.expiresAt,
          deliveryLeadTimeDays: source.deliveryLeadTimeDays,
          minimumOrderQuantity: source.minimumOrderQuantity,
          paymentTerms: source.paymentTerms,
          commercialTerms: source.commercialTerms,
          items: { create: source.items.map((item) => ({
            procurementRequestItemId: item.procurementRequestItemId,
            productVariantId: item.productVariantId,
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            lineAmount: item.lineAmount,
          })) },
          documents: { create: source.documents.map((document) => ({
            documentId: document.documentId,
          })) },
        },
      });
      const supersededRecord = await transaction.quotation.findUniqueOrThrow({
        where: { id: source.id },
      });
      await transaction.quotationHistory.createMany({
        data: [
          {
            quotationId: source.id,
            fromStatus: "issued",
            toStatus: "superseded",
            command: "revise",
            reason,
            actorId: context.userId,
            rowVersion: supersededRecord.rowVersion,
            metadata: { revisionId: revision.id },
          },
          {
            quotationId: revision.id,
            fromStatus: null,
            toStatus: "draft",
            command: "revised_from",
            reason,
            actorId: context.userId,
            rowVersion: revision.rowVersion,
            metadata: { supersedesId: source.id },
          },
        ],
      });
      await materialEvents(
        transaction,
        context,
        source.id,
        "quotation.revised",
        requestId,
        { revisionId: revision.id, familyId: source.familyId },
      );
      return revision.id;
    });
    return (await this.repository.findById(context.organizationId, revisionId)) ?? notFound();
  }

  public async history(context: AuthContext, quotationId: string) {
    await this.get(context, quotationId);
    return this.database.quotationHistory.findMany({
      where: { quotationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        actor: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
  }

  private async recordMaterial(
    context: AuthContext,
    quotationId: string,
    action: string,
    requestId: string,
  ): Promise<void> {
    await this.database.$transaction(async (transaction) => {
      const quotation = await transaction.quotation.findFirstOrThrow({
        where: { id: quotationId, organizationId: context.organizationId },
        select: { status: true, rowVersion: true },
      });
      await transaction.quotationHistory.create({
        data: {
          quotationId,
          fromStatus: null,
          toStatus: quotation.status,
          command: action.replace("quotation.", ""),
          actorId: context.userId,
          rowVersion: quotation.rowVersion,
        },
      });
      await materialEvents(transaction, context, quotationId, action, requestId);
    });
  }

  private async find(
    organizationId: string,
    quotationId: string,
  ): Promise<QuotationRecord> {
    return (
      (await this.repository.findById(organizationId, quotationId)) ?? notFound()
    );
  }
}

function validateReadyToIssue(quotation: QuotationRecord): void {
  if (
    !quotation.supplierId ||
    !quotation.expiresAt ||
    !quotation.paymentTerms ||
    quotation.items.length === 0 ||
    quotation.totalAmount.lessThan(0)
  ) {
    throw new AppError({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message:
        "Supplier, validity, payment terms, non-negative totals, and quote items are required before issue.",
    });
  }
}

async function materialEvents(
  transaction: Prisma.TransactionClient,
  context: AuthContext,
  quotationId: string,
  action: string,
  requestId: string,
  metadata?: object,
): Promise<void> {
  await transaction.auditEvent.create({
    data: {
      organizationId: context.organizationId,
      actorId: context.userId,
      action,
      resourceType: "quotation",
      resourceId: quotationId,
      requestId,
      ...(metadata ? { metadata } : {}),
    },
  });
  const eventName = action === "quotation.issue" ? "commercial.quotation_submitted" : action === "quotation.accept" ? "commercial.quotation_approved" : undefined;
  if (eventName) {
    await publishDomainEvent(transaction, {
      name: eventName, organizationId: context.organizationId, aggregate: { type: "quotation", id: quotationId },
      actor: { type: "user", id: context.userId }, correlationId: requestId,
      payload: { quotationId, actorId: context.userId, recipientUserId: context.userId, ...metadata }, legacyEventType: action,
    });
    return;
  }
  await transaction.outboxEvent.create({
    data: {
      organizationId: context.organizationId,
      aggregateType: "quotation",
      aggregateId: quotationId,
      eventType: action,
      payload: { quotationId, actorId: context.userId, ...metadata },
    },
  });
}

function notFound(): never {
  throw new AppError({
    statusCode: 404,
    code: "NOT_FOUND",
    message: "Quotation not found.",
  });
}

function conflict(): AppError {
  return new AppError({
    statusCode: 409,
    code: "CONFLICT",
    message: "The quotation changed. Refresh and try again.",
  });
}

function editableDraftOnly(): AppError {
  return new AppError({
    statusCode: 409,
    code: "POLICY_VIOLATION",
    message: "Only draft quotations can be edited.",
  });
}
