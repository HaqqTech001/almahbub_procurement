/**
 * Reconcile accidental ops:access granted by the old buyer-registration default.
 *
 * Does NOT blindly revoke staff. Classification:
 *   keep   – role key is ops_admin / ops / operations (explicit Ops grant)
 *   revoke – buyer-default role key (org_admin / org_member / member / buyer / default)
 *            org_admin is created at public registration for the company owner.
 *   review – any other role still carrying ops:access (manual decision)
 *
 * Dry-run by default. Apply with:
 *   OPS_REVOKE_BUYER_OPS_ACCESS=1 corepack pnpm --filter @hamd/api exec tsx src/scripts/reconcile-ops-access.ts
 *
 * Optional:
 *   OPS_KEEP_EMAILS=ops@almahbub.com,staff@almahbub.com
 *     Users who would otherwise lose access are granted ops_admin instead.
 *   OPS_REVOKE_UNKNOWN_ROLES=1
 *     Also strip ops:access from "review" roles (use only after inspecting dry-run).
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import { DEFAULT_OPS_PERMISSIONS } from "../modules/identity/auth/domain/permission-catalog.js";

const BUYER_DEFAULT_ROLE_KEYS = new Set([
  "org_member",
  "org_admin",
  "member",
  "buyer",
  "default",
]);
const OPS_ROLE_KEYS = new Set(["ops_admin", "ops", "operations"]);

function parseEmailList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

function classifyRole(key: string): "keep" | "revoke" | "review" {
  const normalized = key.trim().toLowerCase();
  if (OPS_ROLE_KEYS.has(normalized)) return "keep";
  if (BUYER_DEFAULT_ROLE_KEYS.has(normalized)) return "revoke";
  return "review";
}

async function main(): Promise<void> {
  const apply = process.env.OPS_REVOKE_BUYER_OPS_ACCESS === "1";
  const revokeUnknown = process.env.OPS_REVOKE_UNKNOWN_ROLES === "1";
  const keepEmails = parseEmailList(process.env.OPS_KEEP_EMAILS);

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const permission = await database.permission.findFirst({
    where: { key: "ops:access" },
    select: { id: true, key: true },
  });
  if (!permission) {
    console.info("[reconcile-ops-access] no ops:access permission row; nothing to do.");
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

  const keepRoleIds = new Set(
    roleReport.filter((row) => row.classification === "keep").map((row) => row.roleId),
  );
  const revokeRoleIds = new Set(
    roleReport
      .filter((row) => row.classification === "revoke")
      .map((row) => row.roleId),
  );
  const reviewRoleIds = new Set(
    roleReport
      .filter((row) => row.classification === "review")
      .map((row) => row.roleId),
  );

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

  const accidental = [...userAccess.entries()]
    .filter(([, value]) => value.via.has("revoke") && !value.via.has("keep"))
    .map(([id, value]) => ({
      id,
      email: value.email,
      onlyReview: value.via.has("review"),
      keepListed: keepEmails.has(value.email.toLowerCase()),
    }));

  console.info(
    JSON.stringify(
      {
        mode: apply ? "apply" : "dry-run",
        roles: roleReport.map((row) => ({
          roleId: row.roleId,
          key: row.key,
          classification: row.classification,
          organizationId: row.organizationId,
          userCount: row.userCount,
        })),
        accidentalBuyerOpsUsers: accidental.map((row) => ({
          email: row.email,
          keepListed: row.keepListed,
          alsoHasReviewRole: row.onlyReview,
        })),
        counts: {
          keepRoles: keepRoleIds.size,
          revokeRoles: revokeRoleIds.size,
          reviewRoles: reviewRoleIds.size,
          accidentalUsers: accidental.length,
        },
      },
      null,
      2,
    ),
  );

  if (!apply) {
    console.info(
      "[reconcile-ops-access] dry-run only. Re-run with OPS_REVOKE_BUYER_OPS_ACCESS=1 to strip ops:access from buyer-default roles.",
    );
    await database.$disconnect();
    return;
  }

  const keepUsers = accidental.filter((row) => row.keepListed && !row.onlyReview);
  for (const user of keepUsers) {
    const membership = await database.organizationMembership.findFirst({
      where: { userId: user.id, status: "active" },
      orderBy: { createdAt: "asc" },
      select: { id: true, organizationId: true },
    });
    if (!membership) continue;

    let role = await database.role.findFirst({
      where: { organizationId: membership.organizationId, key: "ops_admin" },
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

    const opsPermissions = await database.permission.findMany({
      where: { key: { in: [...DEFAULT_OPS_PERMISSIONS] } },
      select: { id: true },
    });
    await database.rolePermission.createMany({
      data: opsPermissions.map((item) => ({
        roleId: role.id,
        permissionId: item.id,
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
    console.info(`[reconcile-ops-access] preserved ${user.email} via ops_admin`);
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
      `[reconcile-ops-access] removed ops:access from ${deleted.count} buyer-default/review role link(s)`,
    );
  } else {
    console.info("[reconcile-ops-access] no buyer-default ops:access links to remove.");
  }

  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
