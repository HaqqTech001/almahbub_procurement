/**
 * Revoke ops_admin / ops:access from a single user by email.
 * Does not delete the shared ops_admin role or other members.
 *
 * Usage:
 *   OPS_REVOKE_EMAIL=phase6a.ops@example.com corepack pnpm --filter @hamd/api exec tsx src/scripts/revoke-ops-access.ts
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";

async function main(): Promise<void> {
  const email = (process.env.OPS_REVOKE_EMAIL ?? "").trim().toLowerCase();
  if (!email) {
    throw new Error("OPS_REVOKE_EMAIL is required.");
  }

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const user = await database.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, email: true },
  });
  if (!user) {
    throw new Error(`No user found for ${email}.`);
  }

  const memberships = await database.organizationMembership.findMany({
    where: { userId: user.id },
    select: { id: true, organizationId: true },
  });

  let removed = 0;
  for (const membership of memberships) {
    const opsRoles = await database.role.findMany({
      where: {
        organizationId: membership.organizationId,
        key: { in: ["ops_admin", "ops", "operations"] },
      },
      select: { id: true, key: true },
    });
    for (const role of opsRoles) {
      const result = await database.membershipRole.deleteMany({
        where: { membershipId: membership.id, roleId: role.id },
      });
      removed += result.count;
    }
  }

  console.info(
    JSON.stringify({ email: user.email, opsMembershipRolesRemoved: removed }, null, 2),
  );
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
