/**
 * Report whether specific emails currently have ops:access.
 * Usage: OPS_INSPECT_EMAILS=a@x.com,b@y.com ...
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";

async function main(): Promise<void> {
  const emails = (process.env.OPS_INSPECT_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) throw new Error("OPS_INSPECT_EMAILS is required.");

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const database = createDatabaseClient(environment.DATABASE_URL);

  const users = await database.user.findMany({
    where: { email: { in: emails, mode: "insensitive" } },
    select: {
      email: true,
      memberships: {
        where: { status: "active" },
        select: {
          roles: {
            select: {
              role: {
                select: {
                  key: true,
                  permissions: { select: { permission: { select: { key: true } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  const report = emails.map((email) => {
    const user = users.find((row) => row.email.toLowerCase() === email);
    if (!user) return { email, found: false, opsAccess: false, roles: [] as string[] };
    const roles = user.memberships.flatMap((membership) =>
      membership.roles.map((link) => link.role.key),
    );
    const permissionKeys = [
      ...new Set(
        user.memberships.flatMap((membership) =>
          membership.roles.flatMap((link) =>
            link.role.permissions.map((row) => row.permission.key),
          ),
        ),
      ),
    ].sort();
    const has = (key: string) => permissionKeys.includes(key);
    return {
      email,
      found: true,
      roles: [...new Set(roles)],
      opsAccess: has("ops:access"),
      communicationManage: has("communication:manage"),
      cmsManage: has("cms:manage"),
      auditRead: has("audit:read"),
      quotationReview: has("quotation:review"),
    };
  });

  console.info(JSON.stringify({ report }, null, 2));
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
