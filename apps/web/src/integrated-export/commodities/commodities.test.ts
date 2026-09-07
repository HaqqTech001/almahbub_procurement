import { describe, expect, it } from "vitest";

import {
  assertIeCommodityRecordInvariants,
  getIeCommodityPreviews,
  getPublishedIeCommodityBySlug,
  IE_COMMODITY_RECORDS,
  isValidIeCommoditySlug,
  listPublishedIeCommodities,
  toIeCommodityPreview,
  type IeCommodity,
} from "./index.js";

/** Test-only fixtures - never imported into the production store. */
const FIXTURE_PUBLISHED: IeCommodity = {
  id: "test-ie-commodity-published",
  slug: "fixture-commodity-alpha",
  name: "Fixture Commodity Alpha",
  published: true,
  category: "Test category",
  shortDescription: "Short approved fixture copy.",
  sortOrder: 2,
};

const FIXTURE_MINIMAL_PUBLISHED: IeCommodity = {
  id: "test-ie-commodity-minimal",
  slug: "fixture-commodity-minimal",
  name: "Fixture Commodity Minimal",
  published: true,
  sortOrder: 1,
};

const FIXTURE_DRAFT: IeCommodity = {
  id: "test-ie-commodity-draft",
  slug: "fixture-commodity-draft",
  name: "Fixture Commodity Draft",
  published: false,
  shortDescription: "Must never appear publicly.",
};

const FIXTURE_SET: readonly IeCommodity[] = [
  FIXTURE_PUBLISHED,
  FIXTURE_MINIMAL_PUBLISHED,
  FIXTURE_DRAFT,
];

describe("IE-3A commodity domain contract", () => {
  it("keeps the static public catalogue empty until owner-verified publication", () => {
    expect(IE_COMMODITY_RECORDS).toHaveLength(0);
    expect(listPublishedIeCommodities()).toEqual([]);
    expect(getPublishedIeCommodityBySlug("sesame")).toBeNull();
    expect(getPublishedIeCommodityBySlug("sesame-seeds")).toBeNull();
    expect(getPublishedIeCommodityBySlug("cashew")).toBeNull();
    assertIeCommodityRecordInvariants(IE_COMMODITY_RECORDS);
  });

  it("IE-9: homepage previews and catalogue share the empty published store", () => {
    expect(getIeCommodityPreviews()).toHaveLength(0);
    expect(listPublishedIeCommodities()).toHaveLength(0);
    expect(IE_COMMODITY_RECORDS).toHaveLength(0);
  });

  it("represents a published commodity and excludes unpublished from public data", () => {
    const published = listPublishedIeCommodities(FIXTURE_SET);
    expect(published.map((item) => item.slug)).toEqual([
      "fixture-commodity-minimal",
      "fixture-commodity-alpha",
    ]);
    expect(published.some((item) => item.slug === "fixture-commodity-draft")).toBe(
      false,
    );
    expect(getPublishedIeCommodityBySlug("fixture-commodity-draft", FIXTURE_SET)).toBeNull();
    expect(
      getPublishedIeCommodityBySlug("fixture-commodity-alpha", FIXTURE_SET)?.name,
    ).toBe("Fixture Commodity Alpha");
  });

  it("keeps slugs stable and validates URL-safe form", () => {
    expect(isValidIeCommoditySlug("fixture-commodity-alpha")).toBe(true);
    expect(isValidIeCommoditySlug("Bad Slug")).toBe(false);
    expect(isValidIeCommoditySlug("UPPER")).toBe(false);
    const preview = toIeCommodityPreview(FIXTURE_PUBLISHED);
    expect(preview.slug).toBe(FIXTURE_PUBLISHED.slug);
  });

  it("derives homepage previews from the same published source", () => {
    const previews = getIeCommodityPreviews(FIXTURE_SET);
    expect(previews).toHaveLength(2);
    expect(previews[0]).toMatchObject({
      slug: "fixture-commodity-minimal",
      name: "Fixture Commodity Minimal",
      imageSrc: null,
    });
    expect(previews[1]).toMatchObject({
      slug: "fixture-commodity-alpha",
      name: "Fixture Commodity Alpha",
      category: "Test category",
      shortDescription: "Short approved fixture copy.",
      imageSrc: null,
    });
    expect(previews.some((item) => item.slug === "fixture-commodity-draft")).toBe(
      false,
    );
  });

  it("maps hero media into preview when present without inventing defaults", () => {
    const withMedia: IeCommodity = {
      ...FIXTURE_MINIMAL_PUBLISHED,
      heroMedia: { src: "/media/approved-fixture.webp", alt: "Approved fixture media" },
    };
    const preview = toIeCommodityPreview(withMedia);
    expect(preview.imageSrc).toBe("/media/approved-fixture.webp");
    expect(preview.imageAlt).toBe("Approved fixture media");
    expect(preview).not.toHaveProperty("origin");
    expect(preview).not.toHaveProperty("price");
    expect(preview).not.toHaveProperty("certifications");
  });

  it("rejects duplicate slugs in the authoritative set", () => {
    expect(() =>
      assertIeCommodityRecordInvariants([
        FIXTURE_MINIMAL_PUBLISHED,
        { ...FIXTURE_PUBLISHED, slug: "fixture-commodity-minimal" },
      ]),
    ).toThrow(/Duplicate IeCommodity.slug/);
  });
});
