import { persistedPublicationReviews } from "./persisted-publication-review.js";
import { resolveCategorySlug } from "./category-alias.js";
import { reviewedMediaHash } from "../infrastructure/reviewed-media-hash.js";
import { AppError } from "../../../lib/app-error.js";
import { compareProductPriority, orderedProductImages } from "@hamd/constants";
import { restoreProductOrder } from "./prioritized-product-page.js";
import {
  publicProductMediaHealth,
  withConcurrency,
} from "../infrastructure/product-media-health.js";
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
import {
  productPublicationReviews,
  primaryImage,
  reviewIsCurrent,
  legitimateSharedMedia,
  conceptIdentity,
  type PublicationReview,
  type ReviewProduct,
} from "./product-publication-review.js";

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
  id?: string | undefined;
  description?: string | null;
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
  specifications: Record<string, unknown>;
};

export type PublicCatalogProduct = {
  slug: string;
  name: string;
  description: string | null;
  summary: string | null;
  entryType:
    | "STANDARD_PRODUCT"
    | "PRODUCT_FAMILY"
    | "PROCUREMENT_SERVICE"
    | "CONFIGURABLE_PRODUCT";
  availabilityStatus:
    | "ON_REQUEST"
    | "COMING_SOON"
    | "PRE_ORDER"
    | "OUT_OF_STOCK";
  keySpecifications: Record<string, unknown>;
  releaseDate: string | null;
  category: PublicCatalogCategory | null;
  brandName: string | null;
  manufacturerName: string | null;
  images: PublicCatalogImage[];
  videos: PublicCatalogVideo[];
  variants: PublicCatalogVariant[];
};

type CatalogProductRow = {
  id?: string;
  catalogueId?: string | null;
  sourceManifestVersion?: string | null;
  verificationStatus?: string | null;
  slug: string;
  name: string;
  description: string | null;
  summary?: string | null;
  entryType?: "STANDARD_PRODUCT" | "PRODUCT_FAMILY" | "PROCUREMENT_SERVICE" | "CONFIGURABLE_PRODUCT";
  availabilityStatus?: "ON_REQUEST" | "COMING_SOON" | "PRE_ORDER" | "OUT_OF_STOCK";
  keySpecifications?: unknown;
  releaseDate?: Date | string | null;
  category: {
    id?: string;
    description?: string | null;
    slug: string;
    name: string;
    status: string;
  } | null;
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
  images: {
    orderBy: [{ isPrimary: "desc" as const }, { position: "asc" as const }],
    take: 3,
  },
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
    unit:
      typeof record?.unit === "string" && record.unit.trim()
        ? record.unit
        : null,
    typicalSpecificationFields: Array.isArray(fields)
      ? fields.filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0,
        )
      : [],
    sourcingStatus:
      typeof record?.sourcingStatus === "string" && record.sourcingStatus.trim()
        ? record.sourcingStatus
        : null,
  };
}

function publicSpecifications(value: unknown): Record<string, unknown> {
  return asRecord(value) ?? {};
}

function publicDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function manifestFallbackEligible(
  product: CatalogProductRow & { status?: string },
): boolean {
  return Boolean(
    product.status === PUBLIC_CATALOG_STATUS &&
      product.category?.status === PUBLIC_CATALOG_STATUS &&
      product.catalogueId?.trim() &&
      product.sourceManifestVersion?.trim() &&
      product.verificationStatus?.startsWith("VERIFIED_"),
  );
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
    summary: row.summary ?? null,
    entryType: row.entryType ?? "STANDARD_PRODUCT",
    availabilityStatus: row.availabilityStatus ?? "ON_REQUEST",
    keySpecifications: publicSpecifications(row.keySpecifications),
    releaseDate: publicDate(row.releaseDate),
    category:
      row.category?.status === PUBLIC_CATALOG_STATUS
        ? {
            id: row.category.id,
            description: row.category.description ?? null,
            slug: row.category.slug,
            name: row.category.name,
            imageUrl: null,
            imageAlt: null,
          }
        : null,
    brandName: row.brand?.name ?? null,
    manufacturerName: row.manufacturer?.legalName ?? null,
    images: orderedProductImages(row.images ?? [])
      .filter(
        (image) =>
          typeof image?.url === "string" && image.url.trim().length > 0,
      )
      .map((image) => ({
        url: image.url,
        altText: image.altText,
        position: image.position,
      })),
    videos: (row.videos ?? [])
      .filter(
        (video) =>
          typeof video?.url === "string" && video.url.trim().length > 0,
      )
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
        specifications: publicSpecifications(variant.specifications),
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
    private readonly reviews: readonly PublicationReview[] = productPublicationReviews,
    private readonly mediaHash = reviewedMediaHash,
    private readonly loadedReviews = false,
  ) {}

  private async reviewedService(): Promise<CatalogService> {
    if (this.loadedReviews || this.reviews !== productPublicationReviews) return this;
    const saved = await persistedPublicationReviews(this.database);
    return new CatalogService(this.database, this.mediaHealth, [...this.reviews, ...saved], this.mediaHash, true);
  }

  /** Technical validity never substitutes for a recorded visual/editorial review. */
  private async isApproved(product: ReviewProduct): Promise<boolean> {
    const review = this.reviews.find((item) => item.productId === product.id);
    if (!reviewIsCurrent(product, review)) return false;
    const image = primaryImage(product)!;
    const associations = await this.database.productImage.findMany({
      where: {
        productId: { not: product.id },
        OR: [
          { url: image.url },
          ...(image.storageKey ? [{ storageKey: image.storageKey }] : []),
        ],
      },
      select: { productId: true },
      take: 101,
    });
    if (associations.length > 100) return false;
    const conflicts = new Set(associations.map((row) => row.productId));
    for (const other of this.reviews) {
      if (
        other.productId !== product.id &&
        (other.sha256 === review!.sha256 ||
          conceptIdentity(other.productName) === conceptIdentity(product.name))
      )
        conflicts.add(other.productId);
    }
    for (const id of conflicts) {
      if (
        !legitimateSharedMedia(
          review,
          this.reviews.find((item) => item.productId === id),
        )
      )
        return false;
    }
    return (
      (await this.mediaHealth(image.url)) === "valid" &&
      (await this.mediaHash(image.url)) === review!.sha256
    );
  }

  private async isPubliclyReleasable(
    product: CatalogProductRow & ReviewProduct,
  ): Promise<boolean> {
    if (manifestFallbackEligible(product)) return true;
    if (!this.reviews.some((review) => review.productId === product.id)) return false;
    return this.isApproved(product);
  }

  private publicProductForRelease(
    row: CatalogProductRow & ReviewProduct,
  ): PublicCatalogProduct {
    return manifestFallbackEligible(row)
      ? toPublicProduct(row)
      : this.reviewedPublicProduct(row);
  }

  private reviewedPublicProduct(
    row: CatalogProductRow & ReviewProduct,
  ): PublicCatalogProduct {
    const image = primaryImage(row)!;
    // Only the reviewed primary binary is approved, not every legacy gallery row.
    return toPublicProduct({
      ...row,
      images: [{ url: image.url, altText: image.altText ?? null, position: 0 }],
    });
  }

  public async getCategoryPreview(slug: string): Promise<{ category: { id: string; slug: string; name: string; description: string | null; imageUrl: string | null; imageAlt: string | null }; products: (PublicCatalogProduct & { id: string })[]; limit: number }> {
    const service = await this.reviewedService();
    if (service !== this) return service.getCategoryPreview(slug);
    const row = await this.database.productCategory.findFirst({
      where: { slug: resolveCategorySlug(slug), status: PUBLIC_CATALOG_STATUS },
    });
    if (!row)
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Category not found.",
      });
    const category = withCategoryMedia(row);
    // Page only reviewed identities, not the first 16 legacy rows. Rank after validation.
    const products: (PublicCatalogProduct & { id: string })[] = [];
    const reviews = [...this.reviews].sort(
      (a, b) =>
        a.priorityTier.localeCompare(b.priorityTier) ||
        a.slug.localeCompare(b.slug),
    );
    for (
      let offset = 0;
      offset < reviews.length && products.length < 16;
      offset += 100
    ) {
      const batch = reviews.slice(offset, offset + 100);
      const candidates = await this.database.product.findMany({
        where: {
          categoryId: row.id,
          status: PUBLIC_CATALOG_STATUS,
          slug: { in: batch.map((item) => item.slug) },
        },
        take: 100,
        orderBy: { slug: "asc" },
        include: publicProductInclude,
      });
      const approved = await withConcurrency(candidates, (product) =>
        this.isApproved(product),
      );
      for (const review of batch) {
        const index = candidates.findIndex(
          (product) => product.id === review.productId,
        );
        if (index >= 0 && approved[index] && products.length < 16)
          products.push({ ...this.reviewedPublicProduct(candidates[index]!), id: candidates[index]!.id });
      }
    }
    if (products.length < 16) {
      const excludedIds = new Set(products.map((product) => product.id));
      const manifestCandidates = await this.database.product.findMany({
        where: {
          categoryId: row.id,
          status: PUBLIC_CATALOG_STATUS,
          catalogueId: { not: null },
          sourceManifestVersion: { not: null },
          verificationStatus: { startsWith: "VERIFIED_" },
        },
        take: 16,
        orderBy: [{ createdAt: "desc" }, { slug: "asc" }],
        include: publicProductInclude,
      });
      for (const product of manifestCandidates) {
        if (
          products.length >= 16 ||
          excludedIds.has(product.id) ||
          !manifestFallbackEligible(product)
        ) {
          continue;
        }
        products.push({ ...toPublicProduct(product), id: product.id });
        excludedIds.add(product.id);
      }
    }

    return {
      category: {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: category.description,
        imageUrl: category.imageUrl,
        imageAlt: category.imageAlt ?? null,
      },
      products,
      limit: 16,
    };
  }

  public async listProducts(query: PublicProductListQuery): Promise<{
    data: PublicCatalogProduct[];
    page: Meta;
  }> {
    const service = await this.reviewedService();
    if (service !== this) return service.listProducts(query);
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
      include: publicProductInclude,
      orderBy:
        query.sort === "name"
          ? [{ name: "asc" }, { slug: "asc" }]
          : [{ createdAt: "desc" }, { slug: "asc" }],
    });
    const approved = await withConcurrency(candidates, (row) =>
      this.isPubliclyReleasable(row),
    );
    const eligible = candidates.filter((_row, index) => approved[index]);
    if (query.sort === "recommended")
      eligible.sort((a, b) => {
        const tier = (id: string) =>
          this.reviews.find((review) => review.productId === id)?.priorityTier ??
          "P2_CORE";
        return (
          tier(a.id).localeCompare(tier(b.id)) || compareProductPriority(a, b)
        );
      });
    const total = eligible.length;
    const prioritySlugs = eligible
      .slice((query.page - 1) * query.pageSize, query.page * query.pageSize)
      .map((row) => row.slug);
    const rows = await this.database.product.findMany({
      where: { AND: [where, { slug: { in: prioritySlugs } }] },
      include: publicProductListInclude,
      orderBy:
        query.sort === "name"
          ? [{ name: "asc" }, { slug: "asc" }]
          : [{ createdAt: "desc" }, { slug: "asc" }],
      skip: 0,
      take: query.pageSize,
    });

    const currentApprovals = await withConcurrency(rows, (row) =>
      this.isPubliclyReleasable(row),
    );
    return {
      data: restoreProductOrder(
        rows.filter((_row, index) => currentApprovals[index]),
        prioritySlugs,
      ).map((row) => this.publicProductForRelease(row)),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  public async getProduct(slug: string): Promise<PublicCatalogProduct> {
    const service = await this.reviewedService();
    if (service !== this) return service.getProduct(slug);
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
    if (!(await this.isPubliclyReleasable(row)))
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Product not found.",
      });

    if (!manifestFallbackEligible(row)) {
      const primary = primaryImage(row);
      if ((await this.mediaHealth(primary?.url)) !== "valid") {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }
    }

    return this.publicProductForRelease(row);
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
          id: true,
          description: true,
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
          id: media.id,
          description: media.description ?? null,
          slug: media.slug,
          name: media.name,
          imageUrl: media.imageUrl ?? null,
          imageAlt: media.imageAlt ?? null,
        };
      }),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  private async requirePublishedCategory(
    slug: string,
  ): Promise<{ id: string }> {
    const category = await this.database.productCategory.findFirst({
      where: { slug: resolveCategorySlug(slug), status: PUBLIC_CATALOG_STATUS },
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
