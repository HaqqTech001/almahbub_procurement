import { describe, expect, it, vi } from "vitest";

import { AuthController } from "./auth-controller.js";

const environment = {
  NODE_ENV: "test",
  COOKIE_SECURE: false,
  REFRESH_TOKEN_TTL_SECONDS: 60 * 60 * 24,
} as any;

describe("AuthController.googleSignIn", () => {
  it("issues the normal session cookies from a GIS credential", async () => {
    const service = {
      completeGoogleCredentialSignIn: vi.fn().mockResolvedValue({
        refreshToken: "google-refresh",
        accessToken: "google-access",
        expiresIn: 900,
        rememberMe: false,
        user: { id: "user-1", email: "buyer@example.com" },
        organizationId: "org-1",
      }),
    } as any;

    const controller = new AuthController(service, environment);
    const request = {
      body: { credential: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature" },
      ip: "127.0.0.1",
      get: vi.fn(() => "vitest"),
    } as any;
    const response = {
      json: vi.fn(),
      cookie: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as any;

    await controller.googleSignIn(request, response, vi.fn());

    expect(service.completeGoogleCredentialSignIn).toHaveBeenCalledWith({
      credential: "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
      otpCode: undefined,
      email: undefined,
      ip: "127.0.0.1",
      userAgent: "vitest",
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ accessToken: "google-access" }),
    });
    expect(response.cookie).toHaveBeenCalled();
  });
});

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
    const request = {
      body: { csrfToken: "csrf-123" },
      cookies: { hamd_csrf: "csrf-123", hamd_refresh: "current-refresh-token" },
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
      expect.objectContaining({ refreshToken: "current-refresh-token" }),
    );
    expect(response.json).toHaveBeenCalledWith({
      data: expect.objectContaining({ accessToken: "next-access-token" }),
    });
  });
});
