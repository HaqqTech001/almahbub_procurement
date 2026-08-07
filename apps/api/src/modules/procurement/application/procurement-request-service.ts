import { randomUUID } from "node:crypto";

import type { ProcurementRequest } from "@hamd/database";

import type {
  CreateProcurementRequestInput,
  ListProcurementRequestsInput,
  UpdateProcurementRequestInput,
} from "../api/procurement-request-schemas.js";
import {
  type ProcurementRequestCommand,
  transitionProcurementRequest,
} from "../domain/procurement-request-state.js";
import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { publishDomainEvent } from "../../../shared/events/domain-event-publisher.js";
import {
  assertRequesterOrPermission,
  assertRequestPermission,
} from "./procurement-request-policy.js";
import {
  ProcurementRequestRepository,
  type ProcurementRequestRecord,
} from "../infrastructure/procurement-request-repository.js";

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
    return created;
  }

  public async list(
    context: AuthContext,
    input: ListProcurementRequestsInput,
  ): Promise<readonly ProcurementRequestRecord[]> {
    assertRequestPermission(context, "request:read");
    return this.repository.list(context.organizationId, input);
  }

  public async get(
    context: AuthContext,
    requestId: string,
    includeArchived = false,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:read");
    const request = await this.repository.findById(
      context.organizationId,
      requestId,
      includeArchived,
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
    if (request.status !== "draft") {
      throw invalidDraft();
    }
    if (input.documentIds) {
      await this.assertOwnedDocuments(context, input.documentIds);
    }

    const updated = await this.repository.updateDraft(request, input);
    if (!updated) {
      throw conflict();
    }
    await this.recordAudit(
      context,
      requestId,
      "procurement_request.updated",
      correlationId,
    );
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
            payload: { requestId: request.id, status: targetStatus, actorId: context.userId, recipientUserId: request.requesterId },
            legacyEventType: `procurement.request.${targetStatus}`,
          });
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
            },
          },
        });

        return this.repository.findById(context.organizationId, request.id);
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
    if (request.status !== "draft") {
      throw invalidDraft();
    }
    const result = await this.database.procurementRequest.updateMany({
      where: { id: requestId, rowVersion, deletedAt: null, status: "draft" },
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

  public async restore(
    context: AuthContext,
    requestId: string,
    rowVersion: number,
    correlationId: string,
  ): Promise<ProcurementRequestRecord> {
    assertRequestPermission(context, "request:restore");
    const request = await this.repository.findById(
      context.organizationId,
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
        return this.repository.findById(context.organizationId, request.id);
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

function invalidDraft(): AppError {
  return new AppError({
    statusCode: 409,
    code: "POLICY_VIOLATION",
    message: "Only draft requests can be edited or archived.",
  });
}
