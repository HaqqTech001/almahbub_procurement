import { describe, expect, it } from "vitest";

import {
  classifyCategory8,
  mapManifestEntry,
  validateMasterManifest,
} from "./map-master-catalogue.js";

type AnyRecord = Record<string, unknown>;

function validEntry(overrides: AnyRecord = {}): AnyRecord {
  return {
    catalogueId: "ALM-001",
    ordinal: 1,
    slug: "sample-product",
    name: "Sample Product",
    category: "Category One",
    entryType: "STANDARD_PRODUCT",
    manufacturer: "Maker",
    variants: [],
    summary: "A verified sourcing entry.",
    keySpecs: {},
    availabilityStatus: "ON_REQUEST",
    verificationStatus: "VERIFIED",
    heroImagePolicy: "OFFICIAL_EXACT_PRODUCT_IMAGE",
    mediaStatus: "PENDING_ACQUISITION",
    ...overrides,
  };
}

function manifest(entries: AnyRecord[] = [validEntry()]): AnyRecord {
  return {
    catalogueVersion: "test",
    generatedFor: "Test",
    generatedOn: "2026-09-20",
    status: "starter",
    catalogueRules: {},
    categories: ["Category One"],
    entries,
  };
}

describe("master catalogue validation", () => {
  it("rejects invalid entry count and duplicate identities", () => {
    const result = validateMasterManifest(manifest([validEntry(), validEntry()]));
    expect(result.manifest).toBeNull();
    expect(result.errors).toEqual(expect.arrayContaining([
      "Expected exactly 10 categories; received 1.",
      "Expected exactly 100 entries; received 2.",
      "Duplicate catalogueId: ALM-001.",
      "Duplicate slug: sample-product.",
    ]));
  });

  it("rejects invalid categories and entry types", () => {
    const result = validateMasterManifest(manifest([validEntry({ category: "Unknown", entryType: "NOT_A_TYPE" })]));
    expect(result.errors).toEqual(expect.arrayContaining([
      "Entry ALM-001: unknown category Unknown.",
      "Entry ALM-001: unsupported entryType NOT_A_TYPE.",
    ]));
  });

  it("validates family variants and services without flattening them", () => {
    const family = validateMasterManifest(manifest([validEntry({ entryType: "PRODUCT_FAMILY", variants: [{ name: "Variant A" }] })]));
    expect(family.errors).not.toContain("Entry ALM-001: PRODUCT_FAMILY requires at least one variant.");
    const service = validateMasterManifest(manifest([validEntry({ entryType: "PROCUREMENT_SERVICE" })]));
    expect(service.errors).not.toContain("Entry ALM-001: PROCUREMENT_SERVICE must not define product variants.");
    const malformed = validateMasterManifest(manifest([validEntry({ entryType: "PRODUCT_FAMILY", variants: [] })]));
    expect(malformed.errors).toContain("Entry ALM-001: PRODUCT_FAMILY requires at least one variant.");
  });

  it("accepts a variantless specification-driven configurable product with a warning", () => {
    const result = validateMasterManifest(manifest([validEntry({ entryType: "CONFIGURABLE_PRODUCT", variants: [] })]));
    expect(result.errors).not.toContain("Entry ALM-001: CONFIGURABLE_PRODUCT requires at least one variant.");
    expect(result.warnings).toContain("Entry ALM-001: configurable product has no predefined variants and is specification-driven.");
  });
});

describe("compatibility mapping", () => {
  const data = {
    products: [
      { id: "p1", slug: "sample-product", name: "Sample Product", status: "published", categorySlug: "category-one", categoryName: "Category One", manufacturerName: "Maker", brandName: null },
      { id: "p2", slug: "legacy-sample", name: "Sample Product Legacy", status: "published", categorySlug: "category-one", categoryName: "Category One", manufacturerName: null, brandName: null },
    ],
    variants: [{ id: "v1", productId: "p1", name: "Variant A", specifications: {} }],
    images: [{ id: "i1", productId: "p1", url: "/media/sample.webp", storageKey: "sample.webp", position: 0, isPrimary: true }],
    requestRefs: [{ productId: "v1", count: 2 }],
    quoteRefs: [],
    manufacturers: [{ legalName: "Maker" }],
    brands: [],
  };

  it("uses exact slug before alias and reports historical references", () => {
    const entry = {
      catalogueId: "ALM-001", ordinal: 1, slug: "sample-product", name: "Sample Product", category: "Category One", entryType: "STANDARD_PRODUCT" as const,
      manufacturer: "Maker", variants: [], summary: "summary", keySpecs: {}, availabilityStatus: "ON_REQUEST" as const, verificationStatus: "verified", heroImagePolicy: "exact", mediaStatus: "pending",
    };
    const result = mapManifestEntry(entry, data, { "legacy-sample": "sample-product" });
    expect(result.mappingStatus).toBe("EXACT_SLUG_MATCH");
    expect(result.historicalReferenceRisk).toBe("HAS_HISTORICAL_REFERENCES");
    expect(result.recommendedAction).toBe("MANUAL_REVIEW");
  });

  it("uses explicit aliases and never creates fuzzy automatic matches", () => {
    const entry = {
      catalogueId: "ALM-002", ordinal: 2, slug: "new-product", name: "Sample Product Legacy", category: "Category One", entryType: "STANDARD_PRODUCT" as const,
      manufacturer: null, variants: [], summary: "summary", keySpecs: {}, availabilityStatus: "ON_REQUEST" as const, verificationStatus: "verified", heroImagePolicy: "exact", mediaStatus: "pending",
    };
    expect(mapManifestEntry(entry, data, {}).mappingStatus).toBe("MANUAL_REVIEW");
    expect(mapManifestEntry({ ...entry, slug: "other-product", name: "No Relation" }, data, {}).mappingStatus).toBe("CREATE_NEW_DRAFT");
    expect(mapManifestEntry({ ...entry, slug: "new-product-2" }, data, { "legacy-sample": "new-product-2" }).mappingStatus).toBe("ALIAS_MATCH");
  });

  it("produces deterministic mapping output", () => {
    const entry = {
      catalogueId: "ALM-003", ordinal: 3, slug: "sample-product-3", name: "Sample Product", category: "Category One", entryType: "STANDARD_PRODUCT" as const,
      manufacturer: null, variants: [], summary: "summary", keySpecs: {}, availabilityStatus: "ON_REQUEST" as const, verificationStatus: "verified", heroImagePolicy: "exact", mediaStatus: "pending",
    };
    expect(mapManifestEntry(entry, data, {})).toEqual(mapManifestEntry(entry, data, {}));
  });
});

describe("Category 8 classification", () => {
  it("flags prohibited textiles and keeps relevant lifestyle products", () => {
    expect(classifyCategory8("Corporate uniform set")).toBe("LEGACY_ARCHIVE_CANDIDATE");
    expect(classifyCategory8("Leather travel bag")).toBe("KEEP_AND_MAP");
    expect(classifyCategory8("Unclear commercial item")).toBe("MANUAL_REVIEW");
  });
});
