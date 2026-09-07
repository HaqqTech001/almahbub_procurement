import type { RequestHandler, Response } from "express";

import { catalogVideoUploadPolicy } from "../../catalog/infrastructure/catalog-media-policy.js";
import { parseMultipartFiles } from "../../../shared/uploads/multipart.js";

import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { AppError } from "../../../lib/app-error.js";
import {
  createOpsBrandSchema,
  createOpsCategorySchema,
  createOpsManufacturerSchema,
  createOpsProductImageSchema,
  createOpsProductVideoSchema,
  createOpsProductSchema,
  opsListQuerySchema,
  opsProductImageParamsSchema,
  opsProductVideoParamsSchema,
  opsReportSchema,
  opsResourceIdSchema,
  opsUserAccountStatusSchema,
  opsUserIdSchema,
  opsUserOpsAccessSchema,
  updateOpsCategorySchema,
  updateOpsProductImageSchema,
  updateOpsProductVideoSchema,
  updateOpsProductSchema,
} from "./ops-schemas.js";
import type { OpsService } from "../application/ops-service.js";

function requireAuth(request: { auth?: AuthContext }): AuthContext {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
    });
  }
  return request.auth;
}

function correlationId(response: Response): string | undefined {
  return typeof response.locals.requestId === "string"
    ? response.locals.requestId
    : undefined;
}

export class OpsController {
  public constructor(private readonly service: OpsService) {}

  public readonly dashboard: RequestHandler = async (request, response, next) => {
    try {
      const data = await this.service.dashboard(requireAuth(request));
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly auditEvents: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listAuditEvents(requireAuth(request), query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly identity: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const data = await this.service.identityDirectory(requireAuth(request), query);
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateUserAccountStatus: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { userId } = opsUserIdSchema.parse(request.params);
      const input = opsUserAccountStatusSchema.parse(request.body);
      response.json({
        data: await this.service.updateUserAccountStatus(
          requireAuth(request),
          userId,
          input,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateUserOpsAccess: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { userId } = opsUserIdSchema.parse(request.params);
      const input = opsUserOpsAccessSchema.parse(request.body);
      response.json({
        data: await this.service.updateUserOpsAccess(
          requireAuth(request),
          userId,
          input,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly suppliers: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listSuppliers(requireAuth(request), query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly products: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listProducts(requireAuth(request), query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly getProduct: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      response.json({
        data: await this.service.getProduct(requireAuth(request), id),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly createProduct: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = createOpsProductSchema.parse(request.body);
      response.status(201).json({
        data: await this.service.createProduct(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateProduct: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      const input = updateOpsProductSchema.parse(request.body);
      response.json({
        data: await this.service.updateProduct(requireAuth(request), id, input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly addProductImage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      const input = createOpsProductImageSchema.parse(request.body);
      response.status(201).json({
        data: await this.service.addProductImage(requireAuth(request), id, input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadProductImage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
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
        data: await this.service.uploadProductImage(
          requireAuth(request),
          id,
          file,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateProductImage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, imageId } = opsProductImageParamsSchema.parse(request.params);
      const input = updateOpsProductImageSchema.parse(request.body);
      response.json({
        data: await this.service.updateProductImage(
          requireAuth(request),
          id,
          imageId,
          input,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteProductImage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, imageId } = opsProductImageParamsSchema.parse(request.params);
      await this.service.deleteProductImage(requireAuth(request), id, imageId);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly setProductImagePrimary: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, imageId } = opsProductImageParamsSchema.parse(request.params);
      response.json({
        data: await this.service.setProductImagePrimary(
          requireAuth(request),
          id,
          imageId,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly addProductVideo: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      const input = createOpsProductVideoSchema.parse(request.body);
      response.status(201).json({
        data: await this.service.addProductVideo(requireAuth(request), id, input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadProductVideo: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      const files = await parseMultipartFiles(request, {
        maxFileBytes: catalogVideoUploadPolicy.maxBytes,
        maxFiles: 1,
      });
      const file = files[0];
      if (!file) {
        throw new AppError({
          statusCode: 422,
          code: "VALIDATION_ERROR",
          message: "A video file is required.",
        });
      }
      response.status(201).json({
        data: await this.service.uploadProductVideo(
          requireAuth(request),
          id,
          file,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateProductVideo: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, videoId } = opsProductVideoParamsSchema.parse(request.params);
      const input = updateOpsProductVideoSchema.parse(request.body);
      response.json({
        data: await this.service.updateProductVideo(
          requireAuth(request),
          id,
          videoId,
          input,
        ),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly deleteProductVideo: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id, videoId } = opsProductVideoParamsSchema.parse(request.params);
      await this.service.deleteProductVideo(requireAuth(request), id, videoId);
      response.status(204).end();
    } catch (error) {
      next(error);
    }
  };

  public readonly brands: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listBrands(requireAuth(request), query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly createBrand: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = createOpsBrandSchema.parse(request.body);
      response.status(201).json({
        data: await this.service.createBrand(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly manufacturers: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listManufacturers(
        requireAuth(request),
        query,
      );
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly createManufacturer: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = createOpsManufacturerSchema.parse(request.body);
      response.status(201).json({
        data: await this.service.createManufacturer(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly categories: RequestHandler = async (request, response, next) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listCategories(requireAuth(request), query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly createCategory: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = createOpsCategorySchema.parse(request.body);
      response.status(201).json({
        data: await this.service.createCategory(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateCategory: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
      const input = updateOpsCategorySchema.parse(request.body);
      response.json({
        data: await this.service.updateCategory(requireAuth(request), id, input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly uploadCategoryImage: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const { id } = opsResourceIdSchema.parse(request.params);
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
        data: await this.service.uploadCategoryImage(requireAuth(request), id, file),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly purchaseOrders: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = opsListQuerySchema.parse(request.query);
      const result = await this.service.listPurchaseOrders(
        requireAuth(request),
        query,
      );
      response.json(result);
    } catch (error) {
      next(error);
    }
  };

  public readonly report: RequestHandler = async (request, response, next) => {
    try {
      const input = opsReportSchema.parse(request.body);
      const data = await this.service.generateReport(requireAuth(request), input);
      void correlationId(response);
      response.json({ data });
    } catch (error) {
      next(error);
    }
  };
}
