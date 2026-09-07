import { IE_COMMODITY_RECORDS } from "./store.js";
import type { IeCommodity, IeCommodityPreview } from "./types.js";

function bySortOrder(a: IeCommodity, b: IeCommodity): number {
  const left = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const right = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  if (left !== right) return left - right;
  return a.name.localeCompare(b.name);
}

/** All records in the authoritative store (including unpublished). For tests/admin later. */
export function listAllIeCommodities(
  records: readonly IeCommodity[] = IE_COMMODITY_RECORDS,
): readonly IeCommodity[] {
  return [...records].sort(bySortOrder);
}

/** Public catalogue - published only. Empty is a valid production state. */
export function listPublishedIeCommodities(
  records: readonly IeCommodity[] = IE_COMMODITY_RECORDS,
): readonly IeCommodity[] {
  return listAllIeCommodities(records).filter((item) => item.published);
}

/**
 * Public detail lookup by stable slug.
 * Unpublished and unknown slugs resolve to null (never leak drafts).
 */
export function getPublishedIeCommodityBySlug(
  slug: string,
  records: readonly IeCommodity[] = IE_COMMODITY_RECORDS,
): IeCommodity | null {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const match = records.find(
    (item) => item.published && item.slug.toLowerCase() === normalized,
  );
  return match ?? null;
}

export function toIeCommodityPreview(commodity: IeCommodity): IeCommodityPreview {
  const preview: IeCommodityPreview = {
    slug: commodity.slug,
    name: commodity.name,
  };
  if (commodity.category !== undefined) {
    preview.category = commodity.category;
  }
  if (commodity.shortDescription !== undefined) {
    preview.shortDescription = commodity.shortDescription;
  }
  if (commodity.heroMedia) {
    preview.imageSrc = commodity.heroMedia.src;
    preview.imageAlt = commodity.heroMedia.alt;
  } else {
    preview.imageSrc = null;
  }
  return preview;
}

/**
 * Homepage commodity preview - same published source as list/detail.
 * Do not maintain a parallel fake catalogue.
 */
export function getIeCommodityPreviews(
  records: readonly IeCommodity[] = IE_COMMODITY_RECORDS,
): readonly IeCommodityPreview[] {
  return listPublishedIeCommodities(records).map(toIeCommodityPreview);
}

/** Slug must be URL-safe, stable, and unique among records (case-insensitive). */
export function isValidIeCommoditySlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

export function assertIeCommodityRecordInvariants(
  records: readonly IeCommodity[],
): void {
  const seen = new Set<string>();
  const seenIds = new Set<string>();
  for (const item of records) {
    if (!item.id.trim()) {
      throw new Error("IeCommodity.id is required");
    }
    if (seenIds.has(item.id)) {
      throw new Error(`Duplicate IeCommodity.id: ${item.id}`);
    }
    seenIds.add(item.id);

    if (!item.name.trim()) {
      throw new Error(`IeCommodity.name is required (${item.id})`);
    }
    if (!isValidIeCommoditySlug(item.slug)) {
      throw new Error(`Invalid IeCommodity.slug: ${item.slug}`);
    }
    const key = item.slug.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Duplicate IeCommodity.slug: ${item.slug}`);
    }
    seen.add(key);
    if (typeof item.published !== "boolean") {
      throw new Error(`IeCommodity.published must be boolean (${item.id})`);
    }
  }
}
