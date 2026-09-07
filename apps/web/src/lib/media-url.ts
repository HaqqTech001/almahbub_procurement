import { browserApiBase } from "./api-origin.js";

/**
 * Resolve media / upload URLs for catalog and marketing surfaces.
 * Relative upload paths are prefixed with the API origin (V1 getFileUrl parity).
 */
export function resolveMediaUrl(
  value: string | null | undefined,
  apiBase?: string,
): string | undefined {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^(https?:)?\/\//i.test(raw) || raw.startsWith("data:") || raw.startsWith("blob:")) {
    return raw;
  }
  if (raw.startsWith("/media/") || raw.startsWith("/almahbub") || raw.startsWith("/api/v1/public/catalog-media/")) {
    return raw;
  }
  const base = (apiBase ?? browserApiBase()).replace(/\/$/, "");
  if (
    raw.startsWith("/uploads") ||
    raw.startsWith("uploads/") ||
    raw.startsWith("/api/v1/documents/")
  ) {
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${path}` : path;
  }
  if (raw.startsWith("/")) return raw;
  return base ? `${base}/${raw.replace(/^\//, "")}` : `/${raw}`;
}
