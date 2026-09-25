import { Router } from "express";
import type { RequestHandler } from "express";

import { requirePermission } from "../../../shared/auth/require-permission.js";
import { OpsController } from "./ops-controller.js";
import type { OpsService } from "../application/ops-service.js";

const OPS_ACCESS = requirePermission("ops:access");

export function createOpsRouter(
  authenticate: RequestHandler,
  service: OpsService,
): Router {
  const router = Router();
  const controller = new OpsController(service);
  router.use(authenticate);
  router.use(OPS_ACCESS);

  router.get("/dashboard", controller.dashboard);
  router.get("/audit-events", controller.auditEvents);
  router.get("/identity", controller.identity);
  router.patch(
    "/identity/users/:userId",
    controller.updateUserProfile,
  );
  router.patch(
    "/identity/users/:userId/status",
    controller.updateUserAccountStatus,
  );
  router.patch(
    "/identity/users/:userId/ops-access",
    controller.updateUserOpsAccess,
  );
  router.get("/suppliers", controller.suppliers);
  router.get("/products", controller.products);
  router.post("/products", controller.createProduct);
  router.get("/products/:id", controller.getProduct);
  router.patch("/products/:id", controller.updateProduct);
  router.post("/products/:id/images", controller.addProductImage);
  router.post("/products/:id/images/upload", controller.uploadProductImage);
  router.patch(
    "/products/:id/images/:imageId",
    controller.updateProductImage,
  );
  router.delete(
    "/products/:id/images/:imageId",
    controller.deleteProductImage,
  );
  router.post(
    "/products/:id/images/:imageId/primary",
    controller.setProductImagePrimary,
  );
  router.post("/products/:id/videos", controller.addProductVideo);
  router.post("/products/:id/videos/upload", controller.uploadProductVideo);
  router.patch(
    "/products/:id/videos/:videoId",
    controller.updateProductVideo,
  );
  router.delete(
    "/products/:id/videos/:videoId",
    controller.deleteProductVideo,
  );
  router.get("/brands", controller.brands);
  router.post("/brands", controller.createBrand);
  router.get("/manufacturers", controller.manufacturers);
  router.post("/manufacturers", controller.createManufacturer);
  router.get("/categories", controller.categories);
  router.post("/categories", controller.createCategory);
  router.patch("/categories/:id", controller.updateCategory);
  router.post("/categories/:id/image/upload", controller.uploadCategoryImage);
  router.get("/purchase-orders", controller.purchaseOrders);
  router.post("/reports", controller.report);
  return router;
}
