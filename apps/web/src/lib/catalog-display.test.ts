import { describe, expect, it } from "vitest";

import {
  availabilityLabel,
  entryTypeLabel,
  productRequestHref,
  toCatalogCard,
} from "./catalog-display.js";

describe("catalog display helpers", () => {
  it("carries a selected family variant into an authenticated procurement request", () => {
    expect(
      productRequestHref("apple-iphone-18-pro-series", {
        authenticated: true,
        variant: "iPhone 18 Pro Max",
      }),
    ).toBe(
      "/app/requests/new?product=apple-iphone-18-pro-series&variant=iPhone+18+Pro+Max",
    );
  });

  it("preserves the selected variant through login returnTo", () => {
    const href = productRequestHref("apple-iphone-18-pro-series", {
      variant: "iPhone 18 Pro",
    });
    expect(decodeURIComponent(href)).toContain(
      "/app/requests/new?product=apple-iphone-18-pro-series&variant=iPhone+18+Pro",
    );
  });

  it("uses published category media when an item has no product photography", () => {
    const card = toCatalogCard({
      slug: "sample-product",
      name: "Sample Product",
      description: null,
      summary: null,
      entryType: "STANDARD_PRODUCT",
      availabilityStatus: "ON_REQUEST",
      keySpecifications: {},
      releaseDate: null,
      category: {
        slug: "electronics",
        name: "Electronics",
        imageUrl: "https://cdn.example/electronics.jpg",
        imageAlt: "Electronics category",
      },
      brandName: null,
      manufacturerName: null,
      images: [],
      videos: [],
      variants: [],
    });

    expect(card.imageSrc).toBe("https://cdn.example/electronics.jpg");
    expect(card.imageIsCategoryFallback).toBe(true);
    expect(card.imageAlt).toBe("Electronics category");
  });

  it("uses procurement-safe availability labels", () => {
    expect(availabilityLabel("ON_REQUEST")).toBe("Available on request");
    expect(availabilityLabel("COMING_SOON")).toBe("Coming soon");
  });

  it("labels family and service entries without relabelling standard products", () => {
    expect(entryTypeLabel("PRODUCT_FAMILY")).toBe("Product series");
    expect(entryTypeLabel("PROCUREMENT_SERVICE")).toBe("Procurement service");
    expect(entryTypeLabel("STANDARD_PRODUCT")).toBeNull();
  });
});
