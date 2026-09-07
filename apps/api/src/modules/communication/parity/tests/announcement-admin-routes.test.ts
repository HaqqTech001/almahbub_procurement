import type { RequestHandler } from "express";
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { apiEnvelope } from "../../../../middleware/api-envelope.js";
import { errorHandler } from "../../../../middleware/error-handler.js";
import { requestContext } from "../../../../middleware/request-context.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import { createParityRouters } from "../api/parity-routes.js";
import type { ParityService } from "../application/parity-service.js";

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
    listPublishedAnnouncements: vi.fn().mockResolvedValue([]),
    getAnnouncement: vi.fn(),
    listAnnouncementsAdmin: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    attachAnnouncementMedia: vi.fn(),
    deleteAnnouncementMedia: vi.fn(),
    openAnnouncementMedia: vi.fn(),
  } as unknown as ParityService;
  const app = express();
  app.use(requestContext);
  app.use(stubLog());
  app.use(express.json());
  app.use(apiEnvelope);
  const routers = createParityRouters(authenticateWith(permissions), service);
  app.use("/api/v1/announcements", routers.announcements);
  app.use(errorHandler);
  return { app, service };
}

describe("announcement administration routes", () => {
  it("forbids ordinary buyers from admin list and create", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const list = await request(app)
      .get("/api/v1/announcements/admin")
      .expect(403);
    const create = await request(app)
      .post("/api/v1/announcements")
      .send({ title: "Should fail", body: "Buyer must not publish." })
      .expect(403);
    expect(list.body.error.code).toBe("FORBIDDEN");
    expect(create.body.error.code).toBe("FORBIDDEN");
    expect(service.listAnnouncementsAdmin).not.toHaveBeenCalled();
    expect(service.createAnnouncement).not.toHaveBeenCalled();
  });

  it("allows ops:access to reach announcement admin list", async () => {
    const { app, service } = createApp(["ops:access"]);
    vi.mocked(service.listAnnouncementsAdmin).mockResolvedValue([]);
    await request(app).get("/api/v1/announcements/admin").expect(200);
    expect(service.listAnnouncementsAdmin).toHaveBeenCalled();
  });

  it("allows unauthenticated public list of published announcements", async () => {
    const { app, service } = createApp(null);
    await request(app).get("/api/v1/announcements").expect(200);
    expect(service.listPublishedAnnouncements).toHaveBeenCalled();
    expect(service.createAnnouncement).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated create/update/delete", async () => {
    const { app, service } = createApp(null);
    await request(app)
      .post("/api/v1/announcements")
      .send({ title: "Public must not publish", body: "No." })
      .expect(401);
    await request(app)
      .patch("/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001")
      .send({ status: "published" })
      .expect(401);
    await request(app)
      .delete("/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001")
      .expect(401);
    expect(service.createAnnouncement).not.toHaveBeenCalled();
    expect(service.updateAnnouncement).not.toHaveBeenCalled();
    expect(service.deleteAnnouncement).not.toHaveBeenCalled();
  });

  it("forbids buyers from pinning or publishing announcements", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const pin = await request(app)
      .patch("/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001")
      .send({ pinned: true })
      .expect(403);
    expect(pin.body.error.code).toBe("FORBIDDEN");
    expect(service.updateAnnouncement).not.toHaveBeenCalled();
  });

  it("forbids buyers from attaching announcement media", async () => {
    const { app, service } = createApp(DEFAULT_BUYER_PERMISSIONS);
    const response = await request(app)
      .post(
        "/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001/media",
      )
      .expect(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
    expect(service.attachAnnouncementMedia).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated announcement media attach and delete", async () => {
    const { app, service } = createApp(null);
    await request(app)
      .post(
        "/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001/media",
      )
      .expect(401);
    await request(app)
      .delete(
        "/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001/media/0190c8a0-1000-7000-8000-00000000a002",
      )
      .expect(401);
    expect(service.attachAnnouncementMedia).not.toHaveBeenCalled();
    expect(service.deleteAnnouncementMedia).not.toHaveBeenCalled();
  });
});
