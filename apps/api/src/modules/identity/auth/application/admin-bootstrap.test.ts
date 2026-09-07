import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "../../../../config/env.js";
import { DEFAULT_OPS_PERMISSIONS } from "../domain/permission-catalog.js";
import { ensureAdminBootstrap } from "./admin-bootstrap.js";

describe("ensureAdminBootstrap", () => {
  it(
    "creates or refreshes the dedicated admin account from environment values",
    async () => {
    const env = parseEnvironment({
      NODE_ENV: "development",
      JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
      ADMIN_NAME: "Almahbub Admin",
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "StrongPass123!",
    });

    expect(env.ADMIN_NAME).toBe("Almahbub Admin");
    expect(env.ADMIN_EMAIL).toBe("admin@example.com");
    expect(env.ADMIN_PASSWORD).toBe("StrongPass123!");

    const database = {
      permission: {
        createMany: vi.fn(async () => ({ count: 0 })),
        findMany: vi.fn(async () =>
          [...DEFAULT_OPS_PERMISSIONS].map((key, index) => ({
            id: `perm-${index + 1}`,
            key,
          })),
        ),
      },
      role: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => ({ id: "role-1", ...data })),
      },
      rolePermission: {
        createMany: vi.fn(async () => ({ count: 1 })),
      },
      membershipRole: {
        upsert: vi.fn(async () => ({ membershipId: "m-1", roleId: "role-1" })),
      },
      user: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => ({ id: "user-1", ...data })),
        update: vi.fn(async ({ data }) => ({ id: "user-1", ...data })),
      },
      userCredential: {
        upsert: vi.fn(async () => ({ userId: "user-1" })),
      },
      organization: {
        upsert: vi.fn(async ({ create, update }) => ({
          id: "org-1",
          ...create,
          ...update,
        })),
      },
      organizationMembership: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async ({ data }) => ({ id: "m-1", ...data })),
        upsert: vi.fn(async () => ({ id: "m-1" })),
      },
      $transaction: vi.fn(async (callback) => callback(database)),
    } as never;

    const result = await ensureAdminBootstrap(database, env);

    expect(result.created).toBe(true);
    expect(result.email).toBe("admin@example.com");
    expect(database.organization.upsert).toHaveBeenCalled();
    expect(database.userCredential.upsert).toHaveBeenCalled();
    expect(database.membershipRole.upsert).toHaveBeenCalled();
  },
    15_000,
  );

  it("accepts the dedicated Almahbub admin environment aliases", async () => {
    const env = parseEnvironment({
      NODE_ENV: "development",
      JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
      ALMAHBUB_ADMIN_NAME: "Almahbub",
      ALMAHBUB_ADMIN_EMAIL: "almahbub@example.com",
      ALMAHBUB_ADMIN_PASSWORD: "Almahbub1234",
    });

    expect(env.ADMIN_NAME).toBe("Almahbub");
    expect(env.ADMIN_EMAIL).toBe("almahbub@example.com");
    expect(env.ADMIN_PASSWORD).toBe("Almahbub1234");
  });
});
