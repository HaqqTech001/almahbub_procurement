import { resolveBrowserApiBase } from "@hamd/ui/auth";

export function configuredViteApiUrl(): string {
  return (
    typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL)
      : ""
  ).replace(/\/$/, "");
}

export function browserApiBase(): string {
  const pageOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  return resolveBrowserApiBase(configuredViteApiUrl(), pageOrigin);
}
