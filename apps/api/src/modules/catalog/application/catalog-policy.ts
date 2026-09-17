/** Public catalogue is an unauthenticated read of published records only. */
export const PUBLIC_CATALOG_STATUS = "published" as const;

export const PUBLIC_PAGE_SIZE_DEFAULT = 12;
export const PUBLIC_PAGE_SIZE_MAX = 200;
export const PUBLIC_SEARCH_MAX_LENGTH = 200;

export const PUBLIC_PRODUCT_SORTS = ["recommended", "newest", "name"] as const;
export type PublicProductSort = (typeof PUBLIC_PRODUCT_SORTS)[number];

/** Keys allowed on the public product DTO. Internal/admin fields must not appear. */
export const PUBLIC_PRODUCT_KEYS = [
  "slug",
  "name",
  "description",
  "category",
  "brandName",
  "manufacturerName",
  "images",
  "videos",
  "variants",
] as const;

export const PUBLIC_VARIANT_KEYS = [
  "name",
  "unit",
  "typicalSpecificationFields",
  "sourcingStatus",
] as const;

export const PUBLIC_CATEGORY_KEYS = ["slug", "name", "imageUrl", "imageAlt"] as const;

export const PUBLIC_IMAGE_KEYS = ["url", "altText", "position"] as const;

export const PUBLIC_VIDEO_KEYS = ["url", "title", "caption", "position"] as const;
