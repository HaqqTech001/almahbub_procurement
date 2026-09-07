import type { Prisma } from "@hamd/database";
import type { DatabaseClient } from "../../../../shared/database/database-client.js";
import { resolvePermissionRows } from "../domain/permission-catalog.js";

/** Supabase pool latency needs more than Prisma's 5s interactive default. */
const AUTH_TX = { timeout: 20_000, maxWait: 10_000 } as const;

export interface AuthUser {
  readonly id: string;
  readonly email: string;
  readonly status: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string | null;
  readonly locale: string;
  readonly timeZone: string | null;
  readonly lastAuthenticatedAt: Date | null;
  readonly createdAt: Date;
  readonly emailVerifiedAt: Date | null;
  readonly tokenVersion: number;
  readonly credentials?: { readonly passwordHash: string; readonly algorithm: string } | null;
  readonly memberships: readonly {
    readonly id: string;
    readonly organizationId: string;
    readonly organization: { readonly displayName: string; readonly slug: string };
  }[];
}

const userLoginSelect = {
  id: true,
  email: true,
  status: true,
  firstName: true,
  lastName: true,
  displayName: true,
  locale: true,
  timeZone: true,
  lastAuthenticatedAt: true,
  createdAt: true,
  emailVerifiedAt: true,
  tokenVersion: true,
  credentials: { select: { passwordHash: true, algorithm: true } },
  memberships: {
    where: { status: "active" as const },
    select: {
      id: true,
      organizationId: true,
      organization: { select: { displayName: true, slug: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.UserSelect;

export class AuthRepository {
  public constructor(private readonly database: DatabaseClient) {}

  public findUserForLogin(email: string): Promise<AuthUser | null> {
    return this.database.user.findUnique({
      where: { email },
      select: userLoginSelect,
    });
  }

  public findAuthUserById(id: string): Promise<AuthUser | null> {
    return this.database.user.findUnique({
      where: { id },
      select: userLoginSelect,
    });
  }

  public findUserForLoginById(
    id: string,
  ): Promise<Omit<AuthUser, "credentials" | "memberships" | "tokenVersion"> | null> {
    return this.database.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        firstName: true,
        lastName: true,
        displayName: true,
        locale: true,
        timeZone: true,
        lastAuthenticatedAt: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
    });
  }

  public async findOrganizationDisplayName(
    organizationId: string,
  ): Promise<string | null> {
    const row = await this.database.organization.findFirst({
      where: { id: organizationId },
      select: { displayName: true },
    });
    return row?.displayName ?? null;
  }

  public findUserIdByEmail(email: string): Promise<{
    id: string;
    status: string;
    email: string;
    emailVerifiedAt: Date | null;
  } | null> {
    return this.database.user.findUnique({
      where: { email },
      select: {
        id: true,
        status: true,
        email: true,
        emailVerifiedAt: true,
      },
    });
  }

  public findActiveSession(
    refreshTokenHash: string,
  ): Promise<{
    readonly id: string;
    readonly userId: string;
    readonly familyId: string;
    readonly expiresAt: Date;
    readonly rememberDevice: boolean;
    readonly user: AuthUser;
  } | null> {
    return this.database.userSession.findFirst({
      where: {
        refreshTokenHash,
        status: "active",
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        rememberDevice: true,
        user: { select: userLoginSelect },
      },
    });
  }

  public async touchSession(sessionId: string): Promise<void> {
    await this.database.userSession.updateMany({
      where: { id: sessionId, status: "active" },
      data: { lastUsedAt: new Date() },
    });
  }

  public findSessionByRefreshHash(refreshTokenHash: string): Promise<{
    readonly id: string;
    readonly familyId: string;
    readonly status: string;
  } | null> {
    return this.database.userSession.findFirst({
      where: { refreshTokenHash },
      select: { id: true, familyId: true, status: true },
    });
  }

  public revokeSessionFamily(familyId: string): Promise<{ count: number }> {
    return this.database.userSession.updateMany({
      where: { familyId, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }

  public revokeAllUserSessions(userId: string): Promise<{ count: number }> {
    return this.database.userSession.updateMany({
      where: { userId, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }

  public async createSession(input: {
    userId: string;
    familyId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipHash?: string | undefined;
    userAgent?: string | undefined;
    deviceId?: string | undefined;
    rememberDevice?: boolean | undefined;
    authMethod?: string | undefined;
  }) {
    return this.database.userSession.create({
      data: {
        userId: input.userId,
        familyId: input.familyId,
        refreshTokenHash: input.refreshTokenHash,
        expiresAt: input.expiresAt,
        rememberDevice: input.rememberDevice ?? false,
        authMethod: input.authMethod ?? "password",
        ...(input.ipHash !== undefined ? { ipHash: input.ipHash } : {}),
        ...(input.userAgent !== undefined ? { userAgent: input.userAgent } : {}),
        ...(input.deviceId !== undefined ? { deviceId: input.deviceId } : {}),
      },
      select: { id: true },
    });
  }

  public async rotateSession(input: {
    sessionId: string;
    userId: string;
    familyId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    ipHash?: string | undefined;
    userAgent?: string | undefined;
  }) {
    return this.database.$transaction(async (transaction) => {
      const replacement = await transaction.userSession.create({
        data: {
          userId: input.userId,
          familyId: input.familyId,
          refreshTokenHash: input.refreshTokenHash,
          expiresAt: input.expiresAt,
          ...(input.ipHash !== undefined ? { ipHash: input.ipHash } : {}),
          ...(input.userAgent !== undefined ? { userAgent: input.userAgent } : {}),
          authMethod: "password",
        },
        select: { id: true },
      });
      const revoked = await transaction.userSession.updateMany({
        where: { id: input.sessionId, status: "active" },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          replacedBySessionId: replacement.id,
        },
      });

      if (revoked.count !== 1) {
        throw new Error("Refresh session was already rotated.");
      }

      return replacement;
    });
  }

  public revokeSession(id: string): Promise<{ count: number }> {
    return this.database.userSession.updateMany({
      where: { id, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }

  public revokeSessionForUser(
    sessionId: string,
    userId: string,
  ): Promise<{ count: number }> {
    return this.database.userSession.updateMany({
      where: { id: sessionId, userId, status: "active" },
      data: { status: "revoked", revokedAt: new Date() },
    });
  }

  public listSessions(userId: string) {
    return this.database.userSession.findMany({
      where: { userId, status: "active", expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      select: {
        id: true,
        familyId: true,
        authMethod: true,
        rememberDevice: true,
        userAgent: true,
        ipHash: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        device: {
          select: {
            id: true,
            name: true,
            platform: true,
            trustedAt: true,
            lastSeenAt: true,
          },
        },
      },
    });
  }

  public listDevices(userId: string) {
    return this.database.device.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        name: true,
        platform: true,
        fingerprint: true,
        trustedAt: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
  }

  public async upsertTrustedDevice(input: {
    userId: string;
    fingerprint: string;
    name?: string | undefined;
    platform?: string | undefined;
  }) {
    return this.database.device.upsert({
      where: {
        userId_fingerprint: {
          userId: input.userId,
          fingerprint: input.fingerprint,
        },
      },
      create: {
        userId: input.userId,
        fingerprint: input.fingerprint,
        name: input.name ?? "Trusted browser",
        platform: input.platform ?? null,
        trustedAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        lastSeenAt: new Date(),
        revokedAt: null,
        trustedAt: new Date(),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.platform !== undefined ? { platform: input.platform } : {}),
      },
      select: { id: true },
    });
  }

  public revokeDevice(userId: string, deviceId: string): Promise<{ count: number }> {
    return this.database.device.updateMany({
      where: { id: deviceId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public recordLoginEvent(input: {
    userId?: string | null | undefined;
    type: "sign_in" | "sign_out" | "sign_in_failed";
    outcome: "success" | "failure" | "blocked";
    ipHash?: string | undefined;
    userAgent?: string | undefined;
    metadata?: Prisma.InputJsonValue | undefined;
  }) {
    return this.database.loginEvent.create({
      data: {
        type: input.type,
        outcome: input.outcome,
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.ipHash !== undefined ? { ipHash: input.ipHash } : {}),
        ...(input.userAgent !== undefined ? { userAgent: input.userAgent } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
      },
      select: { id: true },
    });
  }

  public countRecentFailedLogins(
    userId: string,
    since: Date,
  ): Promise<number> {
    return this.database.loginEvent.count({
      where: {
        userId,
        type: "sign_in_failed",
        outcome: { in: ["failure", "blocked"] },
        createdAt: { gte: since },
      },
    });
  }

  public listLoginHistory(userId: string, take = 25) {
    return this.database.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        type: true,
        outcome: true,
        ipHash: true,
        userAgent: true,
        createdAt: true,
        metadata: true,
      },
    });
  }

  public async registerAccount(input: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    companyName: string;
    countryCode?: string | undefined;
    orgSlug: string;
    verificationTokenHash: string;
    verificationExpiresAt: Date;
    permissionKeys: readonly string[];
  }) {
    return this.database.$transaction(
      async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        return { duplicate: true as const };
      }

      const organization = await tx.organization.create({
        data: {
          legalName: input.companyName,
          displayName: input.companyName,
          slug: input.orgSlug,
          status: "pending",
          ...(input.countryCode
            ? { countryCode: input.countryCode.slice(0, 2).toUpperCase() }
            : {}),
        },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          status: "pending_verification",
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`.trim(),
          credentials: {
            create: {
              passwordHash: input.passwordHash,
              algorithm: "argon2id",
            },
          },
        },
        select: { id: true, email: true },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          status: "active",
          joinedAt: new Date(),
        },
        select: { id: true },
      });

      const role = await tx.role.create({
        data: {
          organizationId: organization.id,
          scope: "organization",
          key: "org_admin",
          name: "Organization admin",
          description: "Default owner role created at registration.",
        },
        select: { id: true },
      });

      const permissions = await ensurePermissions(tx, input.permissionKeys);
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: role.id,
        },
      });

      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          tokenHash: input.verificationTokenHash,
          expiresAt: input.verificationExpiresAt,
        },
      });

      return {
        duplicate: false as const,
        userId: user.id,
        email: user.email,
        organizationId: organization.id,
      };
    },
      { timeout: AUTH_TX.timeout, maxWait: AUTH_TX.maxWait },
    );
  }

  public async replaceEmailVerificationToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    await this.database.emailVerificationToken.updateMany({
      where: { userId: input.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return this.database.emailVerificationToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
  }

  public findEmailVerificationToken(tokenHash: string) {
    return this.database.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: { id: true, email: true, status: true, firstName: true },
        },
      },
    });
  }

  public async consumeEmailVerification(tokenId: string, userId: string) {
    return this.database.$transaction(async (tx) => {
      const used = await tx.emailVerificationToken.updateMany({
        where: { id: tokenId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) {
        return false;
      }
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "active",
          emailVerifiedAt: new Date(),
        },
      });
      await tx.organizationMembership.updateMany({
        where: { userId, status: "active" },
        data: {},
      });
      await tx.organization.updateMany({
        where: {
          status: "pending",
          memberships: { some: { userId } },
        },
        data: { status: "active" },
      });
      return true;
    }, AUTH_TX);
  }

  public async createPasswordResetToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    await this.database.passwordResetToken.updateMany({
      where: { userId: input.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return this.database.passwordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
  }

  public findPasswordResetToken(tokenHash: string) {
    return this.database.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { id: true, email: true, status: true } },
      },
    });
  }

  public async consumePasswordReset(input: {
    tokenId: string;
    userId: string;
    passwordHash: string;
  }) {
    return this.database.$transaction(async (tx) => {
      const used = await tx.passwordResetToken.updateMany({
        where: { id: input.tokenId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (used.count !== 1) {
        return false;
      }
      await tx.userCredential.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          passwordHash: input.passwordHash,
          algorithm: "argon2id",
        },
        update: {
          passwordHash: input.passwordHash,
          algorithm: "argon2id",
          rotatedAt: new Date(),
        },
      });
      await tx.user.update({
        where: { id: input.userId },
        data: { tokenVersion: { increment: 1 } },
      });
      await tx.userSession.updateMany({
        where: { userId: input.userId, status: "active" },
        data: { status: "revoked", revokedAt: new Date() },
      });
      return true;
    });
  }

  public updateProfile(
    userId: string,
    input: {
      firstName?: string | undefined;
      lastName?: string | undefined;
      displayName?: string | null | undefined;
      locale?: string | undefined;
      timeZone?: string | null | undefined;
    },
  ): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    locale: string;
    timeZone: string | null;
  }> {
    const data: Prisma.UserUpdateInput = {};
    if (input.firstName !== undefined) data.firstName = input.firstName;
    if (input.lastName !== undefined) data.lastName = input.lastName;
    if (input.displayName !== undefined) data.displayName = input.displayName;
    if (input.locale !== undefined) data.locale = input.locale;
    if (input.timeZone !== undefined) data.timeZone = input.timeZone;
    return this.database.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        locale: true,
        timeZone: true,
      },
    });
  }

  public getCredentials(userId: string): Promise<{
    passwordHash: string;
    algorithm: string;
  } | null> {
    return this.database.userCredential.findUnique({
      where: { userId },
      select: { passwordHash: true, algorithm: true },
    });
  }

  public async updatePasswordHash(
    userId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.database.userCredential.update({
      where: { userId },
      data: { passwordHash, algorithm: "argon2id", rotatedAt: new Date() },
    });
    await this.database.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  public async ensureUniqueOrgSlug(base: string): Promise<string> {
    let slug = base;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const existing = await this.database.organization.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
      slug = `${base}-${Math.floor(Math.random() * 90_000 + 10_000)}`;
    }
    return `${base}-${Date.now().toString(36)}`;
  }

  public findInvitationByTokenHash(tokenHash: string) {
    return this.database.organizationInvitation.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        email: true,
        status: true,
        expiresAt: true,
        acceptedAt: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            displayName: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
    });
  }

  public async createOrganizationInvitation(input: {
    organizationId: string;
    email: string;
    tokenHash: string;
    expiresAt: Date;
    createdById: string;
  }) {
    return this.database.organizationInvitation.upsert({
      where: {
        organizationId_email: {
          organizationId: input.organizationId,
          email: input.email,
        },
      },
      create: {
        organizationId: input.organizationId,
        email: input.email,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        createdById: input.createdById,
        status: "invited",
      },
      update: {
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        status: "invited",
        acceptedAt: null,
        createdById: input.createdById,
      },
      select: { id: true, email: true, expiresAt: true },
    });
  }

  public async acceptOrganizationInvitation(input: {
    invitationId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    permissionKeys: readonly string[];
  }) {
    return this.database.$transaction(async (tx) => {
      const claimed = await tx.organizationInvitation.updateMany({
        where: {
          id: input.invitationId,
          status: "invited",
          acceptedAt: null,
        },
        data: {
          status: "active",
          acceptedAt: new Date(),
        },
      });
      if (claimed.count !== 1) {
        return { ok: false as const };
      }

      const existing = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true, status: true },
      });
      if (existing) {
        return { ok: false as const, reason: "EMAIL_ALREADY_REGISTERED" as const };
      }

      const user = await tx.user.create({
        data: {
          email: input.email,
          status: "active",
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`.trim(),
          emailVerifiedAt: new Date(),
          credentials: {
            create: {
              passwordHash: input.passwordHash,
              algorithm: "argon2id",
            },
          },
        },
        select: {
          id: true,
          email: true,
          status: true,
          firstName: true,
          lastName: true,
          displayName: true,
          locale: true,
          timeZone: true,
          tokenVersion: true,
        },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          organizationId: input.organizationId,
          userId: user.id,
          status: "active",
          joinedAt: new Date(),
        },
        select: { id: true, organizationId: true },
      });

      const existingRole = await tx.role.findFirst({
        where: {
          organizationId: input.organizationId,
          key: "org_member",
        },
        select: { id: true },
      });
      const role =
        existingRole ??
        (await tx.role.create({
          data: {
            organizationId: input.organizationId,
            scope: "organization",
            key: "org_member",
            name: "Organization member",
            description: "Default role for invited members.",
          },
          select: { id: true },
        }));

      const permissions = await ensurePermissions(tx, input.permissionKeys);
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: role.id,
        },
      });

      return {
        ok: true as const,
        user,
        membership,
      };
    });
  }

  public findUserIdByIdentity(provider: string, providerSubject: string) {
    return this.database.userIdentityProvider.findUnique({
      where: {
        provider_providerSubject: { provider, providerSubject },
      },
      select: { userId: true },
    });
  }

  public linkIdentityProvider(input: {
    userId: string;
    provider: string;
    providerSubject: string;
    providerEmail: string;
    emailVerified: boolean;
  }) {
    return this.database.userIdentityProvider.upsert({
      where: {
        provider_providerSubject: {
          provider: input.provider,
          providerSubject: input.providerSubject,
        },
      },
      create: {
        userId: input.userId,
        provider: input.provider,
        providerSubject: input.providerSubject,
        providerEmail: input.providerEmail,
        emailVerified: input.emailVerified,
      },
      update: {
        providerEmail: input.providerEmail,
        emailVerified: input.emailVerified,
      },
      select: { id: true, userId: true },
    });
  }

  /**
   * Create an active buyer account from a verified Google identity (no password).
   */
  public async registerOAuthAccount(input: {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    orgSlug: string;
    provider: string;
    providerSubject: string;
    providerEmail: string;
    permissionKeys: readonly string[];
  }) {
    return this.database.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        return { duplicate: true as const, userId: existing.id };
      }

      const organization = await tx.organization.create({
        data: {
          legalName: input.companyName,
          displayName: input.companyName,
          slug: input.orgSlug,
          status: "active",
        },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email: input.email,
          status: "active",
          firstName: input.firstName,
          lastName: input.lastName,
          displayName: `${input.firstName} ${input.lastName}`.trim(),
          emailVerifiedAt: new Date(),
          lastAuthenticatedAt: new Date(),
          identities: {
            create: {
              provider: input.provider,
              providerSubject: input.providerSubject,
              providerEmail: input.providerEmail,
              emailVerified: true,
            },
          },
        },
        select: { id: true, email: true },
      });

      const membership = await tx.organizationMembership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          status: "active",
          joinedAt: new Date(),
        },
        select: { id: true },
      });

      const role = await tx.role.create({
        data: {
          organizationId: organization.id,
          scope: "organization",
          key: "org_admin",
          name: "Organization admin",
          description: "Default owner role created at Google registration.",
        },
        select: { id: true },
      });

      const permissions = await ensurePermissions(tx, input.permissionKeys);
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });

      await tx.membershipRole.create({
        data: {
          membershipId: membership.id,
          roleId: role.id,
        },
      });

      return {
        duplicate: false as const,
        userId: user.id,
        email: user.email,
        organizationId: organization.id,
      };
    },
      { timeout: AUTH_TX.timeout, maxWait: AUTH_TX.maxWait },
    );
  }

  public async activateVerifiedUser(userId: string): Promise<void> {
    await this.database.user.update({
      where: { id: userId },
      data: {
        status: "active",
        emailVerifiedAt: new Date(),
        lastAuthenticatedAt: new Date(),
      },
    });
    await this.database.organization.updateMany({
      where: {
        status: "pending",
        memberships: { some: { userId } },
      },
      data: { status: "active" },
    });
  }

  /**
   * Backfill permission catalog + attach missing keys to organization roles.
   * Safe to re-run; used when a database was migrated without seeding.
   */
  public async ensureRolePermissions(
    organizationId: string,
    permissionKeys: readonly string[],
  ): Promise<{ permissionsEnsured: number; roleLinksCreated: number }> {
    return this.database.$transaction(async (tx) => {
      const permissions = await ensurePermissions(tx, permissionKeys);
      const roles = await tx.role.findMany({
        where: { organizationId },
        select: { id: true },
      });
      let roleLinksCreated = 0;
      for (const role of roles) {
        const result = await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        });
        roleLinksCreated += result.count;
      }
      return {
        permissionsEnsured: permissions.length,
        roleLinksCreated,
      };
    });
  }
}

type PermissionWriter = {
  permission: {
    createMany: DatabaseClient["permission"]["createMany"];
    findMany: DatabaseClient["permission"]["findMany"];
  };
};

async function ensurePermissions(
  tx: PermissionWriter,
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
    throw new Error(
      `Failed to resolve permissions after upsert: ${missing.join(", ")}`,
    );
  }

  return permissions;
}
