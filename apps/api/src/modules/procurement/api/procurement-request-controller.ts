import type { RequestHandler, Response } from "express";

import {
  archiveProcurementRequestSchema,
  assignProcurementRequestSchema,
  createProcurementRequestSchema,
  listProcurementRequestsSchema,
  procurementRequestIdSchema,
  transitionProcurementRequestSchema,
  updateProcurementRequestSchema,
} from "./procurement-request-schemas.js";
import type { ProcurementRequestService } from "../application/procurement-request-service.js";

export class ProcurementRequestController {
  public constructor(private readonly service: ProcurementRequestService) {}

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const input = createProcurementRequestSchema.parse(request.body);
      const created = await this.service.create(
        requireAuth(request),
        input,
        correlationId(response),
      );
      response.status(201).json({ data: serialize(created) });
    } catch (error) {
      next(error);
    }
  };

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const input = listProcurementRequestsSchema.parse(request.query);
      const requests = await this.service.list(requireAuth(request), input);
      const hasMore = requests.length > input.pageSize;
      response.json({
        data: requests.slice(0, input.pageSize).map(serialize),
        page: { hasMore, nextCursor: null },
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly get: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const procurementRequest = await this.service.get(
        requireAuth(request),
        id,
      );
      response.json({ data: serialize(procurementRequest) });
    } catch (error) {
      next(error);
    }
  };

  public readonly update: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const input = updateProcurementRequestSchema.parse(request.body);
      const updated = await this.service.updateDraft(
        requireAuth(request),
        id,
        input,
        correlationId(response),
      );
      response.json({ data: serialize(updated) });
    } catch (error) {
      next(error);
    }
  };

  public readonly transition: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const input = transitionProcurementRequestSchema.parse(request.body);
      const updated = await this.service.transition(
        requireAuth(request),
        id,
        input.command,
        input.rowVersion,
        input.reason,
        correlationId(response),
      );
      response.json({ data: serialize(updated) });
    } catch (error) {
      next(error);
    }
  };

  public readonly archive: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const { rowVersion } = archiveProcurementRequestSchema.parse(
        request.body,
      );
      const updated = await this.service.archive(
        requireAuth(request),
        id,
        rowVersion,
        correlationId(response),
      );
      response.json({ data: serialize(updated) });
    } catch (error) {
      next(error);
    }
  };

  public readonly restore: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const { rowVersion } = archiveProcurementRequestSchema.parse(
        request.body,
      );
      const updated = await this.service.restore(
        requireAuth(request),
        id,
        rowVersion,
        correlationId(response),
      );
      response.json({ data: serialize(updated) });
    } catch (error) {
      next(error);
    }
  };

  public readonly duplicate: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const created = await this.service.duplicate(
        requireAuth(request),
        id,
        correlationId(response),
      );
      response.status(201).json({ data: serialize(created) });
    } catch (error) {
      next(error);
    }
  };

  public readonly assign: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const input = assignProcurementRequestSchema.parse(request.body);
      const updated = await this.service.assign(
        requireAuth(request),
        id,
        input.membershipId,
        input.rowVersion,
        correlationId(response),
      );
      response.json({ data: serialize(updated) });
    } catch (error) {
      next(error);
    }
  };
}

function requireAuth(
  request: Express.Request,
): NonNullable<Express.Request["auth"]> {
  if (!request.auth) {
    throw new Error(
      "Authentication middleware must run before procurement controllers.",
    );
  }
  return request.auth;
}

function correlationId(response: Response): string {
  return response.locals.requestId as string;
}

function serialize(
  request: Awaited<ReturnType<ProcurementRequestService["get"]>>,
) {
  return {
    id: request.id,
    publicCode: request.publicCode,
    status: request.status,
    title: request.title,
    currencyCode: request.currencyCode,
    notes: request.notes,
    destinationCountryCode: request.destinationCountryCode,
    destinationAddress: request.destinationAddress,
    requiredByDate: request.requiredByDate,
    budgetAmount: request.budgetAmount?.toString() ?? null,
    priority: request.priority,
    restrictedGoodsDeclared: request.restrictedGoodsDeclared,
    rowVersion: request.rowVersion,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    archivedAt: request.archivedAt,
    items: request.items.map((item) => ({
      id: item.id,
      productVariantId: item.productVariantId,
      description: item.description,
      quantity: item.quantity.toString(),
      unit: item.unit,
      targetUnitAmount: item.targetUnitAmount?.toString() ?? null,
    })),
    attachments: (request.documents ?? []).map((link) => ({
      id: link.document.id,
      name: link.document.originalFilename,
      mimeType: link.document.mimeType,
      sizeBytes: link.document.sizeBytes,
      sizeLabel: formatAttachmentSize(link.document.sizeBytes),
      href: `/api/v1/documents/${link.document.id}`,
      kind: attachmentKind(link.document.mimeType),
      uploadedAt: link.document.createdAt,
    })),
    documentIds: (request.documents ?? []).map((link) => link.documentId),
  };
}

function formatAttachmentSize(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function attachmentKind(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType === "text/plain") return "document";
  return "file";
}
