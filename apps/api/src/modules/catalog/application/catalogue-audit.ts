import { productShowcaseGroup } from "@hamd/constants";
import type { MediaHealth } from "../infrastructure/product-media-health.js";

export type AuditProduct = {
  id: string; name: string; slug: string; status: string; description?: string | null;
  category: { name: string; slug: string } | null;
  brandId?: string | null; manufacturerId?: string | null;
  variants?: { name: string; specifications: unknown }[];
  images: { id?: string; url: string; position: number }[];
};
export type Classification = "KEEP_PRIORITY" | "KEEP_NEEDS_MEDIA" | "ARCHIVE" | "DELETE_CANDIDATE";

const normalized = (text: string) => text.trim().toLowerCase().replace(/\s+/g, " ");
function stable(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(stable).sort());
  if (value && typeof value === "object") return JSON.stringify(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return JSON.stringify(value) ?? "null";
}
function duplicateKey(row: AuditProduct): string {
  // Similar names alone are not duplicates; preserve distinct brands/specifications.
  return stable({ name: normalized(row.name), category: row.category?.slug,
    brand: row.brandId, manufacturer: row.manufacturerId,
    description: normalized(row.description ?? ""), variants: row.variants ?? [] });
}

export function auditCatalogue(products: AuditProduct[], health: ReadonlyMap<string, MediaHealth>) {
  const primary = (row: AuditProduct) => [...row.images].sort((a, b) => a.position - b.position || (a.id ?? "").localeCompare(b.id ?? ""))[0];
  const primaryHealth = (row: AuditProduct): MediaHealth => {
    const image = primary(row);
    return image ? health.get(image.url) ?? "unverified" : "missing";
  };
  const duplicates = new Map<string, AuditProduct[]>();
  for (const row of products) {
    if (!row.name.trim()) continue;
    const key = duplicateKey(row);
    duplicates.set(key, [...(duplicates.get(key) ?? []), row]);
  }
  const duplicateOf = new Map<string, string>();
  for (const group of duplicates.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => Number(primaryHealth(b) === "valid") - Number(primaryHealth(a) === "valid") ||
      Number(b.status === "published") - Number(a.status === "published") || a.id.localeCompare(b.id));
    for (const row of group.slice(1)) duplicateOf.set(row.id, group[0]!.id);
  }
  const rows = products.map(row => {
    const mediaHealth = primaryHealth(row);
    let classification: Classification;
    let classificationReason: string;
    if (!row.name.trim() || !row.slug.trim() || /^(test|demo|dummy|placeholder|sample)\s*(product|item|record)?\s*[-#\d]*$/i.test(row.name.trim())) {
      classification = "DELETE_CANDIDATE";
      classificationReason = "Malformed identity or explicit test/demo identity; review references and ownership before any deletion.";
    } else if (duplicateOf.has(row.id)) {
      classification = "DELETE_CANDIDATE";
      classificationReason = `Possible duplicate with identical name/category/brand/manufacturer/description/specifications of ${duplicateOf.get(row.id)}; human confirmation required.`;
    } else if (row.status === "archived" || /\bpos\b|point.of.sale|fabric roll|textile roll|consumables bundle|stationery bundle|custom.*bundle|assorted.*(?:items|products)|general.*(?:supplies|bundle)/i.test(row.name)) {
      classification = "ARCHIVE";
      classificationReason = row.status === "archived" ? "Already archived; retain recoverably in Ops." : "Low-priority showcase family or vague bundle; proposed reversible archive, not deletion.";
    } else if (mediaHealth !== "valid") {
      classification = "KEEP_NEEDS_MEDIA";
      classificationReason = `Retain useful product; primary media is ${mediaHealth}. Repair/verify media, never delete solely for missing imagery.`;
    } else {
      classification = "KEEP_PRIORITY";
      const recognized = productShowcaseGroup(row.name, row.category?.slug) || /medical|beauty|salon/.test(row.category?.slug ?? "");
      classificationReason = recognized ? "Relevant product family with usable primary media; retain. Model currency/authenticity still require editorial verification." : "No evidence justifying archive/deletion; retain with usable media pending editorial review.";
    }
    return {
      productId: row.id, productName: row.name, slug: row.slug,
      category: row.category?.name ?? null, publishedStatus: row.status,
      hasValidPrimaryImage: mediaHealth === "valid", mediaHealth,
      classification, classificationReason, duplicateOf: duplicateOf.get(row.id) ?? null,
    };
  });
  const count = (classification: Classification) => rows.filter(row => row.classification === classification).length;
  const keep = rows.filter(row => row.classification.startsWith("KEEP_"));
  return {
    summary: {
      totalProducts: rows.length,
      canSafelyRemain: keep.length,
      validProductsWithMedia: keep.filter(row => row.hasValidPrimaryImage).length,
      validProductsMissingMedia: count("KEEP_NEEDS_MEDIA"),
      archivedProducts: rows.filter(row => row.publishedStatus === "archived").length,
      proposedArchiveProducts: count("ARCHIVE"),
      newlyProposedArchives: rows.filter(row => row.classification === "ARCHIVE" && row.publishedStatus !== "archived").length,
      duplicateProducts: duplicateOf.size,
      deleteCandidates: count("DELETE_CANDIDATE"),
      confirmedDeletions: 0,
      brokenStaleMediaRows: products.flatMap(row => row.images).filter(image => ["broken", "missing"].includes(health.get(image.url) ?? "unverified")).length,
      unverifiedMediaRows: products.flatMap(row => row.images).filter(image => (health.get(image.url) ?? "unverified") === "unverified").length,
    },
    rows,
  };
}
