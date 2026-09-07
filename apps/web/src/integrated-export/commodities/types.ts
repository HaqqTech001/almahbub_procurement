/**
 * Integrated Export commodity domain contract (IE-3A).
 *
 * Content-safe: optional claim fields have no fabricated defaults.
 * Absence of a field means the information is not published - not an empty claim.
 */

/** Approved media asset for a commodity. Never invent stock photography. */
export type IeCommodityMedia = {
  src: string;
  alt: string;
};

/** Flexible label/value row - no universal moisture/purity schema. */
export type IeCommoditySpec = {
  label: string;
  value: string;
};

/**
 * Authoritative IE commodity record.
 *
 * Required: id, slug, name, published.
 * Everything else is optional and must not receive invented defaults.
 */
export type IeCommodity = {
  id: string;
  /** Stable URL segment under /commodities/:slug - set at authoring time, not at render. */
  slug: string;
  name: string;
  /** Public catalogue gate. Unpublished records must never appear publicly. */
  published: boolean;
  /** Optional free-text category label until a structured IE category entity exists. */
  category?: string;
  shortDescription?: string;
  description?: string;
  heroMedia?: IeCommodityMedia;
  gallery?: readonly IeCommodityMedia[];
  specifications?: readonly IeCommoditySpec[];
  packaging?: string;
  qualityInformation?: string;
  applications?: readonly string[];
  /** Optional destination notes - do not invent country lists. */
  markets?: string;
  sortOrder?: number;
};

/** Homepage / list card projection - derived from {@link IeCommodity}, not a second store. */
export type IeCommodityPreview = {
  slug: string;
  name: string;
  category?: string;
  shortDescription?: string;
  imageSrc?: string | null;
  imageAlt?: string;
};
