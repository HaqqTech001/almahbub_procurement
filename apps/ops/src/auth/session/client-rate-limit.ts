/** Advisory UI cooldown received from the API. PostgreSQL enforces account locks. */
const STORAGE_KEY = "hamd.ops.auth.serverCooldown";
export function getLoginLockUntil(): number | null {
  try {
    // Retire the old browser-wide failure counter; it is not account authority.
    localStorage.removeItem("hamd.web.auth.loginAttempts");
    const until = Number(sessionStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(until) && until > Date.now() && until - Date.now() <= 86_400_000) return until;
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Storage is optional. */ }
  return null;
}
export function rememberLoginLock(retryAfterSeconds: number | undefined): number | null {
  const seconds = retryAfterSeconds;
  const until = seconds !== undefined && Number.isFinite(seconds) && seconds > 0 && seconds <= 86_400
    ? Date.now() + seconds * 1000 : null;
  try { if (until) sessionStorage.setItem(STORAGE_KEY, String(until)); else sessionStorage.removeItem(STORAGE_KEY); } catch { /* optional */ }
  return until;
}
export function clearLoginFailures(): void {
  try { sessionStorage.removeItem(STORAGE_KEY); localStorage.removeItem("hamd.web.auth.loginAttempts"); } catch { /* optional */ }
}
