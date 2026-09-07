import { useId } from "react";
import { cx } from "../utils/cx.js";
import {
  DEFAULT_CATALOG_SORTS,
  type CatalogSortId,
  type CatalogSortOption,
  type CatalogViewMode,
} from "./types.js";

export type CatalogToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: CatalogSortId;
  onSortChange: (sort: CatalogSortId) => void;
  view: CatalogViewMode;
  onViewChange: (view: CatalogViewMode) => void;
  resultCount: number;
  sortOptions?: CatalogSortOption[];
  loading?: boolean | undefined;
};

export function CatalogToolbar({
  query,
  onQueryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  resultCount,
  sortOptions = DEFAULT_CATALOG_SORTS,
  loading,
}: CatalogToolbarProps) {
  const searchId = useId();
  const sortId = useId();

  return (
    <div className="hamd-cat-toolbar" role="region" aria-label="Catalog controls">
      <div className="hamd-cat-toolbar__search">
        <label htmlFor={searchId} className="hamd-sr-only">
          Search catalog
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          placeholder="Search products, SKUs, manufacturers…"
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
        />
      </div>

      <p className="hamd-cat-toolbar__count" aria-live="polite">
        {loading ? "Updating results…" : `${resultCount.toLocaleString()} products`}
      </p>

      <div className="hamd-cat-toolbar__sort">
        <label htmlFor={sortId}>Sort</label>
        <select
          id={sortId}
          value={sort}
          onChange={(e) => onSortChange(e.target.value as CatalogSortId)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="hamd-cat-toolbar__views"
        role="group"
        aria-label="Result layout"
      >
        {(["grid", "list", "compact"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={cx("hamd-cat-view", view === mode && "is-active")}
            aria-pressed={view === mode}
            onClick={() => onViewChange(mode)}
          >
            {mode[0]!.toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export type CatalogPaginationBarProps = {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  mode: "pages" | "infinite";
  onPageChange: (page: number) => void;
  onLoadMore?: (() => void) | undefined;
  loadingMore?: boolean | undefined;
};

export function CatalogPaginationBar({
  page,
  pageSize,
  total,
  hasMore,
  mode,
  onPageChange,
  onLoadMore,
  loadingMore,
}: CatalogPaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (mode === "infinite") {
    return (
      <div className="hamd-cat-pager">
        {hasMore ? (
          <button
            type="button"
            className="hamd-cat-btn hamd-cat-btn--primary"
            onClick={onLoadMore}
            disabled={loadingMore}
            aria-busy={loadingMore || undefined}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        ) : (
          <p className="hamd-cat-pager__end" role="status">
            End of results
          </p>
        )}
      </div>
    );
  }

  return (
    <nav className="hamd-cat-pager" aria-label="Pagination">
      <button
        type="button"
        className="hamd-cat-btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <p className="hamd-cat-pager__status" aria-live="polite">
        Page {page} of {totalPages}
      </p>
      <button
        type="button"
        className="hamd-cat-btn"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
