import type { Request, RequestHandler, Response } from "express";

import { AppError } from "../../../../lib/app-error.js";
import {
  createTourSchema,
  dismissTipSchema,
  resetProgressSchema,
  scheduleTourSchema,
  tourIdSchema,
  updatePreferenceSchema,
  updateTourSchema,
  upsertProgressSchema,
} from "./guidance-schemas.js";
import type { GuidanceService } from "../application/guidance-service.js";
import { z } from "zod";

const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});

export class GuidanceController {
  public constructor(private readonly service: GuidanceService) {}

  public readonly preference: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.getPreference(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly updatePreference: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.updatePreference(
          auth(request),
          updatePreferenceSchema.parse(request.body),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly tours: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.listPublishedTours(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly tips: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.listTips(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly progress: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.listProgress(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly upsertProgress: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.upsertProgress(
          auth(request),
          upsertProgressSchema.parse(request.body),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly dismissedTips: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.listDismissedTips(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly dismissTip: RequestHandler = async (request, response, next) => {
    try {
      const { tipId } = dismissTipSchema.parse(request.body);
      await this.service.dismissTip(auth(request), tipId, requestId(response));
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly resetProgress: RequestHandler = async (request, response, next) => {
    try {
      await this.service.resetProgress(
        auth(request),
        resetProgressSchema.parse(request.body),
        requestId(response),
      );
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly adminTours: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.adminListTours(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly createTour: RequestHandler = async (request, response, next) => {
    try {
      response.status(201).json({
        data: await this.service.createTour(
          auth(request),
          createTourSchema.parse(request.body),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateTour: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.updateTour(
          auth(request),
          tourId(request),
          updateTourSchema.parse(request.body),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly publishTour: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.publishTour(
          auth(request),
          tourId(request),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly unpublishTour: RequestHandler = async (request, response, next) => {
    try {
      response.json({
        data: await this.service.unpublishTour(
          auth(request),
          tourId(request),
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly scheduleTour: RequestHandler = async (request, response, next) => {
    try {
      const input = scheduleTourSchema.parse(request.body);
      response.json({
        data: await this.service.scheduleTour(
          auth(request),
          tourId(request),
          input.scheduledFor,
          requestId(response),
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly analytics: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.analytics(auth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly resetUserProgress: RequestHandler = async (request, response, next) => {
    try {
      const { userId } = userIdParamSchema.parse(request.params);
      await this.service.resetProgress(
        auth(request),
        { scope: "all", userId },
        requestId(response),
      );
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };
}

function tourId(request: Request): string {
  return tourIdSchema.parse(request.params).tourId;
}

function auth(request: Request): NonNullable<Request["auth"]> {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication required.",
    });
  }
  return request.auth;
}

function requestId(response: Response): string {
  return response.locals.requestId as string;
}
