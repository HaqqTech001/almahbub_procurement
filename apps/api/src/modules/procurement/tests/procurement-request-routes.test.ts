import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { apiEnvelope } from "../../../middleware/api-envelope.js";
import { errorHandler } from "../../../middleware/error-handler.js";
import { requestContext } from "../../../middleware/request-context.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../identity/auth/domain/permission-catalog.js";
import { createProcurementRequestRouter } from "../api/procurement-request-routes.js";
import type { ProcurementRequestService } from "../application/procurement-request-service.js";

function stubLog(): RequestHandler {
  return (req, _response, next) => {
    req.log = {
      error() {},
      info() {},
      warn() {},
      debug() {},
      fatal() {},
      trace() {},
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
    transition: vi.fn(),
    list: vi.fn(),
    get: vi.fn(),
  } as unknown as ProcurementRequestService;
  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  app.use(
    "/api/v1/procurement-requests",
    createProcurementRequestRouter(authenticateWith(permissions), service),
  );
  app.use(errorHandler);
  return { app, service };
}

const REQUEST_ID = "0190c8a0-1000-7000-8000-00000000b001";

describe("procurement request transition authorization", () => {
  it("rejects unauthenticated administrative and buyer commands", async () => {
    const { app, service } = createApp(null);
    const response = await request(app)
      .post(`/api/v1/procurement-requests/${REQUEST_ID}/transitions`)
      .send({ command: "approve", rowVersion: 0 })
      .expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(service.transition).not.toHaveBeenCalled();
  });

  it("forbids buyers from approve, decline, and other ops commands", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    for (const command of [
      "approve",
      "decline",
      "accept_for_sourcing",
      "start_sourcing",
      "start_purchase",
      "fulfill",
      "close",
    ] as const) {
      const response = await request(app)
        .post(`/api/v1/procurement-requests/${REQUEST_ID}/transitions`)
        .send({
          command,
          rowVersion: 0,
          ...(command === "decline" ? { reason: "Out of scope" } : {}),
        })
        .expect(403);
      expect(response.body.error.code).toBe("FORBIDDEN");
    }
    expect(service.transition).not.toHaveBeenCalled();
  });

  it("lets buyers reach submit and cancel floors", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    vi.mocked(service.transition).mockRejectedValue(new Error("stop after auth"));
    const submit = await request(app)
      .post(`/api/v1/procurement-requests/${REQUEST_ID}/transitions`)
      .send({ command: "submit", rowVersion: 0 });
    expect(submit.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();

    vi.mocked(service.transition).mockClear();
    const cancel = await request(app)
      .post(`/api/v1/procurement-requests/${REQUEST_ID}/transitions`)
      .send({ command: "cancel", rowVersion: 0, reason: "No longer needed" });
    expect(cancel.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();
  });

  it("lets request:manage reach approve", async () => {
    const { app, service } = createApp(["request:manage"]);
    vi.mocked(service.transition).mockRejectedValue(new Error("stop after auth"));
    const response = await request(app)
      .post(`/api/v1/procurement-requests/${REQUEST_ID}/transitions`)
      .send({ command: "approve", rowVersion: 0 });
    expect(response.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();
  });
});
