import express, { type RequestHandler } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { errorHandler } from "../../../middleware/error-handler.js";
import { createWeddingRouter } from "./wedding-routes.js";
import type { WeddingCampaignService } from "../application/wedding-campaign-service.js";
import type { WeddingParticipationService } from "../application/wedding-participation-service.js";

function setup(role: "guest" | "buyer" | "ops") {
  const state = vi.fn().mockResolvedValue({ joined: false, subscribed: false });
  const list = vi.fn().mockResolvedValue({ total: 0, items: [] });
  const authenticate: RequestHandler = (req, res, next) => {
    if (role === "guest") { res.sendStatus(401); return; }
    req.auth = { userId: "buyer-id", organizationId: "org", membershipId: "member", sessionId: "session", permissionKeys: new Set(role === "ops" ? ["ops:access"] : []) };
    next();
  };
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { req.log = { error: vi.fn() } as unknown as typeof req.log; next(); });
  app.use(createWeddingRouter(authenticate, authenticate, {} as WeddingCampaignService,
    { state, list } as unknown as WeddingParticipationService));
  app.use(errorHandler);
  return { app, state, list };
}
describe("Wedding participation authorization", () => {
  it("requires sign-in for personal participation state", async () => {
    const { app, state } = setup("guest");
    expect((await request(app).get("/participation")).status).toBe(401);
    expect(state).not.toHaveBeenCalled();
  });
  it("always uses the authenticated identity and denies buyers the Ops list", async () => {
    const { app, state, list } = setup("buyer");
    expect((await request(app).get("/participation?userId=someone-else")).status).toBe(200);
    expect(state).toHaveBeenCalledWith("buyer-id");
    expect((await request(app).get("/participants?kind=waiting")).status).toBe(403);
    expect(list).not.toHaveBeenCalled();
  });
  it("allows Ops paginated access", async () => {
    const { app, list } = setup("ops");
    expect((await request(app).get("/participants?kind=waiting&page=2")).status).toBe(200);
    expect(list).toHaveBeenCalledWith("waiting", 2);
  });
});

describe("Participants query validation", () => {
 it.each(["subscription", "waiting"])("returns an empty successful %s list", async kind => {
  const {app,list} = setup("ops");
  const response = await request(app).get(`/participants?kind=${kind}&page=1`);
  expect(response.status).toBe(200); expect(response.body.data).toEqual({ total: 0, items: [] });
  expect(list).toHaveBeenCalledWith(kind, 1);
 });
 it.each(["kind=other", "kind=subscription&page=0", "kind=waiting&page=-1", "kind=waiting&page=NaN", "kind=waiting&page=1.5", "kind=waiting&page=100001", "kind=waiting&page=", "kind=waiting&page=1&page=2"])("rejects %s with 400", async query => {
  const {app,list}=setup("ops"); expect((await request(app).get(`/participants?${query}`)).status).toBe(400); expect(list).not.toHaveBeenCalled();
 });
 it("defaults the omitted page to one", async () => {
  const {app,list}=setup("ops"); expect((await request(app).get("/participants?kind=subscription")).status).toBe(200); expect(list).toHaveBeenCalledWith("subscription",1);
 });
 it("denies guests access to listing", async () => {
  const {app,list}=setup("guest"); expect((await request(app).get("/participants?kind=subscription&page=1")).status).toBe(401); expect(list).not.toHaveBeenCalled();
 });
});
