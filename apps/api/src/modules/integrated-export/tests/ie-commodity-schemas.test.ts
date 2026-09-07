import { describe, expect, it } from "vitest";

import {
  createIeCommoditySchema,
  ieCommodityListQuerySchema,
  updateIeCommoditySchema,
} from "../api/ie-commodity-schemas.js";
import { isValidIeCommoditySlug } from "../domain/ie-commodity.js";

describe("IE commodity schemas", () => {
  it("requires name and slug; defaults published via service (optional here)", () => {
    const parsed = createIeCommoditySchema.parse({
      name: "TEST COMMODITY ONLY",
      slug: "test-commodity-only",
    });
    expect(parsed.published).toBeUndefined();
    expect(parsed.slug).toBe("test-commodity-only");
  });

  it("rejects invalid slugs and empty update payloads", () => {
    expect(() =>
      createIeCommoditySchema.parse({
        name: "TEST COMMODITY ONLY",
        slug: "Bad Slug",
      }),
    ).toThrow();
    expect(() => updateIeCommoditySchema.parse({})).toThrow();
  });

  it("validates media, specs, and list query defaults", () => {
    const created = createIeCommoditySchema.parse({
      name: "TEST COMMODITY ONLY",
      slug: "test-commodity-only",
      heroMedia: {
        src: "/media/ie/portal/hero/ie-portal-home-hero-01.webp",
        alt: "Representative imagery",
      },
      gallery: [
        {
          src: "/media/ie/portal/quality/ie-portal-quality-detail-01.webp",
          alt: "Detail",
          sortOrder: 1,
        },
      ],
      specifications: [{ label: "Moisture", value: "Owner-supplied only" }],
      applications: ["Test use only"],
    });
    expect(created.heroMedia?.src).toContain("/media/");

    expect(() =>
      createIeCommoditySchema.parse({
        name: "TEST COMMODITY ONLY",
        slug: "test-commodity-only",
        heroMedia: { src: "ftp://evil", alt: "x" },
      }),
    ).toThrow();

    const query = ieCommodityListQuerySchema.parse({});
    expect(query.page).toBe(1);
    expect(query.sort).toBe("sortOrder");
    expect(query.includeUnpublished).toBe(false);
  });

  it("accepts URL-safe slug helper", () => {
    expect(isValidIeCommoditySlug("sesame-seeds")).toBe(true);
    expect(isValidIeCommoditySlug("TEST")).toBe(false);
  });

  it("accepts the seven owner-approved draft creates without publishing", () => {
    const drafts = [
      { name: "Sesame Seeds", slug: "sesame-seeds" },
      { name: "Cashew", slug: "cashew" },
      { name: "Ginger", slug: "ginger" },
      { name: "Hibiscus", slug: "hibiscus" },
      { name: "Shea", slug: "shea" },
      { name: "Soybean", slug: "soybean" },
      { name: "Cocoa", slug: "cocoa" },
    ];
    for (const draft of drafts) {
      const parsed = createIeCommoditySchema.parse(draft);
      expect(parsed.published).toBeUndefined();
      expect(parsed.specifications).toBeUndefined();
      expect(parsed.markets).toBeUndefined();
      expect(parsed.heroMedia).toBeUndefined();
    }
  });
});
