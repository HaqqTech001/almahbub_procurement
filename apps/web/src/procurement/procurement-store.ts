/**
 * Browser-only wizard draft autosave. Server records live in apps/api.
 */

const DRAFT_KEY = "hamd.web.procurement.wizardDraft";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function saveWizardDraft(draft: unknown): void {
  writeJson(DRAFT_KEY, draft);
}

export function loadWizardDraft<T>(): T | null {
  return readJson<T | null>(DRAFT_KEY, null);
}

export function clearWizardDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
