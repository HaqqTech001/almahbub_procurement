import { describe, expect, it } from "vitest";

import {
  buildProductCoreTypeIndex,
  classifyProductPrimaryMatch,
  productCoreType,
} from "./product-primary-media-match.js";

const NAMES = [
  "Smartphone",
  "5G Smartphone",
  "Rugged Smartphone",
  "Enterprise Smartphone",
  "Premium Smartphone",
  "Business Laptop",
  "Ultrabook Laptop",
  "Education Laptop",
  "Electric Pressure Washer",
  "Compact Pressure Washer",
  "Cotton Fabric Roll",
  "Poplin Cotton Fabric Roll",
  "Custom Industrial Sourcing Brief",
  "Office Setup Procurement Bundle",
  "Silent Diesel Generator",
  "Open-frame Diesel Generator",
];

describe("product primary media match", () => {
  const index = buildProductCoreTypeIndex(NAMES);

  it("groups close physical variants under one core type", () => {
    expect(productCoreType("5G Smartphone", index)).toBe("smartphone");
    expect(productCoreType("Business Laptop", index)).toBe("laptop");
    expect(productCoreType("Electric Pressure Washer", index)).toBe("pressure washer");
    expect(productCoreType("Cotton Fabric Roll", index)).toBe("fabric roll");
  });

  it("keeps abstract briefs and bundles on needs_review", () => {
    expect(classifyProductPrimaryMatch("Custom Industrial Sourcing Brief", index).kind).toBe(
      "needs_review",
    );
    expect(classifyProductPrimaryMatch("Office Setup Procurement Bundle", index).kind).toBe(
      "needs_review",
    );
  });

  it("accepts physical object classes", () => {
    const row = classifyProductPrimaryMatch("Silent Diesel Generator", index);
    expect(row.kind).toBe("core_type");
    expect(row.coreType).toBe("diesel generator");
  });
});
