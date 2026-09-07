/**
 * Strip accidental communication:manage from buyer-default roles.
 *
 * Public registration previously included communication:manage on org_admin.
 * That key is internal template administration, not a customer capability.
 *
 * Classification (same semantics as reconcile-ops-access):
 *   keep   – ops_admin / ops / operations (explicit internal staff)
 *   revoke – org_admin / org_member / member / buyer / default
 *   review – any other role still carrying communication:manage
 *
 * Never revokes ops_admin. Also ensures ops_admin roles still have the key
 * after buyer defaults no longer include it.
 *
 * Dry-run by default. Apply with:
 *   BUYER_REVOKE_COMMUNICATION_MANAGE=1 corepack pnpm --filter @hamd/api exec tsx src/scripts/reconcile-buyer-communication-manage.ts
 *
 * Optional:
 *   OPS_REVOKE_UNKNOWN_ROLES=1
 *     Also strip communication:manage from "review" roles after inspecting dry-run.
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";

const BUYER_DEFAULT_ROLE_KEYS = new Set([
  "org_member",
  "org_admin",
  "member",
  "buyer",
  "default",
]);
const OPS_ROLE_KEYS = new Set(["ops_admin", "ops", "operations"]);
const TARGET_PERMISSION = "communication:manage";

function classifyRole(key: string): "keep" | "revoke" | "review" {
  const normalized = key.trim().toLowerCase();
  if (OPS_ROLE_KEYS.has(normalized)) return "keep";
  if (BUYER_DEFAULT_ROLE_KEYS.has(normalized)) return "revoke";
  return "review";
}

async function main(): Promise<void> {
  const apply = process.env.BUYER_REVOKE_COMMUNICATION_MANAGE === "1";
  const revokeUnknown = process.env.OPS_REVOKE_UNKNOWN_ROLES === "1";

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const permission = await database.permission.findFirst({
    where: { key: TARGET_PERMISSION },
    select: { id: true, key: true },
  });
  if (!permission) {
    console.info(
      `[reconcile-buyer-communication-manage] no ${TARGET_PERMISSION} permission row; nothing to do.`,
    );
    await database.$disconnect();
    return;
  }

  const links = await database.rolePermission.findMany({
    where: { permissionId: permission.id },
    select: {
      roleId: true,
      role: {
        select: {
          id: true,
          key: true,
          name: true,
          organizationId: true,
          memberships: {
            select: {
              membership: {
                select: {
                  status: true,
                  user: { select: { id: true, email: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const roleReport = links.map((link) => {
    const classification = classifyRole(link.role.key);
    const users = link.role.memberships
      .filter((row) => row.membership.status === "active")
      .map((row) => ({
        id: row.membership.user.id,
        email: row.membership.user.email,
      }));
    return {
      roleId: link.role.id,
      key: link.role.key,
      name: link.role.name,
      organizationId: link.role.organizationId,
      classification,
      userCount: users.length,
      users,
    };
  });

  const keepRoleIds = roleReport
    .filter((row) => row.classification === "keep")
    .map((row) => row.roleId);
  const revokeRoleIds = roleReport
    .filter((row) => row.classification === "revoke")
    .map((row) => row.roleId);
  const reviewRoleIds = roleReport
    .filter((row) => row.classification === "review")
    .map((row) => row.roleId);

  const userAccess = new Map<
    string,
    { email: string; via: Set<"keep" | "revoke" | "review"> }
  >();
  for (const role of roleReport) {
    for (const user of role.users) {
      const current = userAccess.get(user.id) ?? {
        email: user.email,
        via: new Set(),
      };
      current.via.add(role.classification);
      userAccess.set(user.id, current);
    }
  }

  const accidentalBuyers = [...userAccess.entries()]
    .filter(([, value]) => value.via.has("revoke") && !value.via.has("keep"))
    .map(([id, value]) => ({ id, email: value.email }));

  const staffKept = [...userAccess.entries()]
    .filter(([, value]) => value.via.has("keep"))
    .map(([id, value]) => ({ id, email: value.email }));

  console.info(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        permission: TARGET_PERMISSION,
        roles: roleReport.map((row) => ({
          roleId: row.roleId,
          key: row.key,
          classification: row.classification,
          organizationId: row.organizationId,
          userCount: row.userCount,
        })),
        accidentalBuyerUsers: accidentalBuyers,
        staffKept,
        counts: {
          keepRoles: keepRoleIds.length,
          revokeRoles: revokeRoleIds.length,
          reviewRoles: reviewRoleIds.length,
          accidentalBuyers: accidentalBuyers.length,
          staffKept: staffKept.length,
        },
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.info(
      "[reconcile-buyer-communication-manage] dry-run only. Re-run with BUYER_REVOKE_COMMUNICATION_MANAGE=1 to strip buyer-default roles.",
    );
    await database.$disconnect();
    return;
  }

  const opsRoles = await database.role.findMany({
    where: { key: { in: [...OPS_ROLE_KEYS] } },
    select: { id: true, key: true },
  });
  if (opsRoles.length > 0) {
    const ensured = await database.rolePermission.createMany({
      data: opsRoles.map((role) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
    console.info(
      `[reconcile-buyer-communication-manage] ensured ${TARGET_PERMISSION} on ${ensured.count} ops role link(s)`,
    );
  }

  const stripRoleIds = [
    ...revokeRoleIds,
    ...(revokeUnknown ? reviewRoleIds : []),
  ];
  if (stripRoleIds.length > 0) {
    const deleted = await database.rolePermission.deleteMany({
      where: {
        permissionId: permission.id,
        roleId: { in: stripRoleIds },
      },
    });
    console.info(
      `[reconcile-buyer-communication-manage] removed ${TARGET_PERMISSION} from ${deleted.count} buyer-default/review role link(s)`,
    );
  } else {
    console.info(
      "[reconcile-buyer-communication-manage] no buyer-default communication:manage links to remove.",
    );
  }

  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
