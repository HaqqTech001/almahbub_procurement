/** Safe in-app redirect targets for OAuth and post-login return URLs. */
export function sanitizeReturnTo(value: string, fallback = "/app"): string {
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
