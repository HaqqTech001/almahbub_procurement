import { describe, expect, it } from "vitest";

import {
  getActiveOpsCampaigns,
  isOpsCampaignActive,
  opsCampaigns,
} from "./campaigns.js";

describe("ops admin campaigns", () => {
  it("registers the wedding celebration as ops-only and dismissible", () => {
    const wedding = opsCampaigns.find(
      (campaign) => campaign.id === "founder-wedding-september-2026",
    );
    expect(wedding).toBeDefined();
    expect(wedding?.audience).toBe("ops");
    expect(wedding?.kind).toBe("celebration");
    expect(wedding?.dismissible).toBe(true);
  });

  it("is active inside the September 2026 window and inactive outside", () => {
    const wedding = opsCampaigns[0]!;
    expect(
      isOpsCampaignActive(wedding, new Date("2026-09-15T12:00:00+01:00")),
    ).toBe(true);
    expect(
      isOpsCampaignActive(wedding, new Date("2026-07-01T12:00:00+01:00")),
    ).toBe(false);
    expect(
      isOpsCampaignActive(wedding, new Date("2026-10-01T00:00:00+01:00")),
    ).toBe(false);
  });

  it("returns no campaigns when the register is empty", () => {
    expect(getActiveOpsCampaigns(new Date("2025-01-01T00:00:00Z"))).toEqual([]);
  });
});
