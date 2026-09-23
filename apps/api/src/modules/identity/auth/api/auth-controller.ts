import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Request, RequestHandler, Response } from "express";

import { AppError } from "../../../../lib/app-error.js";
import type { Environment } from "../../../../config/env.js";
import type { AuthService } from "../application/auth-service.js";
import { appPublicUrl } from "../application/auth-email.js";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  emailOnlySchema,
  googleCredentialSchema,
  loginSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  verifyEmailBodySchema,
} from "./auth-schemas.js";

const refreshCookieName = "hamd_refresh";
const csrfCookieName = "hamd_csrf";

export class AuthController {
  public constructor(
    private readonly service: AuthService,
    private readonly environment: Environment,
  ) {}

  public readonly register: RequestHandler = async (request, response, next) => {
    try {
      const input = registerSchema.parse(request.body);
      const result = await this.service.register(input);
      response.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly login: RequestHandler = async (request, response, next) => {
    try {
      const input = loginSchema.parse(request.body);
      const result = await this.service.login({
        ...input,
        ip: request.ip,
        userAgent: request.get("user-agent") ?? undefined,
      });
      const csrfToken = setRefreshCookies(
        response,
        result.refreshToken,
        this.environment,
      );
      sendAuthSessionResponse(
        response,
        { ...withoutRefreshToken(result), csrfToken },
        200,
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly refresh: RequestHandler = async (request, response, next) => {
    try {
      const input = refreshSchema.parse(request.body ?? {});
      const refreshToken = request.cookies?.[refreshCookieName];
      if (typeof refreshToken !== "string" || refreshToken.length === 0) {
        throw invalidRefresh();
      }
      verifyCsrf(request, input.csrfToken, refreshToken, this.environment);
      const result = await this.service.refresh({
        ...input,
        refreshToken,
        ip: request.ip,
        userAgent: request.get("user-agent") ?? undefined,
      });
      const csrfToken = setRefreshCookies(
        response,
        result.refreshToken,
        this.environment,
      );
      sendAuthSessionResponse(
        response,
        { ...withoutRefreshToken(result), csrfToken },
        200,
      );
    } catch (error) {
      const csrfFailed =
        error instanceof AppError && error.code === "CSRF_VALIDATION_FAILED";
      if (!csrfFailed) {
        clearRefreshCookies(response, this.environment);
      }
      next(error);
    }
  };

  public readonly forgotPassword: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = emailOnlySchema.parse(request.body);
      const result = await this.service.forgotPassword(input.email);
      response.status(202).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly resetPassword: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = resetPasswordSchema.parse(request.body);
      const result = await this.service.resetPassword(input);
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly verifyEmail: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const pathToken =
        typeof request.params.token === "string" ? request.params.token : "";
      const body = verifyEmailBodySchema.parse(request.body ?? {});
      const token = pathToken || body.token || body.code;
      if (!token) {
        throw new AppError({
          statusCode: 400,
          code: "INVALID_VERIFICATION_TOKEN",
          message: "A verification token or code is required.",
        });
      }
      const result = await this.service.verifyEmail(token);
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly resendVerification: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = emailOnlySchema.parse(request.body);
      const result = await this.service.resendVerification(input.email);
      response.status(202).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly verifyOtp: RequestHandler = async (request, response, next) => {
    try {
      const input = otpVerifySchema.parse(request.body);
      const result = await this.service.verifyEmail(input.code);
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  public readonly getInvitation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const token = String(request.params.token ?? "");
      response.json({ data: await this.service.getInvitation(token) });
    } catch (error) {
      next(error);
    }
  };

  public readonly acceptInvitation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const token = String(request.params.token ?? "");
      const input = acceptInvitationSchema.parse(request.body);
      const result = await this.service.acceptInvitation(token, {
        ...input,
        ip: request.ip,
        userAgent: request.get("user-agent") ?? undefined,
      });
      const csrfToken = setRefreshCookies(
        response,
        result.refreshToken,
        this.environment,
      );
      sendAuthSessionResponse(
        response,
        { ...withoutRefreshToken(result), csrfToken },
        201,
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly createInvitation: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      const input = createInvitationSchema.parse(request.body);
      response
        .status(201)
        .json({ data: await this.service.createInvitation(auth, input.email) });
    } catch (error) {
      next(error);
    }
  };

  public readonly logout: RequestHandler = async (request, response, next) => {
    try {
      const auth = requireAuth(request);
      await this.service.logout(auth.sessionId, auth.userId);
      clearRefreshCookies(response, this.environment);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly logoutEverywhere: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      await this.service.logoutEverywhere(auth.userId);
      clearRefreshCookies(response, this.environment);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly listSessions: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      response.json({
        data: await this.service.listSessions(auth.userId, auth.sessionId),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly revokeSession: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      const sessionId = String(request.params.sessionId ?? "");
      await this.service.revokeSession(auth.userId, sessionId, auth.sessionId);
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly listDevices: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      response.json({ data: await this.service.listDevices(auth.userId) });
    } catch (error) {
      next(error);
    }
  };

  public readonly revokeDevice: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      await this.service.revokeDevice(
        auth.userId,
        String(request.params.deviceId ?? ""),
      );
      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  public readonly loginHistory: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const auth = requireAuth(request);
      response.json({ data: await this.service.listLoginHistory(auth.userId) });
    } catch (error) {
      next(error);
    }
  };

  public readonly me: RequestHandler = async (request, response, next) => {
    try {
      response.json({ data: await this.service.me(requireAuth(request)) });
    } catch (error) {
      next(error);
    }
  };

  public readonly updateProfile: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = updateProfileSchema.parse(request.body);
      response.json({
        data: await this.service.updateProfile(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly changePassword: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = changePasswordSchema.parse(request.body);
      response.json({
        data: await this.service.changePassword(requireAuth(request), input),
      });
    } catch (error) {
      next(error);
    }
  };

  public readonly googleStatus: RequestHandler = (_request, response) => {
    response.json({
      data: {
        enabled: this.service.googleOAuthEnabled(),
      },
    });
  };

  public readonly googleSignIn: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    try {
      const input = googleCredentialSchema.parse(request.body);
      const result = await this.service.completeGoogleCredentialSignIn({
        ...input,
        ip: request.ip,
        userAgent: request.get("user-agent") ?? undefined,
      });
      const csrfToken = setRefreshCookies(
        response,
        result.refreshToken,
        this.environment,
      );
      sendAuthSessionResponse(
        response,
        { ...withoutRefreshToken(result), csrfToken },
        200,
      );
    } catch (error) {
      next(error);
    }
  };

  public readonly googleStart: RequestHandler = (request, response, next) => {
    try {
      if (!this.service.googleOAuthEnabled()) {
        throw new AppError({
          statusCode: 503,
          code: "GOOGLE_OAUTH_NOT_CONFIGURED",
          message:
            "Google Sign-In is not configured for this environment. Contact your administrator.",
        });
      }
      const returnToRaw =
        typeof request.query.returnTo === "string" ? request.query.returnTo : "/app";
      const returnTo = sanitizeReturnTo(returnToRaw);
      const state = randomBytes(24).toString("base64url");
      const secure =
        this.environment.COOKIE_SECURE ??
        this.environment.NODE_ENV === "production";
      response.cookie(googleStateCookieName, `${state}.${encodeURIComponent(returnTo)}`, {
        httpOnly: true,
        secure,
        sameSite: authCookieSameSite(this.environment),
        partitioned: authCookiePartitioned(this.environment),
        path: "/api/v1/auth",
        maxAge: 10 * 60 * 1000,
      });
      const url = this.service.buildGoogleAuthorizationUrl(state);
      response.redirect(302, url);
    } catch (error) {
      next(error);
    }
  };

  public readonly googleCallback: RequestHandler = async (
    request,
    response,
    next,
  ) => {
    const webBase = appPublicUrl(this.environment);
    try {
      const errorParam =
        typeof request.query.error === "string" ? request.query.error : null;
      if (errorParam) {
        response.redirect(
          302,
          `${webBase}/login?oauthError=${encodeURIComponent("Google sign-in was cancelled.")}`,
        );
        return;
      }

      const code =
        typeof request.query.code === "string" ? request.query.code : "";
      const state =
        typeof request.query.state === "string" ? request.query.state : "";
      const cookieRaw = request.cookies?.[googleStateCookieName];
      if (
        typeof cookieRaw !== "string" ||
        !code ||
        !state ||
        !cookieRaw.startsWith(`${state}.`)
      ) {
        throw new AppError({
          statusCode: 400,
          code: "GOOGLE_OAUTH_FAILED",
          message: "Google sign-in session expired. Try again.",
        });
      }
      const returnTo = sanitizeReturnTo(
        decodeURIComponent(cookieRaw.slice(state.length + 1)),
      );

      const result = await this.service.completeGoogleSignIn({
        code,
        ip: request.ip,
        userAgent: request.get("user-agent") ?? undefined,
      });
      setRefreshCookies(response, result.refreshToken, this.environment);
      response.clearCookie(googleStateCookieName, {
        path: "/api/v1/auth",
      });
      response.redirect(
        302,
        `${webBase}/login/oauth/complete?returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch (error) {
      const message =
        error instanceof AppError
          ? error.message
          : "Google sign-in could not be completed.";
      response.clearCookie(googleStateCookieName, {
        path: "/api/v1/auth",
      });
      response.redirect(
        302,
        `${webBase}/login?oauthError=${encodeURIComponent(message)}`,
      );
      /* Avoid double-reporting via next() after redirect */
      void next;
    }
  };

  public readonly validate: RequestHandler = (request, response, next) => {
    try {
      const auth = requireAuth(request);
      response.json({
        data: {
          valid: true,
          userId: auth.userId,
          organizationId: auth.organizationId,
          sessionId: auth.sessionId,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

const googleStateCookieName = "hamd_google_oauth";

function authCookieSameSite(environment: Environment): "lax" | "none" {
  const secure =
    environment.COOKIE_SECURE ?? environment.NODE_ENV === "production";
  // Production may serve the buyer/ops SPAs and API from different sites.
  // Credentialed fetches require SameSite=None; Secure. Development stays
  // Lax so localhost HTTP continues to work.
  return secure ? "none" : "lax";
}

function authCookiePartitioned(environment: Environment): boolean {
  const secure =
    environment.COOKIE_SECURE ?? environment.NODE_ENV === "production";
  // CHIPS keeps this cookie available to the Almahbub top-level site even
  // when the API remains on a different site (onrender.com) and ordinary
  // third-party cookies are blocked.
  return secure;
}

function sanitizeReturnTo(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/app";
  if (value === "/") return "/app";
  return value;
}

function setRefreshCookies(
  response: Response,
  refreshToken: string,
  environment: Environment,
): string {
  const secure =
    environment.COOKIE_SECURE ?? environment.NODE_ENV === "production";
  const maxAge = environment.REFRESH_TOKEN_TTL_SECONDS * 1000;
  const csrfToken = csrfTokenForRefresh(refreshToken, environment);
  response.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: authCookieSameSite(environment),
    partitioned: authCookiePartitioned(environment),
    path: "/api/v1/auth",
    maxAge,
  });
  // Readable on every SPA route so refresh can send x-csrf-token. Refresh
  // token stays scoped to /api/v1/auth. Body csrfToken still covers
  // cross-origin SPAs where document.cookie cannot read the API host cookie.
  response.cookie(csrfCookieName, csrfToken, {
    httpOnly: false,
    secure,
    sameSite: authCookieSameSite(environment),
    partitioned: authCookiePartitioned(environment),
    path: "/",
    maxAge,
  });
  return csrfToken;
}

function clearRefreshCookies(
  response: Response,
  environment: Environment,
): void {
  const secure =
    environment.COOKIE_SECURE ?? environment.NODE_ENV === "production";
  const refreshOptions = {
    httpOnly: true,
    secure,
    sameSite: authCookieSameSite(environment),
    partitioned: authCookiePartitioned(environment),
    path: "/api/v1/auth",
  };
  response.clearCookie(refreshCookieName, refreshOptions);
  response.clearCookie(csrfCookieName, {
    ...refreshOptions,
    httpOnly: false,
    path: "/",
  });
}

function csrfTokenForRefresh(
  refreshToken: string,
  environment: Environment,
): string {
  const secret = environment.JWT_ACCESS_SECRET;
  if (!secret) {
    // Authentication cannot issue access tokens without this secret anyway.
    // Keep a deterministic development/test fallback for controller tests.
    return createHmac("sha256", refreshToken)
      .update("hamd-csrf")
      .digest("base64url");
  }
  return createHmac("sha256", secret)
    .update(refreshToken)
    .digest("base64url");
}

function verifyCsrf(
  request: Request,
  bodyToken: string | undefined,
  refreshToken: string,
  environment: Environment,
): void {
  const header = request.get("x-csrf-token");
  const candidate =
    typeof header === "string" && header.length > 0
      ? header
      : typeof bodyToken === "string" && bodyToken.trim().length > 0
        ? bodyToken.trim()
        : undefined;

  if (typeof candidate !== "string") {
    throw new AppError({
      statusCode: 403,
      code: "CSRF_VALIDATION_FAILED",
      message: "A valid CSRF token is required.",
    });
  }

  const expected = csrfTokenForRefresh(refreshToken, environment);
  const expectedBuf = Buffer.from(expected, "utf8");
  const candidateBuf = Buffer.from(candidate, "utf8");

  if (
    expectedBuf.length === 0 ||
    expectedBuf.length !== candidateBuf.length ||
    !timingSafeEqual(expectedBuf, candidateBuf)
  ) {
    throw new AppError({
      statusCode: 403,
      code: "CSRF_VALIDATION_FAILED",
      message: "A valid CSRF token is required.",
    });
  }
}

function sendAuthSessionResponse(
  response: Response,
  data: Record<string, unknown>,
  statusCode: number,
): void {
  // Emit the platform envelope explicitly so auth responses cannot be
  // accidentally transformed into { data: null } by generic middleware.
  response.status(statusCode).json({
    success: true,
    message: "Authentication completed successfully.",
    data,
    meta: {},
    errors: [],
    requestId:
      typeof response.locals.requestId === "string"
        ? response.locals.requestId
        : undefined,
    timestamp: new Date().toISOString(),
  });
}

function invalidRefresh(): AppError {
  return new AppError({
    statusCode: 401,
    code: "INVALID_REFRESH_TOKEN",
    message: "Refresh token is invalid or expired.",
  });
}

function withoutRefreshToken<T extends { refreshToken: string }>(
  result: T,
): Omit<T, "refreshToken"> {
  return Object.fromEntries(
    Object.entries(result).filter(([key]) => key !== "refreshToken"),
  ) as Omit<T, "refreshToken">;
}

function requireAuth(request: Request): NonNullable<Request["auth"]> {
  if (!request.auth) {
    throw new AppError({
      statusCode: 401,
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      details: [
        {
          code: "AUTH_CONTEXT_MISSING",
          message: "Authentication middleware must run before auth controllers.",
        },
      ],
    });
  }
  return request.auth;
}
