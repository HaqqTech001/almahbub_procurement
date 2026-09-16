import { describe, expect, it, vi } from "vitest";

import { toHomepageCatalogProduct } from "./homepage-products.js";

describe("homepage products adapter", () => {
  it("maps public catalogue products without inventing commerce fields", () => {
    const product = toHomepageCatalogProduct({
      slug: "hospital-beds",
      name: "Hospital Beds",
      description: "Electric hospital beds",
      category: { slug: "medical-equipments", name: "Medical Equipments" },
      brandName: null,
      manufacturerName: null,
      images: [],
      videos: [],
    });
    expect(product.href).toBe("/product/hospital-beds");
    expect(product.requestHref).toContain("product=hospital-beds");
    expect(product.imageSrc).toBeUndefined();
    expect(product.moq).toBe("");
    expect(product.priceLabel).toBeUndefined();
  });

  it("returns empty products when the public API has none", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const data = url.includes("/categories")
          ? [{ slug: "machineries", name: "Machineries" }]
          : [];
        return new Response(
          JSON.stringify({
            data,
            meta: { page: 1, pageSize: 12, total: data.length, hasMore: false },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    const { loadHomepageProducts } = await import("./homepage-products.js");
    const result = await loadHomepageProducts();
    expect(result.source).toBe("api");
    expect(result.products).toEqual([]);
    expect(result.categories[0]?.href).toBe("/products?category=machineries");
    vi.unstubAllGlobals();
  });

  it("does not substitute a stale taxonomy when the categories API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    const { loadHomepageProducts } = await import("./homepage-products.js");
    const result = await loadHomepageProducts();
    expect(result.source).toBe("error");
    expect(result.products).toEqual([]);
    expect(result.categoryItems).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("uses durable presentation artwork for a legacy local API category image", async () => {
    const { toCategoryItem } = await import("./homepage-products.js");
    const item = toCategoryItem({
      slug: "medical-equipments",
      name: "Medical Equipments",
      imageUrl: "/api/v1/public/catalog-media/cat/medical.png",
      imageAlt: "Medical equipment category",
    });
    expect(item.imageSrc).toBe("/media/international/category-medical-equipments.jpg");
    expect(item.imageAlt).toBe("Medical equipment category");
    expect(item.href).toContain("medical-equipments");
  });

  it("does not invent a category set when none were supplied", async () => {
    const { listInternationalCategoryCards } = await import("./homepage-products.js");
    expect(listInternationalCategoryCards()).toEqual([]);
  });
});
