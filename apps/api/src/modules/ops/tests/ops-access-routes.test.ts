import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { errorHandler } from "../../../middleware/error-handler.js";
import { apiEnvelope } from "../../../middleware/api-envelope.js";
import { requestContext } from "../../../middleware/request-context.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../identity/auth/domain/permission-catalog.js";
import type { OpsService } from "../application/ops-service.js";
import { createOpsRouter } from "../api/ops-routes.js";

function stubLog(): RequestHandler {
  return (request, _response, next) => {
    request.log = {
      error() {
        return undefined;
      },
      info() {
        return undefined;
      },
      warn() {
        return undefined;
      },
      debug() {
        return undefined;
      },
      fatal() {
        return undefined;
      },
      trace() {
        return undefined;
      },
      child() {
        return this;
      },
    } as never;
    next();
  };
}

function authenticateWith(
  permissions: readonly string[] | null,
): RequestHandler {
  return (request, _response, next) => {
    if (!permissions) {
      next();
      return;
    }
    request.auth = {
      userId: "user-1",
      organizationId: "org-1",
      membershipId: "mem-1",
      sessionId: "sess-1",
      permissionKeys: new Set(permissions),
    } satisfies AuthContext;
    next();
  };
}

function createOpsApp(permissions: readonly string[] | null) {
  const service = {
    listProducts: vi.fn(),
    createProduct: vi.fn(),
    uploadProductImage: vi.fn(),
    uploadProductVideo: vi.fn(),
    deleteProductVideo: vi.fn(),
    updateUserAccountStatus: vi.fn(),
    updateUserOpsAccess: vi.fn(),
  } as unknown as OpsService;
  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  app.use("/api/v1/ops", createOpsRouter(authenticateWith(permissions), service));
  app.use(errorHandler);
  return { app, service };
}

describe("ops route authorization", () => {
  it("rejects unauthenticated callers", async () => {
    const { app, service } = createOpsApp(null);
    const response = await request(app).get("/api/v1/ops/products").expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(service.listProducts).not.toHaveBeenCalled();
  });

  it("rejects a buyer without ops:access from product mutations and uploads", async () => {
    const { app, service } = createOpsApp(DEFAULT_BUYER_PERMISSIONS);
    const create = await request(app)
      .post("/api/v1/ops/products")
      .send({ name: "Should fail" })
      .expect(403);
    expect(create.body.error.code).toBe("FORBIDDEN");

    const upload = await request(app)
      .post("/api/v1/ops/products/0190c8a0-1000-7000-8000-00000000c0de/images/upload")
      .expect(403);
    expect(upload.body.error.code).toBe("FORBIDDEN");

    const videoUpload = await request(app)
      .post("/api/v1/ops/products/0190c8a0-1000-7000-8000-00000000c0de/videos/upload")
      .expect(403);
    expect(videoUpload.body.error.code).toBe("FORBIDDEN");

    const videoDelete = await request(app)
      .delete(
        "/api/v1/ops/products/0190c8a0-1000-7000-8000-00000000c0de/videos/0190c8a0-1000-7000-8000-00000000v1de",
      )
      .expect(403);
    expect(videoDelete.body.error.code).toBe("FORBIDDEN");

    expect(service.createProduct).not.toHaveBeenCalled();
    expect(service.uploadProductImage).not.toHaveBeenCalled();
    expect(service.uploadProductVideo).not.toHaveBeenCalled();
    expect(service.deleteProductVideo).not.toHaveBeenCalled();
  });

  it("rejects a buyer from user status and ops-access mutations", async () => {
    const { app, service } = createOpsApp(DEFAULT_BUYER_PERMISSIONS);
    const userId = "0190c8a0-1000-7000-8000-00000000b001";
    const status = await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/status`)
      .send({ command: "suspend" })
      .expect(403);
    const access = await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/ops-access`)
      .send({ command: "grant" })
      .expect(403);
    expect(status.body.error.code).toBe("FORBIDDEN");
    expect(access.body.error.code).toBe("FORBIDDEN");
    expect(service.updateUserAccountStatus).not.toHaveBeenCalled();
    expect(service.updateUserOpsAccess).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated user administration", async () => {
    const { app, service } = createOpsApp(null);
    const userId = "0190c8a0-1000-7000-8000-00000000b001";
    const response = await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/status`)
      .send({ command: "suspend" })
      .expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(service.updateUserAccountStatus).not.toHaveBeenCalled();
  });

  it("rejects privilege escalation payloads that are not commands", async () => {
    const { app, service } = createOpsApp(["ops:access"]);
    const userId = "0190c8a0-1000-7000-8000-00000000b001";
    await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/status`)
      .send({ status: "active", role: "admin" })
      .expect(422);
    await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/ops-access`)
      .send({ role: "admin" })
      .expect(422);
    expect(service.updateUserAccountStatus).not.toHaveBeenCalled();
    expect(service.updateUserOpsAccess).not.toHaveBeenCalled();
  });

  it("allows ops:access to submit a suspend command", async () => {
    const { app, service } = createOpsApp(["ops:access"]);
    const userId = "0190c8a0-1000-7000-8000-00000000b001";
    vi.mocked(service.updateUserAccountStatus).mockResolvedValue({
      userId,
      userStatus: "suspended",
    } as never);
    await request(app)
      .patch(`/api/v1/ops/identity/users/${userId}/status`)
      .send({ command: "suspend", reason: "Review" })
      .expect(200);
    expect(service.updateUserAccountStatus).toHaveBeenCalled();
  });

  it("rejects a buyer from dashboard, audit, and identity", async () => {
    const { app } = createOpsApp(DEFAULT_BUYER_PERMISSIONS);
    for (const path of [
      "/api/v1/ops/dashboard",
      "/api/v1/ops/audit-events",
      "/api/v1/ops/identity",
    ]) {
      const response = await request(app).get(path).expect(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    }
  });

  it("allows ops:access to reach product list", async () => {
    const { app, service } = createOpsApp(["ops:access"]);
    vi.mocked(service.listProducts).mockResolvedValue({
      data: [],
      page: { page: 1, pageSize: 20, total: 0, hasMore: false },
    });
    await request(app).get("/api/v1/ops/products").expect(200);
    expect(service.listProducts).toHaveBeenCalled();
  });
});
