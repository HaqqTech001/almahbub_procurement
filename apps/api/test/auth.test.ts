import { TextEncoder } from "node:util";

import { SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "../src/config/env.js";
import type { AppError } from "../src/lib/app-error.js";
import { createAuthenticate } from "../src/shared/auth/authenticate.js";
import type { AuthContext } from "../src/shared/auth/auth-context.js";
import { requirePermission } from "../src/shared/auth/require-permission.js";
import type { DatabaseClient } from "../src/shared/database/database-client.js";

const environment = parseEnvironment({
  NODE_ENV: "test",
  JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
  JWT_ISSUER: "hamd-api",
  JWT_AUDIENCE: "hamd-client",
});

describe("access-token authentication", () => {
  it("resolves an active session and organization membership", async () => {
    const database = {
      userSession: {
        findFirst: vi.fn().mockResolvedValue({ id: "session-1" }),
      },
      organizationMembership: {
        findFirst: vi.fn().mockResolvedValue({
          id: "membership-1",
          roles: [
            {
              role: {
                permissions: [{ permission: { key: "request:read" } }],
              },
            },
          ],
        }),
      },
    } as unknown as DatabaseClient;
    const token = await accessToken();
    const request = {
      header: () => `Bearer ${token}`,
    };
    const next = vi.fn();

    await createAuthenticate(database, environment)(
      request as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledWith();
    expect((request as unknown as { auth?: AuthContext }).auth).toMatchObject({
      userId: "user-1",
      organizationId: "organization-1",
      sessionId: "session-1",
    });
    expect(
      (request as unknown as { auth: AuthContext }).auth.permissionKeys.has(
        "request:read",
      ),
    ).toBe(true);
  });

  it("rejects a valid JWT when its session is no longer active", async () => {
    const database = {
      userSession: { findFirst: vi.fn().mockResolvedValue(null) },
    } as unknown as DatabaseClient;
    const next = vi.fn();
    const token = await accessToken();

    await createAuthenticate(database, environment)(
      { header: () => `Bearer ${token}` } as never,
      {} as never,
      next,
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: "SESSION_REVOKED", statusCode: 401 }),
    );
  });
});

describe("permission guard", () => {
  it("returns a details entry for a missing permission", () => {
    const next = vi.fn();
    requirePermission("request:approve")(
      {
        auth: {
          userId: "user-1",
          organizationId: "organization-1",
          membershipId: "membership-1",
          sessionId: "session-1",
          permissionKeys: new Set(["request:read"]),
        },
      } as never,
      {} as never,
      next,
    );

    const error = next.mock.calls[0]?.[0] as AppError;
    expect(error).toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
    expect(error.details).toEqual([
      {
        code: "MISSING_PERMISSION",
        message: "Required permission: request:approve.",
      },
    ]);
  });
});

async function accessToken(): Promise<string> {
  return new SignJWT({ org: "organization-1", sid: "session-1", ver: 0 })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("user-1")
    .setIssuer(environment.JWT_ISSUER)
    .setAudience(environment.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(environment.JWT_ACCESS_SECRET));
}
