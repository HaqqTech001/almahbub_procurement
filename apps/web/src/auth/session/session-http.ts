import { sessionAwareFetch, type SessionRetryHooks } from "@hamd/ui/auth";

let hooks: SessionRetryHooks | null = null;

export function configureWebSession(next: SessionRetryHooks | null): void {
  hooks = next;
}

export async function sessionFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  return sessionAwareFetch(input, init, hooks);
}
