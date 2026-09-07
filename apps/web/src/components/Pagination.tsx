import { cx } from "./cx.js";

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string | undefined;
};

function visiblePages(page: number, pageCount: number): number[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, pageCount, page - 1, page, page + 1]);
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = visiblePages(page, pageCount);

  return (
    <nav className={cx("hamd-pagination", className)} aria-label="Pagination">
      <button
        type="button"
        className="hamd-btn hamd-btn--secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <ul className="hamd-pagination__pages">
        {pages.map((value, index) => {
          const prev = pages[index - 1];
          const showEllipsis = prev !== undefined && value - prev > 1;
          return (
            <li key={value} className="hamd-pagination__page-item">
              {showEllipsis ? (
                <span className="hamd-pagination__ellipsis" aria-hidden="true">
                  …
                </span>
              ) : null}
              <button
                type="button"
                className={cx(
                  "hamd-pagination__page",
                  value === page && "is-current",
                )}
                aria-label={`Page ${value}`}
                aria-current={value === page ? "page" : undefined}
                onClick={() => onPageChange(value)}
              >
                {value}
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="hamd-btn hamd-btn--secondary"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
