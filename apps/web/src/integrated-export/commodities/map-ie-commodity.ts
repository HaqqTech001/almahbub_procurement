import { resolveIeMediaSrc, type IeCommodityApiDetail, type IeCommodityApiListItem, type IeCommodityApiMedia } from "./ie-commodity-api.js";
import type { IeCommodity, IeCommodityMedia } from "./types.js";
import { catalogueCopy } from "../../lib/catalogue-copy.js";


function mapMedia(
  value: IeCommodityApiMedia | null | undefined,
  fallbackAlt: string,

): IeCommodityMedia | undefined {
  const src = resolveIeMediaSrc(value?.src);
  if (!src) return undefined;
  const alt = catalogueCopy(value?.alt?.trim() || fallbackAlt);
  return { src, alt };
}

function omitEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? catalogueCopy(trimmed) : undefined;
}

/**
 * Maps a public API commodity DTO onto the buyer IeCommodity contract.
 * Null API fields stay omitted - never invented.
 */
export function mapApiCommodityToIeCommodity(
  row: IeCommodityApiListItem | IeCommodityApiDetail,
): IeCommodity {
  const record: IeCommodity = {
    id: row.id,
    slug: row.slug,
    name: catalogueCopy(row.name),
    published: row.published,
    sortOrder: row.sortOrder,
  };

  const category = omitEmpty(row.category);
  if (category) record.category = category;

  const shortDescription = omitEmpty(row.shortDescription);
  if (shortDescription) record.shortDescription = shortDescription;

  const heroMedia = mapMedia(row.heroMedia, row.name);
  if (heroMedia) record.heroMedia = heroMedia;

  if ("description" in row) {
    const description = omitEmpty(row.description);
    if (description) record.description = description;
  }

  if ("gallery" in row && Array.isArray(row.gallery)) {
    const gallery = row.gallery
      .map((item) => mapMedia(item, row.name))
      .filter((item): item is IeCommodityMedia => Boolean(item));
    if (gallery.length > 0) record.gallery = gallery;
  }

  if ("specifications" in row && Array.isArray(row.specifications) && row.specifications.length > 0) {
    record.specifications = row.specifications
      .map((item) => ({
        label: catalogueCopy(item.label.trim()),
        value: catalogueCopy(item.value.trim()),
      }))
      .filter((item) => item.label && item.value);
  }

  if ("packaging" in row) {
    const packaging = omitEmpty(row.packaging);
    if (packaging) record.packaging = packaging;
  }

  if ("qualityInformation" in row) {
    const qualityInformation = omitEmpty(row.qualityInformation);
    if (qualityInformation) record.qualityInformation = qualityInformation;
  }

  if ("applications" in row && Array.isArray(row.applications) && row.applications.length > 0) {
    record.applications = row.applications.map((item) => catalogueCopy(item.trim())).filter(Boolean);
  }

  if ("markets" in row) {
    const markets = omitEmpty(row.markets);
    if (markets) record.markets = markets;
  }

  return record;
}
