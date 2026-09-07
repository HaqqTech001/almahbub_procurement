/**
 * Guidance preference persistence - first-login onboarding.
 * Survives across sessions; restartable from Settings.
 */

import type {
  GuidanceMode,
  GuidanceUserPreference,
  GuidanceUserProgress,
} from "@hamd/ui/guidance";

const PREF_KEY = "hamd.web.guidance.preference";
const PROGRESS_KEY = "hamd.web.guidance.progress";
const DISMISSED_KEY = "hamd.web.guidance.dismissedTips";

const defaultPreference: GuidanceUserPreference = {
  mode: "guided",
  neverAutoStart: false,
  welcomeCompletedAt: null,
  locale: "en",
  suppressedTourKeys: [],
};

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
    /* ignore */
  }
}

export function loadGuidancePreference(): GuidanceUserPreference {
  return { ...defaultPreference, ...readJson(PREF_KEY, {}) };
}

export function saveGuidancePreference(
  preference: GuidanceUserPreference,
): void {
  writeJson(PREF_KEY, preference);
}

export function updateGuidancePreference(
  patch: Partial<GuidanceUserPreference> & { mode?: GuidanceMode },
): GuidanceUserPreference {
  const next = { ...loadGuidancePreference(), ...patch };
  saveGuidancePreference(next);
  return next;
}

export function loadGuidanceProgress(): GuidanceUserProgress[] {
  const parsed = readJson<unknown>(PROGRESS_KEY, []);
  return Array.isArray(parsed) ? (parsed as GuidanceUserProgress[]) : [];
}

export function saveGuidanceProgress(progress: GuidanceUserProgress[]): void {
  writeJson(PROGRESS_KEY, progress);
}

export function resetGuidanceProgress(scope: "current" | "all", tourId?: string): void {
  if (scope === "all") {
    saveGuidanceProgress([]);
    return;
  }
  if (!tourId) {
    saveGuidanceProgress([]);
    return;
  }
  saveGuidanceProgress(
    loadGuidanceProgress().filter((item) => item.tourId !== tourId),
  );
}

export function loadDismissedTipIds(): string[] {
  return readJson<string[]>(DISMISSED_KEY, []);
}

export function dismissTipId(tipId: string): string[] {
  const next = Array.from(new Set([...loadDismissedTipIds(), tipId]));
  writeJson(DISMISSED_KEY, next);
  return next;
}

export function restartAllGuidance(): GuidanceUserPreference {
  saveGuidanceProgress([]);
  writeJson(DISMISSED_KEY, []);
  return updateGuidancePreference({
    welcomeCompletedAt: null,
    neverAutoStart: false,
    mode: "guided",
    suppressedTourKeys: [],
  });
}
