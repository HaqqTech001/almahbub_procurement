import type { RequestHandler } from "express";

import type { CatalogService } from "../application/catalog-service.js";
import {
  publicCategoryListQuerySchema,
  publicProductIdentifierSchema,
  publicProductListQuerySchema,
} from "./catalog-schemas.js";

export class CatalogController {
  public constructor(private readonly service: CatalogService) {}

  public readonly listProducts: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = publicProductListQuerySchema.parse(request.query);
      const result = await this.service.listProducts(query);
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
      const { slug } = publicProductIdentifierSchema.parse(request.params);
      response.json({ data: await this.service.getProduct(slug) });
    } catch (error) {
      next(error);
    }
  };

  public readonly listCategories: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const query = publicCategoryListQuerySchema.parse(request.query);
      const result = await this.service.listCategories(query);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };
}
