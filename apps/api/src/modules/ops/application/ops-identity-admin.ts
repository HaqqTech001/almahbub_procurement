import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { AppError } from "../../../lib/app-error.js";
import {
  DEFAULT_BUYER_PERMISSIONS,
  DEFAULT_OPS_PERMISSIONS,
} from "../../identity/auth/domain/permission-catalog.js";

export const OPS_ADMIN_ROLE_KEYS = ["ops_admin", "ops", "operations"] as const;

export const USER_ACCOUNT_STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "deactivated",
] as const;

export type UserAccountStatus = (typeof USER_ACCOUNT_STATUSES)[number];
export type UserAccountStatusCommand = "suspend" | "activate" | "deactivate";
export type UserOpsAccessCommand = "grant" | "revoke";

export type UserAccountStatusInput = {
  command: UserAccountStatusCommand;
  reason?: string | undefined;
};

export type UserOpsAccessInput = {
  command: UserOpsAccessCommand;
};

function conflict(message: string, code = "CONFLICT"): AppError {
  return new AppError({ statusCode: 409, code, message });
}

function notFound(message: string): AppError {
  return new AppError({ statusCode: 404, code: "NOT_FOUND", message });
}

function badRequest(message: string, code = "VALIDATION_ERROR"): AppError {
  return new AppError({ statusCode: 400, code, message });
}

function memberHasOpsRole(keys: readonly string[]): boolean {
  return keys.some((key) =>
    (OPS_ADMIN_ROLE_KEYS as readonly string[]).includes(key),
  );
}

export function isUserAccountStatus(value: string): value is UserAccountStatus {
  return (USER_ACCOUNT_STATUSES as readonly string[]).includes(value);
}

export class OpsIdentityAdmin {
  public constructor(private readonly database: DatabaseClient) {}

  public async updateAccountStatus(
    context: AuthContext,
    userId: string,
    input: UserAccountStatusInput,
  ) {
    if (context.userId === userId) {
      throw badRequest(
        "You cannot change the account status of your own user.",
        "SELF_STATUS_CHANGE_FORBIDDEN",
      );
    }

    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!user) throw notFound("User not found.");

    const nextStatus = this.resolveNextStatus(user.status, input.command);
    if (nextStatus !== "active") {
      await this.assertNotLastActiveOpsAdmin(userId);
    }

    const now = new Date();
    const revokeSessions = nextStatus === "suspended" || nextStatus === "deactivated";

    await this.database.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: nextStatus,
          ...(revokeSessions ? { tokenVersion: { increment: 1 } } : {}),
        },
      });
      if (revokeSessions) {
        await tx.userSession.updateMany({
          where: { userId, status: "active" },
          data: { status: "revoked", revokedAt: now },
        });
      }
      await tx.auditEvent.create({
        data: {
          organizationId: context.organizationId,
          actorId: context.userId,
          action: `ops.identity.user.${input.command}`,
          resourceType: "user",
          resourceId: userId,
          metadata: {
            before: { status: user.status },
            after: { status: nextStatus },
            reason: input.reason?.trim() || null,
            email: user.email,
          },
        },
      });
    });

    return this.loadMemberSnapshot(userId);
  }

  public async updateOpsAccess(
    context: AuthContext,
    userId: string,
    input: UserOpsAccessInput,
  ) {
    if (context.userId === userId) {
      throw badRequest(
        "You cannot grant or revoke your own operations access.",
        "SELF_ROLE_CHANGE_FORBIDDEN",
      );
    }

    const user = await this.database.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true },
    });
    if (!user) throw notFound("User not found.");

    const membershipInclude = {
      roles: { include: { role: { select: { id: true, key: true } } } },
    } as const;
    const preferred =
      (await this.database.organizationMembership.findFirst({
        where: {
          userId,
          organizationId: context.organizationId,
          status: { in: ["active", "invited"] },
        },
        include: membershipInclude,
      })) ??
      (await this.database.organizationMembership.findFirst({
        where: { userId, status: { in: ["active", "invited"] } },
        orderBy: { createdAt: "asc" },
        include: membershipInclude,
      }));
    if (!preferred) {
      throw notFound("User has no organization membership.");
    }

    const currentKeys = preferred.roles.map((link) => link.role.key);
    const currentlyOps = memberHasOpsRole(currentKeys);

    if (input.command === "grant" && currentlyOps) {
      throw conflict("This user already has operations access.");
    }
    if (input.command === "revoke" && !currentlyOps) {
      throw conflict("This user does not have operations access.");
    }
    if (input.command === "revoke") {
      await this.assertNotLastActiveOpsAdmin(userId);
    }

    if (input.command === "grant") {
      const roleId = await this.ensureOpsAdminRole(preferred.organizationId);
      await this.database.membershipRole.upsert({
        where: {
          membershipId_roleId: {
            membershipId: preferred.id,
            roleId,
          },
        },
        update: {},
        create: { membershipId: preferred.id, roleId },
      });
    } else {
      const opsRoles = await this.database.role.findMany({
        where: {
          organizationId: preferred.organizationId,
          key: { in: [...OPS_ADMIN_ROLE_KEYS] },
        },
        select: { id: true },
      });
      if (opsRoles.length > 0) {
        await this.database.membershipRole.deleteMany({
          where: {
            membershipId: preferred.id,
            roleId: { in: opsRoles.map((role) => role.id) },
          },
        });
      }
      await this.ensureBuyerRole(preferred.id, preferred.organizationId);
    }

    await this.database.auditEvent.create({
      data: {
        organizationId: context.organizationId,
        actorId: context.userId,
        action: `ops.identity.user.ops_access.${input.command}`,
        resourceType: "user",
        resourceId: userId,
        metadata: {
          before: { roles: currentKeys },
          after: { command: input.command },
          membershipId: preferred.id,
          organizationId: preferred.organizationId,
          email: user.email,
        },
      },
    });

    return this.loadMemberSnapshot(userId);
  }

  private resolveNextStatus(
    current: string,
    command: UserAccountStatusCommand,
  ): UserAccountStatus {
    if (command === "suspend") {
      if (current !== "active") {
        throw conflict("Only an active account can be suspended.");
      }
      return "suspended";
    }
    if (command === "activate") {
      if (current === "pending_verification") {
        throw badRequest(
          "Pending accounts must verify email. Activation cannot skip verification.",
          "EMAIL_VERIFICATION_REQUIRED",
        );
      }
      if (current !== "suspended" && current !== "deactivated") {
        throw conflict("Only a suspended or deactivated account can be activated.");
      }
      return "active";
    }
    if (
      current !== "active" &&
      current !== "suspended" &&
      current !== "pending_verification"
    ) {
      throw conflict("This account is already deactivated.");
    }
    return "deactivated";
  }

  private async assertNotLastActiveOpsAdmin(userId: string): Promise<void> {
    const rows = await this.database.membershipRole.findMany({
      where: {
        role: { key: { in: [...OPS_ADMIN_ROLE_KEYS] } },
        membership: {
          status: "active",
          user: { status: "active" },
        },
      },
      select: { membership: { select: { userId: true } } },
    });
    const unique = new Set(rows.map((row) => row.membership.userId));
    if (unique.size === 1 && unique.has(userId)) {
      throw conflict(
        "Cannot remove or disable the last operations administrator.",
        "LAST_OPS_ADMIN",
      );
    }
  }

  private async ensureOpsAdminRole(organizationId: string): Promise<string> {
    const opsPermissions = await this.database.permission.findMany({
      where: { key: { in: [...DEFAULT_OPS_PERMISSIONS] } },
      select: { id: true },
    });
    if (opsPermissions.length !== DEFAULT_OPS_PERMISSIONS.length) {
      throw new AppError({
        statusCode: 503,
        code: "PERMISSION_CATALOG_INCOMPLETE",
        message: "Operations permission catalog is incomplete.",
      });
    }

    let role = await this.database.role.findFirst({
      where: { organizationId, key: "ops_admin" },
      select: { id: true },
    });
    if (!role) {
      role = await this.database.role.create({
        data: {
          organizationId,
          scope: "organization",
          key: "ops_admin",
          name: "Operations admin",
          description: "Production operations console access.",
        },
        select: { id: true },
      });
    }
    await this.database.rolePermission.createMany({
      data: opsPermissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
    return role.id;
  }

  private async ensureBuyerRole(
    membershipId: string,
    organizationId: string,
  ): Promise<void> {
    let role = await this.database.role.findFirst({
      where: { organizationId, key: "buyer" },
      select: { id: true },
    });
    if (!role) {
      const buyerPermissions = await this.database.permission.findMany({
        where: { key: { in: [...DEFAULT_BUYER_PERMISSIONS] } },
        select: { id: true },
      });
      role = await this.database.role.create({
        data: {
          organizationId,
          scope: "organization",
          key: "buyer",
          name: "Buyer",
          description: "Buyer workspace access.",
        },
        select: { id: true },
      });
      if (buyerPermissions.length > 0) {
        await this.database.rolePermission.createMany({
          data: buyerPermissions.map((permission) => ({
            roleId: role!.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
      }
    }
    await this.database.membershipRole.upsert({
      where: {
        membershipId_roleId: { membershipId, roleId: role.id },
      },
      update: {},
      create: { membershipId, roleId: role.id },
    });
  }

  private async loadMemberSnapshot(userId: string) {
    const membership = await this.database.organizationMembership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: {
        user: true,
        organization: true,
        roles: { include: { role: true } },
      },
    });
    if (!membership) throw notFound("User membership not found.");
    const roleKeys = membership.roles.map((link) => link.role.key);
    return {
      id: membership.id,
      userId: membership.userId,
      status: membership.status,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      displayName: membership.user.displayName,
      userStatus: membership.user.status,
      lastAuthenticatedAt:
        membership.user.lastAuthenticatedAt?.toISOString() ?? null,
      organizationId: membership.organizationId,
      organizationName:
        membership.organization.displayName || membership.organization.legalName,
      organizationSlug: membership.organization.slug,
      roles: membership.roles.map((link) => ({
        id: link.role.id,
        key: link.role.key,
        name: link.role.name,
      })),
      hasOpsAccess: memberHasOpsRole(roleKeys),
      createdAt: membership.createdAt.toISOString(),
    };
  }
}
