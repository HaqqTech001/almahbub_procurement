export type * from "./types.js";
export {
  COMPARE_LIMIT,
  DEFAULT_CATALOG_SORTS,
  availabilityLabel,
  emptyCatalogFilters,
} from "./types.js";
export { ProductCard, ProductCardSkeleton } from "./ProductCard.js";
export type { ProductCardProps } from "./ProductCard.js";
export { CategoryTree } from "./CategoryTree.js";
export type { CategoryTreeProps } from "./CategoryTree.js";
export { CatalogSmartFilters, FacetGroup } from "./CatalogFilters.js";
export type {
  CatalogSmartFiltersProps,
  FacetGroupProps,
} from "./CatalogFilters.js";
export {
  CatalogPaginationBar,
  CatalogToolbar,
} from "./CatalogToolbar.js";
export type {
  CatalogPaginationBarProps,
  CatalogToolbarProps,
} from "./CatalogToolbar.js";
export { CompareTray, RelatedProductsRail } from "./CompareTray.js";
export type { CompareTrayProps, RelatedRailProps } from "./CompareTray.js";
export { ProductCatalog } from "./ProductCatalog.js";
export type { ProductCatalogProps } from "./ProductCatalog.js";
export { useCatalogSelection } from "./useCatalogSelection.js";
export {
  catalogFixture,
  catalogFixtureProducts,
} from "./fixtures.js";

export const catalogLazy = {
  ProductCatalog: () => import("./ProductCatalog.js"),
  ProductCard: () => import("./ProductCard.js"),
} as const;
