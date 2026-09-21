import express, { type ErrorRequestHandler } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createApiAbuseLimiters, createRedisRateLimiter, RATE_LIMIT_SCRIPT } from "./redis-rate-limit.js";
import { createRateLimiter } from "./rate-limit.js";
import type { RedisClient } from "../shared/cache/redis-client.js";

const errors: ErrorRequestHandler = (error, _req, res, next) => { void next; res.status(error.statusCode ?? 500).json({ code: error.code }); };
afterEach(() => vi.useRealTimers());
function appWithScopes(trust = 0) {
  const app = express(); app.set("trust proxy", trust); app.use(express.json());
  const limits = createApiAbuseLimiters();
  app.use("/api/v1", limits.api);
  app.post("/api/v1/catalogue", (_req, res) => { res.sendStatus(500); });
  const auth = express.Router();
  auth.post(["/login", "/refresh", "/google", "/otp/verify"], limits.auth, (_req, res) => { res.sendStatus(401); });
  auth.get("/google/status", (_req, res) => { res.sendStatus(200); });
  app.use("/api/v1/auth", auth); app.use(errors); return app;
}
describe("authentication traffic isolation", () => {
  it("reproduces the old exact 50-second response without a password submission", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(100000);
    const app = express(); app.use(createRateLimiter({ limit: 300, windowMs: 60000, code: "API_RATE_LIMITED" }));
    app.get("/catalogue", (_req, res) => { res.sendStatus(200); });
    app.post("/login", (_req, res) => { res.sendStatus(200); }); app.use(errors);
    for (let i = 0; i < 300; i++) await request(app).get("/catalogue");
    vi.setSystemTime(110000);
    const response = await request(app).post("/login");
    expect(response.status).toBe(429); expect(response.body.code).toBe("API_RATE_LIMITED"); expect(response.headers["retry-after"]).toBe("50");
  }, 30000);
  it("catalogue 500s, refresh failures, GIS checks, Google errors and OTP traffic cannot consume password budget", async () => {
    const app = appWithScopes();
    for (let i = 0; i < 305; i++) await request(app).post("/api/v1/catalogue");
    for (const path of ["refresh", "google", "otp/verify"]) for (let i = 0; i < 22; i++) await request(app).post(`/api/v1/auth/${path}`);
    for (let i = 0; i < 25; i++) await request(app).get("/api/v1/auth/google/status");
    expect((await request(app).post("/api/v1/auth/login")).status).toBe(401);
  }, 30000);
  it("preserves the IP password ceiling, ignores OPTIONS and expires without extending rejected retries", async () => {
    vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(100000);
    const app = appWithScopes();
    for (let i = 0; i < 25; i++) await request(app).options("/api/v1/auth/login");
    for (let i = 0; i < 20; i++) expect((await request(app).post("/api/v1/auth/login")).status).toBe(401);
    vi.setSystemTime(950000);
    const blocked = await request(app).post("/api/v1/AUTH/LOGIN/");
    expect(blocked.body.code).toBe("AUTH_RATE_LIMITED"); expect(blocked.headers["retry-after"]).toBe("50");
    vi.setSystemTime(1000000);
    expect((await request(app).post("/api/v1/auth/login")).status).toBe(401);
  });
  it("does not trust spoofed forwarding headers on localhost", async () => {
    const app = appWithScopes();
    for (let i = 0; i < 20; i++) await request(app).post("/api/v1/auth/login").set("X-Forwarded-For", `203.0.113.${i}`);
    expect((await request(app).post("/api/v1/auth/login").set("X-Forwarded-For", "198.51.100.2")).status).toBe(429);
    expect((await request(appWithScopes()).post("/api/v1/auth/login")).status).toBe(401);
  });
  it("explicit single-hop trust selects the nearest forwarded client, never the spoofed leftmost entry", async () => {
    const app = appWithScopes(1);
    for (let i = 0; i < 20; i++) await request(app).post("/api/v1/auth/login").set("X-Forwarded-For", `203.0.113.${i}, 198.51.100.1`);
    expect((await request(app).post("/api/v1/auth/login").set("X-Forwarded-For", "203.0.113.99, 198.51.100.1")).status).toBe(429);
    expect((await request(app).post("/api/v1/auth/login").set("X-Forwarded-For", "203.0.113.99, 198.51.100.2")).status).toBe(401);
  });
});

describe("Redis request throttling", () => {
  it("uses the atomic result and precise Retry-After; preserves a warm fallback when Redis fails", async () => {
    const evaluate = vi.fn().mockResolvedValueOnce([1, 0]).mockResolvedValueOnce([0, 50]).mockRejectedValue(new Error("Redis down"));
    const app = express();
    app.use(createRedisRateLimiter({ redis: { eval: evaluate } as unknown as RedisClient, limit: 1, windowMs: 60000, prefix: "isolated-test" }));
    app.get("/", (_req, res) => { res.sendStatus(200); }); app.use(errors);
    expect((await request(app).get("/")).status).toBe(200);
    expect((await request(app).get("/")).headers["retry-after"]).toBe("50");
    expect((await request(app).get("/")).status).toBe(429);
    expect(evaluate.mock.calls[0]?.[0]).toBe(RATE_LIMIT_SCRIPT);
  });
});
