import { Prisma } from "@hamd/database";

import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type { UploadedFileInput } from "../../media/document/application/document-service.js";
import {
  createCatalogMediaStore,
  type CatalogMediaStore,
} from "../../catalog/infrastructure/catalog-media-store.js";
import { validateCatalogMediaUpload } from "../../catalog/infrastructure/catalog-media-policy.js";
import type {
  CreateIeCommodityInput,
  IeCommodityListQuery,
  UpdateIeCommodityInput,
} from "../api/ie-commodity-schemas.js";
import {
  activeCommodityWhere,
  publicCommodityWhere,
} from "../domain/ie-commodity.js";
import {
  assertIeCommodityOpsAccess,
  canViewUnpublishedIeCommodities,
} from "./ie-commodity-policy.js";

type Meta = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type IeCommodityMediaDto = {
  src: string;
  alt: string;
  sortOrder?: number;
};

export type IeCommoditySpecDto = {
  label: string;
  value: string;
};

/** Full commodity DTO aligned with web IeCommodity contract. */
export type IeCommodityDto = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  heroMedia: IeCommodityMediaDto | null;
  gallery: IeCommodityMediaDto[];
  specifications: IeCommoditySpecDto[];
  packaging: string | null;
  qualityInformation: string | null;
  applications: string[];
  markets: string | null;
  sortOrder: number;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** List/card projection for public catalogue. */
export type IeCommodityListItemDto = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  heroMedia: IeCommodityMediaDto | null;
  sortOrder: number;
};

type CommodityRow = {
  id: string;
  slug: string;
  name: string;
  published: boolean;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  heroMedia: Prisma.JsonValue | null;
  gallery: Prisma.JsonValue | null;
  specifications: Prisma.JsonValue | null;
  packaging: string | null;
  qualityInformation: string | null;
  applications: Prisma.JsonValue | null;
  markets: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function pageMeta(total: number, page: number, pageSize: number): Meta {
  return {
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

function asMedia(value: Prisma.JsonValue | null): IeCommodityMediaDto | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const src = typeof record.src === "string" ? record.src.trim() : "";
  if (!src) {
    return null;
  }
  const altFromRecord = typeof record.alt === "string" ? record.alt.trim() : "";
  const fromPath =
    src
      .split("/")
      .pop()
      ?.replace(/\.[^.]+$/, "")
      .replace(/[-_]/g, " ") ?? "Commodity image";
  const dto: IeCommodityMediaDto = { src, alt: altFromRecord || fromPath };
  if (
    typeof record.sortOrder === "number" &&
    Number.isFinite(record.sortOrder)
  ) {
    dto.sortOrder = record.sortOrder;
  }
  return dto;
}

function asMediaList(value: Prisma.JsonValue | null): IeCommodityMediaDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asMedia(item))
    .filter((item): item is IeCommodityMediaDto => item !== null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function asSpecs(value: Prisma.JsonValue | null): IeCommoditySpecDto[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: IeCommoditySpecDto[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const specValue =
      typeof record.value === "string" ? record.value.trim() : "";
    if (label && specValue) {
      out.push({ label, value: specValue });
    }
  }
  return out;
}

function asStringList(value: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toJsonInput(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null) {
    return Prisma.DbNull;
  }
  return value as Prisma.InputJsonValue;
}

export function toIeCommodityDto(row: CommodityRow): IeCommodityDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    published: row.published,
    category: row.category,
    shortDescription: row.shortDescription,
    description: row.description,
    heroMedia: asMedia(row.heroMedia),
    gallery: asMediaList(row.gallery),
    specifications: asSpecs(row.specifications),
    packaging: row.packaging,
    qualityInformation: row.qualityInformation,
    applications: asStringList(row.applications),
    markets: row.markets,
    sortOrder: row.sortOrder,
    archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toIeCommodityListItem(
  row: CommodityRow,
): IeCommodityListItemDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    published: row.published,
    category: row.category,
    shortDescription: row.shortDescription,
    heroMedia: asMedia(row.heroMedia),
    sortOrder: row.sortOrder,
  };
}

function orderByForSort(sort: IeCommodityListQuery["sort"]) {
  if (sort === "name") {
    return [{ name: "asc" as const }, { id: "asc" as const }];
  }
  if (sort === "newest") {
    return [{ createdAt: "desc" as const }, { id: "asc" as const }];
  }
  return [
    { sortOrder: "asc" as const },
    { name: "asc" as const },
    { id: "asc" as const },
  ];
}

/**
 * Authoritative Integrated Export commodity catalogue.
 * Never queries International Product / ProductCategory tables.
 */
export class IeCommodityService {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly catalogMedia: CatalogMediaStore = createCatalogMediaStore({
      uploadRoot: "uploads",
    }),
  ) {}

  public async list(
    query: IeCommodityListQuery,
    auth?: AuthContext,
  ): Promise<{ data: IeCommodityListItemDto[]; page: Meta }> {
    const includeUnpublished =
      Boolean(query.includeUnpublished) &&
      canViewUnpublishedIeCommodities(auth);

    const where: Prisma.IntegratedExportCommodityWhereInput = {
      ...(includeUnpublished ? activeCommodityWhere() : publicCommodityWhere()),
      ...(query.category
        ? { category: { equals: query.category, mode: "insensitive" } }
        : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" } },
              { shortDescription: { contains: query.q, mode: "insensitive" } },
              { slug: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.database.integratedExportCommodity.count({ where }),
      this.database.integratedExportCommodity.findMany({
        where,
        orderBy: orderByForSort(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: (rows as CommodityRow[]).map(toIeCommodityListItem),
      page: pageMeta(total, query.page, query.pageSize),
    };
  }

  public async getBySlug(
    slug: string,
    auth?: AuthContext,
  ): Promise<IeCommodityDto> {
    const allowDraft = canViewUnpublishedIeCommodities(auth);
    const row = await this.database.integratedExportCommodity.findFirst({
      where: {
        slug,
        archivedAt: null,
        ...(allowDraft ? {} : { published: true }),
      },
    });

    if (!row) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Commodity not found.",
      });
    }

    return toIeCommodityDto(row as CommodityRow);
  }

  public async uploadHero(
    auth: AuthContext,
    id: string,
    file: UploadedFileInput,
  ): Promise<IeCommodityDto> {
    assertIeCommodityOpsAccess(auth);
    await this.requireActiveById(id);
    const issues = validateCatalogMediaUpload({
      filename: file.originalFilename,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      kind: "image",
    });
    if (issues.length > 0) {
      throw new AppError({
        statusCode: 422,
        code: issues[0]!.code,
        message: issues[0]!.message,
      });
    }
    const stored = await this.catalogMedia.put({
      productId: id,
      originalFilename: file.originalFilename,
      bytes: file.buffer,
    });
    const row = await this.database.integratedExportCommodity.update({
      where: { id },
      data: {
        heroMedia: toJsonInput({
          src: stored.publicUrl,
          alt: file.originalFilename.replace(/\.[^.]+$/, ""),
        }),
      },
    });
    return toIeCommodityDto(row as CommodityRow);
  }

  public async create(
    auth: AuthContext,
    input: CreateIeCommodityInput,
  ): Promise<IeCommodityDto> {
    assertIeCommodityOpsAccess(auth);
    await this.assertSlugAvailable(input.slug);

    try {
      const data: Prisma.IntegratedExportCommodityCreateInput = {
        name: input.name,
        slug: input.slug,
        published: input.published ?? false,
        category: input.category ?? null,
        shortDescription: input.shortDescription ?? null,
        description: input.description ?? null,
        packaging: input.packaging ?? null,
        qualityInformation: input.qualityInformation ?? null,
        markets: input.markets ?? null,
        sortOrder: input.sortOrder ?? 0,
      };
      if (input.heroMedia !== undefined) {
        data.heroMedia = toJsonInput(input.heroMedia);
      }
      if (input.gallery !== undefined) {
        data.gallery = toJsonInput(input.gallery);
      }
      if (input.specifications !== undefined) {
        data.specifications = toJsonInput(input.specifications);
      }
      if (input.applications !== undefined) {
        data.applications = toJsonInput(input.applications);
      }

      const row = await this.database.integratedExportCommodity.create({
        data,
      });
      return toIeCommodityDto(row as CommodityRow);
    } catch (error) {
      this.rethrowUniqueSlug(error);
      throw error;
    }
  }

  public async update(
    auth: AuthContext,
    id: string,
    input: UpdateIeCommodityInput,
  ): Promise<IeCommodityDto> {
    assertIeCommodityOpsAccess(auth);
    const existing = await this.requireActiveById(id);

    if (input.slug !== undefined && input.slug !== existing.slug) {
      await this.assertSlugAvailable(input.slug, id);
    }

    try {
      const data: Prisma.IntegratedExportCommodityUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.slug !== undefined) data.slug = input.slug;
      if (input.published !== undefined) data.published = input.published;
      if (input.category !== undefined) data.category = input.category;
      if (input.shortDescription !== undefined) {
        data.shortDescription = input.shortDescription;
      }
      if (input.description !== undefined) data.description = input.description;
      if (input.heroMedia !== undefined) {
        data.heroMedia = toJsonInput(input.heroMedia);
      }
      if (input.gallery !== undefined) {
        data.gallery = toJsonInput(input.gallery);
      }
      if (input.specifications !== undefined) {
        data.specifications = toJsonInput(input.specifications);
      }
      if (input.packaging !== undefined) data.packaging = input.packaging;
      if (input.qualityInformation !== undefined) {
        data.qualityInformation = input.qualityInformation;
      }
      if (input.applications !== undefined) {
        data.applications = toJsonInput(input.applications);
      }
      if (input.markets !== undefined) data.markets = input.markets;
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

      const row = await this.database.integratedExportCommodity.update({
        where: { id },
        data,
      });
      return toIeCommodityDto(row as CommodityRow);
    } catch (error) {
      this.rethrowUniqueSlug(error);
      throw error;
    }
  }

  /**
   * Soft-archive: sets archivedAt and forces published=false.
   * Does not hard-delete; preserves referential safety for future procurement links.
   */
  public async archive(auth: AuthContext, id: string): Promise<IeCommodityDto> {
    assertIeCommodityOpsAccess(auth);
    await this.requireActiveById(id);

    const row = await this.database.integratedExportCommodity.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        published: false,
      },
    });
    return toIeCommodityDto(row as CommodityRow);
  }

  private async requireActiveById(id: string): Promise<CommodityRow> {
    const row = await this.database.integratedExportCommodity.findFirst({
      where: { id, archivedAt: null },
    });
    if (!row) {
      throw new AppError({
        statusCode: 404,
        code: "NOT_FOUND",
        message: "Commodity not found.",
      });
    }
    return row as CommodityRow;
  }

  private async assertSlugAvailable(
    slug: string,
    excludeId?: string,
  ): Promise<void> {
    const conflict = await this.database.integratedExportCommodity.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message:
          "An Integrated Export commodity with this slug already exists.",
        details: [
          {
            code: "SLUG_NOT_UNIQUE",
            message: `Slug "${slug}" is already in use.`,
          },
        ],
      });
    }
  }

  private rethrowUniqueSlug(error: unknown): void {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message:
          "An Integrated Export commodity with this slug already exists.",
        details: [
          {
            code: "SLUG_NOT_UNIQUE",
            message: "Slug must be unique.",
          },
        ],
      });
    }
  }
}
