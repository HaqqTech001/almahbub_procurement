import { describe, expect, it, vi } from "vitest";

import type { AppError } from "../../../../lib/app-error.js";
import { AuthService } from "./auth-service.js";
import type { AuthRepository } from "../infrastructure/auth-repository.js";
import type { Environment } from "../../../../config/env.js";

const environment = {
  NODE_ENV: "test",
  JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
  JWT_ISSUER: "hamd-api",
  JWT_AUDIENCE: "hamd-client",
  ACCESS_TOKEN_TTL_SECONDS: 900,
  REFRESH_TOKEN_TTL_SECONDS: 2_592_000,
} as Environment;

describe("AuthService refresh reuse", () => {
  it("revokes the session family when a rotated refresh token is replayed", async () => {
    const revokeSessionFamily = vi.fn().mockResolvedValue({ count: 2 });
    const repository = {
      findActiveSession: vi.fn().mockResolvedValue(null),
      findSessionByRefreshHash: vi.fn().mockResolvedValue({
        id: "sess-old",
        familyId: "family-1",
        status: "revoked",
      }),
      revokeSessionFamily,
    } as unknown as AuthRepository;

    const email = { send: vi.fn() };
    const service = new AuthService(repository, environment, email);
    await expect(
      service.refresh({ refreshToken: "stolen-rotated-token" }),
    ).rejects.toMatchObject({
      code: "INVALID_REFRESH_TOKEN",
    } satisfies Partial<AppError>);
    expect(revokeSessionFamily).toHaveBeenCalledWith("family-1");
  });
});
