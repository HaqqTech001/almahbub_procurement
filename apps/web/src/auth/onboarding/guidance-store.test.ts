import { describe, expect, it, beforeEach } from "vitest";

import {
  loadGuidancePreference,
  restartAllGuidance,
  updateGuidancePreference,
} from "./guidance-store.js";

describe("guidance preference persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists skip and restart without forcing replay on every load", () => {
    expect(loadGuidancePreference().mode).toBe("guided");
    updateGuidancePreference({
      mode: "off",
      neverAutoStart: true,
      welcomeCompletedAt: "2026-09-01T00:00:00.000Z",
    });
    expect(loadGuidancePreference()).toMatchObject({
      mode: "off",
      neverAutoStart: true,
    });
    const restarted = restartAllGuidance();
    expect(restarted.mode).toBe("guided");
    expect(restarted.neverAutoStart).toBe(false);
    expect(restarted.welcomeCompletedAt).toBeNull();
    expect(loadGuidancePreference().mode).toBe("guided");
  });
});
