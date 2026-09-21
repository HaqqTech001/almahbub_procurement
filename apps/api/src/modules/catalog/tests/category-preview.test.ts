import { describe, expect, it, vi } from "vitest";
import { CatalogService } from "../application/catalog-service.js";
import { reviewed, fixtureHash } from "./publication-fixtures.js";
import {
  reviewIsCurrent,
  type ReviewProduct,
} from "../application/product-publication-review.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
const category = {
  id: "c",
  slug: "beauty-spa-salon",
  name: "Salon",
  description: "Salon equipment",
  status: "published",
  imageUrl: "/salon.jpg",
  imageAlt: "Salon",
};
const product = (id: string, name = "Salon chair"): ReviewProduct => ({
  id,
  slug: id,
  name,
  status: "published",
  description: null,
  category,
  brand: null,
  images: [
    {
      id: `image-${id}`,
      url: `/${id}.png`,
      position: 0,
      isPrimary: true,
      altText: name,
    },
  ],
});
function setup(rows: ReviewProduct[]) {
  const findMany = vi.fn().mockResolvedValue(rows);
  const associations = vi.fn().mockResolvedValue([]);
  const db = {
    productVariant: { findMany: vi.fn().mockResolvedValue([]) },
    productCategory: { findFirst: vi.fn().mockResolvedValue(category) },
    product: { findMany, findFirst: vi.fn().mockResolvedValue(rows[0]) },
    productImage: { findMany: associations },
  } as unknown as DatabaseClient;
  return { db, findMany, associations };
}
describe("reviewed category publication", () => {
  it("does not expose technically valid legacy products without explicit approval, including direct URLs", async () => {
    const { db, findMany } = setup([product("legacy")]);
    const service = new CatalogService(db, async () => "valid");
    expect((await service.getCategoryPreview(category.slug)).products).toEqual(
      [],
    );
    expect(findMany).not.toHaveBeenCalled();
    await expect(service.getProduct("legacy")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(
      (
        await service.listProducts({
          page: 1,
          pageSize: 12,
          sort: "recommended",
        })
      ).data,
    ).toEqual([]);
  });
  it("queries only reviewed identities, ranks P1 before P2 and omits broken media", async () => {
    const core = product("core", "Salon chair"),
      showcase = product("showcase", "Hair steamer"),
      broken = product("broken", "Manicure table");
    const { db, findMany } = setup([core, broken, showcase]);
    const service = new CatalogService(
      db,
      async (url) => (url === "/broken.png" ? "broken" : "valid"),
      [reviewed(core), reviewed(showcase, "P1_SHOWCASE"), reviewed(broken)],
      fixtureHash,
    );
    expect(
      (await service.getCategoryPreview(category.slug)).products.map(
        (row) => row.slug,
      ),
    ).toEqual(["showcase", "core"]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
        where: expect.objectContaining({
          categoryId: "c",
          status: "published",
          slug: { in: ["showcase", "broken", "core"] },
        }),
      }),
    );
  });
  it("rejects media shared with an unreviewed product outside the preview", async () => {
    const row = product("one");
    const { db, associations } = setup([row]);
    associations.mockResolvedValue([{ productId: "unrelated" }]);
    expect(
      (
        await new CatalogService(
          db,
          async () => "valid",
          [reviewed(row)],
          fixtureHash,
        ).getCategoryPreview(category.slug)
      ).products,
    ).toEqual([]);
  });
  it("rejects replaced bytes even when the URL and metadata are unchanged", async () => {
    const row = product("one");
    const { db } = setup([row]);
    expect(
      (
        await new CatalogService(
          db,
          async () => "valid",
          [reviewed(row)],
          async () => "different-hash",
        ).getCategoryPreview(category.slug)
      ).products,
    ).toEqual([]);
  });
  it("invalidates review after identity, category or primary-image changes", () => {
    const row = product("one");
    const review = reviewed(row);
    expect(reviewIsCurrent(row, review)).toBe(true);
    expect(reviewIsCurrent({ ...row, name: "Hair steamer" }, review)).toBe(
      false,
    );
    expect(
      reviewIsCurrent(
        { ...row, category: { ...category, slug: "machineries" } },
        review,
      ),
    ).toBe(false);
    expect(
      reviewIsCurrent(
        { ...row, images: [{ ...row.images[0]!, url: "/replacement.png" }] },
        review,
      ),
    ).toBe(false);
  });
  it("rejects category artwork and branded products without verified research", () => {
    const row = product("art");
    row.images[0]!.url = category.imageUrl;
    expect(reviewIsCurrent(row, reviewed(row))).toBe(false);
    const branded = {
      ...product("brand"),
      name: "Apple iPhone 15",
      category: { ...category, slug: "iphones-gadgets" },
    };
    const noResearch = reviewed(branded);
    delete noResearch.research;
    expect(reviewIsCurrent(branded, noResearch)).toBe(false);
  });
  it("continues past an invalid batch instead of selecting the first legacy rows", async () => {
    const rows = Array.from({ length: 101 }, (_, index) =>
      product(
        `chair-${String(index).padStart(3, "0")}`,
        `Salon chair model ${index}`,
      ),
    );
    const { db, findMany } = setup([]);
    findMany
      .mockResolvedValueOnce(rows.slice(0, 100))
      .mockResolvedValueOnce(rows.slice(100));
    const service = new CatalogService(
      db,
      async (url) => (url === "/chair-100.png" ? "valid" : "broken"),
      rows.map((row) => reviewed(row)),
      fixtureHash,
    );
    expect(
      (await service.getCategoryPreview(category.slug)).products.map(
        (row) => row.slug,
      ),
    ).toEqual(["chair-100"]);
    expect(findMany).toHaveBeenCalledTimes(2);
  });
  it("caps the preview at sixteen approved products", async () => {
    const rows = Array.from({ length: 20 }, (_, index) =>
      product(`chair-${index}`, `Salon chair model ${index}`),
    );
    const { db } = setup(rows);
    expect(
      (
        await new CatalogService(
          db,
          async () => "valid",
          rows.map((row) => reviewed(row)),
          fixtureHash,
        ).getCategoryPreview(category.slug)
      ).products,
    ).toHaveLength(16);
  });
  it("does not query products for an unavailable category", async () => {
    const { db, findMany } = setup([]);
    vi.mocked(db.productCategory.findFirst).mockResolvedValue(null);
    await expect(
      new CatalogService(db).getCategoryPreview("missing"),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(findMany).not.toHaveBeenCalled();
  });
});
