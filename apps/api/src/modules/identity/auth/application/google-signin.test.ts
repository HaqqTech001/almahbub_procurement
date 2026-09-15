import { randomUUID } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { parseEnvironment } from "../../../../config/env.js";
import { AuthService } from "./auth-service.js";
import type { GoogleIdTokenClaims } from "./google-oauth.js";
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
  GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
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

function createMemoryRepository() {
  const users = new Map<string, StoredUser>();
  const usersByEmail = new Map<string, string>();
  const identities = new Map<string, { userId: string }>();
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
  const sessions = new Map<
    string,
    {
      id: string;
      userId: string;
      familyId: string;
      refreshTokenHash: string;
      status: string;
      expiresAt: Date;
      authMethod: string;
      rememberDevice: boolean;
    }
  >();
  const loginEvents: Array<{
    userId?: string;
    type: string;
    outcome: string;
    metadata?: unknown;
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
    lastAuthenticatedAt: null,
    createdAt: new Date(),
    emailVerifiedAt: user.emailVerifiedAt,
    tokenVersion: user.tokenVersion,
    credentials: user.passwordHash
      ? { passwordHash: user.passwordHash, algorithm: "argon2id" }
      : null,
    memberships: [
      {
        id: user.membershipId,
        organizationId: user.organizationId,
        organization: { displayName: "Org", slug: "org" },
      },
    ],
  });

  const repository = {
    users,
    usersByEmail,
    identities,
    loginEvents,
    ensureUniqueOrgSlug: vi.fn(async (base: string) => base),
    registerAccount: vi.fn(async (input) => {
      if (usersByEmail.has(input.email)) {
        return { duplicate: true as const };
      }
      const userId = randomUUID();
      const organizationId = randomUUID();
      const membershipId = randomUUID();
      users.set(userId, {
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
      });
      usersByEmail.set(input.email, userId);
      verification.set(input.verificationTokenHash, {
        id: randomUUID(),
        userId,
        tokenHash: input.verificationTokenHash,
        expiresAt: input.verificationExpiresAt,
        usedAt: null,
      });
      return { duplicate: false as const, userId, email: input.email, organizationId };
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
    findUserForLogin: vi.fn(async (email: string) => {
      const id = usersByEmail.get(email);
      return id ? toAuthUser(users.get(id)!) : null;
    }),
    findAuthUserById: vi.fn(async (id: string) => {
      const user = users.get(id);
      return user ? toAuthUser(user) : null;
    }),
    checkPasswordAttempt: vi.fn(async () => ({ lockedUntil: null, now: new Date() })),
    findUserForLoginById: vi.fn(),
    recordLoginEvent: vi.fn(async (input) => {
      loginEvents.push(input);
      return { id: randomUUID() };
    }),
    createSession: vi.fn(async (input) => {
      const id = randomUUID();
      sessions.set(id, {
        id,
        userId: input.userId,
        familyId: input.familyId,
        refreshTokenHash: input.refreshTokenHash,
        status: "active",
        expiresAt: input.expiresAt,
        authMethod: input.authMethod ?? "password",
        rememberDevice: input.rememberDevice ?? false,
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
        rememberDevice: session.rememberDevice,
        user: toAuthUser(users.get(session.userId)!),
      };
    }),
    findSessionByRefreshHash: vi.fn(async () => null),
    touchSession: vi.fn(),
    findUserIdByIdentity: vi.fn(async (provider: string, subject: string) => {
      return identities.get(`${provider}:${subject}`) ?? null;
    }),
    linkIdentityProvider: vi.fn(async (input) => {
      identities.set(`${input.provider}:${input.providerSubject}`, {
        userId: input.userId,
      });
      return { id: randomUUID(), userId: input.userId };
    }),
    registerOAuthAccount: vi.fn(async (input) => {
      const key = `${input.provider}:${input.providerSubject}`;
      const existingIdentity = identities.get(key);
      if (existingIdentity) {
        return { duplicate: true as const, userId: existingIdentity.userId };
      }
      if (usersByEmail.has(input.email)) {
        return { duplicate: true as const, userId: usersByEmail.get(input.email)! };
      }
      const userId = randomUUID();
      const organizationId = randomUUID();
      const membershipId = randomUUID();
      users.set(userId, {
        id: userId,
        email: input.email,
        status: "active",
        emailVerifiedAt: new Date(),
        firstName: input.firstName,
        lastName: input.lastName,
        displayName: `${input.firstName} ${input.lastName}`,
        locale: "en",
        timeZone: null,
        tokenVersion: 0,
        passwordHash: "",
        organizationId,
        membershipId,
      });
      usersByEmail.set(input.email, userId);
      identities.set(key, { userId });
      return {
        duplicate: false as const,
        userId,
        email: input.email,
        organizationId,
      };
    }),
    activateVerifiedUser: vi.fn(async (userId: string) => {
      const user = users.get(userId);
      if (user) {
        user.status = "active";
        user.emailVerifiedAt = new Date();
      }
    }),
  };

  return repository as typeof repository & AuthRepository;
}

function claims(
  partial: Partial<GoogleIdTokenClaims> = {},
): GoogleIdTokenClaims {
  return {
    sub: "google-sub-1",
    email: "google-buyer@example.com",
    email_verified: true,
    given_name: "Ada",
    family_name: "Buyer",
    ...partial,
  };
}

function captureCodes(send: ReturnType<typeof vi.fn>) {
  return {
    otp(): string {
      let latest: string | undefined;
      for (const call of send.mock.calls as Array<[{ text: string }]>) {
        const text = call[0]?.text ?? "";
        const match =
          text.match(/Verification code: (\d{6})/) ??
          text.match(/code is (\d{6})/);
        if (match) latest = match[1]!;
      }
      if (!latest) throw new Error("OTP not found in mailbox");
      return latest;
    },
  };
}

describe("Google credential sign-in", () => {
  it("creates a buyer-only user for a new Google identity", async () => {
    const repository = createMemoryRepository();
    const email = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const identity = claims();
    const service = new AuthService(
      repository,
      environment,
      email,
      async () => identity,
    );

    const session = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });

    expect(session.user.email).toBe(identity.email);
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(session.expiresIn).toBe(900);
    const created = (repository.registerOAuthAccount as ReturnType<typeof vi.fn>)
      .mock.calls[0]?.[0];
    expect(created.permissionKeys).not.toContain("ops:access");
    expect(created.permissionKeys).not.toContain("cms:manage");
    const user = [...repository.users.values()][0]!;
    expect(user.passwordHash).toBe("");
    expect(user.status).toBe("active");
    expect(user.emailVerifiedAt).toBeTruthy();
  });

  it("returns the same user for a returning Google sub", async () => {
    const repository = createMemoryRepository();
    const email = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const identity = claims();
    const service = new AuthService(
      repository,
      environment,
      email,
      async () => identity,
    );

    const first = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });
    const second = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });

    expect(second.user.id).toBe(first.user.id);
    expect(repository.users.size).toBe(1);
    expect(repository.identities.size).toBe(1);
  });

  it("does not create duplicate users for concurrent callbacks", async () => {
    const repository = createMemoryRepository();
    const email = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const identity = claims({ sub: "same-sub", email: "same@example.com" });
    const service = new AuthService(
      repository,
      environment,
      email,
      async () => identity,
    );

    const [a, b] = await Promise.all([
      service.completeGoogleCredentialSignIn({ credential: "aaa.bbb.ccc" }),
      service.completeGoogleCredentialSignIn({ credential: "aaa.bbb.ccc" }),
    ]);

    expect(a.user.id).toBe(b.user.id);
    expect(repository.users.size).toBe(1);
  });

  it("requires OTP before linking an existing password account", async () => {
    const repository = createMemoryRepository();
    const mailbox = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const codes = captureCodes(mailbox.send);
    const service = new AuthService(
      repository,
      environment,
      mailbox,
      async () => claims({ email: "buyer@example.com" }),
    );

    await service.register({
      email: "buyer@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Co",
    });

    await expect(
      service.completeGoogleCredentialSignIn({ credential: "aaa.bbb.ccc" }),
    ).rejects.toMatchObject({
      code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
      statusCode: 409,
    });
    expect(repository.identities.size).toBe(0);
    expect(mailbox.send).toHaveBeenCalled();

    const linked = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
      otpCode: codes.otp(),
      email: "buyer@example.com",
    });
    expect(linked.user.email).toBe("buyer@example.com");
    expect(repository.identities.get("google:google-sub-1")?.userId).toBe(
      linked.user.id,
    );

    const again = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });
    expect(again.user.id).toBe(linked.user.id);
    expect(mailbox.send.mock.calls.length).toBe(2);
  });

  it("issues the same access and refresh session shape as password login", async () => {
    const repository = createMemoryRepository();
    const mailbox = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const codes = captureCodes(mailbox.send);
    const passwordService = new AuthService(repository, environment, mailbox);

    await passwordService.register({
      email: "pwd@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Co",
    });
    await passwordService.verifyEmail(codes.otp());
    const password = await passwordService.login({
      email: "pwd@example.com",
      password: "SecurePass1",
    });

    const googleService = new AuthService(
      repository,
      environment,
      mailbox,
      async () => claims({ sub: "other-sub", email: "google-only@example.com" }),
    );
    const google = await googleService.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });

    expect(Object.keys(google).sort()).toEqual(Object.keys(password).sort());
    expect(google.expiresIn).toBe(password.expiresIn);
    const refreshed = await googleService.refresh({
      refreshToken: google.refreshToken,
    });
    expect(refreshed.refreshToken).toBe(google.refreshToken);
    expect(refreshed.user.id).toBe(google.user.id);
  });

  it("does not invent a password for Google-only users", async () => {
    const repository = createMemoryRepository();
    const mailbox = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const service = new AuthService(
      repository,
      environment,
      mailbox,
      async () => claims(),
    );
    const created = await service.completeGoogleCredentialSignIn({
      credential: "aaa.bbb.ccc",
    });
    await expect(
      service.login({
        email: created.user.email,
        password: "Anything1",
      }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("keeps password register and login working", async () => {
    const repository = createMemoryRepository();
    const mailbox = { send: vi.fn(async () => ({ providerMessageId: "m" })) };
    const codes = captureCodes(mailbox.send);
    const service = new AuthService(repository, environment, mailbox);
    await service.register({
      email: "regression@example.com",
      password: "SecurePass1",
      firstName: "Ada",
      lastName: "Buyer",
      companyName: "Ada Co",
    });
    await service.verifyEmail(codes.otp());
    const login = await service.login({
      email: "regression@example.com",
      password: "SecurePass1",
    });
    expect(login.accessToken).toBeTruthy();
  });
});
