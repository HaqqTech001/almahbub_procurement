import { describe, expect, it } from "vitest";

import {
  assertCatalogMediaPath,
  catalogObjectKey,
  parseStoredCatalogMediaUrl,
} from "./catalog-media-path.js";

describe("catalog media path", () => {
  const productId = "0190c8a0-1000-7000-8000-00000000c0de";

  it("rejects traversal and non-uuid product folders", () => {
    expect(() =>
      assertCatalogMediaPath({ productId: "not-a-uuid", filename: "hero.png" }),
    ).toThrow(/Unsafe catalog media path/);
    expect(() =>
      assertCatalogMediaPath({ productId, filename: "../secret.png" }),
    ).toThrow(/Unsafe catalog media path/);
    expect(() =>
      assertCatalogMediaPath({ productId, filename: "a/b.png" }),
    ).toThrow(/Unsafe catalog media path/);
  });

  it("builds a catalog object key under the product uuid", () => {
    expect(
      catalogObjectKey({ productId, filename: "a1b2c3d4-e5f6-hero.png" }),
    ).toBe(`catalog/${productId}/a1b2c3d4-e5f6-hero.png`);
  });

  it("parses local, supabase, and s3 public urls", () => {
    expect(
      parseStoredCatalogMediaUrl(`/api/v1/public/catalog-media/${productId}/hero.png`),
    ).toEqual({ productId, filename: "hero.png" });
    expect(
      parseStoredCatalogMediaUrl(
        `https://xyz.supabase.co/storage/v1/object/public/catalog-public/catalog/${productId}/hero.webp`,
      ),
    ).toEqual({ productId, filename: "hero.webp" });
    expect(
      parseStoredCatalogMediaUrl(
        `https://bucket.s3.eu-west-1.amazonaws.com/catalog/${productId}/hero.jpg`,
      ),
    ).toEqual({ productId, filename: "hero.jpg" });
    expect(parseStoredCatalogMediaUrl("/api/v1/documents/abc")).toBeNull();
  });
});
