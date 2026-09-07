import { describe, expect, it } from "vitest";

import { wizardProgressPercent } from "./ProcurementProgress.js";

describe("wizardProgressPercent", () => {
  it("uses (currentIndex + 1) / total * 100 for the wizard variant", () => {
    expect(wizardProgressPercent(0, 5)).toBe(20);
    expect(wizardProgressPercent(1, 5)).toBe(40);
    expect(wizardProgressPercent(2, 5)).toBe(60);
    expect(wizardProgressPercent(3, 5)).toBe(80);
    expect(wizardProgressPercent(4, 5)).toBe(100);
  });

  it("clamps out-of-range indexes and empty totals", () => {
    expect(wizardProgressPercent(-2, 5)).toBe(20);
    expect(wizardProgressPercent(99, 5)).toBe(100);
    expect(wizardProgressPercent(0, 0)).toBe(0);
  });
});
