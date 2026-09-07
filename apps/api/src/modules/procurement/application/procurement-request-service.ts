import { randomUUID } from "node:crypto";

import type { ProcurementRequest } from "@hamd/database";

import type {
  CreateProcurementRequestInput,
  ListProcurementRequestsInput,
  UpdateProcurementRequestInput,
} from "../api/procurement-request-schemas.js";
import {
  resolveProcurementListLob,
  type ProcurementRequestLobValue,
} from "../domain/procurement-request-lob.js";
import {
  type ProcurementRequestCommand,
  transitionProcurementRequest,
} from "../domain/procurement-request-state.js";
import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../shared/events/domain-event-publisher.js";
import { findUserIdsWithPermission } from "../../../shared/ops/ops-recipient-users.js";
import { scopeProcurementListOwner } from "../api/procurement-request-related.js";
import {
  assertRequesterOrPermission,
  assertRequestPermission,
} from "./procurement-request-policy.js";
import {
  ProcurementRequestRepository,
  type ProcurementRequestRecord,
} from "../infrastructure/procurement-request-repository.js";

function queueOrganizationScope(context: AuthContext): string | null {
  return context.permissionKeys.has("request:manage")
    ? null
    : context.organizationId;
}

export class ProcurementRequestService {
  private readonly repository: ProcurementRequestRepository;

  public constructor(private readonly database: DatabaseClient) {
    this.repository = new ProcurementRequestRepository(database);
  }

  public async create(
    context: AuthContext,
    input: CreateProcurementRequestInput,
    requestId: string,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:create");
    await this.assertOwnedDocuments(context, input.documentIds);
    const created = await this.repository.create(
      context.organizationId,
      context.userId,
      input,
    );
    await this.recordAudit(
      context,
      created.id,
      "procurement_request.created",
      requestId,
    );
    if (input.submit) {
      return this.transition(
        context,
        created.id,
        "submit",
        created.rowVersion,
        undefined,
        requestId,
      );
    }
    return created;
  }

  public async list(
    context: AuthContext,
    input: ListProcurementRequestsInput,
  ): Promise<readonly ProcurementRequestRecord[]> {
    assertRequestPermission(context, "request:read");
    const lob = resolveProcurementListLob(context, input.lob);
    const ownerId = scopeProcurementListOwner(
      context.permissionKeys.has("request:manage"),
      context.userId,
      input.ownerId,
    );
    return this.repository.list(queueOrganizationScope(context), {
      ...input,
      lob,
      ...(ownerId ? { ownerId } : { ownerId: undefined }),
      retainCancelledAfterBuyerHide: context.permissionKeys.has("request:manage"),
    });
  }

  public async get(
    context: AuthContext,
    requestId: string,
    includeArchived = false,
    lob?: ProcurementRequestLobValue,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:read");
    const request = await this.repository.findById(
      queueOrganizationScope(context),
      requestId,
      includeArchived || context.permissionKeys.has("request:manage"),
      lob,
    );
    if (!request) {
      throw notFound();
    }
    assertRequesterOrPermission(context, request.requesterId, "request:manage");
    return request;
  }

  public async updateDraft(
    context: AuthContext,
    requestId: string,
    input: UpdateProcurementRequestInput,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    const request = await this.get(context, requestId);
    assertRequesterOrPermission(context, request.requesterId, "request:update");
    const buyerEditable =
      request.status === "draft" ||
      request.status === "submitted" ||
      request.status === "needs_clarification";
    if (!buyerEditable) {
      throw invalidDraft();
    }
    if (
      request.status !== "draft" &&
      request.requesterId !== context.userId &&
      !context.permissionKeys.has("request:manage")
    ) {
      throw invalidDraft();
    }
    if (input.documentIds) {
      await this.assertOwnedDocuments(context, input.documentIds);
    }

    const summary = summarizeCustomerRevision(request, input);
    const updated = await this.repository.updateDraft(request, input);
    if (!updated) {
      throw conflict();
    }
    await this.recordAudit(
      context,
      requestId,
      request.status === "draft"
        ? "procurement_request.updated"
        : "procurement_request.customer_revised",
      correlationId,
    );
    if (request.status !== "draft") {
      const opsRecipients = await findUserIdsWithPermission(
        this.database,
        "ops:access",
      );
      await this.database.$transaction(async (transaction) => {
        await transaction.procurementRequestStatusEvent.create({
          data: {
            procurementRequestId: request.id,
            fromStatus: request.status,
            toStatus: request.status,
            command: "customer_update",
            reason: summary,
            actorId: context.userId,
            rowVersion: updated.rowVersion,
          },
        });
        for (const opsUserId of opsRecipients) {
          if (opsUserId === request.requesterId) continue;
          await transaction.outboxEvent.create({
            data: {
              organizationId: context.organizationId,
              aggregateType: "procurement_request",
              aggregateId: request.id,
              eventType: "procurement.request.customer_revised",
              payload: {
                requestId: request.id,
                status: request.status,
                actorId: context.userId,
                recipientUserId: opsUserId,
                deepLink: `/requests/${request.id}`,
                publicCode: request.publicCode,
                title: request.title,
                reason: summary,
              },
            },
          });
        }
      });
    }
    return updated;
  }

  public async transition(
    context: AuthContext,
    requestId: string,
    command: ProcurementRequestCommand,
    rowVersion: number,
    reason: string | undefined,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    const request = await this.get(context, requestId);
    assertTransitionPermission(context, request, command);
    validateTransitionInput(request, command, reason);
    const targetStatus = transitionProcurementRequest(request.status, command);
    const opsRecipients =
      targetStatus === "submitted"
        ? await findUserIdsWithPermission(this.database, "ops:access")
        : [];

    return this.database
      .$transaction(async (transaction) => {
        const changed = await transaction.procurementRequest.updateMany({
          where: {
            id: request.id,
            organizationId: context.organizationId,
            status: request.status,
            rowVersion,
            deletedAt: null,
          },
          data: { status: targetStatus, rowVersion: { increment: 1 } },
        });
        if (changed.count === 0) {
          throw conflict();
        }

        const updated = await transaction.procurementRequest.findUniqueOrThrow({
          where: { id: request.id },
        });
        await transaction.procurementRequestStatusEvent.create({
          data: {
            procurementRequestId: request.id,
            fromStatus: request.status,
            toStatus: targetStatus,
            command,
            reason: reason ?? null,
            actorId: context.userId,
            rowVersion: updated.rowVersion,
          },
        });
        await transaction.auditEvent.create({
          data: {
            organizationId: context.organizationId,
            actorId: context.userId,
            action: `procurement_request.${command}`,
            resourceType: "procurement_request",
            resourceId: request.id,
            requestId: correlationId,
            metadata: { fromStatus: request.status, toStatus: targetStatus },
          },
        });
        if (targetStatus === "submitted") {
          await publishDomainEvent(transaction, {
            name: "procurement.requested", organizationId: context.organizationId,
            aggregate: { type: "procurement_request", id: request.id },
            actor: { type: "user", id: context.userId }, correlationId,
            payload: {
              requestId: request.id,
              status: targetStatus,
              actorId: context.userId,
              recipientUserId: request.requesterId,
              deepLink: `/requests/${request.id}`,
              publicCode: request.publicCode,
              title: request.title,
              ...(reason ? { reason } : {}),
            },
            legacyEventType: `procurement.request.${targetStatus}`,
          });
          for (const opsUserId of opsRecipients) {
            if (opsUserId === request.requesterId) continue;
            await transaction.outboxEvent.create({
              data: {
                organizationId: context.organizationId,
                aggregateType: "procurement_request",
                aggregateId: request.id,
                eventType: "procurement.request.submitted",
                payload: {
                  requestId: request.id,
                  status: targetStatus,
                  actorId: context.userId,
                  recipientUserId: opsUserId,
                  deepLink: `/requests/${request.id}`,
                  publicCode: request.publicCode,
                  title: request.title,
                },
              },
            });
          }
        } else await transaction.outboxEvent.create({
          data: {
            organizationId: context.organizationId,
            aggregateType: "procurement_request",
            aggregateId: request.id,
            eventType: `procurement.request.${targetStatus}`,
            payload: {
              requestId: request.id,
              status: targetStatus,
              actorId: context.userId,
              recipientUserId: request.requesterId,
              deepLink: `/requests/${request.id}`,
              publicCode: request.publicCode,
              title: request.title,
              ...(reason ? { reason } : {}),
            },
          },
        });

        return this.repository.findById(request.organizationId, request.id);
      })
      .then((updated) => updated ?? Promise.reject(notFound()));
  }

  public async archive(
    context: AuthContext,
    requestId: string,
    rowVersion: number,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    const request = await this.get(context, requestId);
    assertRequesterOrPermission(
      context,
      request.requesterId,
      "request:archive",
    );
    if (request.status !== "draft" && request.status !== "cancelled") {
      throw invalidArchive();
    }
    const result = await this.database.procurementRequest.updateMany({
      where: {
        id: requestId,
        rowVersion,
        deletedAt: null,
        status: { in: ["draft", "cancelled"] },
      },
      data: {
        deletedAt: new Date(),
        archivedAt: new Date(),
        archivedById: context.userId,
        rowVersion: { increment: 1 },
      },
    });
    if (result.count === 0) throw conflict();
    await this.recordAudit(
      context,
      requestId,
      "procurement_request.archived",
      correlationId,
    );
    return this.get(context, requestId, true);
  }

  public async destroyCancelled(
    context: AuthContext,
    requestId: string,
    rowVersion: number,
    correlationId: string,
  ): Promise<void> {
    const request = await this.get(context, requestId);
    assertRequesterOrPermission(
      context,
      request.requesterId,
      "request:archive",
    );
    if (request.status !== "cancelled") {
      throw new AppError({
        statusCode: 409,
        code: "POLICY_VIOLATION",
        message: "Only cancelled requests can be permanently deleted.",
      });
    }
    if (request.quotations.length > 0 || request.purchaseOrders.length > 0) {
      throw new AppError({
        statusCode: 409,
        code: "POLICY_VIOLATION",
        message:
          "This request cannot be permanently deleted because quotation or purchase records already exist.",
      });
    }

    const documentIds = request.documents.map((row) => row.documentId);
    const storagePaths = request.documents.map((row) => row.document.storagePath);

    await this.database.$transaction(async (transaction) => {
      await transaction.procurementRequestDocument.deleteMany({
        where: { procurementRequestId: request.id },
      });
      await transaction.procurementRequestItem.deleteMany({
        where: { procurementRequestId: request.id },
      });
      await transaction.procurementRequestAssignment.deleteMany({
        where: { procurementRequestId: request.id },
      });
      await transaction.procurementRequestStatusEvent.deleteMany({
        where: { procurementRequestId: request.id },
      });
      const outboxRows = await transaction.outboxEvent.findMany({
        where: { aggregateType: "procurement_request", aggregateId: request.id },
        select: { id: true },
      });
      const outboxIds = outboxRows.map((row) => row.id);
      if (outboxIds.length > 0) {
        await transaction.notification.deleteMany({
          where: { notificationEvent: { outboxEventId: { in: outboxIds } } },
        });
        await transaction.notificationEvent.deleteMany({
          where: { outboxEventId: { in: outboxIds } },
        });
        await transaction.eventConsumerInbox.deleteMany({
          where: { outboxEventId: { in: outboxIds } },
        });
        await transaction.deadLetterEvent.deleteMany({
          where: { outboxEventId: { in: outboxIds } },
        });
      }
      await transaction.outboxEvent.deleteMany({
        where: { aggregateType: "procurement_request", aggregateId: request.id },
      });
      if (documentIds.length > 0) {
        await transaction.storedDocument.deleteMany({
          where: {
            id: { in: documentIds },
            announcementLinks: { none: {} },
            procurementLinks: { none: {} },
          },
        });
      }
      const removed = await transaction.procurementRequest.deleteMany({
        where: {
          id: request.id,
          rowVersion,
          status: "cancelled",
        },
      });
      if (removed.count === 0) throw conflict();
      await transaction.auditEvent.create({
        data: {
          organizationId: context.organizationId,
          actorId: context.userId,
          action: "procurement_request.deleted",
          resourceType: "procurement_request",
          resourceId: request.id,
          requestId: correlationId,
          metadata: { publicCode: request.publicCode },
        },
      });
    });

    const { unlink } = await import("node:fs/promises");
    const { join } = await import("node:path");
    for (const relative of storagePaths) {
      try {
        await unlink(join(process.cwd(), "uploads", relative));
      } catch {
        /* file may already be absent */
      }
    }
  }

  public async restore(
    context: AuthContext,
    requestId: string,
    rowVersion: number,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:restore");
    const request = await this.repository.findById(
      queueOrganizationScope(context),
      requestId,
      true,
    );
    if (!request || !request.deletedAt) throw notFound();
    const result = await this.database.procurementRequest.updateMany({
      where: {
        id: requestId,
        rowVersion,
        deletedAt: { not: null },
        status: "draft",
      },
      data: {
        deletedAt: null,
        archivedAt: null,
        archivedById: null,
        rowVersion: { increment: 1 },
      },
    });
    if (result.count === 0) throw conflict();
    await this.recordAudit(
      context,
      requestId,
      "procurement_request.restored",
      correlationId,
    );
    return this.get(context, requestId);
  }

  public async duplicate(
    context: AuthContext,
    requestId: string,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    const source = await this.get(context, requestId);
    assertRequesterOrPermission(
      context,
      source.requesterId,
      "request:duplicate",
    );
    const duplicate = await this.database.procurementRequest.create({
      data: {
        organizationId: context.organizationId,
        requesterId: context.userId,
        publicCode: `PR-${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`,
        status: "draft",
        lob: source.lob,
        title: `${source.title} (copy)`,
        currencyCode: source.currencyCode,
        notes: source.notes,
        destinationCountryCode: source.destinationCountryCode,
        destinationAddress: source.destinationAddress,
        requiredByDate: source.requiredByDate,
        budgetAmount: source.budgetAmount,
        priority: source.priority,
        restrictedGoodsDeclared: source.restrictedGoodsDeclared,
        duplicatedFromId: source.id,
        items: {
          create: source.items.map((item) => ({
            productVariantId: item.productVariantId,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            targetUnitAmount: item.targetUnitAmount,
          })),
        },
      },
    });
    await this.recordAudit(
      context,
      duplicate.id,
      "procurement_request.duplicated",
      correlationId,
    );
    return this.get(context, duplicate.id);
  }

  public async assign(
    context: AuthContext,
    requestId: string,
    membershipId: string,
    rowVersion: number,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:assign");
    const request = await this.get(context, requestId);

    return this.database
      .$transaction(async (transaction) => {
        const membership = await transaction.organizationMembership.findFirst({
          where: {
            id: membershipId,
            organizationId: context.organizationId,
            status: "active",
          },
          select: { id: true },
        });
        if (!membership) {
          throw new AppError({
            statusCode: 422,
            code: "VALIDATION_ERROR",
            message: "The assignee must be an active organization member.",
          });
        }
        const updated = await transaction.procurementRequest.updateMany({
          where: { id: requestId, rowVersion, deletedAt: null },
          data: { rowVersion: { increment: 1 } },
        });
        if (updated.count === 0) throw conflict();
        await transaction.procurementRequestAssignment.updateMany({
          where: { procurementRequestId: requestId, unassignedAt: null },
          data: { unassignedAt: new Date() },
        });
        await transaction.procurementRequestAssignment.create({
          data: {
            procurementRequestId: requestId,
            membershipId,
            assignedById: context.userId,
          },
        });
        await transaction.auditEvent.create({
          data: {
            organizationId: context.organizationId,
            actorId: context.userId,
            action: "procurement_request.assigned",
            resourceType: "procurement_request",
            resourceId: requestId,
            requestId: correlationId,
            metadata: { membershipId },
          },
        });
        await transaction.outboxEvent.create({
          data: {
            organizationId: context.organizationId,
            aggregateType: "procurement_request",
            aggregateId: requestId,
            eventType: "procurement.request.assigned",
            payload: { requestId, membershipId, actorId: context.userId },
          },
        });
        return this.repository.findById(request.organizationId, request.id);
      })
      .then((updated) => updated ?? Promise.reject(notFound()));
  }

  private async assertOwnedDocuments(
    context: AuthContext,
    documentIds: readonly string[],
  ): Promise<void> {
    if (documentIds.length === 0) return;
    const unique = [...new Set(documentIds)];
    const count = await this.database.storedDocument.count({
      where: {
        id: { in: unique },
        organizationId: context.organizationId,
        deletedAt: null,
      },
    });
    if (count !== unique.length) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message: "One or more document ids are invalid for this organization.",
      });
    }
  }

  private async recordAudit(
    context: AuthContext,
    resourceId: string,
    action: string,
    requestId: string,
  ): Promise<void> {
    await this.database.auditEvent.create({
      data: {
        organizationId: context.organizationId,
        actorId: context.userId,
        action,
        resourceType: "procurement_request",
        resourceId,
        requestId,
      },
    });
  }
}

function assertTransitionPermission(
  context: AuthContext,
  request: ProcurementRequest,
  command: ProcurementRequestCommand,
): void {
  if (["submit", "request_revision"].includes(command)) {
    assertRequesterOrPermission(context, request.requesterId, "request:submit");
    return;
  }
  if (command === "cancel") {
    assertRequesterOrPermission(context, request.requesterId, "request:cancel");
    return;
  }
  assertRequestPermission(context, "request:manage");
}

function validateTransitionInput(
  request: ProcurementRequest,
  command: ProcurementRequestCommand,
  reason: string | undefined,
): void {
  if (
    ["request_clarification", "request_revision", "decline", "cancel"].includes(
      command,
    ) &&
    !reason
  ) {
    throw new AppError({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message: "A reason is required for this transition.",
    });
  }
  if (command === "request_clarification" && reason) {
    const question = reason.replace(/^\[[^\]]+\]\s*/, "").trim();
    const generic =
      /^(more\s+clarification(\s+is\s+required)?\.?|please\s+clarify\.?|clarification\s+required\.?|n\/?a|\.+)$/i;
    if (question.length < 12 || generic.test(question)) {
      throw new AppError({
        statusCode: 422,
        code: "VALIDATION_ERROR",
        message:
          "Write the exact information the buyer must provide. Generic clarification notes are not accepted.",
      });
    }
  }
  if (
    command === "submit" &&
    (!request.destinationCountryCode || !request.destinationAddress)
  ) {
    throw new AppError({
      statusCode: 422,
      code: "VALIDATION_ERROR",
      message:
        "A destination country and address are required before submission.",
    });
  }
}

function notFound(): AppError {
  return new AppError({
    statusCode: 404,
    code: "NOT_FOUND",
    message: "Procurement request not found.",
  });
}

function conflict(): AppError {
  return new AppError({
    statusCode: 409,
    code: "CONFLICT",
    message: "The request changed. Refresh and try again.",
  });
}

function invalidArchive(): AppError {
  return new AppError({
    statusCode: 409,
    code: "POLICY_VIOLATION",
    message: "Only draft or cancelled requests can be removed from the buyer list.",
  });
}

function invalidDraft(): AppError {
  return new AppError({
    statusCode: 409,
    code: "POLICY_VIOLATION",
    message:
      "This request can only be edited while it is a draft, awaiting review, or waiting for clarification.",
  });
}

function summarizeCustomerRevision(
  request: ProcurementRequestRecord,
  input: UpdateProcurementRequestInput,
): string {
  const parts: string[] = [];
  if (
    input.destinationAddress !== undefined &&
    input.destinationAddress !== request.destinationAddress
  ) {
    parts.push("Customer updated the delivery address.");
  }
  if (
    input.destinationCountryCode !== undefined &&
    input.destinationCountryCode !== request.destinationCountryCode
  ) {
    parts.push("Customer updated the destination country.");
  }
  if (
    input.requiredByDate !== undefined &&
    String(input.requiredByDate) !== String(request.requiredByDate ?? "")
  ) {
    parts.push("Customer updated the required delivery date.");
  }
  if (input.notes !== undefined && input.notes !== request.notes) {
    parts.push("Customer updated the request notes.");
  }
  if (input.items) {
    const before = request.items[0];
    const after = input.items[0];
    if (
      before &&
      after &&
      (Number(before.quantity) !== after.quantity || before.unit !== after.unit)
    ) {
      parts.push(
        `Quantity changed from ${before.quantity} ${before.unit} to ${after.quantity} ${after.unit}.`,
      );
    } else {
      parts.push("Customer updated the requested items.");
    }
  }
  if (input.documentIds) {
    parts.push("Supporting image or document updated.");
  }
  return parts.join(" ") || "Customer updated the request.";
}
