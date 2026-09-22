import { reviewed, fixtureHash } from "./publication-fixtures.js";
import { type ReviewProduct } from "../application/product-publication-review.js";
import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import {
  CatalogService,
  toPublicProduct,
} from "../application/catalog-service.js";
import {
  PUBLIC_CATEGORY_KEYS,
  PUBLIC_IMAGE_KEYS,
  PUBLIC_PRODUCT_KEYS,
  PUBLIC_VARIANT_KEYS,
  PUBLIC_VIDEO_KEYS,
} from "../application/catalog-policy.js";
import { publicProductListQuerySchema } from "../api/catalog-schemas.js";

function createDatabase(overrides: {
  products?: unknown[];
  productCount?: number;
  categories?: unknown[];
  categoryCount?: number;
  publishedCategory?: { id: string } | null;
  productDetail?: unknown | null;
}) {
  const product = {
    count: vi.fn().mockResolvedValue(overrides.productCount ?? 0),
    findMany: vi.fn().mockResolvedValue(overrides.products ?? []),
    findFirst: vi.fn().mockResolvedValue(overrides.productDetail ?? null),
  };
  const productCategory = {
    count: vi.fn().mockResolvedValue(overrides.categoryCount ?? 0),
    findMany: vi.fn().mockResolvedValue(overrides.categories ?? []),
    findFirst: vi.fn().mockResolvedValue(overrides.publishedCategory ?? null),
  };
  return {
    database: {
      product,
      productCategory,
      productVariant: { findMany: vi.fn().mockResolvedValue([]) },
      productImage: { findMany: vi.fn().mockResolvedValue([]) },
    } as unknown as DatabaseClient,
    product,
    productCategory,
  };
}

const publishedPhone = {
  id: "phone",
  status: "published",
  slug: "iphone-15-pro",
  name: "iPhone 15 Pro",
  description: "Latest iPhone models for institutional procurement.",
  category: {
    slug: "iphones-gadgets",
    name: "iPhones & Gadgets",
    status: "published",
  },
  brand: { name: "Apple" },
  manufacturer: { legalName: "Apple Inc." },
  images: [
    {
      id: "image",
      url: "https://cdn.example/iphone.jpg",
      altText: "iPhone 15 Pro",
      position: 0,
    },
  ],
  videos: [],
};

describe("catalog service", () => {
  it("loads persisted approvals for public listings without a process restart", async () => {
    const { database } = createDatabase({ products: [publishedPhone] });
    const service = new CatalogService(database, async () => "valid", undefined, fixtureHash);
    const query = publicProductListQuerySchema.parse({});
    expect((await service.listProducts(query)).data).toHaveLength(0);
    vi.mocked(database.productVariant.findMany).mockResolvedValueOnce([
      { id: "variant", productId: publishedPhone.id, specifications: { publicationReview: reviewed(publishedPhone) } },
    ] as never);
    expect((await service.listProducts(query)).data.map((row) => row.slug)).toEqual([publishedPhone.slug]);
  });

  it("returns published products and always queries status=published", async () => {
    const { database, product } = createDatabase({
      products: [publishedPhone],
      productCount: 1,
    });
    const result = await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(publicProductListQuerySchema.parse({}));

    expect(product.findMany.mock.calls[0]?.[0]?.where.status).toBe("published");
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.slug).toBe("iphone-15-pro");
    expect(result.page).toMatchObject({
      page: 1,
      pageSize: 12,
      total: 1,
      hasMore: false,
    });
  });

  it("excludes unpublished products from the public query", async () => {
    const { database, product } = createDatabase({
      products: [],
      productCount: 0,
    });
    await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(publicProductListQuerySchema.parse({}));

    const where = product.findMany.mock.calls[0]?.[0]?.where as {
      status: string;
    };
    expect(where.status).toBe("published");
    expect(where).not.toHaveProperty("status", "draft");
  });

  it("filters by a published category slug", async () => {
    const { database, product, productCategory } = createDatabase({
      publishedCategory: { id: "cat-1" },
      products: [publishedPhone],
      productCount: 1,
    });
    await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(
      publicProductListQuerySchema.parse({ category: "iphones-gadgets" }),
    );

    expect(productCategory.findFirst).toHaveBeenCalledWith({
      where: { slug: "iphones-gadgets", status: "published" },
      select: { id: true },
    });
    expect(product.findMany.mock.calls[0]?.[0]?.where).toMatchObject({
      status: "published",
      categoryId: "cat-1",
    });
  });

  it("returns 404 for an unknown or unpublished category slug", async () => {
    const { database } = createDatabase({ publishedCategory: null });
    const error = await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    )
      .listProducts(
        publicProductListQuerySchema.parse({ category: "does-not-exist" }),
      )
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("searches name, description, and category name", async () => {
    const { database, product } = createDatabase({
      products: [],
      productCount: 0,
    });
    await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(publicProductListQuerySchema.parse({ q: "hospital" }));

    expect(product.findMany.mock.calls[0]?.[0]?.where.OR).toEqual([
      { name: { contains: "hospital", mode: "insensitive" } },
      { description: { contains: "hospital", mode: "insensitive" } },
      { category: { name: { contains: "hospital", mode: "insensitive" } } },
    ]);
  });

  it("filters media before pagination and calculates eligible totals", async () => {
    const { database, product } = createDatabase({
      products: Array.from({ length: 25 }, (_, index) => ({
        ...publishedPhone,
        id: `phone-${index}`,
        slug: `phone-${index}`,
        name: `iPhone fixture model ${index}`,
        images: [
          {
            id: `image-${index}`,
            url: `/phone-${index}.png`,
            position: 0,
            altText: "phone",
          },
        ],
      })),
      productCount: 25,
    });
    const approvals = Array.from({ length: 25 }, (_, index) =>
      reviewed({
        ...publishedPhone,
        id: `phone-${index}`,
        slug: `phone-${index}`,
        name: `iPhone fixture model ${index}`,
        images: [
          {
            id: `image-${index}`,
            url: `/phone-${index}.png`,
            position: 0,
            altText: "phone",
          },
        ],
      } as ReviewProduct),
    );
    const result = await new CatalogService(
      database,
      async () => "valid",
      approvals,
      fixtureHash,
    ).listProducts(
      publicProductListQuerySchema.parse({
        page: 2,
        pageSize: 12,
        sort: "newest",
      }),
    );

    expect(product.findMany.mock.calls[1]?.[0]).toMatchObject({
      skip: 0,
      take: 12,
    });
    expect(result.page).toEqual({
      page: 2,
      pageSize: 12,
      total: 25,
      hasMore: true,
    });
  });

  it("loads at most three assigned image candidates on list queries", async () => {
    const { database, product } = createDatabase({
      products: [publishedPhone],
      productCount: 1,
    });
    await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(publicProductListQuerySchema.parse({}));
    expect(product.findMany.mock.calls[1]?.[0]?.include.images.take).toBe(3);
    expect(product.findMany.mock.calls[1]?.[0]?.include.videos.take).toBe(1);
  });

  it("returns a published product by slug and 404s otherwise", async () => {
    const found = createDatabase({ productDetail: publishedPhone });
    const missing = createDatabase({ productDetail: null });

    await expect(
      new CatalogService(
        found.database,
        async () => "valid",
        [reviewed(publishedPhone)],
        fixtureHash,
      ).getProduct("iphone-15-pro"),
    ).resolves.toMatchObject({ slug: "iphone-15-pro" });
    expect(found.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: "iphone-15-pro", status: "published" },
      }),
    );

    const error = await new CatalogService(missing.database)
      .getProduct("draft-only")
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
  });

  it("releases only verified v2 master-manifest products without photography", async () => {
    const masterProduct = {
      ...publishedPhone,
      id: "master-product",
      catalogueId: "ALM-001",
      sourceManifestVersion: "2.0-starter",
      verificationStatus: "VERIFIED_2026-09-20",
      images: [],
    };
    const { database } = createDatabase({ products: [masterProduct] });

    const result = await new CatalogService(
      database,
      async () => "invalid",
      [],
      fixtureHash,
      true,
    ).listProducts(publicProductListQuerySchema.parse({}));

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      slug: masterProduct.slug,
      images: [],
    });
  });

  it("does not extend fallback release to arbitrary catalogue-tagged products", async () => {
    const nonMaster = {
      ...publishedPhone,
      id: "other-catalogue-product",
      catalogueId: "OTHER-001",
      sourceManifestVersion: "2.0-starter",
      verificationStatus: "VERIFIED_2026-09-20",
      images: [],
    };
    const { database } = createDatabase({ products: [nonMaster] });

    const result = await new CatalogService(
      database,
      async () => "invalid",
      [],
      fixtureHash,
      true,
    ).listProducts(publicProductListQuerySchema.parse({}));

    expect(result.data).toEqual([]);
  });

  it("returns an empty catalogue without inventing rows", async () => {
    const { database } = createDatabase({ products: [], productCount: 0 });
    const result = await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listProducts(publicProductListQuerySchema.parse({}));
    expect(result.data).toEqual([]);
    expect(result.page.total).toBe(0);
    expect(result.page.hasMore).toBe(false);
  });

  it("maps master catalogue family metadata without exposing editorial fields", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      summary: "Apple's current Pro iPhone family.",
      entryType: "PRODUCT_FAMILY",
      availabilityStatus: "ON_REQUEST",
      keySpecifications: { chip: "A20 Pro" },
      releaseDate: new Date("2026-09-18T00:00:00.000Z"),
      variants: [
        {
          name: "iPhone 18 Pro",
          specifications: { storage: ["256GB", "512GB"] },
        },
        {
          name: "iPhone 18 Pro Max",
          specifications: { storage: ["256GB", "512GB"] },
        },
      ],
    });

    expect(mapped).toMatchObject({
      summary: "Apple's current Pro iPhone family.",
      entryType: "PRODUCT_FAMILY",
      availabilityStatus: "ON_REQUEST",
      keySpecifications: { chip: "A20 Pro" },
      releaseDate: "2026-09-18",
    });
    expect(mapped.variants.map((variant) => variant.name)).toEqual([
      "iPhone 18 Pro",
      "iPhone 18 Pro Max",
    ]);
    expect(mapped).not.toHaveProperty("manufacturerUrl");
    expect(mapped).not.toHaveProperty("verificationStatus");
    expect(mapped).not.toHaveProperty("mediaStatus");
    expect(mapped).not.toHaveProperty("sourceManifestVersion");
  });

  it("returns an empty images array when a product has no photography", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      images: [],
    });
    expect(mapped.images).toEqual([]);
  });

  it("omits blank image URLs instead of manufacturing a fallback", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      images: [{ url: "   ", altText: null, position: 0 }],
    });
    expect(mapped.images).toEqual([]);
  });

  it("does not expose admin or private fields on the public product", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      category: {
        slug: "iphones-gadgets",
        name: "iPhones & Gadgets",
        status: "published",
      },
      videos: [
        {
          url: "https://cdn.example/demo.mp4",
          title: "Demo",
          caption: "Walkthrough",
          position: 0,
        },
      ],
    });
    expect(Object.keys(mapped).sort()).toEqual([...PUBLIC_PRODUCT_KEYS].sort());
    expect(mapped).not.toHaveProperty("id");
    expect(mapped).not.toHaveProperty("status");
    expect(mapped).not.toHaveProperty("brandId");
    expect(mapped).not.toHaveProperty("manufacturerId");
    expect(mapped).not.toHaveProperty("createdAt");
    expect(mapped).not.toHaveProperty("updatedAt");
    expect(mapped.category && Object.keys(mapped.category).sort()).toEqual(
      [...PUBLIC_CATEGORY_KEYS].sort(),
    );
    expect(mapped.images[0] && Object.keys(mapped.images[0]).sort()).toEqual(
      [...PUBLIC_IMAGE_KEYS].sort(),
    );
    expect(mapped.videos[0] && Object.keys(mapped.videos[0]).sort()).toEqual(
      [...PUBLIC_VIDEO_KEYS].sort(),
    );
    expect(mapped.variants).toEqual([]);
  });

  it("exposes normalized fields plus verified variant specifications", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      variants: [
        {
          name: "Standard sourcing",
          specifications: {
            unit: "unit",
            typicalSpecificationFields: ["screen size", "storage"],
            sourcingStatus: "available_for_procurement",
          },
        },
      ],
    });
    expect(
      mapped.variants[0] && Object.keys(mapped.variants[0]).sort(),
    ).toEqual([...PUBLIC_VARIANT_KEYS].sort());
    expect(mapped.variants[0]).toEqual({
      name: "Standard sourcing",
      unit: "unit",
      typicalSpecificationFields: ["screen size", "storage"],
      sourcingStatus: "available_for_procurement",
      specifications: {
        unit: "unit",
        typicalSpecificationFields: ["screen size", "storage"],
        sourcingStatus: "available_for_procurement",
      },
    });
  });

  it("omits blank video URLs from the public product", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      videos: [{ url: "  ", title: null, caption: null, position: 0 }],
    });
    expect(mapped.videos).toEqual([]);
  });

  it("hides an unpublished parent category from the public product", () => {
    const mapped = toPublicProduct({
      ...publishedPhone,
      category: {
        slug: "internal-staging",
        name: "Internal Staging",
        status: "draft",
      },
    });
    expect(mapped.category).toBeNull();
  });

  it("lists only published categories", async () => {
    const { database, productCategory } = createDatabase({
      categories: [{ slug: "machineries", name: "Machineries" }],
      categoryCount: 1,
    });
    const result = await new CatalogService(
      database,
      async () => "valid",
      [reviewed(publishedPhone)],
      fixtureHash,
    ).listCategories({
      page: 1,
      pageSize: 12,
    });

    expect(productCategory.findMany.mock.calls[0]?.[0]?.where.status).toBe(
      "published",
    );
    expect(result.data).toEqual([
      {
        id: undefined,
        description: null,
        slug: "machineries",
        name: "Machineries",
        imageUrl: null,
        imageAlt: null,
      },
    ]);
  });
});
