import type { RequestHandler, Response } from "express";

import {
  archiveProcurementRequestSchema,
  assignProcurementRequestSchema,
  createProcurementRequestSchema,
  getProcurementRequestQuerySchema,
  listProcurementRequestsSchema,
  procurementRequestIdSchema,
  transitionProcurementRequestSchema,
  updateProcurementRequestSchema,
} from "./procurement-request-schemas.js";
import type { ProcurementRequestService } from "../application/procurement-request-service.js";
import {
  procurementRequestAudience,
  serializeProcurementRequest,
} from "./procurement-request-serialize.js";

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
      response.status(201).json({
        data: serialize(created, requireAuth(request)),
      });
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
        data: requests
          .slice(0, input.pageSize)
          .map((row) => serialize(row, requireAuth(request))),
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
      const { lob } = getProcurementRequestQuerySchema.parse(request.query);
      const procurementRequest = await this.service.get(
        requireAuth(request),
        id,
        false,
        lob,
      );
      response.json({
        data: serialize(procurementRequest, requireAuth(request)),
      });
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
      response.json({ data: serialize(updated, requireAuth(request)) });
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
      response.json({ data: serialize(updated, requireAuth(request)) });
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
      response.json({ data: serialize(updated, requireAuth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly destroy: RequestHandler = async (request, response, next) => {
    try {
      const { requestId: id } = procurementRequestIdSchema.parse(
        request.params,
      );
      const { rowVersion } = archiveProcurementRequestSchema.parse(
        request.body ?? {},
      );
      await this.service.destroyCancelled(
        requireAuth(request),
        id,
        rowVersion,
        correlationId(response),
      );
      response.status(204).send();
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
      response.json({ data: serialize(updated, requireAuth(request)) });
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
      response.status(201).json({
        data: serialize(created, requireAuth(request)),
      });
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
      response.json({ data: serialize(updated, requireAuth(request)) });
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
  auth: NonNullable<Express.Request["auth"]>,
) {
  return serializeProcurementRequest(
    request,
    procurementRequestAudience(auth),
  );
}
