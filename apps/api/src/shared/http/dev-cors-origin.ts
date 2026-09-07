/**
 * Development CORS: Chrome on a LAN IP is a different origin than 127.0.0.1.
 * Credentials cannot use `*`. Private-network origins are allowed only outside production.
 */
export function isAllowedDevelopmentBrowserOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
      return true;
    }
    const parts = host.split(".");
    if (parts.length !== 4) return false;
    const octets = parts.map((part) => Number(part));
    if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
    const [a, b] = octets;
    if (a === undefined || b === undefined) return false;
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
  } catch {
    return false;
  }
}
