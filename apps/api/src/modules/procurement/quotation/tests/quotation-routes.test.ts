import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { apiEnvelope } from "../../../../middleware/api-envelope.js";
import { errorHandler } from "../../../../middleware/error-handler.js";
import { requestContext } from "../../../../middleware/request-context.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import { createQuotationRouter } from "../api/quotation-routes.js";
import type { QuotationService } from "../application/quotation-service.js";

function stubLog(): RequestHandler {
  return (req, _response, next) => {
    req.log = {
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
  return (req, _response, next) => {
    if (!permissions) {
      next();
      return;
    }
    req.auth = {
      userId: "buyer-owner",
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
    create: vi.fn(),
  } as unknown as QuotationService;
  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  app.use(
    "/api/v1/quotations",
    createQuotationRouter(authenticateWith(permissions), service),
  );
  app.use(errorHandler);
  return { app, service };
}

const QUOTATION_ID = "0190c8a0-1000-7000-8000-00000000c0de";

describe("quotation route authorization", () => {
  it("rejects unauthenticated transition callers", async () => {
    const { app, service } = createApp(null);
    const response = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "accept", rowVersion: 0 })
      .expect(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(service.transition).not.toHaveBeenCalled();
  });

  it("does not require quotation:review for a buyer accept/decline floor", async () => {
    expect(DEFAULT_BUYER_PERMISSIONS).not.toContain("quotation:review");
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    vi.mocked(service.transition).mockRejectedValue(new Error("stop after auth"));

    const accept = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "accept", rowVersion: 0 });
    expect(accept.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();

    vi.mocked(service.transition).mockClear();
    const decline = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "decline", rowVersion: 0, reason: "Lead time too long" });
    expect(decline.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();
  });

  it("forbids buyers from internal review and issue", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const review = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "review", rowVersion: 0 })
      .expect(403);
    const issue = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "issue", rowVersion: 0 })
      .expect(403);
    expect(review.body.error.code).toBe("FORBIDDEN");
    expect(issue.body.error.code).toBe("FORBIDDEN");
    expect(service.transition).not.toHaveBeenCalled();
  });

  it("forbids buyers from creating quotations", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const response = await request(app)
      .post("/api/v1/quotations")
      .send({
        procurementRequestId: QUOTATION_ID,
        items: [{ description: "Pump", quantity: 1, unitAmount: 10 }],
      })
      .expect(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(service.create).not.toHaveBeenCalled();
  });

  it("lets ops review when quotation:review is present", async () => {
    const { app, service } = createApp(["quotation:review"]);
    vi.mocked(service.transition).mockRejectedValue(new Error("stop after auth"));
    const response = await request(app)
      .post(`/api/v1/quotations/${QUOTATION_ID}/transitions`)
      .send({ command: "review", rowVersion: 0 });
    expect(response.status).not.toBe(403);
    expect(service.transition).toHaveBeenCalled();
  });
});
