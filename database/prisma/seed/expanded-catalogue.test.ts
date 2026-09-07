import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  LEGACY_AMBIGUOUS_KEEP_SLUGS,
  LEGACY_DUPLICATE_ARCHIVE_SLUGS,
} from "./catalogue-cleanup.js";
import {
  EXPANDED_CATALOGUE_CATEGORIES,
  EXPANDED_CATALOGUE_PRODUCTS,
} from "./expanded-catalogue.js";
import {
  assertExpandedCatalogueQuality,
  publishedCatalogueDescription,
} from "./seed-expanded-catalogue.js";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../catalogue-package");

describe("expanded procurement catalogue", () => {
  it("matches the approved 10 x 100 published catalogue contract", () => {
    expect(() => assertExpandedCatalogueQuality()).not.toThrow();
    expect(EXPANDED_CATALOGUE_CATEGORIES).toHaveLength(10);
    expect(EXPANDED_CATALOGUE_PRODUCTS).toHaveLength(1000);
    expect(EXPANDED_CATALOGUE_CATEGORIES.map((row) => row.slug)).toEqual([
      "iphones-gadgets",
      "medical-equipments",
      "home-garden-wares",
      "machineries",
      "general-procurement",
      "home-appliances",
      "office-business",
      "fashion-textiles",
      "beauty-spa-salon",
      "retail-store-setup",
    ]);
    expect(new Set(EXPANDED_CATALOGUE_PRODUCTS.map((row) => row.slug)).size).toBe(
      1000,
    );
  });

  it("keeps commercial names without duplicated consecutive words", () => {
    for (const product of EXPANDED_CATALOGUE_PRODUCTS) {
      expect(product.name.length).toBeLessThanOrEqual(200);
      const words = product.name.split(/\s+/);
      for (let index = 1; index < words.length; index += 1) {
        expect(words[index]!.toLowerCase()).not.toBe(words[index - 1]!.toLowerCase());
      }
    }
  });

  it("varies published descriptions by product without claiming stock", () => {
    const first = publishedCatalogueDescription(EXPANDED_CATALOGUE_PRODUCTS[0]!, 0);
    const second = publishedCatalogueDescription(EXPANDED_CATALOGUE_PRODUCTS[1]!, 1);
    expect(first).not.toBe(second);
    expect(first).toMatch(/smartphone/i);
    expect(first).not.toMatch(/in stock/i);
    expect(first.length).toBeLessThanOrEqual(8000);
    const salonChair = EXPANDED_CATALOGUE_PRODUCTS.find(
      (row) => /salon/i.test(row.name) && /chair/i.test(row.name),
    );
    expect(salonChair).toBeDefined();
    expect(
      publishedCatalogueDescription(salonChair!, 0),
    ).toMatch(/salon chair/i);
  });

  it("archives only extras that are not in the generated 1,000", () => {
    const generated = new Set(EXPANDED_CATALOGUE_PRODUCTS.map((row) => row.slug));
    for (const slug of LEGACY_DUPLICATE_ARCHIVE_SLUGS) {
      expect(generated.has(slug)).toBe(false);
    }
    for (const slug of LEGACY_AMBIGUOUS_KEEP_SLUGS) {
      expect(generated.has(slug)).toBe(false);
      expect(LEGACY_DUPLICATE_ARCHIVE_SLUGS).not.toContain(slug);
    }
  });
});

describe("catalogue media plans", () => {
  it("covers the ten current categories and generated product slugs", () => {
    const categoryPlan = JSON.parse(
      readFileSync(join(packageRoot, "category-media-plan.json"), "utf8"),
    ) as Array<{ categorySlug: string; status: string }>;
    const productPlan = JSON.parse(
      readFileSync(join(packageRoot, "product-media-plan.json"), "utf8"),
    ) as Array<{
      productSlug: string;
      kind: string;
      position: number;
    }>;

    expect(categoryPlan).toHaveLength(10);
    expect(categoryPlan.map((row) => row.categorySlug)).toEqual(
      EXPANDED_CATALOGUE_CATEGORIES.map((row) => row.slug),
    );
    expect(categoryPlan.every((row) => row.status === "planned")).toBe(true);

    const generated = new Set(EXPANDED_CATALOGUE_PRODUCTS.map((row) => row.slug));
    const missing: string[] = [];
    const imageKeys = new Set<string>();
    const videoKeys = new Set<string>();
    let duplicatePositions = 0;
    let imagePlans = 0;
    let videoPlans = 0;
    for (const row of productPlan) {
      if (!generated.has(row.productSlug)) missing.push(row.productSlug);
      const key = `${row.productSlug}:${row.kind}:${row.position}`;
      if (row.kind === "image") {
        imagePlans += 1;
        if (imageKeys.has(key)) duplicatePositions += 1;
        imageKeys.add(key);
      } else if (row.kind === "video") {
        videoPlans += 1;
        if (videoKeys.has(key)) duplicatePositions += 1;
        videoKeys.add(key);
      }
    }
    expect(missing).toEqual([]);
    expect(duplicatePositions).toBe(0);
    expect(imagePlans).toBe(3000);
    expect(videoPlans).toBe(1000);
  });
});
