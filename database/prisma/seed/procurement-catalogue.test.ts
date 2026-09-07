import { describe, expect, it } from "vitest";

import {
  assertProcurementCatalogueQuality,
  PROCUREMENT_CATALOGUE_CATEGORIES,
  PROCUREMENT_CATALOGUE_PRODUCTS,
  PROCUREMENT_CATALOGUE_SOURCING_NOTE,
} from "./procurement-catalogue.js";

describe("procurement catalogue seed dataset", () => {
  it("has unique ids, slugs, and category coverage without invented stock", () => {
    expect(() => assertProcurementCatalogueQuality()).not.toThrow();
    expect(PROCUREMENT_CATALOGUE_PRODUCTS.length).toBeGreaterThanOrEqual(100);
    expect(PROCUREMENT_CATALOGUE_PRODUCTS.length).toBeLessThanOrEqual(200);
    expect(PROCUREMENT_CATALOGUE_CATEGORIES.map((row) => row.slug)).toEqual(
      expect.arrayContaining([
        "iphones-gadgets",
        "home-appliances",
        "office-business",
        "fashion-textiles",
        "beauty-spa-salon",
        "medical-equipments",
        "machineries",
        "retail-store-setup",
        "home-garden-wares",
        "general-procurement",
      ]),
    );
    for (const product of PROCUREMENT_CATALOGUE_PRODUCTS) {
      expect(product.description).toBe(PROCUREMENT_CATALOGUE_SOURCING_NOTE);
      expect(product).not.toHaveProperty("price");
      expect(product).not.toHaveProperty("stock");
      expect(product).not.toHaveProperty("imageUrl");
    }
  });
});
