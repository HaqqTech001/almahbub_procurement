/**
 * Browser API origin for cookie and LAN-safe fetches.
 *
 * Loopback VITE_API_URL from a different page origin hits the *client* machine
 * (phone/tablet) or drops SameSite cookies on cross-port POSTs. Use same-origin
 * `/api` (Vite proxy) in those cases. Production split hosts keep the configured URL.
 */
export function resolveBrowserApiBase(
  configured: string,
  pageOrigin?: string,
): string {
  const base = configured.trim().replace(/\/$/, "");
  if (!pageOrigin) return base;
  try {
    const page = new URL(pageOrigin);
    if (!base) return "";
    const api = new URL(base, pageOrigin);
    if (api.origin === page.origin) return base;
    const loopback = (host: string) =>
      host === "localhost" || host === "127.0.0.1" || host === "[::1]";
    if (loopback(api.hostname) && api.origin !== page.origin) {
      return "";
    }
  } catch {
    return "";
  }
  return base;
}

/**
 * After a failed refresh, never leave UI status as "booting".
 * Retry in the background only when an access token still exists.
 */
export function statusAfterFailedRefresh(input: {
  kind: "transient" | "expired";
  hasAccessToken: boolean;
}): "authenticated" | "anonymous" {
  if (input.kind === "transient" && input.hasAccessToken) {
    return "authenticated";
  }
  return "anonymous";
}
