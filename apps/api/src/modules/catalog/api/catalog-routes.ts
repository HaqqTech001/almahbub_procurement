import { Router } from "express";

import type { CatalogService } from "../application/catalog-service.js";
import { CatalogController } from "./catalog-controller.js";

export function createCatalogRouters(service: CatalogService): {
  products: Router;
  categories: Router;
} {
  const controller = new CatalogController(service);

  const products = Router();
  products.get("/", controller.listProducts);
  products.get("/:slug", controller.getProduct);

  const categories = Router();
  categories.get("/", controller.listCategories);

  return { products, categories };
}
