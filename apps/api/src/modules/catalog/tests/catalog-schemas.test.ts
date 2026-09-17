import { describe, expect, it } from "vitest";

import {
  publicCategorySlugSchema,
  publicProductIdentifierSchema,
  publicProductListQuerySchema,
} from "../api/catalog-schemas.js";

describe("catalog schemas", () => {
  it("applies public list defaults", () => {
    const parsed = publicProductListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(12);
    expect(parsed.sort).toBe("recommended");
    expect(parsed.category).toBeUndefined();
    expect(parsed.q).toBeUndefined();
  });

  it("accepts a validated category slug", () => {
    const parsed = publicProductListQuerySchema.parse({
      category: "iphones-gadgets",
      q: "hospital bed",
      page: "2",
      pageSize: "12",
      sort: "name",
    });
    expect(parsed.category).toBe("iphones-gadgets");
    expect(parsed.q).toBe("hospital bed");
    expect(parsed.page).toBe(2);
    expect(parsed.sort).toBe("name");
  });

  it("rejects an invalid category identifier", () => {
    expect(() => publicCategorySlugSchema.parse("iPhones & Gadgets")).toThrow();
    expect(() => publicCategorySlugSchema.parse("../secret")).toThrow();
    expect(() => publicProductListQuerySchema.parse({ category: "!!!" })).toThrow();
  });

  it("rejects arbitrary sort fields", () => {
    expect(() =>
      publicProductListQuerySchema.parse({ sort: "internalNotes" }),
    ).toThrow();
    expect(() =>
      publicProductListQuerySchema.parse({ sort: "status" }),
    ).toThrow();
  });

  it("constrains search and pagination", () => {
    expect(() =>
      publicProductListQuerySchema.parse({ q: "x".repeat(201) }),
    ).toThrow();
    expect(() => publicProductListQuerySchema.parse({ page: 0 })).toThrow();
    expect(() => publicProductListQuerySchema.parse({ pageSize: 201 })).toThrow();
    expect(publicProductListQuerySchema.parse({ pageSize: 200 }).pageSize).toBe(200);
  });

  it("requires a lowercase product slug", () => {
    expect(publicProductIdentifierSchema.parse({ slug: "hospital-beds" }).slug).toBe(
      "hospital-beds",
    );
    expect(() =>
      publicProductIdentifierSchema.parse({ slug: "Not A Slug" }),
    ).toThrow();
  });
});
