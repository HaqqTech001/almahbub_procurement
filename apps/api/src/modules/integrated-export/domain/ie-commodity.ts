/**
 * Integrated Export commodity domain helpers (IE-11A).
 *
 * Category decision: optional free-text `category` string until an owner-approved
 * IE category taxonomy exists. Do NOT reuse International ProductCategory.
 *
 * Archive decision: soft-archive via `archivedAt` (sets published=false). Matches
 * procurement soft-archive spirit; Product uses status=archived instead of deletedAt.
 */

export const IE_COMMODITY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidIeCommoditySlug(slug: string): boolean {
  return IE_COMMODITY_SLUG_PATTERN.test(slug);
}

export function publicCommodityWhere() {
  return {
    published: true,
    archivedAt: null,
  } as const;
}

export function activeCommodityWhere() {
  return {
    archivedAt: null,
  } as const;
}
