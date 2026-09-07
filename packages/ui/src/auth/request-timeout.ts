/** Browser fetches must not stay pending without a user-visible outcome. */
export const BROWSER_REQUEST_TIMEOUT_MS = 20_000;
export const AUTH_BOOTSTRAP_TIMEOUT_MS = 12_000;
const MUTATION_REQUEST_TIMEOUT_MS = 45_000;

export function abortSignalAfter(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export function timeoutMsForMethod(method?: string): number {
  const normalized = (method ?? "GET").toUpperCase();
  if (normalized === "GET" || normalized === "HEAD" || normalized === "OPTIONS") {
    return BROWSER_REQUEST_TIMEOUT_MS;
  }
  return MUTATION_REQUEST_TIMEOUT_MS;
}

export function signalWithTimeout(
  existing?: AbortSignal | null,
  ms: number = BROWSER_REQUEST_TIMEOUT_MS,
): AbortSignal {
  const timeout = abortSignalAfter(ms);
  if (!existing) return timeout;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any([existing, timeout]);
  }
  const merged = new AbortController();
  const abort = () => merged.abort();
  if (existing.aborted || timeout.aborted) {
    merged.abort();
    return merged.signal;
  }
  existing.addEventListener("abort", abort, { once: true });
  timeout.addEventListener("abort", abort, { once: true });
  return merged.signal;
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const code = "code" in error ? String(error.code) : "";
  return (
    name === "AbortError" ||
    name === "TimeoutError" ||
    name === "CancelledRequestError" ||
    code === "ABORT_ERR"
  );
}

export class CancelledRequestError extends Error {
  constructor(message = "Request cancelled") {
    super(message);
    this.name = "CancelledRequestError";
  }
}

export function isCancelledRequest(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (error instanceof CancelledRequestError) return true;
  return isAbortError(error);
}

export function toCancelledRequestError(error: unknown): CancelledRequestError | null {
  if (!isCancelledRequest(error)) return null;
  if (error instanceof CancelledRequestError) return error;
  return new CancelledRequestError(
    error instanceof Error && error.message ? error.message : "Request cancelled",
  );
}

export function userFacingRequestError(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string | null {
  if (isCancelledRequest(error)) return null;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isNoContentStatus(status: number): boolean {
  return status === 204 || status === 205 || status === 304;
}

function shouldParseJson(contentType: string, raw: string): boolean {
  if (/json/i.test(contentType)) return true;
  if (contentType.trim() === "") {
    const trimmed = raw.trimStart();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  }
  return false;
}

export async function readResponseBody(response: Response): Promise<unknown> {
  if (isNoContentStatus(response.status)) return null;
  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") return null;

  const contentType = response.headers.get("content-type") ?? "";
  const raw = await response.text();
  if (!raw.trim()) return null;
  if (!shouldParseJson(contentType, raw)) return raw;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("The server returned an unreadable response.");
  }
}

export function unwrapEnvelopeData<T>(body: unknown): T {
  if (body == null) return undefined as T;
  if (Array.isArray(body)) return body as T;
  if (typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function createFetchGate() {
  let generation = 0;
  return {
    next(): number {
      generation += 1;
      return generation;
    },
    isCurrent(id: number): boolean {
      return id === generation;
    },
  };
}

/**
 * A successful mutation stays successful even if a later refetch fails.
 */
const TRANSIENT_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function isTransientHttpStatus(status: number): boolean {
  return TRANSIENT_HTTP_STATUSES.has(status);
}

function isIdempotentMethod(method?: string): boolean {
  const normalized = (method ?? "GET").toUpperCase();
  return normalized === "GET" || normalized === "HEAD";
}

/**
 * Bounded retry for idempotent GETs on network/5xx only.
 * Never retries 400/401/403/404 or mutations (including login).
 */
export async function fetchWithTransientRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  const method = typeof init.method === "string" ? init.method : "GET";
  const maxAttempts = isIdempotentMethod(method) ? 3 : 1;
  const delaysMs = [0, 280, 900];
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt] ?? 900));
    }
    try {
      const response = await fetchImpl(input, init);
      if (attempt === maxAttempts - 1 || !isTransientHttpStatus(response.status)) {
        return response;
      }
    } catch (error) {
      const cancelled = toCancelledRequestError(error);
      if (cancelled) throw cancelled;
      lastError = error;
      if (attempt === maxAttempts - 1) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("We couldn't load this information.");
}

export async function runMutationThenRefresh<T>(args: {
  mutate: () => Promise<T>;
  refresh?: () => Promise<unknown>;
}): Promise<{ result: T; refreshError: unknown | null }> {
  const result = await args.mutate();
  if (!args.refresh) return { result, refreshError: null };
  try {
    await args.refresh();
    return { result, refreshError: null };
  } catch (error) {
    if (isCancelledRequest(error)) return { result, refreshError: null };
    return { result, refreshError: error };
  }
}
