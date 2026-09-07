/** Presentational catalog contracts - aligned with Prisma + homepage featured fields. */

export type CatalogAvailability =
  | "available_to_source"
  | "limited"
  | "lead_time_constrained"
  | "unavailable"
  | "unknown";

export type CatalogViewMode = "grid" | "list" | "compact";

export type CatalogSortId =
  | "relevance"
  | "name_asc"
  | "name_desc"
  | "newest"
  | "lead_time"
  | "moq";

export type CatalogCategoryNode = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: CatalogCategoryNode[];
};

export type CatalogFacetOption = {
  id: string;
  label: string;
  count?: number;
};

export type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  href: string;
  requestHref: string;
  manufacturer: string;
  manufacturerId?: string;
  brand?: string;
  brandId?: string;
  supplier?: string;
  supplierId?: string;
  country: string;
  moq: string;
  leadTime: string;
  availability: CatalogAvailability | string;
  categoryId?: string;
  categoryName?: string;
  imageSrc?: string | undefined;
  imageAlt?: string | undefined;
  /** Optional display price / indicative range for cards. */
  priceLabel?: string | undefined;
  certifications?: string[];
  description?: string;
  /** Why suggested - recommendations only. */
  reason?: string;
};

export type CatalogFiltersState = {
  query: string;
  categoryIds: string[];
  manufacturerIds: string[];
  brandIds: string[];
  supplierIds: string[];
  availability: string[];
  countries: string[];
};

export type CatalogPagination = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type CatalogSortOption = {
  id: CatalogSortId;
  label: string;
};

export const DEFAULT_CATALOG_SORTS: CatalogSortOption[] = [
  { id: "relevance", label: "Relevance" },
  { id: "name_asc", label: "Name A–Z" },
  { id: "name_desc", label: "Name Z–A" },
  { id: "newest", label: "Newest" },
  { id: "lead_time", label: "Lead time" },
  { id: "moq", label: "MOQ" },
];

export const emptyCatalogFilters = (): CatalogFiltersState => ({
  query: "",
  categoryIds: [],
  manufacturerIds: [],
  brandIds: [],
  supplierIds: [],
  availability: [],
  countries: [],
});

export function availabilityLabel(value: string): string {
  switch (value) {
    case "available_to_source":
      return "Available to source";
    case "limited":
      return "Limited";
    case "lead_time_constrained":
      return "Lead-time constrained";
    case "unavailable":
      return "Unavailable";
    case "unknown":
      return "Unknown";
    default:
      return value.replace(/_/g, " ");
  }
}

export const COMPARE_LIMIT = 4;
