import { describe, it, expect, vi } from "vitest";
import { reviewed, fixtureHash } from "./publication-fixtures.js";
import { compareProductPriority, orderedProductImages, productMediaRoute, productShowcaseGroup } from "@hamd/constants";
import { CatalogService } from "../application/catalog-service.js";
import { publicProductListQuerySchema } from "../api/catalog-schemas.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

describe("V2 product priority", () => {
  it("deprioritizes POS and fabric even when they have images", () => {
    const photo = [{ url: "https://media.example/a.webp", position: 0 }];
    const rows = [{ slug: "pos", name: "POS Terminal", images: photo }, { slug: "fabric", name: "Cotton Fabric Roll", images: photo }, { slug: "freezer", name: "Chest Freezer", images: [] }];
    expect(rows.sort(compareProductPriority)[0]?.slug).toBe("freezer");
    expect(productMediaRoute("Samsung Galaxy phone")).toBe("current_product_research");
    expect(productMediaRoute("Generic men's kaftan set")).toBe("generation_ready");
    expect(productShowcaseGroup("Hydraulic hoses")).toBe("industrial-parts");
    expect(productShowcaseGroup("Folding Wheelchair")).toBeNull();
    expect(productShowcaseGroup("Backpack Brush Cutter", "home-garden-wares")).toBeNull();
    expect(productShowcaseGroup("Infusion Pump", "medical-equipments")).toBeNull();
  });

  it("prefers assigned persistent media without changing the primary image order", () => {
    expect(orderedProductImages([{ url: "https://media.example/detail.webp", position: 2 }, { url: "/api/v1/public/catalog-media/primary.webp", position: 0 }, { url: "javascript:alert(1)", position: -1 }, { url: "https://media.example/detail.webp", position: 3 }]).map(image => image.position)).toEqual([0, 2]);
    expect(compareProductPriority({ slug: "a", name: "Chest Freezer", images: [] }, { slug: "b", name: "Chest Freezer", images: [{ url: "https://media.example/freezer.webp", position: 0 }] })).toBeGreaterThan(0);
  });

  it("ranks all filtered records before paginating and restores hydration order", async () => {
    const candidates = ["Printer", "Laptop", "Scanner"].map((name, index) => ({
      id: ["printer", "laptop", "scanner"][index]!, slug: ["printer", "laptop", "scanner"][index]!, name, status: "published", description: null,
      category: { slug: "office-business", name: "Office", status: "published" }, brand: null, manufacturer: null,
      images: [{ id: `image-${index}`, url: `/${["printer", "laptop", "scanner"][index]}.png`, position: 0, isPrimary: true }],
    }));
    const findMany = vi.fn().mockResolvedValueOnce(candidates).mockResolvedValueOnce([candidates[2]]);
    const database = { product: { count: vi.fn().mockResolvedValue(3), findMany }, productImage: { findMany: vi.fn().mockResolvedValue([]) } } as unknown as DatabaseClient;
    const reviews = candidates.map((row, index) => reviewed(row, index === 1 ? "P1_SHOWCASE" : index === 2 ? "P2_CORE" : "P3_EXPANSION"));
    const result = await new CatalogService(database, async () => "valid", reviews, fixtureHash).listProducts(publicProductListQuerySchema.parse({ page: 2, pageSize: 1, q: "request" }));
    expect(findMany.mock.calls[0]?.[0]).not.toHaveProperty("take");
    expect(findMany.mock.calls[0]?.[0]?.where.status).toBe("published");
    expect(findMany.mock.calls[1]?.[0]?.where.AND[1]).toEqual({ slug: { in: ["scanner"] } });
    expect(findMany.mock.calls[1]?.[0]?.where.AND[0].OR).toBeTruthy();
    expect(result.data.map(row => row.slug)).toEqual(["scanner"]);
    expect(result.page).toEqual({ page: 2, pageSize: 1, total: 3, hasMore: true });
  });
});
