/** In-memory only. Never persist a Google ID token. */
let pendingGoogleCredential: string | null = null;

export function setPendingGoogleCredential(credential: string): void {
  pendingGoogleCredential = credential;
}

export function peekPendingGoogleCredential(): string | null {
  return pendingGoogleCredential;
}

export function takePendingGoogleCredential(): string | null {
  const value = pendingGoogleCredential;
  pendingGoogleCredential = null;
  return value;
}

export function clearPendingGoogleCredential(): void {
  pendingGoogleCredential = null;
}
