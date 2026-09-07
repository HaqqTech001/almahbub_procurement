/** Client-side login attempt limiter - complements server authAbuseLimiter. */

const STORAGE_KEY = "hamd.web.auth.loginAttempts";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

type AttemptState = {
  failures: number;
  firstAt: number;
  lockedUntil: number | null;
};

function read(): AttemptState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { failures: 0, firstAt: Date.now(), lockedUntil: null };
    return JSON.parse(raw) as AttemptState;
  } catch {
    return { failures: 0, firstAt: Date.now(), lockedUntil: null };
  }
}

function write(state: AttemptState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function getLoginLockUntil(): number | null {
  const state = read();
  if (state.lockedUntil && state.lockedUntil > Date.now()) {
    return state.lockedUntil;
  }
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    write({ failures: 0, firstAt: Date.now(), lockedUntil: null });
    return null;
  }
  return null;
}

export function isLoginLocked(): boolean {
  return getLoginLockUntil() !== null;
}

export function recordLoginFailure(): { locked: boolean; unlockAt: number | null } {
  const now = Date.now();
  let state = read();
  if (state.lockedUntil && state.lockedUntil > now) {
    return { locked: true, unlockAt: state.lockedUntil };
  }
  if (now - state.firstAt > WINDOW_MS) {
    state = { failures: 0, firstAt: now, lockedUntil: null };
  }
  state.failures += 1;
  if (state.failures >= MAX_ATTEMPTS) {
    state.lockedUntil = now + LOCK_MS;
    write(state);
    return { locked: true, unlockAt: state.lockedUntil };
  }
  write(state);
  return { locked: false, unlockAt: null };
}

export function clearLoginFailures(): void {
  write({ failures: 0, firstAt: Date.now(), lockedUntil: null });
}
