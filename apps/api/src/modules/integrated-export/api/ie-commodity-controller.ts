import type { RequestHandler } from "express";

import { AppError } from "../../../lib/app-error.js";
import { parseMultipartFiles } from "../../../shared/uploads/multipart.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { IeCommodityService } from "../application/ie-commodity-service.js";
import {
  createIeCommoditySchema,
  ieCommodityIdParamsSchema,
  ieCommodityListQuerySchema,
  ieCommoditySlugParamsSchema,
  updateIeCommoditySchema,
} from "./ie-commodity-schemas.js";

function optionalAuth(request: { auth?: AuthContext }): AuthContext | undefined {
  return request.auth;
}

function requireAuth(request: { auth?: AuthContext }): AuthContext {
  if (!request.auth) {
    throw new Error(
      "Authentication middleware must run before IE commodity write controllers.",
    );
  }
  return request.auth;
}

export class IeCommodityController {
  public constructor(private readonly service: IeCommodityService) {}

  public readonly list: RequestHandler = async (request, response, next) => {
    try {
      const query = ieCommodityListQuerySchema.parse(request.query);
      const result = await this.service.list(query, optionalAuth(request));
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly getBySlug: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { slug } = ieCommoditySlugParamsSchema.parse(request.params);
      response.json({
        data: await this.service.getBySlug(slug, optionalAuth(request)),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly create: RequestHandler = async (request, response, next) => {
    try {
      const input = createIeCommoditySchema.parse(request.body);
      const data = await this.service.create(requireAuth(request), input);
      response.status(201).json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly update: RequestHandler = async (request, response, next) => {
    try {
      const { id } = ieCommodityIdParamsSchema.parse(request.params);
      const input = updateIeCommoditySchema.parse(request.body);
      response.json({
        data: await this.service.update(requireAuth(request), id, input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly archive: RequestHandler = async (request, response, next) => {
    try {
      const { id } = ieCommodityIdParamsSchema.parse(request.params);
      response.json({
        data: await this.service.archive(requireAuth(request), id),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadHero: RequestHandler = async (request, response, next) => {
    try {
      const { id } = ieCommodityIdParamsSchema.parse(request.params);
      const files = await parseMultipartFiles(request);
      const file = files[0];
      if (!file) {
        throw new AppError({
          statusCode: 422,
          code: "VALIDATION_ERROR",
          message: "An image file is required.",
        });
      }
      response.status(201).json({
        data: await this.service.uploadHero(requireAuth(request), id, file),
      });
    } catch (error) {
      next(error);
    }
  };
}
