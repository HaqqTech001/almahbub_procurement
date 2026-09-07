import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { apiEnvelope } from "../../../../middleware/api-envelope.js";
import { errorHandler } from "../../../../middleware/error-handler.js";
import { requestContext } from "../../../../middleware/request-context.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import { createCommunicationTemplateRouter } from "../api/notification-routes.js";
import type { NotificationService } from "../application/notification-service.js";

function stubLog(): RequestHandler {
  return (req, _response, next) => {
    req.log = { error() {}, info() {}, warn() {}, debug() {}, fatal() {}, trace() {}, child() { return this; } } as never;
    next();
  };
}

function authenticateWith(permissions: readonly string[] | null): RequestHandler {
  return (req, _response, next) => {
    if (!permissions) {
      next();
      return;
    }
    req.auth = {
      userId: "user-1",
      organizationId: "org-1",
      membershipId: "mem-1",
      sessionId: "sess-1",
      permissionKeys: new Set(permissions),
    } satisfies AuthContext;
    next();
  };
}

function createApp(permissions: readonly string[] | null) {
  const service = {
    listTemplates: vi.fn(),
    createTemplate: vi.fn(),
    publishTemplate: vi.fn(),
  } as unknown as NotificationService;
  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  app.use(
    "/api/v1/admin/communication/templates",
    createCommunicationTemplateRouter(authenticateWith(permissions), service),
  );
  app.use(errorHandler);
  return { app, service };
}

describe("communication template administration", () => {
  it("forbids ordinary buyers from listing or creating templates", async () => {
    expect(DEFAULT_BUYER_PERMISSIONS).not.toContain("communication:manage");
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const list = await request(app)
      .get("/api/v1/admin/communication/templates")
      .expect(403);
    const create = await request(app)
      .post("/api/v1/admin/communication/templates")
      .send({
        key: "welcome",
        type: "account",
        channel: "email",
        locale: "en",
        title: "Welcome",
        body: "Hello",
      })
      .expect(403);
    expect(list.body.error.code).toBe("FORBIDDEN");
    expect(create.body.error.code).toBe("FORBIDDEN");
    expect(service.listTemplates).not.toHaveBeenCalled();
    expect(service.createTemplate).not.toHaveBeenCalled();
  });

  it("allows communication:manage to reach template list", async () => {
    const { app, service } = createApp(["communication:manage"]);
    vi.mocked(service.listTemplates).mockResolvedValue([]);
    await request(app).get("/api/v1/admin/communication/templates").expect(200);
    expect(service.listTemplates).toHaveBeenCalled();
  });
});
