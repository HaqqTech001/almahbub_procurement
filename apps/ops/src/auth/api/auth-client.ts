import { AuthApiError, readCookie } from "./auth-errors.js";
import { getCsrfToken, setCsrfToken } from "../session/token-store.js";
import { browserApiBase } from "../../lib/api-origin.js";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  locale: string;
  timeZone: string | null;
  emailVerifiedAt?: string | null;
  createdAt?: string | null;
  lastAuthenticatedAt?: string | null;
};

export type AuthSessionPayload = {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
  organizationId: string;
  /** Present for SPA routes where hamd_csrf cookie path is not readable. */
  csrfToken?: string;
};

export type AuthMePayload = {
  user: AuthUser;
  organizationId: string;
  organizationName?: string | null;
  permissions: string[];
};

export type AuthSessionRow = {
  id: string;
  current: boolean;
  authMethod: string;
  rememberDevice: boolean;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  device: {
    id: string;
    name: string | null;
    platform: string | null;
    trustedAt: string | null;
    lastSeenAt: string;
  } | null;
};

export type AuthDeviceRow = {
  id: string;
  name: string | null;
  platform: string | null;
  trustedAt: string | null;
  lastSeenAt: string;
  createdAt: string;
};

export type AuthLoginHistoryRow = {
  id: string;
  type: string;
  outcome: string;
  userAgent: string | null;
  createdAt: string;
};

export type InvitationPreview = {
  email: string;
  organizationName: string;
  inviterName: string | null;
  expiresAt: string;
};

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

function stringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function numberValue(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed =
      typeof value === "number"
        ? value
        : typeof value === "string" && value.trim()
          ? Number(value)
          : Number.NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function normalizeAuthUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = stringValue(row.id, row.userId, row.user_id);
  const email = stringValue(row.email);
  if (!id || !email) return null;

  const firstName = stringValue(row.firstName, row.first_name) ?? "";
  const lastName = stringValue(row.lastName, row.last_name) ?? "";
  const fallbackDisplayName = [firstName, lastName].filter(Boolean).join(" ");

  return {
    id,
    email,
    firstName,
    lastName,
    displayName:
      stringValue(row.displayName, row.display_name) ||
      fallbackDisplayName ||
      null,
    locale: stringValue(row.locale) ?? "en",
    timeZone: stringValue(row.timeZone, row.time_zone),
    emailVerifiedAt: stringValue(row.emailVerifiedAt, row.email_verified_at),
    createdAt: stringValue(row.createdAt, row.created_at),
    lastAuthenticatedAt: stringValue(
      row.lastAuthenticatedAt,
      row.last_authenticated_at,
    ),
  };
}

function normalizeAuthSessionPayload(
  value: unknown,
  depth = 0,
): AuthSessionPayload | null {
  if (!value || typeof value !== "object" || depth > 4) return null;

  const row = value as Record<string, unknown>;
  const organization =
    row.organization && typeof row.organization === "object"
      ? (row.organization as Record<string, unknown>)
      : null;
  const organisation =
    row.organisation && typeof row.organisation === "object"
      ? (row.organisation as Record<string, unknown>)
      : null;

  const accessToken = stringValue(
    row.accessToken,
    row.access_token,
    row.token,
    row.jwt,
  );
  const expiresIn = numberValue(
    row.expiresIn,
    row.expires_in,
    row.ttl,
    row.accessTokenExpiresIn,
  );
  const organizationId = stringValue(
    row.organizationId,
    row.organisationId,
    row.organization_id,
    row.organisation_id,
    organization?.id,
    organisation?.id,
  );
  const user = normalizeAuthUser(row.user ?? row.account ?? row.profile);

  if (accessToken && expiresIn && organizationId && user) {
    const csrfToken = stringValue(row.csrfToken, row.csrf_token) ?? undefined;
    return {
      accessToken,
      expiresIn,
      user,
      organizationId,
      ...(csrfToken ? { csrfToken } : {}),
    };
  }

  for (const key of ["data", "session", "result", "payload"]) {
    const nested = normalizeAuthSessionPayload(row[key], depth + 1);
    if (nested) return nested;
  }

  return null;
}

function isAuthSessionPayload(value: unknown): value is AuthSessionPayload {
  return normalizeAuthSessionPayload(value) !== null;
}

function assertAuthSessionPayload(value: unknown): AuthSessionPayload {
  const normalized = normalizeAuthSessionPayload(value);
  if (normalized) return normalized;

  const keys =
    value && typeof value === "object"
      ? Object.keys(value as Record<string, unknown>).slice(0, 12)
      : [];

  throw new AuthApiError({
    message:
      "The authentication service returned a response that does not contain a usable session.",
    status: 502,
    code: "INVALID_AUTH_RESPONSE",
    details: { keys },
  });
}

function authUrl(path: string, forceSameOrigin = false): string {
  const base = forceSameOrigin ? "" : browserApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1/auth${normalized}`;
  return `${base}/api/v1/auth${normalized}`;
}

function timeoutSignal(ms: number, inherited?: AbortSignal): AbortSignal {
  if (!inherited) return AbortSignal.timeout(ms);
  if (inherited.aborted) return inherited;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), ms);
  const abort = () => controller.abort();
  inherited.addEventListener("abort", abort, { once: true });
  controller.signal.addEventListener(
    "abort",
    () => {
      window.clearTimeout(timeout);
      inherited.removeEventListener("abort", abort);
    },
    { once: true },
  );
  return controller.signal;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AuthApiError({
      message:
        "The authentication endpoint returned a non-JSON response. The Ops API route is not configured correctly.",
      status: response.status || 502,
      code: "INVALID_AUTH_RESPONSE",
    });
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new AuthApiError({
      message: "The authentication service returned malformed JSON.",
      status: response.status || 502,
      code: "INVALID_AUTH_RESPONSE",
    });
  }
}

function toAuthError(response: Response, body: unknown): AuthApiError {
  const envelope = body as {
    error?: { code?: string; message?: string; details?: unknown };
    message?: string;
  } | null;
  const code =
    envelope?.error?.code ??
    (response.status === 429 ? "TOO_MANY_REQUESTS" : "AUTH_ERROR");
  const message =
    envelope?.error?.message ??
    envelope?.message ??
    (response.status === 429
      ? "Too many attempts. Wait briefly and try again."
      : response.status === 401
        ? "Invalid email or password."
        : "Authentication request failed.");
  return new AuthApiError({
    message,
    status: response.status,
    code,
    details: envelope?.error?.details,
  });
}

/**
 * Production auth HTTP client.
 * - Access JWT in memory (caller supplies Bearer)
 * - Refresh via httpOnly cookie + readable CSRF cookie header
 * - credentials: include for cookie path
 */
export async function authFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
    csrf?: boolean;
    signal?: AbortSignal;
    forceSameOrigin?: boolean;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options.csrf) {
    const csrf = getCsrfToken() ?? readCookie("hamd_csrf");
    if (csrf) headers["x-csrf-token"] = csrf;
  }

  const requestInit: RequestInit = {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  };

  let response: Response;
  const primarySameOrigin = options.forceSameOrigin === true;
  try {
    response = await fetch(authUrl(path, primarySameOrigin), {
      ...requestInit,
      signal: timeoutSignal(primarySameOrigin ? 1_700 : 2_400, options.signal),
    });
  } catch {
    if (primarySameOrigin) {
      throw new AuthApiError({
        message:
          "Unable to reach the authentication service through the Ops API route.",
        status: 0,
        code: "NETWORK_ERROR",
      });
    }
    try {
      response = await fetch(authUrl(path, true), {
        ...requestInit,
        signal: timeoutSignal(1_700, options.signal),
      });
    } catch {
      throw new AuthApiError({
        message:
          "Unable to reach the authentication service. Check that the API is online and the Ops deployment exposes /api or VITE_API_URL.",
        status: 0,
        code: "NETWORK_ERROR",
      });
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await parseJson(response);
  if (!response.ok) {
    throw toAuthError(response, body);
  }

  const envelope = body as Envelope<T> | null;
  if (envelope && "data" in envelope) {
    const data = envelope.data as T & { csrfToken?: string };
    if (data && typeof data === "object" && typeof data.csrfToken === "string") {
      setCsrfToken(data.csrfToken);
    }
    return envelope.data;
  }
  return body as T;
}

export async function loginRequest(input: {
  email: string;
  password: string;
  organizationId?: string;
  rememberMe?: boolean;
  deviceFingerprint?: string;
  deviceName?: string;
  devicePlatform?: string;
}): Promise<AuthSessionPayload> {
  const body = {
    email: input.email,
    password: input.password,
    ...(input.organizationId ? { organizationId: input.organizationId } : {}),
    ...(input.rememberMe !== undefined ? { rememberMe: input.rememberMe } : {}),
    ...(input.deviceFingerprint
      ? { deviceFingerprint: input.deviceFingerprint }
      : {}),
    ...(input.deviceName ? { deviceName: input.deviceName } : {}),
    ...(input.devicePlatform ? { devicePlatform: input.devicePlatform } : {}),
  };

  const payload = await authFetch<unknown>("/login", {
    method: "POST",
    body,
  });
  const normalized = normalizeAuthSessionPayload(payload);
  if (normalized) return normalized;

  // A reachable VITE_API_URL may still point at an outdated/legacy service.
  // If it returns the wrong JSON contract, retry the Ops origin's /api proxy.
  if (browserApiBase()) {
    const sameOriginPayload = await authFetch<unknown>("/login", {
      method: "POST",
      body,
      forceSameOrigin: true,
    });
    return assertAuthSessionPayload(sameOriginPayload);
  }

  return assertAuthSessionPayload(payload);
}

export async function refreshRequest(accessToken?: string | null): Promise<AuthSessionPayload> {
  const csrf = getCsrfToken() ?? readCookie("hamd_csrf") ?? undefined;
  const body = csrf ? { csrfToken: csrf } : {};
  const payload = await authFetch<unknown>("/refresh", {
    method: "POST",
    body,
    csrf: true,
    accessToken: accessToken ?? null,
    signal: AbortSignal.timeout(4_100),
  });
  const normalized = normalizeAuthSessionPayload(payload);
  if (normalized) return normalized;

  if (browserApiBase()) {
    const sameOriginPayload = await authFetch<unknown>("/refresh", {
      method: "POST",
      body,
      csrf: true,
      accessToken: accessToken ?? null,
      signal: AbortSignal.timeout(1_700),
      forceSameOrigin: true,
    });
    return assertAuthSessionPayload(sameOriginPayload);
  }

  return assertAuthSessionPayload(payload);
}

export function logoutRequest(accessToken: string): Promise<void> {
  return authFetch<void>("/logout", {
    method: "POST",
    accessToken,
  });
}

export function meRequest(accessToken: string): Promise<AuthMePayload> {
  return authFetch<AuthMePayload>("/me", {
    method: "GET",
    accessToken,
  });
}

export function validateRequest(accessToken: string): Promise<{
  valid: boolean;
  userId: string;
  organizationId: string;
  sessionId: string;
}> {
  return authFetch("/validate", { method: "GET", accessToken });
}

export async function registerRequest(
  body: Record<string, unknown>,
): Promise<{ status: string; email: string; message: string }> {
  return authFetch("/register", { method: "POST", body });
}

export async function forgotPasswordRequest(
  email: string,
): Promise<{ message: string }> {
  return authFetch("/forgot-password", { method: "POST", body: { email } });
}

export async function resetPasswordRequest(input: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  return authFetch("/reset-password", {
    method: "POST",
    body: input,
  });
}

export async function verifyEmailRequest(
  token: string,
): Promise<{ email: string; status: string; message: string }> {
  return authFetch(`/verify-email/${encodeURIComponent(token)}`, {
    method: "POST",
    body: {},
  });
}

export async function verifyOtpRequest(input: {
  code: string;
  email?: string;
}): Promise<{ email: string; status: string; message: string }> {
  return authFetch("/otp/verify", { method: "POST", body: input });
}

export async function resendOtpRequest(
  email: string,
): Promise<{ message: string }> {
  return authFetch("/otp/resend", { method: "POST", body: { email } });
}

export async function logoutEverywhereRequest(
  accessToken: string,
): Promise<void> {
  await authFetch("/logout-everywhere", {
    method: "POST",
    accessToken,
  });
}

export function listSessionsRequest(
  accessToken: string,
): Promise<AuthSessionRow[]> {
  return authFetch("/sessions", { method: "GET", accessToken });
}

export function revokeSessionRequest(
  accessToken: string,
  sessionId: string,
): Promise<void> {
  return authFetch(`/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    accessToken,
  });
}

export function listDevicesRequest(
  accessToken: string,
): Promise<AuthDeviceRow[]> {
  return authFetch("/devices", { method: "GET", accessToken });
}

export function revokeDeviceRequest(
  accessToken: string,
  deviceId: string,
): Promise<void> {
  return authFetch(`/devices/${encodeURIComponent(deviceId)}`, {
    method: "DELETE",
    accessToken,
  });
}

export function loginHistoryRequest(
  accessToken: string,
): Promise<AuthLoginHistoryRow[]> {
  return authFetch("/login-history", { method: "GET", accessToken });
}

export function getInvitationRequest(
  token: string,
): Promise<InvitationPreview> {
  return authFetch(`/invitations/${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export function acceptInvitationRequest(input: {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<AuthSessionPayload> {
  return authFetch(`/invitations/${encodeURIComponent(input.token)}/accept`, {
    method: "POST",
    body: {
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  });
}

export function createInvitationRequest(
  accessToken: string,
  email: string,
): Promise<{ id: string; email: string; expiresAt: string; message: string }> {
  return authFetch("/invitations", {
    method: "POST",
    accessToken,
    body: { email },
  });
}

export function updateProfileRequest(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<AuthUser> {
  return authFetch("/profile", {
    method: "PATCH",
    accessToken,
    body,
  });
}


export function changePasswordRequest(
  accessToken: string,
  input: { currentPassword: string; newPassword: string },
): Promise<{ changed: true }> {
  return authFetch("/password", {
    method: "PATCH",
    accessToken,
    body: input,
  });
}
