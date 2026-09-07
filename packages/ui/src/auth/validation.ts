export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordRules(password: string): {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongEnough(password: string): boolean {
  const r = passwordRules(password);
  return r.minLength && r.hasUpper && r.hasLower && r.hasNumber;
}

/** Same rule as API `strongPassword` in auth-schemas. */
export const PASSWORD_POLICY_HINT =
  "Use at least 8 characters with uppercase, lowercase, and a number.";

/**
 * Allow only in-app paths. Reject protocol-relative, encoded, and host-qualified URLs.
 */
export function safeInternalPath(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }
  if (trimmed === "/") return fallback;
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(trimmed.slice(1))) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\") || trimmed.includes("@")) {
    return fallback;
  }
  return trimmed;
}
