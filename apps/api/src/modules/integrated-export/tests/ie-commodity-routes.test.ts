import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../../../app.js";
import { parseEnvironment } from "../../../config/env.js";
import { apiEnvelope } from "../../../middleware/api-envelope.js";
import { errorHandler } from "../../../middleware/error-handler.js";
import { requestContext } from "../../../middleware/request-context.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../identity/auth/domain/permission-catalog.js";
import type { IeCommodityService } from "../application/ie-commodity-service.js";
import { createIeCommodityRouter } from "../api/ie-commodity-routes.js";

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

function optionalAuthenticateWith(
  permissions: readonly string[] | null,
): RequestHandler {
  return (request, _response, next) => {
    if (permissions) {
      request.auth = {
        userId: "user-1",
        organizationId: "org-1",
        membershipId: "mem-1",
        sessionId: "sess-1",
        permissionKeys: new Set(permissions),
      } satisfies AuthContext;
    }
    next();
  };
}

function createIeRouterApp(permissions: readonly string[] | null) {
  const service = {
    list: vi.fn().mockResolvedValue({
      data: [],
      page: { page: 1, pageSize: 24, total: 0, hasMore: false },
    }),
    getBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
  } as unknown as IeCommodityService;

  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  app.use(
    "/api/v1/integrated-export/commodities",
    createIeCommodityRouter(
      authenticateWith(permissions),
      optionalAuthenticateWith(permissions),
      service,
    ),
  );
  app.use(errorHandler);
  return { app, service };
}

describe("IE commodity route authorization", () => {
  it("allows unauthenticated public list", async () => {
    const { app, service } = createIeRouterApp(null);
    await request(app).get("/api/v1/integrated-export/commodities").expect(200);
    expect(service.list).toHaveBeenCalled();
  });

  it("rejects unauthenticated create with 401", async () => {
    const { app, service } = createIeRouterApp(null);
    const response = await request(app)
      .post("/api/v1/integrated-export/commodities")
      .send({ name: "TEST COMMODITY ONLY", slug: "test-commodity-only" })
      .expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(service.create).not.toHaveBeenCalled();
  });

  it("rejects buyer create/update/archive with 403", async () => {
    const { app, service } = createIeRouterApp(DEFAULT_BUYER_PERMISSIONS);
    const create = await request(app)
      .post("/api/v1/integrated-export/commodities")
      .send({ name: "TEST COMMODITY ONLY", slug: "test-commodity-only" })
      .expect(403);
    expect(create.body.error.code).toBe("FORBIDDEN");

    await request(app)
      .patch("/api/v1/integrated-export/commodities/0190c8a0-1000-7000-8000-00000000c001")
      .send({ published: true })
      .expect(403);

    await request(app)
      .delete(
        "/api/v1/integrated-export/commodities/0190c8a0-1000-7000-8000-00000000c001",
      )
      .expect(403);

    expect(service.create).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
    expect(service.archive).not.toHaveBeenCalled();
  });

  it("allows ops create", async () => {
    const { app, service } = createIeRouterApp(["ops:access"]);
    (service.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "0190c8a0-1000-7000-8000-00000000c001",
      slug: "test-commodity-only",
      name: "TEST COMMODITY ONLY",
      published: false,
    });
    const response = await request(app)
      .post("/api/v1/integrated-export/commodities")
      .send({ name: "TEST COMMODITY ONLY", slug: "test-commodity-only" })
      .expect(201);
    expect(response.body.success).toBe(true);
    expect(service.create).toHaveBeenCalled();
  });
});

describe("IE commodity International isolation (HTTP)", () => {
  it("does not surface IE commodities via /api/v1/products", async () => {
    const product = {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    };
    const integratedExportCommodity = {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        {
          id: "0190c8a0-1000-7000-8000-00000000c001",
          slug: "test-commodity-only",
          name: "TEST COMMODITY ONLY",
          published: true,
          category: null,
          shortDescription: null,
          description: null,
          heroMedia: null,
          gallery: null,
          specifications: null,
          packaging: null,
          qualityInformation: null,
          applications: null,
          markets: null,
          sortOrder: 0,
          archivedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    const database = {
      $queryRaw: vi.fn(),
      $disconnect: vi.fn(),
      product,
      productCategory: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      integratedExportCommodity,
      userSession: { findFirst: vi.fn() },
      organizationMembership: { findFirst: vi.fn() },
    } as unknown as DatabaseClient;

    const app = createApp(
      parseEnvironment({
        NODE_ENV: "test",
        API_HOST: "127.0.0.1",
        API_PORT: "4000",
        LOG_LEVEL: "silent",
        CORS_ORIGINS: "http://localhost:5173",
        JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
      }),
      { database },
    );

    const products = await request(app).get("/api/v1/products").expect(200);
    expect(products.body.data).toEqual([]);
    expect(product.findMany).toHaveBeenCalled();
    expect(integratedExportCommodity.findMany).not.toHaveBeenCalled();

    const ie = await request(app)
      .get("/api/v1/integrated-export/commodities")
      .expect(200);
    expect(ie.body.data).toHaveLength(1);
    expect(ie.body.data[0]?.slug).toBe("test-commodity-only");
    expect(integratedExportCommodity.findMany).toHaveBeenCalled();
  });
});
