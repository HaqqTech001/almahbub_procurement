import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";
import type { DatabaseClient } from "../src/shared/database/database-client.js";

function createCatalogApp(database: DatabaseClient) {
  return createApp(
    parseEnvironment({
      NODE_ENV: "test",
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      LOG_LEVEL: "silent",
      CORS_ORIGINS: "http://localhost:5173",
      JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
    }),
    { database },
  );
}

function mockDatabase(options?: {
  products?: unknown[];
  productCount?: number;
  categories?: unknown[];
  categoryCount?: number;
  publishedCategory?: { id: string } | null;
  productDetail?: unknown | null;
}): DatabaseClient {
  return {
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
    product: {
      count: vi.fn().mockResolvedValue(options?.productCount ?? 0),
      findMany: vi.fn().mockResolvedValue(options?.products ?? []),
      findFirst: vi.fn().mockResolvedValue(options?.productDetail ?? null),
    },
    productCategory: {
      count: vi.fn().mockResolvedValue(options?.categoryCount ?? 0),
      findMany: vi.fn().mockResolvedValue(options?.categories ?? []),
      findFirst: vi.fn().mockResolvedValue(options?.publishedCategory ?? null),
    },
  } as unknown as DatabaseClient;
}

describe("public catalog routes", () => {
  it("lists published products in the standard envelope with pagination meta", async () => {
    const app = createCatalogApp(
      mockDatabase({
        products: [
          {
            slug: "hospital-beds",
            name: "Hospital Beds",
            description: null,
            category: {
              slug: "medical-equipments",
              name: "Medical Equipments",
              status: "published",
            },
            brand: null,
            manufacturer: null,
            images: [],
          },
        ],
        productCount: 1,
      }),
    );

    const response = await request(app).get("/api/v1/products").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([
      {
        slug: "hospital-beds",
        name: "Hospital Beds",
        description: null,
        category: {
          slug: "medical-equipments",
          name: "Medical Equipments",
          imageUrl: null,
          imageAlt: null,
        },
        brandName: null,
        manufacturerName: null,
        images: [],
        videos: [],
        variants: [],
      },
    ]);
    expect(response.body.meta).toMatchObject({
      page: 1,
      pageSize: 12,
      total: 1,
      hasMore: false,
    });
    expect(response.body.data[0]).not.toHaveProperty("id");
    expect(response.body.data[0]).not.toHaveProperty("status");
    expect(response.body.data[0]).not.toHaveProperty("categoryId");
  });

  it("rejects an invalid category query without querying products", async () => {
    const database = mockDatabase();
    const app = createCatalogApp(database);

    const response = await request(app)
      .get("/api/v1/products")
      .query({ category: "Not A Slug" })
      .expect(422);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(database.product.findMany).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown category slug", async () => {
    const app = createCatalogApp(mockDatabase({ publishedCategory: null }));
    const response = await request(app)
      .get("/api/v1/products")
      .query({ category: "agro-commodities" })
      .expect(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("looks up a published product by slug", async () => {
    const app = createCatalogApp(
      mockDatabase({
        productDetail: {
          slug: "hospital-beds",
          name: "Hospital Beds",
          description: "Electric hospital beds",
          category: null,
          brand: null,
          manufacturer: null,
          images: [],
        },
      }),
    );

    const response = await request(app)
      .get("/api/v1/products/hospital-beds")
      .expect(200);

    expect(response.body.data).toMatchObject({
      slug: "hospital-beds",
      name: "Hospital Beds",
      images: [],
    });
  });

  it("does not expose unpublished product details", async () => {
    const app = createCatalogApp(mockDatabase({ productDetail: null }));
    const response = await request(app)
      .get("/api/v1/products/draft-only")
      .expect(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });

  it("lists published categories", async () => {
    const app = createCatalogApp(
      mockDatabase({
        categories: [
          { slug: "general-procurement", name: "General Procurement" },
          { slug: "machineries", name: "Machineries" },
        ],
        categoryCount: 2,
      }),
    );

    const response = await request(app).get("/api/v1/categories").expect(200);
    expect(response.body.data).toEqual([
      { slug: "general-procurement", name: "General Procurement", imageUrl: null, imageAlt: null },
      { slug: "machineries", name: "Machineries", imageUrl: null, imageAlt: null },
    ]);
  });
});
