import { describe, expect, it } from "vitest";

import { parseManufacturerMediaCandidate } from "./manufacturer-media-candidate.js";

describe("manufacturer media candidate parser", () => {
  it("extracts an absolute Open Graph image", () => {
    const result = parseManufacturerMediaCandidate(
      '<html><head><meta property="og:title" content="Phone Pro Series"><meta property="og:image" content="https://cdn.example/series.jpg"></head></html>',
      "https://maker.example/products/series",
    );
    expect(result).toEqual({
      pageUrl: "https://maker.example/products/series",
      imageUrl: "https://cdn.example/series.jpg",
      title: "Phone Pro Series",
    });
  });

  it("resolves relative manufacturer media URLs", () => {
    const result = parseManufacturerMediaCandidate(
      '<meta name="twitter:image" content="/media/hero.png"><title>Product</title>',
      "https://maker.example/products/item",
    );
    expect(result?.imageUrl).toBe("https://maker.example/media/hero.png");
  });

  it("fails closed when no manufacturer hero metadata exists", () => {
    expect(
      parseManufacturerMediaCandidate(
        "<html><head><title>No image</title></head></html>",
        "https://maker.example/product",
      ),
    ).toBeNull();
  });
});
