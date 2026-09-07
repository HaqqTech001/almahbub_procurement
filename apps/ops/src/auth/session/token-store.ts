/**
 * Access token lives in memory only (XSS-safe vs localStorage).
 * Refresh token stays in httpOnly cookie set by the API.
 * Optional remember-me preference is a non-secret flag only.
 * Session hint is a non-secret flag so anonymous boots skip /auth/refresh.
 */

const REMEMBER_KEY = "hamd.ops.auth.remember";
const EMAIL_KEY = "hamd.ops.auth.rememberedEmail";
const SESSION_HINT_KEY = "hamd.ops.auth.sessionHint";
const CSRF_KEY = "hamd.ops.auth.csrf";

let accessToken: string | null = null;
let expiresAt = 0;
let csrfToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null, expiresInSeconds?: number): void {
  accessToken = token;
  expiresAt =
    token && expiresInSeconds
      ? Date.now() + Math.max(30, expiresInSeconds - 30) * 1000
      : 0;
  if (token) setSessionHint(true);
}

export function isAccessTokenFresh(): boolean {
  return Boolean(accessToken) && Date.now() < expiresAt;
}

export function clearAccessToken(): void {
  accessToken = null;
  expiresAt = 0;
  setCsrfToken(null);
}

export function getCsrfToken(): string | null {
  if (typeof document !== "undefined") {
    const cookie = document.cookie
      .split("; ")
      .map((row) => row.trim())
      .find((row) => row.startsWith("hamd_csrf="));
    if (cookie) {
      const value = decodeURIComponent(cookie.slice("hamd_csrf=".length));
      if (value) {
        csrfToken = value;
        try {
          window.sessionStorage.setItem(CSRF_KEY, value);
        } catch {
          /* private mode */
        }
        return value;
      }
    }
  }
  if (csrfToken) return csrfToken;
  try {
    return window.sessionStorage.getItem(CSRF_KEY);
  } catch {
    return null;
  }
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
  try {
    if (token) window.sessionStorage.setItem(CSRF_KEY, token);
    else window.sessionStorage.removeItem(CSRF_KEY);
  } catch {
    /* private mode */
  }
}

export function setSessionHint(active: boolean): void {
  try {
    if (active) window.localStorage.setItem(SESSION_HINT_KEY, "1");
    else window.localStorage.removeItem(SESSION_HINT_KEY);
  } catch {
    /* private mode */
  }
}

export function hasSessionHint(): boolean {
  try {
    return window.localStorage.getItem(SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRememberMe(enabled: boolean, email?: string): void {
  try {
    if (enabled) {
      window.localStorage.setItem(REMEMBER_KEY, "1");
      if (email) window.localStorage.setItem(EMAIL_KEY, email);
    } else {
      window.localStorage.removeItem(REMEMBER_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function getRememberMe(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function getRememberedEmail(): string {
  try {
    return window.localStorage.getItem(EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}
