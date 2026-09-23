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

function isAuthSessionPayload(value: unknown): value is AuthSessionPayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const user = row.user;
  return (
    typeof row.accessToken === "string" &&
    row.accessToken.trim().length > 0 &&
    typeof row.expiresIn === "number" &&
    Number.isFinite(row.expiresIn) &&
    row.expiresIn > 0 &&
    typeof row.organizationId === "string" &&
    row.organizationId.trim().length > 0 &&
    Boolean(user && typeof user === "object" && typeof (user as Record<string, unknown>).id === "string")
  );
}

function assertAuthSessionPayload(value: unknown): AuthSessionPayload {
  if (!isAuthSessionPayload(value)) {
    throw new AuthApiError({
      message:
        "The authentication service returned an invalid session response. Check the Ops API URL/proxy configuration.",
      status: 502,
      code: "INVALID_AUTH_RESPONSE",
      details: value,
    });
  }
  return value;
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
  try {
    response = await fetch(authUrl(path), {
      ...requestInit,
      signal: timeoutSignal(2_400, options.signal),
    });
  } catch {
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
  const payload = await authFetch<unknown>("/login", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.rememberMe !== undefined ? { rememberMe: input.rememberMe } : {}),
      ...(input.deviceFingerprint
        ? { deviceFingerprint: input.deviceFingerprint }
        : {}),
      ...(input.deviceName ? { deviceName: input.deviceName } : {}),
      ...(input.devicePlatform ? { devicePlatform: input.devicePlatform } : {}),
    },
  });
  return assertAuthSessionPayload(payload);
}

export async function refreshRequest(accessToken?: string | null): Promise<AuthSessionPayload> {
  const csrf = getCsrfToken() ?? readCookie("hamd_csrf") ?? undefined;
  const payload = await authFetch<unknown>("/refresh", {
    method: "POST",
    body: csrf ? { csrfToken: csrf } : {},
    csrf: true,
    accessToken: accessToken ?? null,
    signal: AbortSignal.timeout(8_000),
  });
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
