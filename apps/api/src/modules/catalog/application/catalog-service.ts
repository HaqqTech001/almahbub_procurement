import { AppError } from "../../../lib/app-error.js";
import { compareProductPriority, orderedProductImages } from "@hamd/constants";
import { restoreProductOrder } from "./prioritized-product-page.js";
import { publicProductMediaHealth, withConcurrency } from "../infrastructure/product-media-health.js";
import {
  mediaWriteData,
  withCategoryMedia,
  type DatabaseClient,
} from "../../../shared/database/database-client.js";
import type {
  PublicCategoryListQuery,
  PublicProductListQuery,
} from "../api/catalog-schemas.js";
import { PUBLIC_CATALOG_STATUS } from "./catalog-policy.js";

type Meta = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type PublicCatalogImage = {
  url: string;
  altText: string | null;
  position: number;
};

export type PublicCatalogVideo = {
  url: string;
  title: string | null;
  caption: string | null;
  position: number;
};

export type PublicCatalogCategory = {
  slug: string;
  name: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type PublicCatalogVariant = {
  name: string;
  unit: string | null;
  typicalSpecificationFields: string[];
  sourcingStatus: string | null;
};

export type PublicCatalogProduct = {
  slug: string;
  name: string;
  description: string | null;
  category: PublicCatalogCategory | null;
  brandName: string | null;
  manufacturerName: string | null;
  images: PublicCatalogImage[];
  videos: PublicCatalogVideo[];
  variants: PublicCatalogVariant[];
};

type CatalogProductRow = {
  slug: string;
  name: string;
  description: string | null;
  category: { slug: string; name: string; status: string } | null;
  brand: { name: string } | null;
  manufacturer: { legalName: string } | null;
  images: { url: string; altText: string | null; position: number }[];
  videos?: {
    url: string;
    title: string | null;
    caption: string | null;
    position: number;
  }[];
  variants?: {
    name: string;
    specifications: unknown;
  }[];
};

const publicProductListInclude = {
  category: true,
  brand: true,
  manufacturer: true,
  images: { orderBy: { position: "asc" as const }, take: 3 },
  videos: { orderBy: { position: "asc" as const }, take: 1 },
  variants: { orderBy: { createdAt: "asc" as const } },
};

const publicProductInclude = {
  category: true,
  brand: true,
  manufacturer: true,
  images: { orderBy: { position: "asc" as const } },
  videos: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { createdAt: "asc" as const } },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parseVariantSpecifications(value: unknown): {
  unit: string | null;
  typicalSpecificationFields: string[];
  sourcingStatus: string | null;
} {
  const record = asRecord(value);
  const fields = record?.typicalSpecificationFields;
  return {
    unit: typeof record?.unit === "string" && record.unit.trim() ? record.unit : null,
    typicalSpecificationFields: Array.isArray(fields)
      ? fields.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
    sourcingStatus:
      typeof record?.sourcingStatus === "string" && record.sourcingStatus.trim()
        ? record.sourcingStatus
        : null,
  };
}

function pageMeta(total: number, page: number, pageSize: number): Meta {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

export function toPublicProduct(row: CatalogProductRow): PublicCatalogProduct {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    category:
      row.category?.status === PUBLIC_CATALOG_STATUS
        ? { slug: row.category.slug, name: row.category.name, imageUrl: null, imageAlt: null }
        : null,
    brandName: row.brand?.name ?? null,
    manufacturerName: row.manufacturer?.legalName ?? null,
    images: orderedProductImages(row.images ?? [])
      .filter((image) => typeof image?.url === "string" && image.url.trim().length > 0)
      .map((image) => ({
        url: image.url,
        altText: image.altText,
        position: image.position,
      })),
    videos: (row.videos ?? [])
      .filter((video) => typeof video?.url === "string" && video.url.trim().length > 0)
      .map((video) => ({
        url: video.url,
        title: video.title,
        caption: video.caption,
        position: video.position,
      })),
    variants: (row.variants ?? []).map((variant) => {
      const specs = parseVariantSpecifications(variant.specifications);
      return {
        name: variant.name,
        unit: specs.unit,
        typicalSpecificationFields: specs.typicalSpecificationFields,
        sourcingStatus: specs.sourcingStatus,
      };
    }),
  };
}

/**
 * Read-only public catalogue over existing Product / ProductCategory rows.
 * Never invents images, prices, stock, or unpublished records.
 */
export class CatalogService {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly mediaHealth = publicProductMediaHealth,
  ) {}

  public async listProducts(query: PublicProductListQuery): Promise<{
    data: PublicCatalogProduct[];
    page: Meta;
  }> {
    const categoryFilter = query.category
      ? await this.requirePublishedCategory(query.category)
      : undefined;

    const where = {
      status: PUBLIC_CATALOG_STATUS,
      ...(categoryFilter ? { categoryId: categoryFilter.id } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              {
                description: {
                  contains: query.q,
                  mode: "insensitive" as const,
                },
              },
              {
                category: {
                  name: { contains: query.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
    };

    const candidates = await this.database.product.findMany({
      where,
      select: { slug: true, name: true, category: { select: { slug: true } }, images: { select: { url: true, position: true }, orderBy: [{ position: "asc" }, { id: "asc" }], take: 1 } },
      orderBy: query.sort === "name" ? [{ name: "asc" }, { slug: "asc" }] : [{ createdAt: "desc" }, { slug: "asc" }],
    });
    const health = await withConcurrency(candidates, row => this.mediaHealth(row.images[0]?.url));
    const eligible = candidates.filter((_, index) => health[index] === "valid");
    if (query.sort === "recommended") eligible.sort(compareProductPriority);
    const total = eligible.length;
    const prioritySlugs = eligible.slice((query.page - 1) * query.pageSize, query.page * query.pageSize).map(row => row.slug);
    const rows = await this.database.product.findMany({
      where: { AND: [where, { slug: { in: prioritySlugs } }] },
      include: publicProductListInclude,
      orderBy:
        query.sort === "name" ? [{ name: "asc" }, { slug: "asc" }] : [{ createdAt: "desc" }, { slug: "asc" }],
      skip: 0,
      take: query.pageSize,
    });

    return {
      data: restoreProductOrder(rows, prioritySlugs).map((row) => toPublicProduct(row)),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  public async getProduct(slug: string): Promise<PublicCatalogProduct> {
    const row = await this.database.product.findFirst({
      where: { slug, status: PUBLIC_CATALOG_STATUS },
      include: publicProductInclude,
    });

    if (!row) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product not found.",
      });
    }

    return toPublicProduct(row);
  }

  public async listCategories(query: PublicCategoryListQuery): Promise<{
    data: PublicCatalogCategory[];
    page: Meta;
  }> {
    const where = { status: PUBLIC_CATALOG_STATUS };
    const total = await this.database.productCategory.count({ where });
    const rows = await this.database.productCategory.findMany(
      mediaWriteData({
        where,
        orderBy: { name: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          slug: true,
          name: true,
          imageUrl: true,
          imageAlt: true,
        },
      }),
    );

    return {
      data: rows.map((row) => {
        const media = withCategoryMedia(row);
        return {
          slug: media.slug,
          name: media.name,
          imageUrl: media.imageUrl ?? null,
          imageAlt: media.imageAlt ?? null,
        };
      }),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  private async requirePublishedCategory(slug: string): Promise<{ id: string }> {
    const category = await this.database.productCategory.findFirst({
      where: { slug, status: PUBLIC_CATALOG_STATUS },
      select: { id: true },
    });

    if (!category) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Category not found.",
      });
    }

    return category;
  }
}
