export type RefreshOutcome = "refreshed" | "transient" | "expired";

const TERMINAL_CODES = new Set([
  "INVALID_REFRESH_TOKEN",
  "SESSION_REVOKED",
  "UNAUTHENTICATED",
]);

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object") return "";
  const candidate = error as { code?: unknown; name?: unknown };
  return typeof candidate.code === "string" ? candidate.code.trim().toUpperCase() : "";
}

function errorStatus(error: unknown): number {
  if (!error || typeof error !== "object") return 0;
  const candidate = error as { status?: unknown; statusCode?: unknown };
  if (typeof candidate.status === "number") return candidate.status;
  if (typeof candidate.statusCode === "number") return candidate.statusCode;
  return 0;
}

function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; code?: unknown };
  return candidate.name === "AbortError" || candidate.code === "ABORT_ERR";
}

/** True only when the refresh session itself is invalid, expired, or revoked. */
export function isTerminalRefreshFailure(error: unknown): boolean {
  if (isAbortError(error)) return false;
  const code = errorCode(error);
  const status = errorStatus(error);
  if (
    code === "NETWORK_ERROR" ||
    code === "CSRF_VALIDATION_FAILED" ||
    code === "TOO_MANY_REQUESTS" ||
    code === "AUTH_RATE_LIMITED" ||
    status === 0 ||
    status === 429 ||
    status >= 500
  ) {
    return false;
  }
  // CSRF failures are retryable after the cookie/header is refreshed. A
  // forbidden/unauthenticated refresh session is terminal and must sign out.
  if (code === "CSRF_VALIDATION_FAILED") return false;
  if (code === "FORBIDDEN" || code === "UNAUTHENTICATED" || status === 403) return true;
  if (TERMINAL_CODES.has(code)) return true;
  return status === 401 && (code === "" || TERMINAL_CODES.has(code));
}

export function classifyRefreshFailure(error: unknown): "transient" | "expired" {
  return isTerminalRefreshFailure(error) ? "expired" : "transient";
}

export function logSessionEvent(
  event: string,
  fields?: Record<string, string | number | boolean | undefined>,
): void {
  const debug =
    (typeof import.meta !== "undefined" &&
      Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)) ||
    (typeof process !== "undefined" && process.env.NODE_ENV !== "production");
  if (!debug) return;
  const safe = { ...fields };
  delete safe.token;
  delete safe.accessToken;
  delete safe.refreshToken;
  delete safe.csrf;
  console.info("[hamd-session]", event, safe);
}

export async function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks =
    typeof navigator !== "undefined"
      ? (
          navigator as Navigator & {
            locks?: {
              request: (name: string, callback: () => Promise<T>) => Promise<T>;
            };
          }
        ).locks
      : undefined;
  if (!locks?.request) return run();
  return locks.request("hamd-auth-refresh", run);
}
