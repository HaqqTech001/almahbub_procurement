import type { Environment } from "../../../../config/env.js";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { hashPassword, slugifyOrg } from "./auth-crypto.js";
import { checkDatabaseBeforeBootstrap } from "../../../../composition/database-startup.js";
import {
  DEFAULT_OPS_PERMISSIONS,
  resolvePermissionRows,
} from "../domain/permission-catalog.js";

export type AdminBootstrapResult = {
  created: boolean;
  email: string;
  userId: string;
  organizationId: string;
  roleId: string;
};

export async function ensureAdminBootstrap(
  database: DatabaseClient,
  environment: Environment,
): Promise<AdminBootstrapResult | null> {
  const email = environment.ADMIN_EMAIL?.trim().toLowerCase();
  const password = environment.ADMIN_PASSWORD;
  const name = environment.ADMIN_NAME?.trim();

  if (!email || !password || !name) {
    return null;
  }

  // Warm/verify the connection before acquiring a transaction. Otherwise the
  // pool connection timeout races Prisma's maxWait and masks it as P2028.
  await checkDatabaseBeforeBootstrap(() => database.$queryRaw`SELECT 1`);

  const [rawFirstName, ...rest] = name.split(/\s+/);
  const firstName = rawFirstName?.trim() || name;
  const lastName = rest.join(" ") || "Admin";
  const passwordHash = await hashPassword(password);

  return database.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    const organization = await tx.organization.upsert({
      where: { slug: slugifyOrg("Almahbub Admin") },
      create: {
        legalName: "Almahbub Admin",
        displayName: "Almahbub Admin",
        slug: slugifyOrg("Almahbub Admin"),
        status: "active",
      },
      update: {
        legalName: "Almahbub Admin",
        displayName: "Almahbub Admin",
        status: "active",
      },
      select: { id: true },
    });

    const user =
      existingUser ??
      (await tx.user.create({
        data: {
          email,
          status: "active",
          firstName,
          lastName,
          displayName: name,
          emailVerifiedAt: new Date(),
          lastAuthenticatedAt: new Date(),
          credentials: {
            create: {
              passwordHash,
              algorithm: "argon2id",
            },
          },
        },
        select: { id: true, email: true, status: true },
      }));

    if (existingUser) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: "active",
          firstName,
          lastName,
          displayName: name,
          emailVerifiedAt: new Date(),
          lastAuthenticatedAt: new Date(),
        },
      });
    }

    await tx.userCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        passwordHash,
        algorithm: "argon2id",
      },
      update: {
        passwordHash,
        algorithm: "argon2id",
        rotatedAt: new Date(),
      },
    });

    const membership = await tx.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      create: {
        organizationId: organization.id,
        userId: user.id,
        status: "active",
        joinedAt: new Date(),
      },
      update: {
        status: "active",
        joinedAt: new Date(),
      },
      select: { id: true },
    });

    let role = await tx.role.findFirst({
      where: {
        organizationId: organization.id,
        key: "ops_admin",
      },
      select: { id: true },
    });

    if (!role) {
      role = await tx.role.create({
        data: {
          organizationId: organization.id,
          scope: "organization",
          key: "ops_admin",
          name: "Operations admin",
          description: "Platform bootstrap administrator.",
        },
        select: { id: true },
      });
    }

    const permissions = await ensurePermissions(tx, DEFAULT_OPS_PERMISSIONS);
    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    await tx.membershipRole.upsert({
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

    return {
      created: !existingUser,
      email,
      userId: user.id,
      organizationId: organization.id,
      roleId: role.id,
    } satisfies AdminBootstrapResult;
  }, { timeout: 20_000, maxWait: 10_000 });
}

async function ensurePermissions(
  tx: {
    permission: {
      createMany: DatabaseClient["permission"]["createMany"];
      findMany: DatabaseClient["permission"]["findMany"];
    };
  },
  permissionKeys: readonly string[],
): Promise<Array<{ id: string; key: string }>> {
  const rows = resolvePermissionRows(permissionKeys);
  await tx.permission.createMany({
    data: rows.map((row) => ({
      key: row.key,
      resource: row.resource,
      action: row.action,
    })),
    skipDuplicates: true,
  });

  const permissions = await tx.permission.findMany({
    where: { key: { in: [...permissionKeys] } },
    select: { id: true, key: true },
  });

  if (permissions.length !== permissionKeys.length) {
    const found = new Set(permissions.map((permission) => permission.key));
    const missing = permissionKeys.filter((key) => !found.has(key));
    throw new Error(`Failed to resolve permissions after upsert: ${missing.join(", ")}`);
  }

  return permissions;
}
