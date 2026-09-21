import { configureMediaSession } from "@hamd/ui/auth";
import { browserApiBase } from "../../lib/api-origin.js";
import { sessionAwareFetch, type SessionRetryHooks } from "@hamd/ui/auth";

let hooks: SessionRetryHooks | null = null;

export function configureWebSession(next: SessionRetryHooks | null): void {
  hooks = next;
  configureMediaSession(next, browserApiBase());
}

export async function sessionFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return sessionAwareFetch(input, init, hooks);
}
