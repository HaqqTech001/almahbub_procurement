import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  getInternationalCategoryExtraMedia,
  getInternationalCategoryMedia,
  IE_DEFERRED_COMMODITY_SLUGS,
  IE_PORTAL_MEDIA,
  IE_STAGED_COMMODITY_MEDIA_SLUGS,
  INTERNATIONAL_CATEGORY_MEDIA,
  listInternationalStagedMedia,
  REPRESENTATIVE_MEDIA_CAPTION,
} from "./media-assets.js";

const publicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public",
);

function publicPathExists(src: string): boolean {
  return existsSync(path.join(publicDir, src.replace(/^\//, "")));
}

describe("IE-IMAGE-02 staged media registry", () => {
  it("registers IE portal assets with source, license, alt, authenticity, and path", () => {
    const assets = Object.values(IE_PORTAL_MEDIA);
    expect(assets).toHaveLength(10);
    const filenames = new Set<string>();
    for (const asset of assets) {
      expect(asset.src.startsWith("/media/ie/portal/")).toBe(true);
      expect(asset.alt.length).toBeGreaterThan(8);
      expect(asset.source).toBeTruthy();
      expect(asset.license).toBe("Unsplash License");
      expect(asset.authenticity === "representative" || asset.authenticity === "contextual").toBe(
        true,
      );
      expect(asset.kind).toBe("representative");
      expect(asset.downloadDate).toBe("2026-08-17");
      expect(publicPathExists(asset.src)).toBe(true);
      const filename = asset.src.split("/").pop()!;
      expect(filenames.has(filename)).toBe(false);
      filenames.add(filename);
    }
  });

  it("keeps primary International category media and stages extras without replacing them", () => {
    const slugs = [
      "iphones-gadgets",
      "medical-equipments",
      "home-garden-wares",
      "machineries",
      "general-procurement",
    ] as const;
    for (const slug of slugs) {
      const primary = getInternationalCategoryMedia(slug);
      expect(primary?.src.endsWith(".jpg")).toBe(true);
      expect(publicPathExists(primary!.src)).toBe(true);

      const extras = listInternationalStagedMedia(slug);
      expect(extras.length).toBeGreaterThan(0);
      expect(getInternationalCategoryExtraMedia(slug)).toEqual(
        extras.map((a) => a.src),
      );
      for (const asset of extras) {
        expect(asset.src.includes(`/categories/${slug}/`)).toBe(true);
        expect(asset.src.endsWith(".webp")).toBe(true);
        expect(asset.alt.toLowerCase()).toContain("representative");
        expect(asset.license).toBe("Unsplash License");
        expect(asset.source).toBeTruthy();
        expect(publicPathExists(asset.src)).toBe(true);
      }
    }
    expect(Object.keys(INTERNATIONAL_CATEGORY_MEDIA)).toEqual([...slugs]);
  });

  it("does not create the legacy sesame slug folder or mix International SKUs into IE", () => {
    for (const slug of IE_DEFERRED_COMMODITY_SLUGS) {
      expect(getInternationalCategoryMedia(slug)).toBeUndefined();
      expect(listInternationalStagedMedia(slug)).toEqual([]);
      const commodityDir = path.join(
        publicDir,
        "media/ie/commodities",
        slug,
      );
      expect(existsSync(commodityDir)).toBe(false);
    }
    for (const asset of Object.values(IE_PORTAL_MEDIA)) {
      expect(asset.src.includes("/media/ie/commodities/")).toBe(false);
    }
  });

  it("stages licensed representative files for IE commodity folders without publishing them", () => {
    for (const slug of IE_STAGED_COMMODITY_MEDIA_SLUGS) {
      const commodityDir = path.join(publicDir, "media/ie/commodities", slug);
      expect(existsSync(commodityDir)).toBe(true);
    }
    expect(
      existsSync(
        path.join(
          publicDir,
          "media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        path.join(publicDir, "media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp"),
      ),
    ).toBe(true);
  });

  it("does not show a visible representation caption", () => {
    expect(REPRESENTATIVE_MEDIA_CAPTION).toBe("");
  });
});
