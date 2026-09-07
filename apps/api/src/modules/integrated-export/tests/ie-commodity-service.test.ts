import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import {
  createIeCommoditySchema,
  ieCommodityListQuerySchema,
} from "../api/ie-commodity-schemas.js";
import { IeCommodityService } from "../application/ie-commodity-service.js";

function opsAuth(
  permissions: readonly string[] = ["ops:access"],
): AuthContext {
  return {
    userId: "user-ops",
    organizationId: "org-1",
    membershipId: "mem-1",
    sessionId: "sess-1",
    permissionKeys: new Set(permissions),
  };
}

function buyerAuth(): AuthContext {
  return {
    userId: "user-buyer",
    organizationId: "org-1",
    membershipId: "mem-2",
    sessionId: "sess-2",
    permissionKeys: new Set(["request:read"]),
  };
}

function fixtureRow(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-08-17T00:00:00.000Z");
  return {
    id: "0190c8a0-1000-7000-8000-00000000c001",
    slug: "test-commodity-only",
    name: "TEST COMMODITY ONLY",
    published: false,
    category: null,
    shortDescription: null,
    description: null,
    heroMedia: null,
    gallery: null,
    specifications: null,
    packaging: null,
    qualityInformation: null,
    applications: null,
    markets: null,
    sortOrder: 0,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("IeCommodityService", () => {
  it("lists only published non-archived commodities for public callers", async () => {
    const integratedExportCommodity = {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        fixtureRow({ published: true }),
      ]),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const result = await new IeCommodityService(database).list(
      ieCommodityListQuerySchema.parse({}),
    );
    expect(integratedExportCommodity.findMany.mock.calls[0]?.[0]?.where).toEqual(
      expect.objectContaining({ published: true, archivedAt: null }),
    );
    expect(result.data[0]?.slug).toBe("test-commodity-only");
  });

  it("ignores includeUnpublished unless caller has ops:access", async () => {
    const integratedExportCommodity = {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const service = new IeCommodityService(database);

    await service.list(
      ieCommodityListQuerySchema.parse({ includeUnpublished: "true" }),
    );
    expect(
      integratedExportCommodity.findMany.mock.calls[0]?.[0]?.where.published,
    ).toBe(true);

    await service.list(
      ieCommodityListQuerySchema.parse({ includeUnpublished: "true" }),
      buyerAuth(),
    );
    expect(
      integratedExportCommodity.findMany.mock.calls[1]?.[0]?.where.published,
    ).toBe(true);

    await service.list(
      ieCommodityListQuerySchema.parse({ includeUnpublished: "true" }),
      opsAuth(),
    );
    expect(
      integratedExportCommodity.findMany.mock.calls[2]?.[0]?.where,
    ).toEqual({ archivedAt: null });
  });

  it("requires published=true for anonymous getBySlug", async () => {
    const integratedExportCommodity = {
      findFirst: vi.fn().mockResolvedValue(null),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    await expect(
      new IeCommodityService(database).getBySlug("test-commodity-only"),
    ).rejects.toMatchObject({ statusCode: 404, code: "NOT_FOUND" });
    expect(integratedExportCommodity.findFirst.mock.calls[0]?.[0]?.where).toEqual(
      {
        slug: "test-commodity-only",
        archivedAt: null,
        published: true,
      },
    );
  });

  it("allows ops getBySlug without published filter", async () => {
    const integratedExportCommodity = {
      findFirst: vi.fn().mockResolvedValue(fixtureRow({ published: false })),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const dto = await new IeCommodityService(database).getBySlug(
      "test-commodity-only",
      opsAuth(),
    );
    expect(dto.published).toBe(false);
    expect(integratedExportCommodity.findFirst.mock.calls[0]?.[0]?.where).toEqual(
      {
        slug: "test-commodity-only",
        archivedAt: null,
      },
    );
  });

  it("serializes heroMedia onto public list items and detail DTOs", async () => {
    const hero = {
      src: "/media/ie/commodities/cashew/hero/ie-cashew-hero-01.webp",
      alt: "Representative photo of cashew kernels",
    };
    const integratedExportCommodity = {
      count: vi.fn().mockResolvedValue(1),
      findMany: vi.fn().mockResolvedValue([
        fixtureRow({ published: true, heroMedia: hero }),
      ]),
      findFirst: vi.fn().mockResolvedValue(
        fixtureRow({ published: true, slug: "cashew", name: "Cashew", heroMedia: hero }),
      ),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const service = new IeCommodityService(database);
    const listed = await service.list(ieCommodityListQuerySchema.parse({}));
    expect(listed.data[0]?.heroMedia).toEqual(hero);

    const detail = await service.getBySlug("cashew");
    expect(detail.heroMedia).toEqual(hero);
  });

  it("creates draft by default when ops-authorized", async () => {
    const integratedExportCommodity = {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(fixtureRow({ published: false })),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const created = await new IeCommodityService(database).create(
      opsAuth(),
      createIeCommoditySchema.parse({
        name: "TEST COMMODITY ONLY",
        slug: "test-commodity-only",
      }),
    );
    expect(integratedExportCommodity.create.mock.calls[0]?.[0]?.data.published).toBe(
      false,
    );
    expect(created.published).toBe(false);
  });

  it("rejects create without ops:access at the service layer", async () => {
    const database = {
      integratedExportCommodity: {},
    } as unknown as DatabaseClient;
    await expect(
      new IeCommodityService(database).create(
        buyerAuth(),
        createIeCommoditySchema.parse({
          name: "TEST COMMODITY ONLY",
          slug: "test-commodity-only",
        }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects duplicate slugs with 409", async () => {
    const integratedExportCommodity = {
      findFirst: vi.fn().mockResolvedValue({ id: "other-id" }),
      create: vi.fn(),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    await expect(
      new IeCommodityService(database).create(
        opsAuth(),
        createIeCommoditySchema.parse({
          name: "TEST COMMODITY ONLY",
          slug: "test-commodity-only",
        }),
      ),
    ).rejects.toMatchObject({ statusCode: 409, code: "CONFLICT" });
    expect(integratedExportCommodity.create).not.toHaveBeenCalled();
  });

  it("publishes via update when authorized", async () => {
    const integratedExportCommodity = {
      findFirst: vi
        .fn()
        .mockResolvedValueOnce(fixtureRow({ published: false }))
        .mockResolvedValueOnce(null),
      update: vi.fn().mockResolvedValue(fixtureRow({ published: true })),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const updated = await new IeCommodityService(database).update(
      opsAuth(),
      "0190c8a0-1000-7000-8000-00000000c001",
      { published: true },
    );
    expect(updated.published).toBe(true);
  });

  it("soft-archives (published=false + archivedAt) instead of hard delete", async () => {
    const integratedExportCommodity = {
      findFirst: vi.fn().mockResolvedValue(fixtureRow({ published: true })),
      update: vi.fn().mockResolvedValue(
        fixtureRow({
          published: false,
          archivedAt: new Date("2026-08-17T12:00:00.000Z"),
        }),
      ),
      delete: vi.fn(),
    };
    const database = { integratedExportCommodity } as unknown as DatabaseClient;
    const archived = await new IeCommodityService(database).archive(
      opsAuth(),
      "0190c8a0-1000-7000-8000-00000000c001",
    );
    expect(integratedExportCommodity.delete).not.toHaveBeenCalled();
    expect(integratedExportCommodity.update.mock.calls[0]?.[0]?.data).toEqual(
      expect.objectContaining({ published: false }),
    );
    expect(archived.published).toBe(false);
    expect(archived.archivedAt).toBeTruthy();
  });

  it("never queries International Product tables", async () => {
    const product = { findMany: vi.fn(), create: vi.fn() };
    const productCategory = { findMany: vi.fn() };
    const integratedExportCommodity = {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    };
    const database = {
      product,
      productCategory,
      integratedExportCommodity,
    } as unknown as DatabaseClient;
    await new IeCommodityService(database).list(
      ieCommodityListQuerySchema.parse({}),
    );
    expect(product.findMany).not.toHaveBeenCalled();
    expect(productCategory.findMany).not.toHaveBeenCalled();
  });
});
