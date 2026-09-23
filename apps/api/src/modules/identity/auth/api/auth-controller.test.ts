import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { AuthController } from "./auth-controller.js";

const jwtSecret = "test-secret-that-is-at-least-32-characters-long";

const environment = {
  NODE_ENV: "test",
  COOKIE_SECURE: false,
  REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24,
  JWT_ACCESS_SECRET: jwtSecret,
} as any;

function csrfFor(refreshToken: string): string {
  return createHmac("sha256", jwtSecret)
    .update(refreshToken)
    .digest("base64url");
}

describe("AuthController.refresh", () => {
  it("accepts the CSRF token from the request body when the header is absent", async () => {
    const service = {
      refresh: vi.fn().mockResolvedValue({
        refreshToken: "next-refresh-token",
        accessToken: "next-access-token",
        expiresIn: 900,
        user: { id: "user-1", email: "buyer@example.com" },
        organizationId: "org-1",
        sessionId: "session-1",
      }),
    } as any;

    const controller = new AuthController(service, environment);
    const currentRefreshToken = "current-refresh-token";
    const csrfToken = csrfFor(currentRefreshToken);
    const request = {
      body: { csrfToken },
      cookies: { hamd_refresh: currentRefreshToken },
      ip: "127.0.0.1",
      get: vi.fn(() => undefined),
      headers: {},
    } as any;
    const response = {
      json: vi.fn(),
      cookie: vi.fn(),
      clearCookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await controller.refresh(request, response, vi.fn());

    expect(service.refresh).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: currentRefreshToken }),
    );
    expect(response.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ accessToken: "next-access-token" }),
    });
  });

  it("sets Secure SameSite=None Partitioned refresh cookies in production", async () => {
    const productionEnvironment = {
      ...environment,
      NODE_ENV: "production",
      COOKIE_SECURE: true,
    } as any;
    const service = {
      login: vi.fn().mockResolvedValue({
        refreshToken: "production-refresh-token",
        accessToken: "production-access-token",
        expiresIn: 900,
        user: { id: "user-1", email: "buyer@example.com" },
        organizationId: "org-1",
      }),
    } as any;
    const controller = new AuthController(service, productionEnvironment);
    const request = {
      body: { email: "buyer@example.com", password: "Password123!" },
      ip: "127.0.0.1",
      get: vi.fn(() => undefined),
    } as any;
    const response = {
      json: vi.fn(),
      cookie: vi.fn(),
      clearCookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await controller.login(request, response, vi.fn());

    expect(response.cookie).toHaveBeenCalledWith(
      "hamd_refresh",
      "production-refresh-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: "none",
        partitioned: true,
        path: "/api/v1/auth",
      }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "hamd_csrf",
      expect.any(String),
      expect.objectContaining({
        httpOnly: false,
        secure: true,
        sameSite: "none",
        partitioned: true,
        path: "/",
      }),
    );
  });
});
