/** Auth API error codes mapped from the enterprise API envelope. */

export class AuthApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly retryAfterSeconds?: number | undefined;

  constructor(options: {
    message: string;
    status: number;
    code: string;
    details?: unknown;
    retryAfterSeconds?: number | undefined;
  }) {
    super(options.message);
    this.name = "AuthApiError";
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.code === "UNAUTHENTICATED";
  }

  get isForbidden(): boolean {
    return this.status === 403 || this.code === "FORBIDDEN";
  }

  get isLocked(): boolean {
    return this.status === 423 && this.code === "ACCOUNT_LOCKED";
  }

  get isRateLimited(): boolean {
    return this.status === 429 || this.code === "TOO_MANY_REQUESTS";
  }

  get isNotImplemented(): boolean {
    return this.status === 404 || this.status === 501 || this.code === "NOT_IMPLEMENTED";
  }

  get isUnverified(): boolean {
    return this.code === "EMAIL_NOT_VERIFIED";
  }

  get isGoogleLinkRequired(): boolean {
    return this.code === "GOOGLE_ACCOUNT_LINK_REQUIRED";
  }

  get linkedEmail(): string | null {
    if (!Array.isArray(this.details)) return null;
    const row = this.details.find(
      (item) =>
        item &&
        typeof item === "object" &&
        "field" in item &&
        (item as { field?: string }).field === "email" &&
        "message" in item &&
        typeof (item as { message?: string }).message === "string",
    ) as { message: string } | undefined;
    return row?.message ?? null;
  }
}

export function isCredentialFailure(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === "INVALID_CREDENTIALS";
}

export function formatAuthError(error: unknown, fallback: string): string {
  if (error instanceof AuthApiError) {
    if (error.isRateLimited) {
      const wait = error.retryAfterSeconds;
      if (wait && wait > 0) {
        return `Too many attempts. Try again in ${wait} seconds.`;
      }
      return error.message || "Too many attempts. Wait briefly and try again.";
    }
    if (error.code === "NETWORK_ERROR") {
      return "Unable to reach the authentication service.";
    }
    return error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}
