import { randomUUID } from "node:crypto";
import { TextEncoder } from "node:util";

import { SignJWT } from "jose";

import type { Environment } from "../../../../config/env.js";
import { AppError } from "../../../../lib/app-error.js";
import {
  verifyAccessToken,
  type AccessTokenClaims,
} from "../../../../shared/auth/authenticate.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import type { EmailGateway } from "../../../communication/notification/application/notification-gateways.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../domain/permission-catalog.js";
import {
  hashPassword,
  hashToken,
  newOpaqueToken,
  newOtpCode,
  slugifyOrg,
  verifyPasswordConstantTime,
} from "./auth-crypto.js";
import {
  appPublicUrl,
  buildAccountActivatedEmail,
  buildInvitationEmail,
  buildPasswordResetEmail,
  buildVerificationCodeEmail,
  buildWelcomeVerificationEmail,
  createEmailBrand,
} from "./auth-email.js";
import {
  buildGoogleAuthorizationUrl,
  exchangeGoogleAuthorizationCode,
  isGoogleOAuthConfigured,
  isGoogleSignInConfigured,
  verifyGoogleIdToken,
  type GoogleCredentialVerifier,
  type GoogleIdTokenClaims,
} from "./google-oauth.js";
import { requireActiveUser, selectMembership } from "./auth-policy.js";
import type { AuthRepository } from "../infrastructure/auth-repository.js";

const refreshTokenBytes = 48;
const verificationTtlMs = 24 * 60 * 60 * 1000;
const resetTtlMs = 60 * 60 * 1000;

const GOOGLE_LINK_MESSAGE =
  "An Almahbub account already uses this email. Verify your account to connect Google and continue.";

export class AuthService {
  public constructor(
    private readonly repository: AuthRepository,
    private readonly environment: Environment,
    private readonly email: EmailGateway,
    private readonly verifyGoogleCredential: GoogleCredentialVerifier = verifyGoogleIdToken,
  ) {}

  public async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
    country?: string | undefined;
    phone?: string | undefined;
    companyType?: string | undefined;
    address?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
  }) {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await hashPassword(input.password);
    const otp = newOtpCode();
    const orgSlug = await this.repository.ensureUniqueOrgSlug(
      slugifyOrg(input.companyName),
    );

    const created = await this.repository.registerAccount({
      email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      companyName: input.companyName.trim(),
      countryCode: input.country,
      orgSlug,
      verificationTokenHash: hashToken(otp),
      verificationExpiresAt: new Date(Date.now() + verificationTtlMs),
      permissionKeys: DEFAULT_BUYER_PERMISSIONS,
    });

    if (created.duplicate) {
      throw new AppError({
        statusCode: 409,
        code: "EMAIL_ALREADY_REGISTERED",
        message: "An account with this email already exists.",
      });
    }

    const brand = createEmailBrand(this.environment);
    const verifyUrl = `${appPublicUrl(this.environment)}/verify-email?token=${encodeURIComponent(otp)}`;
    await this.email.send({
      to: email,
      ...buildWelcomeVerificationEmail({
        brand,
        firstName: input.firstName.trim(),
        otp,
        verifyUrl,
      }),
    });

    return {
      status: "pending_verification" as const,
      email,
      organizationId: created.organizationId,
      message: "Check your email for a verification code to activate your account.",
    };
  }

  public async resendVerification(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.repository.findUserIdByEmail(email);
    /* Always generic - no account enumeration. */
    if (!user || user.status === "active") {
      return {
        message:
          "If an unverified account exists for that email, a new code has been sent.",
      };
    }

    const otp = newOtpCode();
    await this.repository.replaceEmailVerificationToken({
      userId: user.id,
      tokenHash: hashToken(otp),
      expiresAt: new Date(Date.now() + verificationTtlMs),
    });
    const verifyUrl = `${appPublicUrl(this.environment)}/verify-email?token=${encodeURIComponent(otp)}`;
    await this.email.send({
      to: email,
      ...buildVerificationCodeEmail({
        brand: createEmailBrand(this.environment),
        otp,
        verifyUrl,
      }),
    });
    return {
      message:
        "If an unverified account exists for that email, a new code has been sent.",
    };
  }

  public async verifyEmail(token: string, emailRaw?: string) {
    const row = await this.repository.findEmailVerificationToken(hashToken(token));
    if (!row || row.usedAt) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link or code is invalid.",
      });
    }
    if (emailRaw) {
      const expected = emailRaw.trim().toLowerCase();
      if (row.user.email !== expected) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "This verification link or code is invalid.",
        });
      }
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        statusCode: 400,
        code: "EXPIRED_VERIFICATION_TOKEN",
        message: "This verification link or code has expired. Request a new one.",
      });
    }
    const ok = await this.repository.consumeEmailVerification(row.id, row.userId);
    if (!ok) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_VERIFICATION_TOKEN",
        message: "This verification link or code is invalid.",
      });
    }
    try {
      await this.email.send({
        to: row.user.email,
        ...buildAccountActivatedEmail({
          brand: createEmailBrand(this.environment),
          firstName: row.user.firstName,
        }),
      });
    } catch (error) {
      console.warn(
        "[auth-email] welcome message after verification failed.",
        error instanceof Error ? error.message : error,
      );
    }
    return {
      email: row.user.email,
      status: "active" as const,
      message: "Email verified. You can sign in.",
    };
  }

  public async forgotPassword(emailRaw: string) {
    const email = emailRaw.trim().toLowerCase();
    const user = await this.repository.findUserIdByEmail(email);
    if (user) {
      const verified =
        user.emailVerifiedAt != null || user.status === "active";
      if (!verified) {
        /* Unverified accounts must verify email before a password reset. */
        const otp = newOtpCode();
        await this.repository.replaceEmailVerificationToken({
          userId: user.id,
          tokenHash: hashToken(otp),
          expiresAt: new Date(Date.now() + verificationTtlMs),
        });
        const verifyUrl = `${appPublicUrl(this.environment)}/verify-email?token=${encodeURIComponent(otp)}`;
        await this.email.send({
          to: email,
          ...buildVerificationCodeEmail({
            brand: createEmailBrand(this.environment),
            otp,
            verifyUrl,
          }),
          subject: "Verify your Almahbub email before resetting your password",
          text: `Verify your email before you can reset your password. Your code is ${otp}. Or open ${verifyUrl}. Expires in 24 hours.`,
        });
      } else {
        const token = newOpaqueToken(32);
        await this.repository.createPasswordResetToken({
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + resetTtlMs),
        });
        const resetUrl = `${appPublicUrl(this.environment)}/reset-password/${encodeURIComponent(token)}`;
        await this.email.send({
          to: email,
          ...buildPasswordResetEmail({
            brand: createEmailBrand(this.environment),
            resetUrl,
          }),
        });
      }
    }
    return {
      message:
        "If an account exists for that email, password reset or verification instructions have been sent.",
    };
  }

  public async resetPassword(input: { token: string; password: string }) {
    const row = await this.repository.findPasswordResetToken(
      hashToken(input.token),
    );
    if (!row || row.usedAt) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
        message: "This reset link is invalid.",
      });
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        statusCode: 400,
        code: "EXPIRED_RESET_TOKEN",
        message: "This reset link has expired. Request a new one.",
      });
    }
    const passwordHash = await hashPassword(input.password);
    const ok = await this.repository.consumePasswordReset({
      tokenId: row.id,
      userId: row.userId,
      passwordHash,
    });
    if (!ok) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
        message: "This reset link is invalid.",
      });
    }
    return { message: "Password updated. Sign in with your new password." };
  }

  public async login(input: {
    email: string;
    password: string;
    organizationId?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
    rememberMe?: boolean | undefined;
    deviceFingerprint?: string | undefined;
    deviceName?: string | undefined;
    devicePlatform?: string | undefined;
  }) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findUserForLogin(email);
    const ipHash = input.ip ? hashToken(input.ip) : undefined;

    if (user) {
      const since = new Date(
        Date.now() - this.environment.AUTH_LOCKOUT_WINDOW_SECONDS * 1000,
      );
      const failures = await this.repository.countRecentFailedLogins(
        user.id,
        since,
      );
      if (failures >= this.environment.AUTH_LOCKOUT_THRESHOLD) {
        await this.repository.recordLoginEvent({
          userId: user.id,
          type: "sign_in_failed",
          outcome: "blocked",
          ipHash,
          userAgent: input.userAgent,
          metadata: { reason: "lockout" },
        });
        throw new AppError({
          statusCode: 423,
          code: "ACCOUNT_LOCKED",
          message:
            "This account is temporarily locked after repeated failed sign-in attempts. Try again later.",
        });
      }
    }

    const passwordValid = await verifyPasswordConstantTime(
      user?.credentials ?? null,
      input.password,
    );
    if (!user || !passwordValid) {
      if (user) {
        await this.repository.recordLoginEvent({
          userId: user.id,
          type: "sign_in_failed",
          outcome: "failure",
          ipHash,
          userAgent: input.userAgent,
        });
      } else {
        await this.repository.recordLoginEvent({
          type: "sign_in_failed",
          outcome: "failure",
          ipHash,
          userAgent: input.userAgent,
          metadata: { emailHash: hashToken(email) },
        });
      }
      throw invalidCredentials();
    }

    try {
      requireActiveUser(user.status);
    } catch (error) {
      await this.repository.recordLoginEvent({
        userId: user.id,
        type: "sign_in_failed",
        outcome: "blocked",
        ipHash,
        userAgent: input.userAgent,
        metadata: { status: user.status },
      });
      throw error;
    }

    const membership = selectMembership(user.memberships, input.organizationId);
    let deviceId: string | undefined;
    if (input.rememberMe && input.deviceFingerprint) {
      const device = await this.repository.upsertTrustedDevice({
        userId: user.id,
        fingerprint: hashToken(input.deviceFingerprint),
        name: input.deviceName,
        platform: input.devicePlatform,
      });
      deviceId = device.id;
    }

    const refreshToken = newRefreshToken();
    const session = await this.repository.createSession({
      userId: user.id,
      familyId: randomUUID(),
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(this.environment, Boolean(input.rememberMe)),
      ipHash,
      userAgent: input.userAgent,
      deviceId,
      rememberDevice: Boolean(input.rememberMe),
    });

    await this.repository.recordLoginEvent({
      userId: user.id,
      type: "sign_in",
      outcome: "success",
      ipHash,
      userAgent: input.userAgent,
      metadata: { sessionId: session.id },
    });

    return this.createTokenResponse(
      user,
      membership,
      session.id,
      refreshToken,
      Boolean(input.rememberMe),
    );
  }

  public googleOAuthEnabled(): boolean {
    return isGoogleSignInConfigured(this.environment);
  }

  public googleRedirectEnabled(): boolean {
    return isGoogleOAuthConfigured(this.environment);
  }

  public buildGoogleAuthorizationUrl(state: string): string {
    return buildGoogleAuthorizationUrl({
      environment: this.environment,
      state,
    });
  }

  public async completeGoogleCredentialSignIn(input: {
    credential: string;
    otpCode?: string | undefined;
    email?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }) {
    if (!isGoogleSignInConfigured(this.environment)) {
      throw new AppError({
        statusCode: 503,
        code: "GOOGLE_OAUTH_NOT_CONFIGURED",
        message:
          "Google Sign-In is not configured for this environment. Contact your administrator.",
      });
    }
    const identity = await this.verifyGoogleCredential(
      input.credential,
      this.environment,
    );
    return this.establishGoogleSession(identity, {
      ip: input.ip,
      userAgent: input.userAgent,
      otpCode: input.otpCode,
      otpEmail: input.email,
    });
  }

  public async completeGoogleSignIn(input: {
    code: string;
    ip?: string | undefined;
    userAgent?: string | undefined;
    otpCode?: string | undefined;
    email?: string | undefined;
  }) {
    const identity = await exchangeGoogleAuthorizationCode({
      environment: this.environment,
      code: input.code,
    });
    return this.establishGoogleSession(identity, {
      ip: input.ip,
      userAgent: input.userAgent,
      otpCode: input.otpCode,
      otpEmail: input.email,
    });
  }

  private async establishGoogleSession(
    identity: GoogleIdTokenClaims,
    input: {
      ip?: string | undefined;
      userAgent?: string | undefined;
      otpCode?: string | undefined;
      otpEmail?: string | undefined;
    },
  ) {
    const ipHash = input.ip ? hashToken(input.ip) : undefined;
    const userId = await this.resolveGoogleUser(identity, {
      otpCode: input.otpCode,
      otpEmail: input.otpEmail,
      ipHash,
      userAgent: input.userAgent,
    });

    const resolved =
      (await this.repository.findAuthUserById(userId)) ??
      (await this.repository.findUserForLogin(identity.email));
    if (!resolved) {
      throw new AppError({
        statusCode: 500,
        code: "GOOGLE_OAUTH_FAILED",
        message: "Unable to load your account after Google sign-in.",
      });
    }

    try {
      requireActiveUser(resolved.status);
    } catch (error) {
      await this.repository.recordLoginEvent({
        userId: resolved.id,
        type: "sign_in_failed",
        outcome: "blocked",
        ipHash,
        userAgent: input.userAgent,
        metadata: { status: resolved.status, provider: "google" },
      });
      throw error;
    }

    const membership = selectMembership(resolved.memberships);
    const refreshToken = newRefreshToken();
    const session = await this.repository.createSession({
      userId: resolved.id,
      familyId: randomUUID(),
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(this.environment),
      ipHash,
      userAgent: input.userAgent,
      authMethod: "google",
    });

    await this.repository.recordLoginEvent({
      userId: resolved.id,
      type: "sign_in",
      outcome: "success",
      ipHash,
      userAgent: input.userAgent,
      metadata: { sessionId: session.id, provider: "google" },
    });

    return this.createTokenResponse(
      resolved,
      membership,
      session.id,
      refreshToken,
    );
  }

  private async resolveGoogleUser(
    identity: GoogleIdTokenClaims,
    input: {
      otpCode?: string | undefined;
      otpEmail?: string | undefined;
      ipHash?: string | undefined;
      userAgent?: string | undefined;
    },
  ): Promise<string> {
    const linked = await this.repository.findUserIdByIdentity(
      "google",
      identity.sub,
    );
    if (linked) {
      return linked.userId;
    }

    const byEmail = await this.repository.findUserIdByEmail(identity.email);
    if (byEmail) {
      return this.linkExistingAccountWithGoogle({
        existing: byEmail,
        identity,
        otpCode: input.otpCode,
        otpEmail: input.otpEmail,
        ipHash: input.ipHash,
        userAgent: input.userAgent,
      });
    }

    return this.createGoogleBuyer(identity);
  }

  private async linkExistingAccountWithGoogle(input: {
    existing: {
      id: string;
      email: string;
      status: string;
      emailVerifiedAt: Date | null;
    };
    identity: GoogleIdTokenClaims;
    otpCode?: string | undefined;
    otpEmail?: string | undefined;
    ipHash?: string | undefined;
    userAgent?: string | undefined;
  }): Promise<string> {
    if (input.otpCode) {
      const expectedEmail = (
        input.otpEmail ?? input.existing.email
      ).trim().toLowerCase();
      if (expectedEmail !== input.existing.email) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "This verification link or code is invalid.",
        });
      }
      const row = await this.repository.findEmailVerificationToken(
        hashToken(input.otpCode),
      );
      if (!row || row.usedAt || row.userId !== input.existing.id) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "This verification link or code is invalid.",
        });
      }
      if (row.user.email !== input.existing.email) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "This verification link or code is invalid.",
        });
      }
      if (row.expiresAt.getTime() < Date.now()) {
        throw new AppError({
          statusCode: 400,
          code: "EXPIRED_VERIFICATION_TOKEN",
          message: "This verification link or code has expired. Request a new one.",
        });
      }
      const ok = await this.repository.consumeEmailVerification(
        row.id,
        row.userId,
      );
      if (!ok) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "This verification link or code is invalid.",
        });
      }
      await this.repository.linkIdentityProvider({
        userId: input.existing.id,
        provider: "google",
        providerSubject: input.identity.sub,
        providerEmail: input.identity.email,
        emailVerified: true,
      });
      if (input.existing.status !== "active") {
        await this.repository.activateVerifiedUser(input.existing.id);
      }
      await this.repository.recordLoginEvent({
        userId: input.existing.id,
        type: "sign_in",
        outcome: "success",
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        metadata: { provider: "google", action: "google_account_linked" },
      });
      return input.existing.id;
    }

    const otp = newOtpCode();
    await this.repository.replaceEmailVerificationToken({
      userId: input.existing.id,
      tokenHash: hashToken(otp),
      expiresAt: new Date(Date.now() + verificationTtlMs),
    });
    const verifyUrl = `${appPublicUrl(this.environment)}/verify-email?token=${encodeURIComponent(otp)}`;
    await this.email.send({
      to: input.existing.email,
      ...buildVerificationCodeEmail({
        brand: createEmailBrand(this.environment),
        otp,
        verifyUrl,
      }),
    });
    await this.repository.recordLoginEvent({
      userId: input.existing.id,
      type: "sign_in_failed",
      outcome: "blocked",
      ipHash: input.ipHash,
      userAgent: input.userAgent,
      metadata: { reason: "google_link_required", provider: "google" },
    });
    throw new AppError({
      statusCode: 409,
      code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
      message: GOOGLE_LINK_MESSAGE,
      details: [
        {
          field: "email",
          code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
          message: input.existing.email,
        },
      ],
    });
  }

  private async createGoogleBuyer(
    identity: GoogleIdTokenClaims,
  ): Promise<string> {
    const firstName =
      identity.given_name?.trim() ||
      identity.name?.split(/\s+/)[0] ||
      "Almahbub";
    const lastName =
      identity.family_name?.trim() ||
      identity.name?.split(/\s+/).slice(1).join(" ") ||
      "Member";
    const companyName = `${firstName} ${lastName}`.trim();
    const orgSlug = await this.repository.ensureUniqueOrgSlug(
      slugifyOrg(companyName),
    );
    const created = await this.repository.registerOAuthAccount({
      email: identity.email,
      firstName,
      lastName,
      companyName,
      orgSlug,
      provider: "google",
      providerSubject: identity.sub,
      providerEmail: identity.email,
      permissionKeys: DEFAULT_BUYER_PERMISSIONS,
    });
    if (!created.duplicate) {
      return created.userId;
    }

    const alreadyLinked = await this.repository.findUserIdByIdentity(
      "google",
      identity.sub,
    );
    if (alreadyLinked) {
      return alreadyLinked.userId;
    }

    const byEmail = await this.repository.findUserIdByEmail(identity.email);
    if (byEmail) {
      return this.linkExistingAccountWithGoogle({
        existing: byEmail,
        identity,
      });
    }

    throw new AppError({
      statusCode: 500,
      code: "GOOGLE_OAUTH_FAILED",
      message: "Unable to load your account after Google sign-in.",
    });
  }

  public async refresh(input: {
    refreshToken: string;
    organizationId?: string | undefined;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }) {
    const tokenHash = hashToken(input.refreshToken);
    const session = await this.repository.findActiveSession(tokenHash);
    if (!session || session.user.status !== "active") {
      await this.handleRefreshReuse(tokenHash);
      throw invalidRefreshToken();
    }
    const membership = selectMembership(
      session.user.memberships,
      input.organizationId,
    );
    await this.repository.touchSession(session.id);
    return this.createTokenResponse(
      session.user,
      membership,
      session.id,
      input.refreshToken,
      session.rememberDevice,
    );
  }

  private async handleRefreshReuse(refreshTokenHash: string): Promise<void> {
    const prior =
      await this.repository.findSessionByRefreshHash(refreshTokenHash);
    if (prior && prior.status !== "active") {
      await this.repository.revokeSessionFamily(prior.familyId);
    }
  }

  public async logout(sessionId?: string, userId?: string): Promise<void> {
    if (sessionId) {
      await this.repository.revokeSession(sessionId);
    }
    if (userId) {
      await this.repository.recordLoginEvent({
        userId,
        type: "sign_out",
        outcome: "success",
        metadata: { sessionId },
      });
    }
  }

  public async logoutEverywhere(userId: string): Promise<void> {
    await this.repository.revokeAllUserSessions(userId);
    await this.repository.recordLoginEvent({
      userId,
      type: "sign_out",
      outcome: "success",
      metadata: { scope: "everywhere" },
    });
  }

  public listSessions(userId: string, currentSessionId: string) {
    return this.repository.listSessions(userId).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        current: row.id === currentSessionId,
        authMethod: row.authMethod,
        rememberDevice: row.rememberDevice,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
        lastUsedAt: row.lastUsedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        device: row.device
          ? {
              id: row.device.id,
              name: row.device.name,
              platform: row.device.platform,
              trustedAt: row.device.trustedAt?.toISOString() ?? null,
              lastSeenAt: row.device.lastSeenAt.toISOString(),
            }
          : null,
      })),
    );
  }

  public async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId: string,
  ) {
    if (sessionId === currentSessionId) {
      throw new AppError({
        statusCode: 400,
        code: "CANNOT_REVOKE_CURRENT_SESSION",
        message: "Use logout to end the current session.",
      });
    }
    const result = await this.repository.revokeSessionForUser(sessionId, userId);
    if (result.count === 0) {
      throw new AppError({
        statusCode: 404,
        code: "SESSION_NOT_FOUND",
        message: "Session was not found.",
      });
    }
  }

  public listDevices(userId: string) {
    return this.repository.listDevices(userId).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        platform: row.platform,
        trustedAt: row.trustedAt?.toISOString() ?? null,
        lastSeenAt: row.lastSeenAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      })),
    );
  }

  public async revokeDevice(userId: string, deviceId: string) {
    const result = await this.repository.revokeDevice(userId, deviceId);
    if (result.count === 0) {
      throw new AppError({
        statusCode: 404,
        code: "DEVICE_NOT_FOUND",
        message: "Trusted device was not found.",
      });
    }
  }

  public listLoginHistory(userId: string) {
    return this.repository.listLoginHistory(userId).then((rows) =>
      rows.map((row) => ({
        id: row.id,
        type: row.type,
        outcome: row.outcome,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
      })),
    );
  }

  public async me(context: AuthContext) {
    const user = await this.repository.findUserForLoginById(context.userId);
    if (!user) {
      throw new AppError({
        statusCode: 401,
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
      });
    }
    return {
      user,
      organizationId: context.organizationId,
      organizationName: await this.repository.findOrganizationDisplayName(
        context.organizationId,
      ),
      permissions: [...context.permissionKeys].sort(),
    };
  }

  public async getInvitation(token: string) {
    const row = await this.repository.findInvitationByTokenHash(hashToken(token));
    if (!row || row.acceptedAt || row.status !== "invited") {
      throw new AppError({
        statusCode: 404,
        code: "INVITATION_NOT_FOUND",
        message: "This invitation is invalid or has already been used.",
      });
    }
    if (row.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        statusCode: 400,
        code: "INVITATION_EXPIRED",
        message: "This invitation has expired. Ask your administrator for a new invite.",
      });
    }
    const inviter = row.createdBy
      ? row.createdBy.displayName ??
        `${row.createdBy.firstName} ${row.createdBy.lastName}`.trim()
      : null;
    return {
      email: row.email,
      organizationName: row.organization.displayName,
      inviterName: inviter,
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  public async acceptInvitation(
    token: string,
    input: {
      password: string;
      firstName: string;
      lastName: string;
      ip?: string | undefined;
      userAgent?: string | undefined;
    },
  ) {
    const preview = await this.repository.findInvitationByTokenHash(
      hashToken(token),
    );
    if (!preview || preview.acceptedAt || preview.status !== "invited") {
      throw new AppError({
        statusCode: 404,
        code: "INVITATION_NOT_FOUND",
        message: "This invitation is invalid or has already been used.",
      });
    }
    if (preview.expiresAt.getTime() < Date.now()) {
      throw new AppError({
        statusCode: 400,
        code: "INVITATION_EXPIRED",
        message: "This invitation has expired. Ask your administrator for a new invite.",
      });
    }

    const passwordHash = await hashPassword(input.password);
    const accepted = await this.repository.acceptOrganizationInvitation({
      invitationId: preview.id,
      email: preview.email,
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      organizationId: preview.organizationId,
      permissionKeys: DEFAULT_BUYER_PERMISSIONS,
    });
    if (!accepted.ok) {
      if (accepted.reason === "EMAIL_ALREADY_REGISTERED") {
        throw new AppError({
          statusCode: 409,
          code: "EMAIL_ALREADY_REGISTERED",
          message: "An account with this email already exists. Sign in instead.",
        });
      }
      throw new AppError({
        statusCode: 400,
        code: "INVITATION_NOT_FOUND",
        message: "This invitation is invalid or has already been used.",
      });
    }

    const refreshToken = newRefreshToken();
    const session = await this.repository.createSession({
      userId: accepted.user.id,
      familyId: randomUUID(),
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiry(this.environment),
      ipHash: input.ip ? hashToken(input.ip) : undefined,
      userAgent: input.userAgent,
    });
    await this.repository.recordLoginEvent({
      userId: accepted.user.id,
      type: "sign_in",
      outcome: "success",
      ipHash: input.ip ? hashToken(input.ip) : undefined,
      userAgent: input.userAgent,
      metadata: { sessionId: session.id, via: "invitation" },
    });

    return this.createTokenResponse(
      accepted.user,
      { organizationId: accepted.membership.organizationId },
      session.id,
      refreshToken,
    );
  }

  public async createInvitation(
    context: AuthContext,
    emailRaw: string,
  ) {
    const email = emailRaw.trim().toLowerCase();
    const token = newOpaqueToken(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.repository.createOrganizationInvitation({
      organizationId: context.organizationId,
      email,
      tokenHash: hashToken(token),
      expiresAt,
      createdById: context.userId,
    });
    const brand = createEmailBrand(this.environment);
    const inviteUrl = `${appPublicUrl(this.environment)}/invite/${encodeURIComponent(token)}`;
    await this.email.send({
      to: email,
      ...buildInvitationEmail({ brand, inviteUrl }),
    });
    return {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt.toISOString(),
      message: "Invitation sent.",
    };
  }

  public updateProfile(
    context: AuthContext,
    input: {
      firstName?: string | undefined;
      lastName?: string | undefined;
      displayName?: string | null | undefined;
      locale?: string | undefined;
      timeZone?: string | null | undefined;
    },
  ) {
    return this.repository.updateProfile(context.userId, input);
  }

  public async changePassword(
    context: AuthContext,
    input: { currentPassword: string; newPassword: string },
  ) {
    const credentials = await this.repository.getCredentials(context.userId);
    const valid = await verifyPasswordConstantTime(
      credentials,
      input.currentPassword,
    );
    if (!valid) {
      throw new AppError({
        statusCode: 400,
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect.",
      });
    }
    const passwordHash = await hashPassword(input.newPassword);
    await this.repository.updatePasswordHash(context.userId, passwordHash);
    return { changed: true as const };
  }

  public validateAccessToken(token: string): Promise<AccessTokenClaims> {
    return verifyAccessToken(token, this.environment);
  }

  private async createTokenResponse(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      displayName: string | null;
      locale: string;
      timeZone: string | null;
      tokenVersion: number;
    },
    membership: { organizationId: string },
    sessionId: string,
    refreshToken: string,
    rememberMe = false,
  ) {
    const accessToken = await signAccessToken(
      this.environment,
      user.id,
      membership.organizationId,
      sessionId,
      user.tokenVersion,
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: this.environment.ACCESS_TOKEN_TTL_SECONDS,
      rememberMe,
      user: serializeUser(user),
      organizationId: membership.organizationId,
    };
  }
}

function signAccessToken(
  environment: Environment,
  userId: string,
  organizationId: string,
  sessionId: string,
  tokenVersion: number,
) {
  if (!environment.JWT_ACCESS_SECRET) {
    throw new AppError({
      statusCode: 503,
      code: "AUTH_CONFIGURATION_ERROR",
      message: "Authentication is not configured.",
    });
  }
  return new SignJWT({ org: organizationId, sid: sessionId, ver: tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(environment.JWT_ISSUER)
    .setAudience(environment.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${environment.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(environment.JWT_ACCESS_SECRET));
}

function serializeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  locale: string;
  timeZone: string | null;
  lastAuthenticatedAt?: Date | null;
  createdAt?: Date;
  emailVerifiedAt?: Date | null;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    locale: user.locale,
    timeZone: user.timeZone,
    lastAuthenticatedAt: user.lastAuthenticatedAt?.toISOString() ?? null,
    createdAt: user.createdAt?.toISOString() ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  };
}

function refreshExpiry(environment: Environment, rememberMe = false): Date {
  const seconds = rememberMe
    ? environment.REFRESH_TOKEN_TTL_SECONDS
    : Math.min(environment.REFRESH_TOKEN_TTL_SECONDS, 43_200);
  return new Date(Date.now() + seconds * 1000);
}

function newRefreshToken(): string {
  return newOpaqueToken(refreshTokenBytes);
}

function invalidCredentials(): AppError {
  return new AppError({
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password.",
  });
}

function invalidRefreshToken(): AppError {
  return new AppError({
    statusCode: 401,
    code: "INVALID_REFRESH_TOKEN",
    message: "Refresh token is invalid or expired.",
  });
}
