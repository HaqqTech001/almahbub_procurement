import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { reviewFingerprint } from "../src/modules/catalog/application/product-publication-review.js";

import { createApp } from "../src/app.js";
import { parseEnvironment } from "../src/config/env.js";
import type { DatabaseClient } from "../src/shared/database/database-client.js";

vi.mock("../src/modules/catalog/infrastructure/product-media-health.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/modules/catalog/infrastructure/product-media-health.js")>();
  return {
    ...actual,
    publicProductMediaHealth: vi.fn().mockResolvedValue("valid"),
  };
});

vi.mock("../src/modules/catalog/infrastructure/reviewed-media-hash.js", () => ({
  reviewedMediaHash: vi.fn().mockResolvedValue("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
}));

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

const REVIEW_SHA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function reviewedHospitalBed() {
  const product = {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "hospital-beds",
    name: "Hospital Beds",
    description: "Electric hospital beds",
    status: "published",
    summary: "Hospital beds available for institutional procurement.",
    entryType: "STANDARD_PRODUCT" as const,
    availabilityStatus: "ON_REQUEST" as const,
    keySpecifications: {},
    releaseDate: null,
    category: {
      id: "22222222-2222-4222-8222-222222222222",
      slug: "medical-equipments",
      name: "Medical Equipments",
      status: "published",
      description: null,
    },
    brand: null,
    manufacturer: null,
    images: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        url: "https://cdn.example.test/hospital-bed.jpg",
        storageKey: "catalog/hospital-bed.jpg",
        position: 0,
        isPrimary: true,
        altText: "Hospital bed",
      },
    ],
    videos: [],
    variants: [],
  };

  const publicationReview = {
    productId: product.id,
    slug: product.slug,
    productName: product.name,
    fingerprint: reviewFingerprint(product),
    identityStatus: "approved" as const,
    categoryStatus: "approved" as const,
    duplicateStatus: "clear" as const,
    mediaStatus: "approved" as const,
    mediaSemanticStatus: "approved" as const,
    commercialRelevance: "Core institutional healthcare procurement.",
    reviewedBy: "catalog-route-test",
    checkedAt: "2026-09-20T12:00:00.000Z",
    primaryImageId: product.images[0].id,
    sha256: REVIEW_SHA,
    mediaIdentity: "Hospital Beds",
    semanticEvidence: "Exact reviewed hospital-bed fixture.",
    mediaSource: "Test fixture",
    mediaRights: "Test fixture rights approved.",
    priorityTier: "P2_CORE" as const,
  };

  return { product, publicationReview };
}

function mockDatabase(options?: {
  products?: unknown[];
  productCount?: number;
  categories?: unknown[];
  categoryCount?: number;
  publishedCategory?: { id: string } | null;
  productDetail?: unknown | null;
  publicationReviews?: Array<{ productId: string; publicationReview: unknown }>;
}): DatabaseClient {
  return {
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
    product: {
      count: vi.fn().mockResolvedValue(options?.productCount ?? 0),
      findMany: vi.fn().mockResolvedValue(options?.products ?? []),
      findFirst: vi.fn().mockResolvedValue(options?.productDetail ?? null),
    },
    productVariant: {
      findMany: vi.fn().mockResolvedValue(
        (options?.publicationReviews ?? []).map((row, index) => ({
          id: `review-variant-${index + 1}`,
          productId: row.productId,
          specifications: {
            publicationStatus: "PUBLIC_APPROVED",
            publicationReview: row.publicationReview,
          },
        })),
      ),
    },
    productImage: {
      findMany: vi.fn().mockResolvedValue([]),
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
    const { product, publicationReview } = reviewedHospitalBed();
    const app = createCatalogApp(
      mockDatabase({
        products: [product],
        productCount: 1,
        publicationReviews: [{ productId: product.id, publicationReview }],
      }),
    );

    const response = await request(app).get("/api/v1/products").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual([
      {
        slug: "hospital-beds",
        name: "Hospital Beds",
        description: "Electric hospital beds",
        summary: "Hospital beds available for institutional procurement.",
        entryType: "STANDARD_PRODUCT",
        availabilityStatus: "ON_REQUEST",
        keySpecifications: {},
        releaseDate: null,
        category: {
          id: "22222222-2222-4222-8222-222222222222",
          description: null,
          slug: "medical-equipments",
          name: "Medical Equipments",
          imageUrl: null,
          imageAlt: null,
        },
        brandName: null,
        manufacturerName: null,
        images: [
          {
            url: "https://cdn.example.test/hospital-bed.jpg",
            altText: "Hospital bed",
            position: 0,
          },
        ],
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
    const { product, publicationReview } = reviewedHospitalBed();
    const app = createCatalogApp(
      mockDatabase({
        productDetail: product,
        publicationReviews: [{ productId: product.id, publicationReview }],
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
      { description: null, slug: "general-procurement", name: "General Procurement", imageUrl: null, imageAlt: null },
      { description: null, slug: "machineries", name: "Machineries", imageUrl: null, imageAlt: null },
    ]);
  });
});
