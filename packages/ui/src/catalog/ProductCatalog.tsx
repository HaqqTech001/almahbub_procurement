import { useMemo } from "react";
import { cx } from "../utils/cx.js";
import { CategoryTree } from "./CategoryTree.js";
import { CatalogSmartFilters } from "./CatalogFilters.js";
import {
  CatalogPaginationBar,
  CatalogToolbar,
} from "./CatalogToolbar.js";
import { CompareTray, RelatedProductsRail } from "./CompareTray.js";
import { ProductCard, ProductCardSkeleton } from "./ProductCard.js";
import {
  emptyCatalogFilters,
  type CatalogCategoryNode,
  type CatalogFacetOption,
  type CatalogFiltersState,
  type CatalogPagination,
  type CatalogProduct,
  type CatalogSortId,
  type CatalogViewMode,
} from "./types.js";
import { useCatalogSelection } from "./useCatalogSelection.js";

export type ProductCatalogProps = {
  title?: string | undefined;
  description?: string | undefined;
  categories: CatalogCategoryNode[];
  products: CatalogProduct[];
  manufacturers: CatalogFacetOption[];
  brands: CatalogFacetOption[];
  suppliers: CatalogFacetOption[];
  countries: CatalogFacetOption[];
  availabilityOptions: CatalogFacetOption[];
  filters: CatalogFiltersState;
  onFiltersChange: (next: CatalogFiltersState) => void;
  sort: CatalogSortId;
  onSortChange: (sort: CatalogSortId) => void;
  view: CatalogViewMode;
  onViewChange: (view: CatalogViewMode) => void;
  pagination: CatalogPagination;
  /** `pages` = classic pagination; `infinite` = load-more. */
  scrollMode?: "pages" | "infinite" | undefined;
  onPageChange: (page: number) => void;
  onLoadMore?: (() => void) | undefined;
  loading?: boolean | undefined;
  loadingMore?: boolean | undefined;
  recommendations?: CatalogProduct[] | undefined;
  recentlyViewed?: CatalogProduct[] | undefined;
  relatedProducts?: CatalogProduct[] | undefined;
  initialBookmarks?: string[] | undefined;
  initialCompare?: string[] | undefined;
  onBookmarkChange?: ((ids: string[]) => void | Promise<void>) | undefined;
  onCompareChange?: ((ids: string[]) => void | Promise<void>) | undefined;
  onQuickQuote?: ((product: CatalogProduct) => void) | undefined;
  compareHref?: string | undefined;
  className?: string | undefined;
};

/**
 * Enterprise procurement catalog - discovery → filter → compare/save → quick quote.
 * Presentational; hosts own data fetching.
 */
export function ProductCatalog({
  title = "Product catalog",
  description = "Source with evidence - MOQ, lead time, and availability to source.",
  categories,
  products,
  manufacturers,
  brands,
  suppliers,
  countries,
  availabilityOptions,
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  pagination,
  scrollMode = "pages",
  onPageChange,
  onLoadMore,
  loading,
  loadingMore,
  recommendations = [],
  recentlyViewed = [],
  relatedProducts = [],
  initialBookmarks,
  initialCompare,
  onBookmarkChange,
  onCompareChange,
  onQuickQuote,
  compareHref,
  className,
}: ProductCatalogProps) {
  const selection = useCatalogSelection({
    ...(initialBookmarks ? { initialBookmarks } : {}),
    ...(initialCompare ? { initialCompare } : {}),
    ...(onBookmarkChange ? { onBookmarkChange } : {}),
    ...(onCompareChange ? { onCompareChange } : {}),
  });

  const compareProducts = useMemo(
    () => products.filter((p) => selection.comparing.has(p.id)),
    [products, selection.comparing],
  );

  const toggleCategory = (id: string) => {
    const categoryIds = filters.categoryIds.includes(id)
      ? filters.categoryIds.filter((x) => x !== id)
      : [...filters.categoryIds, id];
    onFiltersChange({ ...filters, categoryIds });
  };

  return (
    <div className={cx("hamd-cat", className)}>
      <a className="hamd-cat__skip" href="#catalog-results">
        Skip to results
      </a>

      <header className="hamd-cat__header">
        <div>
          <h1 className="hamd-cat__title">{title}</h1>
          {description ? <p className="hamd-cat__desc">{description}</p> : null}
        </div>
      </header>

      <div className="hamd-cat__layout">
        <aside className="hamd-cat__aside" aria-label="Catalog filters">
          <CategoryTree
            nodes={categories}
            selectedIds={filters.categoryIds}
            onToggle={toggleCategory}
          />
          <CatalogSmartFilters
            filters={filters}
            onChange={onFiltersChange}
            manufacturers={manufacturers}
            brands={brands}
            suppliers={suppliers}
            countries={countries}
            availabilityOptions={availabilityOptions}
            onClear={() => onFiltersChange(emptyCatalogFilters())}
          />
          <RelatedProductsRail
            title="Recently viewed"
            products={recentlyViewed}
            onQuickQuote={onQuickQuote}
          />
          <RelatedProductsRail
            title="Recommendations"
            products={recommendations}
            onQuickQuote={onQuickQuote}
          />
        </aside>

        <div className="hamd-cat__main">
          <CatalogToolbar
            query={filters.query}
            onQueryChange={(query) => onFiltersChange({ ...filters, query })}
            sort={sort}
            onSortChange={onSortChange}
            view={view}
            onViewChange={onViewChange}
            resultCount={pagination.total}
            loading={loading}
          />

          <div
            id="catalog-results"
            className={cx("hamd-cat__results", `hamd-cat__results--${view}`)}
            aria-busy={loading || undefined}
            tabIndex={-1}
          >
            {loading && products.length === 0 ? (
              Array.from({ length: view === "list" ? 6 : 8 }, (_, i) => (
                <ProductCardSkeleton key={i} view={view} />
              ))
            ) : products.length === 0 ? (
              <p className="hamd-cat-empty" role="status">
                No products match these filters. Clear filters or broaden your
                search.
              </p>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  view={view}
                  bookmarked={selection.bookmarked.has(product.id)}
                  comparing={selection.comparing.has(product.id)}
                  compareDisabled={selection.compareFull}
                  onBookmark={selection.toggleBookmark}
                  onCompare={selection.toggleCompare}
                  onQuickQuote={onQuickQuote}
                />
              ))
            )}
          </div>

          <CatalogPaginationBar
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={pagination.total}
            hasMore={pagination.hasMore}
            mode={scrollMode}
            onPageChange={onPageChange}
            {...(onLoadMore ? { onLoadMore } : {})}
            {...(loadingMore !== undefined ? { loadingMore } : {})}
          />

          <RelatedProductsRail
            title="Related products"
            products={relatedProducts}
            onQuickQuote={onQuickQuote}
          />
        </div>
      </div>

      <CompareTray
        products={compareProducts}
        onRemove={selection.toggleCompare}
        onClear={selection.clearCompare}
        compareHref={compareHref}
      />

      <div className="hamd-sr-only" role="status" aria-live="polite">
        {selection.announce}
      </div>
    </div>
  );
}
