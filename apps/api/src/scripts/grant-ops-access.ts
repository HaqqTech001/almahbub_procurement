/**
 * Grant operations console access to an existing user by email.
 *
 * Creates (or reuses) an organization role `ops_admin` with DEFAULT_OPS_PERMISSIONS
 * and attaches it to the user's membership. Public registration never receives
 * ops:access.
 *
 * Usage from repo root:
 *   OPS_GRANT_EMAIL=ops@example.com corepack pnpm --filter @hamd/api exec tsx src/scripts/grant-ops-access.ts
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  DEFAULT_OPS_PERMISSIONS,
  PERMISSION_CATALOG,
  resolvePermissionRows,
} from "../modules/identity/auth/domain/permission-catalog.js";

async function main(): Promise<void> {
  const email = (process.env.OPS_GRANT_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("OPS_GRANT_EMAIL is required.");
  }

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const catalog = resolvePermissionRows(PERMISSION_CATALOG.map(([key]) => key));

  await database.permission.createMany({
    data: catalog.map((row) => ({
      key: row.key,
      resource: row.resource,
      action: row.action,
    })),
    skipDuplicates: true,
  });

  const user = await database.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(`No user found for ${email}.`);
  }

  const membership = await database.organizationMembership.findFirst({
    where: { userId: user.id, status: "active" },
    orderBy: { createdAt: "asc" },
    select: { id: true, organizationId: true },
  });
  if (!membership) {
    throw new Error(`User ${email} has no active organization membership.`);
  }

  const opsPermissions = await database.permission.findMany({
    where: { key: { in: [...DEFAULT_OPS_PERMISSIONS] } },
    select: { id: true, key: true },
  });
  if (opsPermissions.length !== DEFAULT_OPS_PERMISSIONS.length) {
    throw new Error("Ops permission catalog is incomplete.");
  }

  let role = await database.role.findFirst({
    where: {
      organizationId: membership.organizationId,
      key: "ops_admin",
    },
    select: { id: true },
  });
  if (!role) {
    role = await database.role.create({
      data: {
        organizationId: membership.organizationId,
        scope: "organization",
        key: "ops_admin",
        name: "Operations admin",
        description: "Production operations console access.",
      },
      select: { id: true },
    });
  }

  await database.rolePermission.createMany({
    data: opsPermissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });

  await database.membershipRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: membership.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      membershipId: membership.id,
      roleId: role.id,
    },
  });

  console.info(
    `[grant-ops-access] granted ops:access to ${user.email} via role ops_admin`,
  );
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
