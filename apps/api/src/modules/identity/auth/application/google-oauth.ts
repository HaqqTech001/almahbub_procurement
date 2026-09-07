import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

import type { Environment } from "../../../../config/env.js";
import { AppError } from "../../../../lib/app-error.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);
const GOOGLE_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

export type GoogleIdTokenClaims = {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

export type GoogleCredentialVerifier = (
  credential: string,
  environment: Environment,
) => Promise<GoogleIdTokenClaims>;

export function googleClientId(environment: Environment): string | undefined {
  const id = environment.GOOGLE_CLIENT_ID || environment.GOOGLE_OAUTH_CLIENT_ID;
  return id && id.trim().length > 0 ? id.trim() : undefined;
}

/** GIS ID-token flow needs the public client ID only. */
export function isGoogleSignInConfigured(environment: Environment): boolean {
  return Boolean(googleClientId(environment));
}

/** Legacy authorization-code redirect still needs the server secret. */
export function isGoogleOAuthConfigured(environment: Environment): boolean {
  return Boolean(
    googleClientId(environment) && environment.GOOGLE_OAUTH_CLIENT_SECRET,
  );
}

export function googleOAuthRedirectUri(environment: Environment): string {
  if (environment.GOOGLE_OAUTH_REDIRECT_URI) {
    return environment.GOOGLE_OAUTH_REDIRECT_URI;
  }
  const publicApi =
    process.env.API_PUBLIC_URL?.replace(/\/$/, "") ??
    `http://${environment.API_HOST}:${environment.API_PORT}`;
  return `${publicApi}/api/v1/auth/google/callback`;
}

export function buildGoogleAuthorizationUrl(input: {
  environment: Environment;
  state: string;
}): string {
  if (!isGoogleOAuthConfigured(input.environment)) {
    throw googleNotConfigured();
  }
  const clientId = googleClientId(input.environment);
  if (!clientId) {
    throw googleNotConfigured();
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: googleOAuthRedirectUri(input.environment),
    response_type: "code",
    scope: "openid email profile",
    state: input.state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthorizationCode(input: {
  environment: Environment;
  code: string;
}): Promise<GoogleIdTokenClaims> {
  if (!isGoogleOAuthConfigured(input.environment)) {
    throw googleNotConfigured();
  }
  const clientId = googleClientId(input.environment);
  if (!clientId || !input.environment.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw googleNotConfigured();
  }

  const body = new URLSearchParams({
    code: input.code,
    client_id: clientId,
    client_secret: input.environment.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: googleOAuthRedirectUri(input.environment),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw googleTokenRejected();
  }

  const payload = (await response.json()) as { id_token?: string };
  if (!payload.id_token) {
    throw googleTokenRejected();
  }

  return verifyGoogleIdToken(payload.id_token, input.environment);
}

/**
 * Verifies a GIS ID token with google-auth-library (signature, issuer, exp,
 * audience === GOOGLE_CLIENT_ID). Never trusts client-sent profile objects.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  environment: Environment,
): Promise<GoogleIdTokenClaims> {
  const audience = googleClientId(environment);
  if (!audience) {
    throw googleNotConfigured();
  }

  let payload: {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    aud?: string | string[];
    iss?: string;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
  };

  try {
    const client = new OAuth2Client(audience);
    const ticket = await client.verifyIdToken({
      idToken,
      audience,
    });
    const verified = ticket.getPayload();
    if (!verified) {
      throw googleTokenRejected();
    }
    payload = verified;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw googleTokenRejected();
  }

  return claimsFromPayload(payload, audience);
}

/** jose fallback used only when a caller already has a raw JWT to inspect in tests. */
export async function verifyGoogleIdTokenWithJwks(
  idToken: string,
  environment: Environment,
): Promise<GoogleIdTokenClaims> {
  const audience = googleClientId(environment);
  if (!audience) {
    throw googleNotConfigured();
  }
  try {
    const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience,
    });
    return claimsFromPayload(payload, audience);
  } catch {
    throw googleTokenRejected();
  }
}

function claimsFromPayload(
  payload: {
    sub?: unknown;
    email?: unknown;
    email_verified?: unknown;
    aud?: unknown;
    iss?: unknown;
    given_name?: unknown;
    family_name?: unknown;
    name?: unknown;
    picture?: unknown;
  },
  audience: string,
): GoogleIdTokenClaims {
  const aud = payload.aud;
  const audienceOk =
    aud === audience || (Array.isArray(aud) && aud.includes(audience));
  if (!audienceOk) {
    throw googleTokenRejected();
  }

  const issuer = typeof payload.iss === "string" ? payload.iss : "";
  if (!GOOGLE_ISSUERS.has(issuer)) {
    throw googleTokenRejected();
  }

  const email = typeof payload.email === "string" ? payload.email : "";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!email || !sub) {
    throw new AppError({
      statusCode: 401,
      code: "GOOGLE_OAUTH_FAILED",
      message: "Google account is missing a verified email.",
    });
  }

  const emailVerified =
    payload.email_verified === true || payload.email_verified === "true";
  if (!emailVerified) {
    throw new AppError({
      statusCode: 403,
      code: "GOOGLE_EMAIL_NOT_VERIFIED",
      message: "Verify your Google email address before signing in.",
    });
  }

  return {
    sub,
    email: email.toLowerCase(),
    email_verified: true,
    ...(typeof payload.given_name === "string"
      ? { given_name: payload.given_name }
      : {}),
    ...(typeof payload.family_name === "string"
      ? { family_name: payload.family_name }
      : {}),
    ...(typeof payload.name === "string" ? { name: payload.name } : {}),
    ...(typeof payload.picture === "string" ? { picture: payload.picture } : {}),
  };
}

export function googleNotConfigured(): AppError {
  return new AppError({
    statusCode: 503,
    code: "GOOGLE_OAUTH_NOT_CONFIGURED",
    message:
      "Google Sign-In is not configured for this environment. Contact your administrator.",
  });
}

function googleTokenRejected(): AppError {
  return new AppError({
    statusCode: 401,
    code: "GOOGLE_OAUTH_FAILED",
    message: "Google sign-in could not be completed. Try again.",
  });
}
