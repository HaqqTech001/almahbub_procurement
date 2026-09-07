import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";

const app = createApp(
  parseEnvironment({
    NODE_ENV: "test",
    API_HOST: "127.0.0.1",
    API_PORT: "4000",
    LOG_LEVEL: "silent",
    CORS_ORIGINS: "http://localhost:5173",
  }),
);

describe("health endpoints", () => {
  it("returns the liveness contract", async () => {
    const response = await request(app).get("/health/live").expect(200);

    expect(response.body).toMatchObject({
      data: {
        status: "ok",
        service: "hamd-api",
        version: "v1",
      },
    });
    expect(response.headers["x-request-id"]).toBeTypeOf("string");
  });

  it("returns an operational readiness contract", async () => {
    const response = await request(app).get("/health/ready").expect(200);

    expect(response.body.data).toMatchObject({
      status: "ready",
      dependencies: {
        database: "not-configured",
        redis: "not-configured",
      },
    });
  });

  it("only reflects an RFC 4122 request identifier", async () => {
    const validRequestId = "9a5aa0bd-f98c-43ca-a9a2-346f3fcb8876";
    const validResponse = await request(app)
      .get("/health/live")
      .set("x-request-id", validRequestId)
      .expect(200);
    const invalidResponse = await request(app)
      .get("/health/live")
      .set("x-request-id", "untrusted-request-id")
      .expect(200);

    expect(validResponse.headers["x-request-id"]).toBe(validRequestId);
    expect(invalidResponse.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("does not grant CORS access to an unapproved browser origin", async () => {
    const response = await request(app)
      .get("/health/live")
      .set("origin", "https://unapproved.example")
      .expect(200);

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("returns the standard error envelope for unknown routes", async () => {
    const response = await request(app).get("/missing").expect(404);

    expect(response.body.error).toMatchObject({
      code: "NOT_FOUND",
      requestId: expect.any(String),
    });
  });
});
