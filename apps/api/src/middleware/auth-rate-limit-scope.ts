import type { Request } from "express";

/** Stable operation groups; never key by tokens, query strings, or claimed email. */
export function authOperation(path: string): string {
  const route = path.toLowerCase().replace(/^\/auth(?=\/|$)/, "").replace(/\/$/, "");
  if (route === "/login") return "password-login";
  if (route === "/refresh") return "session-refresh";
  if (route.startsWith("/google")) return "google";
  if (route.startsWith("/verify-email") || route === "/otp/verify") return "verification";
  if (["/otp/resend", "/resend-verification"].includes(route)) return "verification-delivery";
  if (route.startsWith("/invitations")) return "invitations";
  if (["/register", "/forgot-password", "/reset-password"].includes(route)) return route.slice(1);
  return "session-management";
}
export function clientIp(request: Request): string {
  // Express alone resolves proxy trust; never read X-Forwarded-For here.
  const ip = request.ip || request.socket.remoteAddress || "unknown";
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}
export const authRateLimitKey = (request: Request): string => `${authOperation(request.path)}:${clientIp(request)}`;
export const apiRateLimitKey = (request: Request): string =>
  `${/^\/auth(?:\/|$)/i.test(request.path) ? `auth:${authOperation(request.path)}` : "general"}:${clientIp(request)}`;
