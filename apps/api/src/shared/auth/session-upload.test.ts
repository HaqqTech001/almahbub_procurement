import express from "express";
import request from "supertest";
import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";
import { parseEnvironment } from "../../config/env.js";
import { createAuthenticate } from "./authenticate.js";
import type { DatabaseClient } from "../database/database-client.js";
import { AppError } from "../../lib/app-error.js";
const env = parseEnvironment({ JWT_ACCESS_SECRET: "test-only-secret-at-least-thirty-two-characters" });
async function token(expiry: string) {
  return new SignJWT({ org: "org", sid: "session", ver: 1 }).setProtectedHeader({ alg: "HS256" }).setSubject("user").setIssuer(env.JWT_ISSUER).setAudience(env.JWT_AUDIENCE).setExpirationTime(expiry).sign(new TextEncoder().encode(env.JWT_ACCESS_SECRET!));
}
describe("protected upload boundary", () => {
  it("rejects expired bearer before any upload work and accepts a fresh credential once", async () => {
    const db = { userSession: { findFirst: vi.fn().mockResolvedValue({ id: "session" }) }, organizationMembership: { findFirst: vi.fn().mockResolvedValue({ id: "membership", roles: [] }) } } as unknown as DatabaseClient;
    let uploads = 0;
    const app = express();
    app.post("/upload", createAuthenticate(db, env), (_req, res) => { uploads++; res.sendStatus(201); });
    app.use(((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.sendStatus(err instanceof AppError ? err.statusCode : 500)) as express.ErrorRequestHandler);
    expect((await request(app).post("/upload").set("Authorization", `Bearer ${await token("-1s")}`).attach("files", Buffer.from("file"), "file.txt")).status).toBe(401);
    expect(uploads).toBe(0);
    expect((await request(app).post("/upload").set("Authorization", `Bearer ${await token("5m")}`).attach("files", Buffer.from("file"), "file.txt")).status).toBe(201);
    expect(uploads).toBe(1);
  });
  it("does not classify database failures as invalid credentials", async () => {
    const db = { userSession: { findFirst: vi.fn().mockRejectedValue(new Error("database unavailable")) } } as unknown as DatabaseClient;
    const app = express(); app.get("/protected", createAuthenticate(db, env), (_req, res) => res.sendStatus(200));
    app.use(((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.sendStatus(err instanceof AppError ? err.statusCode : 503)) as express.ErrorRequestHandler);
    expect((await request(app).get("/protected").set("Authorization", `Bearer ${await token("5m")}`)).status).toBe(503);
  });
  it("caps configured sessions at seven days without long-lived access tokens", () => {
    const config = parseEnvironment({ REFRESH_TOKEN_TTL_SECONDS: "2592000" });
    expect(config.REFRESH_TOKEN_TTL_SECONDS).toBe(7 * 86400);
    expect(config.ACCESS_TOKEN_TTL_SECONDS).toBeLessThan(config.REFRESH_TOKEN_TTL_SECONDS);
  });
});
