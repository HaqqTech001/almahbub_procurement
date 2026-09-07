import type { Request, RequestHandler } from "express";

import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { CopilotService } from "../application/copilot-service.js";
import {
  orderAdviseSchema,
  productAdviseSchema,
  quotationCompareSchema,
  quotationExplainSchema,
  recordIdSchema,
  requestDraftGuidanceSchema,
  requestGuidanceSchema,
} from "./copilot-schemas.js";

function auth(request: Request): AuthContext | undefined {
  return request.auth;
}

export class CopilotController {
  public constructor(private readonly service: CopilotService) {}

  public readonly status: RequestHandler = (_request, response) => {
    response.json({ data: this.service.status() });
  };

  public readonly adviseProduct: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.adviseProduct(
          auth(request),
          productAdviseSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly guideRequest: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = recordIdSchema.parse(request.params);
      response.json({
        data: await this.service.guideRequest(
          auth(request),
          id,
          requestGuidanceSchema.parse(request.body ?? {}),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly guideRequestDraft: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.guideRequestDraft(
          auth(request),
          requestDraftGuidanceSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly explainQuotation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = recordIdSchema.parse(request.params);
      response.json({
        data: await this.service.explainQuotation(
          auth(request),
          id,
          quotationExplainSchema.parse(request.body ?? {}),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly compareQuotations: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.compareQuotations(
          auth(request),
          quotationCompareSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly adviseOrder: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      response.json({
        data: await this.service.adviseOrder(
          auth(request),
          orderAdviseSchema.parse(request.body),
        ),
      });
    } catch (error) {
      next(error);
    }
  };
}
