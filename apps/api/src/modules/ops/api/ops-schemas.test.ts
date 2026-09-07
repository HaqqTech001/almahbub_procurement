import { describe, expect, it } from "vitest";

import {
  createOpsProductImageSchema,
  createOpsProductSchema,
  opsListQuerySchema,
  opsReportSchema,
} from "./ops-schemas.js";

describe("ops schemas", () => {
  it("parses list query defaults", () => {
    const parsed = opsListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(25);
  });

  it("parses report body", () => {
    const parsed = opsReportSchema.parse({
      domain: "audit",
      format: "csv",
    });
    expect(parsed.domain).toBe("audit");
    expect(parsed.format).toBe("csv");
  });

  it("accepts brand and manufacturer assignment on product create", () => {
    const parsed = createOpsProductSchema.parse({
      name: "Hospital beds",
      categoryId: "0190c8a0-1000-7000-8000-000000000002",
      brandId: "0190c8a0-1000-7000-8000-000000000011",
      manufacturerId: "0190c8a0-1000-7000-8000-000000000012",
      description: "Electric hospital beds for ward use.",
      status: "draft",
    });
    expect(parsed.brandId).toBe("0190c8a0-1000-7000-8000-000000000011");
  });

  it("rejects non-http product image URLs", () => {
    expect(() =>
      createOpsProductImageSchema.parse({ url: "javascript:alert(1)" }),
    ).toThrow();
    expect(
      createOpsProductImageSchema.parse({
        url: "https://cdn.example/bed.jpg",
        altText: "Hospital bed",
      }).url,
    ).toBe("https://cdn.example/bed.jpg");
  });

  it("accepts public catalog media paths for uploaded gallery images", () => {
    expect(
      createOpsProductImageSchema.parse({
        url: "/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-000000000099/photo.webp",
      }).url,
    ).toContain("/api/v1/public/catalog-media/");
  });

  it("parses categoryId on product list queries", () => {
    const parsed = opsListQuerySchema.parse({
      categoryId: "0190c8a0-1000-7000-8000-000000000002",
      status: "draft",
    });
    expect(parsed.categoryId).toBe("0190c8a0-1000-7000-8000-000000000002");
    expect(parsed.status).toBe("draft");
  });
});
