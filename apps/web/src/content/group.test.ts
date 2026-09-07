import { describe, expect, it } from "vitest";

import { GROUP, GROUP_BUSINESSES } from "./group.js";

describe("Almahbub Group content", () => {
  it("keeps the two businesses distinct", () => {
    expect(GROUP.name).toBe("Almahbub Group");
    expect(GROUP.exploreLabel).toBe("Explore our businesses");
    expect(GROUP.tagline).toMatch(/two distinct businesses/i);
    expect(GROUP_BUSINESSES.map((item) => item.name)).toEqual([
      "Almahbub International",
      "Almahbub Integrated Export Ltd.",
    ]);
    expect(GROUP_BUSINESSES[1]?.summary).toMatch(/separately registered/i);
    expect(GROUP_BUSINESSES[1]?.capabilities).toEqual([
      "Agro commodities",
      "Bulk supply",
      "Export",
    ]);
    expect(GROUP_BUSINESSES[0]?.href).toBe("/businesses/almahbub-international");
    expect(GROUP_BUSINESSES[1]?.href).toBe("/businesses/almahbub-integrated-export");
  });

  it("does not invent legal claims", () => {
    const blob = JSON.stringify({ GROUP, GROUP_BUSINESSES });
    expect(blob).not.toMatch(/RC\s?\d/);
    expect(blob).not.toMatch(/subsidiary/i);
    expect(blob).not.toMatch(/ownership percentage/i);
  });

  it("exposes replaceable Integrated Export brand tokens", async () => {
    const { INTEGRATED_EXPORT_BRAND, INTEGRATED_EXPORT_PORTAL } = await import("./group.js");
    expect(INTEGRATED_EXPORT_BRAND.logoSrc).toBe(
      "/media/brands/almahbub-integrated-export.jpg",
    );
    expect(INTEGRATED_EXPORT_BRAND.cssVars.light["--aie-accent"]).toMatch(/^#/);
    expect(INTEGRATED_EXPORT_PORTAL.nav.map((item) => item.label)).toEqual([
      "Home",
      "Commodities",
      "Our Process",
      "Quality & Compliance",
      "Global Markets",
      "About",
      "Contact",
    ]);
    expect(INTEGRATED_EXPORT_PORTAL.nav.every((item) => item.href.startsWith("/"))).toBe(
      true,
    );
  });
});
