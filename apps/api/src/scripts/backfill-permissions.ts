/**
 * One-shot repair: upsert permission catalog and attach buyer defaults
 * to every organization role that exists (covers DBs migrated without seed).
 *
 * Usage from repo root:
 *   corepack pnpm --filter @hamd/api exec tsx src/scripts/backfill-permissions.ts
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  DEFAULT_BUYER_PERMISSIONS,
  PERMISSION_CATALOG,
  resolvePermissionRows,
} from "../modules/identity/auth/domain/permission-catalog.js";

async function main(): Promise<void> {
  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const allKeys = PERMISSION_CATALOG.map(([key]) => key);
  const rows = resolvePermissionRows(allKeys);

  await database.permission.createMany({
    data: rows.map((row) => ({
      key: row.key,
      resource: row.resource,
      action: row.action,
    })),
    skipDuplicates: true,
  });

  const permissions = await database.permission.findMany({
    where: { key: { in: [...DEFAULT_BUYER_PERMISSIONS] } },
    select: { id: true, key: true },
  });

  if (permissions.length !== DEFAULT_BUYER_PERMISSIONS.length) {
    throw new Error("Buyer permission upsert incomplete.");
  }

  const roles = await database.role.findMany({ select: { id: true, key: true } });
  let links = 0;
  for (const role of roles) {
    const result = await database.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
    links += result.count;
  }

  console.info(
    `[backfill-permissions] catalog=${rows.length} roles=${roles.length} linksCreated=${links}`,
  );
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
