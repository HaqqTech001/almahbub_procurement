import { sessionAwareFetch, type SessionRetryHooks } from "./session-retry.js";
let session: { hooks: SessionRetryHooks; apiOrigin: string } | null = null;
/** Hosts supply the same session hooks used by their normal API requests. */
export function configureMediaSession(hooks: SessionRetryHooks | null, apiOrigin = ""): void {
  session = hooks ? { hooks, apiOrigin } : null;
}
export function isPrivateDocument(href: string): boolean {
  try { return /^\/api\/v1\/documents\/[^/]+$/.test(new URL(href, "https://local.invalid").pathname); } catch { return false; }
}
export async function fetchAuthenticatedMedia(href: string): Promise<Response> {
  if (!session || !isPrivateDocument(href)) throw new Error("Your session has expired. Please sign in again to continue.");
  // Never send a credential to an origin supplied by a message or attachment.
  const path = new URL(href, "https://local.invalid").pathname;
  return sessionAwareFetch(`${session.apiOrigin}${path}`, {}, session.hooks);
}
