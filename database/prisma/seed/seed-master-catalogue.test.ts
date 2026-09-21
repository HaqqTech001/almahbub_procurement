import { describe, expect, it } from "vitest";

import { buildSeedVariantRows } from "./seed-master-catalogue.js";

function entry(
  entryType: "STANDARD_PRODUCT" | "PRODUCT_FAMILY" | "PROCUREMENT_SERVICE" | "CONFIGURABLE_PRODUCT",
  variants: Array<Record<string, unknown> & { name: string }> = [],
) {
  return {
    catalogueId: "ALM-001",
    ordinal: 1,
    slug: "sample",
    name: "Sample",
    category: "Electronics / Mobile / Digital Technology",
    entryType,
    manufacturer: "Maker",
    variants,
    summary: "Summary",
    keySpecs: {},
    availabilityStatus: "ON_REQUEST" as const,
    verificationStatus: "VERIFIED",
    heroImagePolicy: "OFFICIAL_EXACT_PRODUCT_IMAGE",
    mediaStatus: "PENDING_ACQUISITION",
  };
}

describe("master catalogue seed variant planning", () => {
  it("keeps sibling models under one family product", () => {
    const rows = buildSeedVariantRows(
      entry("PRODUCT_FAMILY", [
        { name: "Phone Pro", storage: ["256GB", "512GB"] },
        { name: "Phone Pro Max", storage: ["256GB", "512GB"] },
      ]),
    );

    expect(rows).toEqual([
      {
        sku: "ALM-001-V01",
        name: "Phone Pro",
        specifications: { storage: ["256GB", "512GB"] },
      },
      {
        sku: "ALM-001-V02",
        name: "Phone Pro Max",
        specifications: { storage: ["256GB", "512GB"] },
      },
    ]);
  });

  it("uses a neutral sourcing variant for a standard product", () => {
    expect(buildSeedVariantRows(entry("STANDARD_PRODUCT"))).toEqual([
      {
        sku: "ALM-001-DEFAULT",
        name: "Standard sourcing",
        specifications: {},
      },
    ]);
  });

  it("does not invent a physical model for procurement services", () => {
    expect(buildSeedVariantRows(entry("PROCUREMENT_SERVICE"))).toEqual([
      {
        sku: "ALM-001-SERVICE",
        name: "Sourcing request",
        specifications: { service: true },
      },
    ]);
  });

  it("keeps specification-driven configurable products configurable", () => {
    expect(buildSeedVariantRows(entry("CONFIGURABLE_PRODUCT"))).toEqual([
      {
        sku: "ALM-001-CONFIG",
        name: "Configured to request",
        specifications: { configurationMode: "customer_specification" },
      },
    ]);
  });
});
