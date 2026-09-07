import { describe, expect, it, vi } from "vitest";

import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type { AppError } from "../../../lib/app-error.js";
import { DEFAULT_OPS_PERMISSIONS } from "../../identity/auth/domain/permission-catalog.js";
import { OpsIdentityAdmin } from "../application/ops-identity-admin.js";

const adminAuth = {
  userId: "admin-1",
  organizationId: "org-1",
  membershipId: "mem-admin",
  sessionId: "sess-admin",
  permissionKeys: new Set(["ops:access"]),
} as AuthContext;

function membershipRow(overrides: {
  userId: string;
  status?: string;
  roleKeys?: string[];
  organizationId?: string;
}) {
  const userId = overrides.userId;
  return {
    id: `mem-${userId}`,
    userId,
    organizationId: overrides.organizationId ?? "org-1",
    status: overrides.status ?? "active",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    user: {
      id: userId,
      email: `${userId}@example.com`,
      firstName: "Test",
      lastName: "User",
      displayName: null,
      status: "active",
      lastAuthenticatedAt: null,
    },
    organization: {
      displayName: "Almahbub",
      legalName: "Almahbub",
      slug: "almahbub",
    },
    roles: (overrides.roleKeys ?? ["buyer"]).map((key) => ({
      role: { id: `role-${key}`, key, name: key },
    })),
  };
}

function createDatabase(state: {
  users: Record<string, { id: string; email: string; status: string }>;
  opsUserIds: string[];
  memberships: ReturnType<typeof membershipRow>[];
}) {
  const users = { ...state.users };
  const opsUserIds = [...state.opsUserIds];
  const memberships = [...state.memberships];
  const auditEvent = { create: vi.fn(async () => ({ id: "audit-1" })) };
  const userSession = { updateMany: vi.fn(async () => ({ count: 1 })) };
  const membershipRole = {
    findMany: vi.fn(async () =>
      opsUserIds.map((userId) => ({ membership: { userId } })),
    ),
    upsert: vi.fn(async () => ({})),
    deleteMany: vi.fn(async () => ({ count: 1 })),
  };
  const permission = {
    findMany: vi.fn(async () =>
      DEFAULT_OPS_PERMISSIONS.map((key, index) => ({ id: `perm-${index}`, key })),
    ),
  };
  const role = {
    findFirst: vi.fn(async (args: { where: { key?: string } }) => {
      if (args.where.key === "ops_admin") return { id: "role-ops_admin" };
      if (args.where.key === "buyer") return { id: "role-buyer" };
      return null;
    }),
    findMany: vi.fn(async () => [{ id: "role-ops_admin" }]),
    create: vi.fn(async () => ({ id: "role-ops_admin" })),
  };
  const rolePermission = { createMany: vi.fn(async () => ({ count: 1 })) };
  const user = {
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
      const row = users[where.id];
      return row
        ? { ...row, firstName: "Test", lastName: "User" }
        : null;
    }),
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: { status?: string } }) => {
      const row = users[where.id];
      if (row && data.status) row.status = data.status;
      return row;
    }),
  };
  const organizationMembership = {
    findFirst: vi.fn(async (args: { where: { userId?: string; organizationId?: string } }) => {
      return (
        memberships.find((item) => {
          if (args.where.userId && item.userId !== args.where.userId) return false;
          if (
            args.where.organizationId &&
            item.organizationId !== args.where.organizationId
          ) {
            return false;
          }
          return true;
        }) ?? null
      );
    }),
  };

  const database = {
    user,
    userSession,
    auditEvent,
    membershipRole,
    permission,
    role,
    rolePermission,
    organizationMembership,
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn(database),
    ),
  } as unknown as DatabaseClient;

  return {
    database,
    users,
    opsUserIds,
    auditEvent,
    userSession,
    membershipRole,
    user,
  };
}

describe("ops identity administration", () => {
  it("suspends an active buyer, revokes sessions, and writes an audit event", async () => {
    const { database, users, auditEvent, userSession } = createDatabase({
      users: {
        "buyer-1": { id: "buyer-1", email: "buyer@example.com", status: "active" },
      },
      opsUserIds: ["admin-1"],
      memberships: [membershipRow({ userId: "buyer-1" })],
    });

    const result = await new OpsIdentityAdmin(database).updateAccountStatus(
      adminAuth,
      "buyer-1",
      { command: "suspend", reason: "Policy breach" },
    );

    expect(users["buyer-1"]?.status).toBe("suspended");
    expect(userSession.updateMany).toHaveBeenCalled();
    expect(auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "ops.identity.user.suspend",
          resourceId: "buyer-1",
        }),
      }),
    );
    expect(result.userId).toBe("buyer-1");
  });

  it("reactivates a suspended user without deleting data", async () => {
    const { database, users } = createDatabase({
      users: {
        "buyer-1": {
          id: "buyer-1",
          email: "buyer@example.com",
          status: "suspended",
        },
      },
      opsUserIds: ["admin-1"],
      memberships: [membershipRow({ userId: "buyer-1" })],
    });

    await new OpsIdentityAdmin(database).updateAccountStatus(adminAuth, "buyer-1", {
      command: "activate",
    });
    expect(users["buyer-1"]?.status).toBe("active");
  });

  it("refuses to skip email verification by activating a pending user", async () => {
    const { database } = createDatabase({
      users: {
        "buyer-1": {
          id: "buyer-1",
          email: "buyer@example.com",
          status: "pending_verification",
        },
      },
      opsUserIds: ["admin-1"],
      memberships: [membershipRow({ userId: "buyer-1" })],
    });

    await expect(
      new OpsIdentityAdmin(database).updateAccountStatus(adminAuth, "buyer-1", {
        command: "activate",
      }),
    ).rejects.toMatchObject({
      code: "EMAIL_VERIFICATION_REQUIRED",
      statusCode: 400,
    } satisfies Partial<AppError>);
  });

  it("blocks self-suspension and last operations administrator removal", async () => {
    const { database } = createDatabase({
      users: {
        "admin-1": { id: "admin-1", email: "ops@example.com", status: "active" },
      },
      opsUserIds: ["admin-1"],
      memberships: [
        membershipRow({ userId: "admin-1", roleKeys: ["ops_admin"] }),
      ],
    });
    const service = new OpsIdentityAdmin(database);

    await expect(
      service.updateAccountStatus(adminAuth, "admin-1", { command: "suspend" }),
    ).rejects.toMatchObject({ code: "SELF_STATUS_CHANGE_FORBIDDEN" });

    await expect(
      service.updateOpsAccess(
        { ...adminAuth, userId: "other-admin" },
        "admin-1",
        { command: "revoke" },
      ),
    ).rejects.toMatchObject({ code: "LAST_OPS_ADMIN", statusCode: 409 });
  });

  it("grants ops_admin instead of accepting a raw admin role string", async () => {
    const { database, membershipRole } = createDatabase({
      users: {
        "buyer-1": { id: "buyer-1", email: "buyer@example.com", status: "active" },
      },
      opsUserIds: ["admin-1"],
      memberships: [membershipRow({ userId: "buyer-1" })],
    });

    await new OpsIdentityAdmin(database).updateOpsAccess(adminAuth, "buyer-1", {
      command: "grant",
    });
    expect(membershipRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ roleId: "role-ops_admin" }),
      }),
    );
  });

  it("returns 404 for an unknown user id", async () => {
    const { database } = createDatabase({
      users: {},
      opsUserIds: ["admin-1"],
      memberships: [],
    });
    await expect(
      new OpsIdentityAdmin(database).updateAccountStatus(adminAuth, "missing", {
        command: "suspend",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });
});
