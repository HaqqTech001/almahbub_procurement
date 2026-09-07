import { describe, expect, it } from "vitest";

import {
  announcementSystem,
  getActiveCampaigns,
  isAnnouncementSystemEnabled,
  isCampaignActive,
  siteCampaigns,
  type SiteCampaign,
} from "./campaigns.js";

describe("announcement system", () => {
  it("registers the September wedding campaign as enabled", () => {
    const wedding = siteCampaigns.find(
      (campaign) => campaign.id === "founder-wedding-september-2026",
    );
    expect(wedding).toBeDefined();
    expect(wedding?.kind).toBe("celebration");
    expect(wedding?.enabled).toBe(true);
    expect(wedding?.dismissible).toBe(false);
    expect(wedding?.animation).toBe("confetti");
    expect(wedding?.ctaLabel).toBeUndefined();
    expect(
      wedding?.slides?.some((slide) => slide.line.includes("Rowdotul HAMD'26")),
    ).toBe(true);
    expect(wedding?.slides?.[0]?.line).toMatch(/Rowdotul HAMD'26/);
    expect(wedding?.href).toBeUndefined();
    for (const slide of wedding?.slides ?? []) {
      expect(slide.line).not.toContain("\u2014");
      expect(slide.whisper ?? "").not.toContain("\u2014");
    }
  });

  it("activates inside the configured window and expires after endAt", () => {
    const wedding = siteCampaigns[0];
    expect(wedding).toBeDefined();
    if (!wedding) return;
    expect(
      isCampaignActive(wedding, new Date("2026-09-15T12:00:00+01:00")),
    ).toBe(true);
    expect(
      isCampaignActive(wedding, new Date("2026-08-06T12:00:00+01:00")),
    ).toBe(true);
    expect(
      isCampaignActive(wedding, new Date("2026-07-01T12:00:00+01:00")),
    ).toBe(false);
    expect(
      isCampaignActive(wedding, new Date("2026-10-01T00:00:00+01:00")),
    ).toBe(false);
  });

  it("can be disabled by campaign.enabled without code changes", () => {
    const wedding = siteCampaigns[0];
    expect(wedding).toBeDefined();
    if (!wedding) return;
    const disabled: SiteCampaign = { ...wedding, enabled: false };
    expect(
      isCampaignActive(disabled, new Date("2026-09-15T12:00:00+01:00")),
    ).toBe(false);
  });

  it("can be disabled by announcementSystem.enabled", () => {
    const wedding = siteCampaigns[0];
    expect(wedding).toBeDefined();
    if (!wedding) return;
    expect(
      isCampaignActive(wedding, new Date("2026-09-15T12:00:00+01:00"), {
        system: { ...announcementSystem, enabled: false },
      }),
    ).toBe(false);
    expect(
      isAnnouncementSystemEnabled({ ...announcementSystem, enabled: false }),
    ).toBe(false);
  });

  it("supports preview of all enabled campaigns", () => {
    const active = getActiveCampaigns(new Date("2020-01-01"), {
      previewAll: true,
    });
    expect(active.length).toBe(siteCampaigns.filter((c) => c.enabled).length);
  });
});
