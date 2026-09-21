import { describe, expect, it, vi } from "vitest";
import { reviewed, fixtureHash } from "./publication-fixtures.js";
import { auditCatalogue, type AuditProduct } from "../application/catalogue-audit.js";
import { CatalogService } from "../application/catalog-service.js";
import { publicProductListQuerySchema } from "../api/catalog-schemas.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import { hasImageSignature, inspectProductMedia, isPublicIpv4 } from "../infrastructure/product-media-health.js";

const product = (id: string, name: string, overrides: Partial<AuditProduct> = {}): AuditProduct => ({
  id, name, slug: id, status: "published", category: { slug: "medical-equipments", name: "Medical" }, images: [], ...overrides,
});
describe("safe catalogue audit", () => {
  it("retains useful missing media, protects medical testing equipment, proposes archives and never deletes", () => {
    const rows = [product("a", "Blood Test Analyzer"), product("b", "Hospital Bed", { images: [{ url: "valid", position: 0 }] }),
      product("c", "POS Terminal"), product("d", "test product"), product("e", "Hydraulic Salon Chair")];
    const audit = auditCatalogue(rows, new Map([["valid", "valid"]]));
    expect(audit.rows.map(row => row.classification)).toEqual(["KEEP_NEEDS_MEDIA", "KEEP_PRIORITY", "ARCHIVE", "DELETE_CANDIDATE", "KEEP_NEEDS_MEDIA"]);
    expect(audit.summary).toMatchObject({ totalProducts: 5, canSafelyRemain: 3, validProductsMissingMedia: 2, proposedArchiveProducts: 1, deleteCandidates: 1, confirmedDeletions: 0 });
    expect(rows.every(row => row.status === "published")).toBe(true);
  });
  it("flags only exact duplicate identities, retains one, and protects distinct model specifications", () => {
    const rows = [product("a", "Laptop"), product("b", "Laptop"), product("c", "Laptop", { variants: [{ name: "16GB", specifications: { ram: 16 } }] })];
    const audit = auditCatalogue(rows, new Map());
    expect(audit.summary.duplicateProducts).toBe(1);
    expect(audit.rows[1]?.duplicateOf).toBe("a");
    expect(audit.rows[2]?.classification).toBe("KEEP_NEEDS_MEDIA");
  });
  it("does not treat unverified network media as deletion evidence or a verified image", () => {
    const audit = auditCatalogue([product("a", "Laptop", { images: [{ url: "timeout", position: 0 }, { url: "404", position: 1 }] })], new Map([["timeout", "unverified"], ["404", "broken"]]));
    expect(audit.summary).toMatchObject({ validProductsMissingMedia: 1, brokenStaleMediaRows: 1, unverifiedMediaRows: 1, deleteCandidates: 0 });
  });
});

describe("public media visibility", () => {
  it.each(["recommended", "name", "newest"])("filters broken/missing primary before %s pagination while leaving direct management alone", async sort => {
    const candidates = ["Laptop", "Printer", "Scanner"].map((name, index) => ({
      id: ["a", "b", "c"][index]!, slug: ["a", "b", "c"][index]!, name, status: "published", description: null,
      category: { slug: "office-business", name: "Office", status: "published" }, brand: null, manufacturer: null,
      images: [{ id: `image-${index}`, url: `/${["a", "b", "c"][index]}.png`, position: 0, isPrimary: true }],
    }));
    const findMany = vi.fn().mockResolvedValueOnce(candidates).mockResolvedValueOnce([candidates[2]]);
    const database = { product: { findMany }, productImage: { findMany: vi.fn().mockResolvedValue([]) } } as unknown as DatabaseClient;
    const health = vi.fn(async (source: string | undefined) => source === "/c.png" ? "valid" as const : source === "/b.png" ? "broken" as const : "missing" as const);
    const result = await new CatalogService(database, health, candidates.map(row => reviewed(row)), fixtureHash).listProducts(publicProductListQuerySchema.parse({ sort, pageSize: 1 }));
    expect(result.data.map(row => row.slug)).toEqual(["c"]);
    expect(result.page).toMatchObject({ total: 1, hasMore: false });
    expect(findMany.mock.calls[0]?.[0]?.where.status).toBe("published");
    expect(findMany.mock.calls[1]?.[0]?.where.AND[1]).toEqual({ slug: { in: ["c"] } });
  });
  it("blocks private/metadata destinations and unsafe relative paths", async () => {
    for (const address of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.0.1", "172.16.1.1", "100.100.100.200", "::1"]) expect(isPublicIpv4(address)).toBe(false);
    expect(isPublicIpv4("8.8.8.8")).toBe(true);
    expect(await inspectProductMedia(undefined)).toBe("missing");
    expect(await inspectProductMedia("file:///etc/passwd")).toBe("broken");
    expect(await inspectProductMedia("/api/v1/public/catalog-media/../../secret")).toBe("broken");
    expect(hasImageSignature(Buffer.from("<html>Not found</html>"))).toBe(false);
    expect(hasImageSignature(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  });
});
