import { readResponseBody, toCancelledRequestError, unwrapEnvelopeData } from "@hamd/ui/auth";

import { sessionFetch } from "../auth/session/session-http.js";
import { browserApiBase } from "./api-origin.js";

export class OpsApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "OpsApiError";
    this.status = status;
    this.code = code;
  }
}

type Envelope<T> = {
  data: T;
  page?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  error?: { code?: string; message?: string };
};

function apiBase(): string {
  return browserApiBase();
}

export function opsApiUrl(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

export type OpsFetchOptions = {
  method?: string;
  body?: unknown;
  form?: FormData;
  accessToken: string;
  query?: Record<string, string | number | boolean | undefined>;
};

async function requestOps(
  path: string,
  options: OpsFetchOptions,
): Promise<{ status: number; body: unknown }> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined && !options.form) {
    headers["Content-Type"] = "application/json";
  }

  let url = opsApiUrl(path);
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  let response: Response;
  try {
    response = await sessionFetch(url, {
      method:
        options.method ??
        (options.body !== undefined || options.form ? "POST" : "GET"),
      headers,
      body: options.form
        ? options.form
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      credentials: "include",
    });
  } catch (error) {
    const cancelled = toCancelledRequestError(error);
    if (cancelled) throw cancelled;
    throw error;
  }
  if (response.status === 204 || response.status === 205) {
    return { status: response.status, body: null };
  }
  return { status: response.status, body: await readResponseBody(response) };
}

function throwIfFailed(status: number, body: unknown): void {
  if (status >= 200 && status < 300) return;
  const envelope = body as {
    error?: { code?: string; message?: string };
    message?: string;
  } | null;
  throw new OpsApiError(
    envelope?.error?.message ?? envelope?.message ?? "Request failed.",
    status,
    envelope?.error?.code ?? "OPS_ERROR",
  );
}

/**
 * Shared Bearer fetch with envelope unwrap for ops host API clients.
 */
export async function opsFetch<T>(
  path: string,
  options: OpsFetchOptions,
): Promise<T> {
  const { status, body } = await requestOps(path, options);
  if (status === 204 || status === 205) return undefined as T;
  throwIfFailed(status, body);
  return unwrapEnvelopeData<T>(body);
}

export async function opsFetchEnvelope<T>(
  path: string,
  options: OpsFetchOptions,
): Promise<Envelope<T>> {
  const { status, body } = await requestOps(path, options);
  throwIfFailed(status, body);
  const envelope = body as Envelope<T> | null;
  if (envelope && typeof envelope === "object" && "data" in envelope) {
    return envelope;
  }
  return { data: body as T };
}

export async function requireOpsToken(
  ensureSession: () => Promise<string | null>,
  getAccessToken: () => string | null,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new OpsApiError(
      "Sign in again to continue.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
