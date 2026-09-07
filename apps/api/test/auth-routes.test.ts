import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";

const app = createApp(
  parseEnvironment({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
  }),
  { database: {} as never },
);

describe("authentication HTTP routes", () => {
  it("mounts protected identity endpoints under /api/v1/auth", async () => {
    const response = await request(app).get("/api/v1/auth/me").expect(401);

    expect(response.body.error).toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
