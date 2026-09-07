import {
  fetchWithTransientRetry,
  signalWithTimeout,
  timeoutMsForMethod,
  toCancelledRequestError,
} from "./request-timeout.js";

export type SessionRefreshResult = boolean | "transient";

export type SessionRetryHooks = {
  getAccessToken: () => string | null;
  ensureSession: () => Promise<string | null>;
  refreshSession: () => Promise<SessionRefreshResult>;
  onSessionLost: () => void;
};

const EXPIRY_CODES = new Set([
  "UNAUTHENTICATED",
  "SESSION_REVOKED",
  "INVALID_REFRESH_TOKEN",
]);

const refreshInflight = new WeakMap<object, Promise<SessionRefreshResult>>();

export function isAuthExpiryResponse(
  status: number,
  code?: string | null,
): boolean {
  if (status !== 401) return false;
  if (!code) return true;
  const normalized = code.trim().toUpperCase();
  if (normalized === "FORBIDDEN" || normalized === "CSRF_VALIDATION_FAILED") {
    return false;
  }
  return EXPIRY_CODES.has(normalized) || normalized.includes("UNAUTHENTICATED");
}

export async function peekErrorCode(response: Response): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as {
      error?: { code?: string };
      code?: string;
    };
    return body.error?.code ?? body.code ?? null;
  } catch {
    return null;
  }
}

function unauthenticatedError(): Error {
  const error = new Error("Authentication required.");
  Object.assign(error, { status: 401, code: "UNAUTHENTICATED" });
  return error;
}

async function sharedRefresh(hooks: SessionRetryHooks): Promise<SessionRefreshResult> {
  const existing = refreshInflight.get(hooks);
  if (existing) return existing;
  const pending = Promise.resolve()
    .then(() => hooks.refreshSession())
    .finally(() => {
      refreshInflight.delete(hooks);
    });
  refreshInflight.set(hooks, pending);
  return pending;
}

/**
 * Run an authenticated fetch once, refresh+retry on 401 expiry, then give up.
 * 403 is never treated as session expiry. Concurrent callers share one refresh.
 */
export async function runWithSessionRetry(
  execute: (accessToken: string) => Promise<Response>,
  hooks: SessionRetryHooks,
): Promise<Response> {
  let token = hooks.getAccessToken();
  if (!token) token = await hooks.ensureSession();
  if (!token) {
    throw unauthenticatedError();
  }

  const first = await execute(token);
  if (first.status !== 401) return first;

  const code = await peekErrorCode(first);
  if (!isAuthExpiryResponse(401, code)) return first;

  const refreshed = await sharedRefresh(hooks);
  if (refreshed === "transient") {
    return first;
  }
  const next = refreshed ? hooks.getAccessToken() : null;
  if (!next) {
    hooks.onSessionLost();
    return first;
  }
  return execute(next);
}

export async function sessionAwareFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  hooks: SessionRetryHooks | null,
): Promise<Response> {
  const method = typeof init.method === "string" ? init.method : "GET";
  const nextInit: RequestInit = {
    credentials: "include",
    ...init,
    signal: signalWithTimeout(init.signal ?? undefined, timeoutMsForMethod(method)),
  };

  try {
    if (!hooks) {
      return await fetchWithTransientRetry(input, nextInit);
    }
    return await runWithSessionRetry((accessToken) => {
      const headers = new Headers(nextInit.headers);
      headers.set("Authorization", `Bearer ${accessToken}`);
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      return fetchWithTransientRetry(input, { ...nextInit, headers });
    }, hooks);
  } catch (error) {
    const cancelled = toCancelledRequestError(error);
    if (cancelled) throw cancelled;
    throw error;
  }
}
