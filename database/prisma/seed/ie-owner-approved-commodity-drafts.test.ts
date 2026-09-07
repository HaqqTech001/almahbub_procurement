import { describe, expect, it } from "vitest";

import {
  IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST,
  IE_OWNER_APPROVED_COMMODITY_DRAFTS,
} from "./ie-owner-approved-commodity-drafts.js";

const OWNER_APPROVED_NAMES = [
  "Sesame Seeds",
  "Cashew",
  "Ginger",
  "Hibiscus",
  "Shea",
  "Soybean",
  "Cocoa",
] as const;

describe("IE-11C owner-approved commodity drafts", () => {
  it("seeds exactly the seven owner-approved names as unpublished drafts", () => {
    expect(IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST.published).toBe(false);
    expect(
      IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST.approvedForPublication,
    ).toBe(false);
    expect(IE_OWNER_APPROVED_COMMODITY_DRAFTS).toHaveLength(7);
    expect(IE_OWNER_APPROVED_COMMODITY_DRAFTS.map((row) => row.name)).toEqual([
      ...OWNER_APPROVED_NAMES,
    ]);
    expect(IE_OWNER_APPROVED_COMMODITY_DRAFTS.map((row) => row.slug)).toEqual([
      "sesame-seeds",
      "cashew",
      "ginger",
      "hibiscus",
      "shea",
      "soybean",
      "cocoa",
    ]);
  });

  it("does not invent specs, markets, media, or a sesame slug alias", () => {
    for (const row of IE_OWNER_APPROVED_COMMODITY_DRAFTS) {
      expect(row).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        ),
        slug: expect.stringMatching(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        name: expect.any(String),
        sortOrder: expect.any(Number),
      });
      expect(row).not.toHaveProperty("category");
      expect(row).not.toHaveProperty("specifications");
      expect(row).not.toHaveProperty("markets");
      expect(row).not.toHaveProperty("heroMedia");
      expect(row).not.toHaveProperty("gallery");
      expect(row).not.toHaveProperty("packaging");
      expect(row).not.toHaveProperty("qualityInformation");
      expect(row).not.toHaveProperty("applications");
      expect(row).not.toHaveProperty("shortDescription");
      expect(row).not.toHaveProperty("description");
    }
    expect(
      IE_OWNER_APPROVED_COMMODITY_DRAFTS.some((row) => row.slug === "sesame"),
    ).toBe(false);
  });
});
