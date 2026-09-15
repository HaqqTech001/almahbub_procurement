import { randomUUID } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "../../../../config/env.js";
import { passwordLockUntil } from "./password-lockout.js";
import { AuthService } from "./auth-service.js";
import type { AuthRepository } from "../infrastructure/auth-repository.js";

const environment = parseEnvironment({
  NODE_ENV: "test",
  JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
  JWT_ISSUER: "hamd-api",
  JWT_AUDIENCE: "hamd-client",
  ACCESS_TOKEN_TTL_SECONDS: "900",
  REFRESH_TOKEN_TTL_SECONDS: "2592000",
  AUTH_LOCKOUT_THRESHOLD: "3",
  AUTH_LOCKOUT_WINDOW_SECONDS: "900",
  APP_PUBLIC_URL: "http://localhost:5173",
});

type StoredUser = {
  id: string;
  email: string;
  status: string;
  emailVerifiedAt: Date | null;
  firstName: string;
  lastName: string;
  displayName: string | null;
  locale: string;
  timeZone: string | null;
  tokenVersion: number;
  passwordHash: string;
  organizationId: string;
  membershipId: string;
};

type StoredSession = {
  id: string;
  userId: string;
  familyId: string;
  refreshTokenHash: string;
  status: string;
  expiresAt: Date;
  authMethod: string;
  rememberDevice: boolean;
  userAgent: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  deviceId: string | null;
};

function createMemoryRepository() {
  const users = new Map<string, StoredUser>();
  const usersByEmail = new Map<string, string>();
  const verification = new Map<
    string,
    {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      usedAt: Date | null;
    }
  >();
  const resets = new Map<
    string,
    {
      id: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      usedAt: Date | null;
    }
  >();
  const sessions = new Map<string, StoredSession>();
  const devices = new Map<
    string,
    {
      id: string;
      userId: string;
      fingerprint: string;
      name: string | null;
      platform: string | null;
      trustedAt: Date | null;
      lastSeenAt: Date;
      createdAt: Date;
      revokedAt: Date | null;
    }
  >();
  const loginEvents: Array<{
    id: string;
    userId?: string;
    type: string;
    outcome: string;
    createdAt: Date;
    userAgent?: string;
  }> = [];

  const toAuthUser = (user: StoredUser) => ({
    id: user.id,
    email: user.email,
    status: user.status,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    locale: user.locale,
    timeZone: user.timeZone,
    tokenVersion: user.tokenVersion,
    credentials: { passwordHash: user.passwordHash, algorithm: "argon2id" },
    memberships: [
      {
        id: user.membershipId,
        organizationId: user.organizationId,
        organization: { displayName: "Org", slug: "org" },
      },
    ],
  });

  return {
    ensureUniqueOrgSlug: vi.fn(async (base: string) => base),
    registerAccount: vi.fn(async (input) => {
      if (usersByEmail.has(input.email)) {
        return { duplicate: true as const };
      }
      const userId = randomUUID();
      const organizationId = randomUUID();
      const membershipId = randomUUID();
      const user: StoredUser = {
        id: userId,
        email: input.email,
        status: "pending_verification",
        emailVerifiedAt: null,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`,
        locale: "en",
        timeZone: null,
        tokenVersion: 0,
        passwordHash: input.passwordHash,
        organizationId,
        membershipId,
      };
      users.set(userId, user);
      usersByEmail.set(input.email, userId);
      verification.set(input.verificationTokenHash, {
        id: randomUUID(),
        userId,
        tokenHash: input.verificationTokenHash,
        expiresAt: input.verificationExpiresAt,
        usedAt: null,
      });
      return {
        duplicate: false as const,
        userId,
        email: input.email,
        organizationId,
      };
    }),
    findUserIdByEmail: vi.fn(async (email: string) => {
      const id = usersByEmail.get(email);
      if (!id) return null;
      const user = users.get(id)!;
      return {
        id: user.id,
        status: user.status,
        email: user.email,
        emailVerifiedAt: user.emailVerifiedAt,
      };
    }),
    replaceEmailVerificationToken: vi.fn(async (input) => {
      for (const [hash, row] of verification) {
        if (row.userId === input.userId && !row.usedAt) {
          verification.set(hash, { ...row, usedAt: new Date() });
        }
      }
      verification.set(input.tokenHash, {
        id: randomUUID(),
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: null,
      });
      return { id: randomUUID() };
    }),
    findEmailVerificationToken: vi.fn(async (tokenHash: string) => {
      const row = verification.get(tokenHash);
      if (!row) return null;
      const user = users.get(row.userId)!;
      return {
        id: row.id,
        userId: row.userId,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
        user: {
          id: user.id,
          email: user.email,
          status: user.status,
          firstName: user.firstName,
        },
      };
    }),
    consumeEmailVerification: vi.fn(async (tokenId: string, userId: string) => {
      const entry = [...verification.values()].find((row) => row.id === tokenId);
      if (!entry || entry.usedAt) return false;
      entry.usedAt = new Date();
      const user = users.get(userId)!;
      user.status = "active";
      user.emailVerifiedAt = new Date();
      return true;
    }),
    createPasswordResetToken: vi.fn(async (input) => {
      for (const [hash, row] of resets) {
        if (row.userId === input.userId && !row.usedAt) {
          resets.set(hash, { ...row, usedAt: new Date() });
        }
      }
      resets.set(input.tokenHash, {
        id: randomUUID(),
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: null,
      });
      return { id: randomUUID() };
    }),
    findPasswordResetToken: vi.fn(async (tokenHash: string) => {
      const row = resets.get(tokenHash);
      if (!row) return null;
      const user = users.get(row.userId)!;
      return {
        id: row.id,
        userId: row.userId,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
        user: { id: user.id, email: user.email, status: user.status },
      };
    }),
    consumePasswordReset: vi.fn(async (input) => {
      const entry = [...resets.values()].find((row) => row.id === input.tokenId);
      if (!entry || entry.usedAt) return false;
      entry.usedAt = new Date();
      const user = users.get(input.userId)!;
      user.passwordHash = input.passwordHash;
      user.tokenVersion += 1;
      for (const session of sessions.values()) {
        if (session.userId === input.userId && session.status === "active") {
          session.status = "revoked";
        }
      }
      return true;
    }),
    findUserForLogin: vi.fn(async (email: string) => {
      const id = usersByEmail.get(email);
      if (!id) return null;
      return toAuthUser(users.get(id)!);
    }),
    findUserForLoginById: vi.fn(async (id: string) => {
      const user = users.get(id);
      if (!user) return null;
      return {
        id: user.id,
        email: user.email,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        locale: user.locale,
        timeZone: user.timeZone,
      };
    }),
    findOrganizationDisplayName: vi.fn(async () => "Org"),
    checkPasswordAttempt: vi.fn(async (input) => {
      const now = new Date();
      const events = loginEvents.filter((event) => event.userId === input.userId);
      const reset = events.findLastIndex((event) => event.type === "sign_in" && event.outcome === "success");
      const failures = events.slice(reset + 1).filter((event) => event.type === "sign_in_failed" && event.outcome === "failure");
      const lockedUntil = passwordLockUntil(failures.map((event) => event.createdAt), now, input.threshold, input.windowSeconds);
      if (!input.passwordValid || lockedUntil) loginEvents.push({ id: randomUUID(), userId: input.userId, type: "sign_in_failed", outcome: lockedUntil ? "blocked" : "failure", createdAt: now });
      return { lockedUntil, now };
    }),
    recordLoginEvent: vi.fn(async (input) => {
      loginEvents.push({
        id: randomUUID(),
        ...(input.userId ? { userId: input.userId } : {}),
        type: input.type,
        outcome: input.outcome,
        createdAt: new Date(),
        ...(input.userAgent ? { userAgent: input.userAgent } : {}),
      });
      return { id: randomUUID() };
    }),
    upsertTrustedDevice: vi.fn(async (input) => {
      const existing = [...devices.values()].find(
        (device) =>
          device.userId === input.userId &&
          device.fingerprint === input.fingerprint &&
          !device.revokedAt,
      );
      if (existing) {
        existing.lastSeenAt = new Date();
        existing.trustedAt = new Date();
        return { id: existing.id };
      }
      const id = randomUUID();
      devices.set(id, {
        id,
        userId: input.userId,
        fingerprint: input.fingerprint,
        name: input.name ?? "Trusted browser",
        platform: input.platform ?? null,
        trustedAt: new Date(),
        lastSeenAt: new Date(),
        createdAt: new Date(),
        revokedAt: null,
      });
      return { id };
    }),
    createSession: vi.fn(async (input) => {
      const id = randomUUID();
      const now = new Date();
      sessions.set(id, {
        id,
        userId: input.userId,
        familyId: input.familyId,
        refreshTokenHash: input.refreshTokenHash,
        status: "active",
        expiresAt: input.expiresAt,
        authMethod: "password",
        rememberDevice: input.rememberDevice ?? false,
        userAgent: input.userAgent ?? null,
        createdAt: now,
        lastUsedAt: now,
        deviceId: input.deviceId ?? null,
      });
      return { id };
    }),
    findActiveSession: vi.fn(async (refreshTokenHash: string) => {
      const session = [...sessions.values()].find(
        (row) =>
          row.refreshTokenHash === refreshTokenHash &&
          row.status === "active" &&
          row.expiresAt > new Date(),
      );
      if (!session) return null;
      return {
        id: session.id,
        userId: session.userId,
        familyId: session.familyId,
        expiresAt: session.expiresAt,
        user: toAuthUser(users.get(session.userId)!),
      };
    }),
    findSessionByRefreshHash: vi.fn(async (refreshTokenHash: string) => {
      const session = [...sessions.values()].find(
        (row) => row.refreshTokenHash === refreshTokenHash,
      );
      if (!session) return null;
      return {
        id: session.id,
        familyId: session.familyId,
        status: session.status,
      };
    }),
    touchSession: vi.fn(async () => undefined),
    rotateSession: vi.fn(async (input) => {
      const current = sessions.get(input.sessionId);
      if (!current || current.status !== "active") {
        throw new Error("Refresh session was already rotated.");
      }
      current.status = "revoked";
      const id = randomUUID();
      const now = new Date();
      sessions.set(id, {
        id,
        userId: input.userId,
        familyId: input.familyId,
        refreshTokenHash: input.refreshTokenHash,
        status: "active",
        expiresAt: input.expiresAt,
        authMethod: "password",
        rememberDevice: false,
        userAgent: input.userAgent ?? null,
        createdAt: now,
        lastUsedAt: now,
        deviceId: null,
      });
      return { id };
    }),
    revokeSessionFamily: vi.fn(async (familyId: string) => {
      let count = 0;
      for (const session of sessions.values()) {
        if (session.familyId === familyId && session.status === "active") {
          session.status = "revoked";
          count += 1;
        }
      }
      return { count };
    }),
    revokeSession: vi.fn(async (id: string) => {
      const session = sessions.get(id);
      if (!session || session.status !== "active") return { count: 0 };
      session.status = "revoked";
      return { count: 1 };
    }),
    revokeAllUserSessions: vi.fn(async (userId: string) => {
      let count = 0;
      for (const session of sessions.values()) {
        if (session.userId === userId && session.status === "active") {
          session.status = "revoked";
          count += 1;
        }
      }
      return { count };
    }),
    listSessions: vi.fn(async (userId: string) =>
      [...sessions.values()]
        .filter(
          (session) =>
            session.userId === userId &&
            session.status === "active" &&
            session.expiresAt > new Date(),
        )
        .map((session) => ({
          ...session,
          device: session.deviceId ? (devices.get(session.deviceId) ?? null) : null,
        })),
    ),
    revokeSessionForUser: vi.fn(async (sessionId: string, userId: string) => {
      const session = sessions.get(sessionId);
      if (!session || session.userId !== userId || session.status !== "active") {
        return { count: 0 };
      }
      session.status = "revoked";
      return { count: 1 };
    }),
    listDevices: vi.fn(async (userId: string) =>
      [...devices.values()].filter(
        (device) => device.userId === userId && !device.revokedAt,
      ),
    ),
    revokeDevice: vi.fn(async (userId: string, deviceId: string) => {
      const device = devices.get(deviceId);
      if (!device || device.userId !== userId || device.revokedAt) {
        return { count: 0 };
      }
      device.revokedAt = new Date();
      return { count: 1 };
    }),
    listLoginHistory: vi.fn(async (userId: string) =>
      loginEvents
        .filter((event) => event.userId === userId)
        .map((event) => ({
          id: event.id,
          type: event.type,
          outcome: event.outcome,
          userAgent: event.userAgent ?? null,
          createdAt: event.createdAt,
          ipHash: null,
          metadata: null,
        })),
    ),
    updateProfile: vi.fn(),
    findInvitationByTokenHash: vi.fn(),
    createOrganizationInvitation: vi.fn(),
    acceptOrganizationInvitation: vi.fn(),
    findUserIdByIdentity: vi.fn(async () => null),
    linkIdentityProvider: vi.fn(),
    registerOAuthAccount: vi.fn(),
    activateVerifiedUser: vi.fn(),
    findAuthUserById: vi.fn(async (id: string) => {
      const user = users.get(id);
      return user ? toAuthUser(user) : null;
    }),
  } as unknown as AuthRepository;
}

function captureCodes(send: ReturnType<typeof vi.fn>) {
  return {
    otp(): string {
      for (const call of send.mock.calls as Array<[{ text: string }]>) {
        const text = call[0]?.text ?? "";
        const match =
          text.match(/Verification code: (\d{6})/) ??
          text.match(/code is (\d{6})/);
        if (match) return match[1]!;
      }
      throw new Error("OTP not found in mailbox");
    },
    resetToken(): string {
      for (const call of send.mock.calls as Array<[{ text: string }]>) {
        const match = (call[0]?.text ?? "").match(/reset-password\/([^\s]+)/);
        if (match) return decodeURIComponent(match[1]!);
      }
      throw new Error("Reset token not found in mailbox");
    },
  };
}

describe("AuthService user lifecycle", () => {
  it(
    "completes register → verify → login → refresh → forgot/reset → login → logout → logout everywhere",
    async () => {
    const repository = createMemoryRepository();
    const email = {
      send: vi.fn(async () => ({ providerMessageId: "mail-1" })),
    };
    const codes = captureCodes(email.send);
    const service = new AuthService(repository, environment, email);

    const registered = await service.register({
      email: "buyer@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Procurement",
    });
    expect(registered.status).toBe("pending_verification");
    const grantedKeys = (
      repository.registerAccount as ReturnType<typeof vi.fn>
    ).mock.calls[0]?.[0]?.permissionKeys as string[] | undefined;
    expect(grantedKeys).toBeDefined();
    expect(grantedKeys).not.toContain("ops:access");
    expect(grantedKeys).not.toContain("communication:manage");
    expect(grantedKeys).not.toContain("cms:manage");
    expect(grantedKeys).not.toContain("quotation:review");

    await expect(
      service.login({
        email: "buyer@example.com",
        password: "SecurePass1",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });

    const verified = await service.verifyEmail(codes.otp());
    expect(verified.status).toBe("active");

    const login = await service.login({
      email: "buyer@example.com",
      password: "SecurePass1",
      rememberMe: true,
      deviceFingerprint: "device-fingerprint-abc",
      deviceName: "Chrome",
      devicePlatform: "Win32",
    });
    expect(login.accessToken).toBeTruthy();
    expect(login.refreshToken).toBeTruthy();

    const refreshed = await service.refresh({
      refreshToken: login.refreshToken,
    });
    expect(refreshed.refreshToken).toBe(login.refreshToken);

    const refreshedAgain = await service.refresh({
      refreshToken: login.refreshToken,
    });
    expect(refreshedAgain.refreshToken).toBe(login.refreshToken);

    await service.forgotPassword("buyer@example.com");
    const reset = await service.resetPassword({
      token: codes.resetToken(),
      password: "NewSecurePass2",
    });
    expect(reset.message).toMatch(/Password updated/i);

    await expect(
      service.refresh({ refreshToken: refreshed.refreshToken }),
    ).rejects.toMatchObject({ code: "INVALID_REFRESH_TOKEN" });

    const loginAgain = await service.login({
      email: "buyer@example.com",
      password: "NewSecurePass2",
    });

    const active = await service.listSessions(
      loginAgain.user.id,
      "placeholder",
    );
    expect(active.length).toBeGreaterThan(0);
    await service.logout(active[0]!.id, loginAgain.user.id);

    const second = await service.login({
      email: "buyer@example.com",
      password: "NewSecurePass2",
    });
    await service.logoutEverywhere(second.user.id);
    await expect(
      service.refresh({ refreshToken: second.refreshToken }),
    ).rejects.toMatchObject({ code: "INVALID_REFRESH_TOKEN" });

    const genericForgot = await service.forgotPassword("missing@example.com");
    expect(genericForgot.message).toMatch(/If an account exists/i);

    await expect(
      service.register({
        email: "buyer@example.com",
        password: "SecurePass1",
        firstName: "Ada",
        lastName: "Buyer",
        companyName: "Ada Procurement",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_ALREADY_REGISTERED" });
  },
  30_000,
  );

  it("binds OTP to the intended email and rejects reuse", async () => {
    const repository = createMemoryRepository();
    const email = {
      send: vi.fn(async () => ({ providerMessageId: "mail-1" })),
    };
    const codes = captureCodes(email.send);
    const service = new AuthService(repository, environment, email);

    await service.register({
      email: "buyer@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Procurement",
    });
    const otp = codes.otp();

    await expect(
      service.verifyEmail(otp, "other@example.com"),
    ).rejects.toMatchObject({ code: "INVALID_VERIFICATION_TOKEN" });

    await service.verifyEmail(otp, "buyer@example.com");
    await expect(service.verifyEmail(otp, "buyer@example.com")).rejects.toMatchObject({
      code: "INVALID_VERIFICATION_TOKEN",
    });
  });

  it("rejects an expired verification OTP", async () => {
    const repository = createMemoryRepository();
    const email = {
      send: vi.fn(async () => ({ providerMessageId: "mail-1" })),
    };
    const codes = captureCodes(email.send);
    const service = new AuthService(repository, environment, email);

    await service.register({
      email: "expire@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Procurement",
    });
    const otp = codes.otp();
    const find = repository.findEmailVerificationToken as ReturnType<typeof vi.fn>;
    const impl = find.getMockImplementation() as (
      tokenHash: string,
    ) => Promise<{
      id: string;
      userId: string;
      expiresAt: Date;
      usedAt: Date | null;
      user: { id: string; email: string; status: string; firstName: string };
    } | null>;
    find.mockImplementation(async (tokenHash: string) => {
      const row = await impl(tokenHash);
      if (!row) return null;
      return { ...row, expiresAt: new Date(Date.now() - 60_000) };
    });
    await expect(service.verifyEmail(otp)).rejects.toMatchObject({
      code: "EXPIRED_VERIFICATION_TOKEN",
    });
  });

  it(
    "locks the account after repeated failed logins",
    async () => {
    const repository = createMemoryRepository();
    const email = {
      send: vi.fn(async () => ({ providerMessageId: "mail-1" })),
    };
    const codes = captureCodes(email.send);
    const service = new AuthService(repository, environment, email);

    await service.register({
      email: "lock@example.com",
      password: "SecurePass1",
      firstName: "Lock",
      lastName: "User",
      companyName: "Lock Co",
    });
    await service.verifyEmail(codes.otp());

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(
        service.login({
          email: "lock@example.com",
          password: "WrongPass1",
        }),
      ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
    }

    await expect(
      service.login({
        email: "lock@example.com",
        password: "SecurePass1",
      }),
    ).rejects.toMatchObject({ code: "ACCOUNT_LOCKED" });
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date(Date.now() + 900_001));
      await expect(service.login({ email: "lock@example.com", password: "WrongPass1" })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
      await expect(service.login({ email: "lock@example.com", password: "SecurePass1" })).resolves.toBeDefined();
      // Success resets the previous sequence, so two failures remain below three.
      for (let i = 0; i < 2; i++) await expect(service.login({ email: "lock@example.com", password: "WrongPass1" })).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
      await expect(service.login({ email: "lock@example.com", password: "SecurePass1" })).resolves.toBeDefined();
    } finally { vi.useRealTimers(); }

  },
  30_000,
  );
});
