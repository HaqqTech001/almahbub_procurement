import { useMemo, useState, type ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { Dialog } from "../primitives/Dialog.js";
import { Button } from "../primitives/Button.js";

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterToolbarProps = {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: Array<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: readonly FilterOption[];
  }>;
  sort?: {
    value: string;
    onChange: (value: string) => void;
    options: readonly FilterOption[];
  };
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onReset?: () => void;
  extraFields?: ReactNode;
  className?: string;
};

function isDefaultValue(
  value: string,
  options: readonly FilterOption[] | undefined,
): boolean {
  if (!options?.length) return !value;
  return value === "all" || value === options[0]?.value;
}

export function FilterToolbar({
  search,
  filters,
  sort,
  viewMode,
  onViewModeChange,
  onReset,
  extraFields,
  className,
}: FilterToolbarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Record<string, string>>({});
  const [draftSort, setDraftSort] = useState(sort?.value ?? "");

  const hasFilters =
    search || (filters && filters.length > 0) || sort || onReset || extraFields;

  const activeCount = useMemo(() => {
    let count = 0;
    for (const filter of filters ?? []) {
      if (!isDefaultValue(filter.value, filter.options)) count += 1;
    }
    if (sort && !isDefaultValue(sort.value, sort.options)) count += 1;
    return count;
  }, [filters, sort]);

  if (!hasFilters && !viewMode && !onViewModeChange) {
    return null;
  }

  const openSheet = () => {
    const next: Record<string, string> = {};
    for (const filter of filters ?? []) next[filter.label] = filter.value;
    setDraftFilters(next);
    setDraftSort(sort?.value ?? "");
    setSheetOpen(true);
  };

  const applySheet = () => {
    for (const filter of filters ?? []) {
      const next = draftFilters[filter.label];
      if (next !== undefined && next !== filter.value) filter.onChange(next);
    }
    if (sort && draftSort && draftSort !== sort.value) sort.onChange(draftSort);
    setSheetOpen(false);
  };

  const resetAll = () => {
    onReset?.();
    const next: Record<string, string> = {};
    for (const filter of filters ?? []) next[filter.label] = filter.options[0]?.value ?? "all";
    setDraftFilters(next);
    setDraftSort(sort?.options[0]?.value ?? "");
    setSheetOpen(false);
  };

  const advanced = (
    <>
      {filters?.map((filter) => (
        <label key={filter.label} className="hamd-module-toolbar__filter">
          <span className="hamd-module-toolbar__filter-label">{filter.label}</span>
          <select
            className="hamd-module-toolbar__filter-select"
            value={sheetOpen ? (draftFilters[filter.label] ?? filter.value) : filter.value}
            onChange={(event) => {
              if (sheetOpen) {
                setDraftFilters((current) => ({
                  ...current,
                  [filter.label]: event.target.value,
                }));
                return;
              }
              filter.onChange(event.target.value);
            }}
            aria-label={filter.label}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {sort ? (
        <label className="hamd-module-toolbar__filter">
          <span className="hamd-module-toolbar__filter-label">Sort</span>
          <select
            className="hamd-module-toolbar__filter-select"
            value={sheetOpen ? draftSort : sort.value}
            onChange={(event) => {
              if (sheetOpen) {
                setDraftSort(event.target.value);
                return;
              }
              sort.onChange(event.target.value);
            }}
            aria-label="Sort"
          >
            {sort.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {extraFields}
    </>
  );

  return (
    <div className={cx("hamd-module-workspace__toolbar", className)}>
      {search ? (
        <div className="hamd-module-toolbar__search">
          <span className="hamd-module-toolbar__search-icon" aria-hidden="true">
            <svg viewBox="0 0 20 20" width="16" height="16">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M12.5 12.5L17 17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            type="search"
            className="hamd-module-toolbar__search-input"
            value={search.value}
            onChange={(event) => search.onChange(event.target.value)}
            placeholder={search.placeholder ?? "Search"}
            aria-label={search.placeholder ?? "Search"}
          />
        </div>
      ) : null}

      <div className="hamd-module-toolbar__advanced">{advanced}</div>

      {onReset ? (
        <button type="button" className="hamd-module-toolbar__reset hamd-module-toolbar__reset--inline" onClick={onReset}>
          Reset
        </button>
      ) : null}

      {viewMode && onViewModeChange ? (
        <div className="hamd-module-toolbar__view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className="hamd-module-toolbar__view-btn"
            aria-pressed={viewMode === "grid"}
            onClick={() => onViewModeChange("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className="hamd-module-toolbar__view-btn"
            aria-pressed={viewMode === "list"}
            onClick={() => onViewModeChange("list")}
          >
            List
          </button>
        </div>
      ) : null}

      {filters?.length || sort || extraFields ? (
        <button
          type="button"
          className="hamd-module-toolbar__filters-btn"
          aria-expanded={sheetOpen}
          onClick={openSheet}
        >
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
              d="M3 5h14M5.5 10h9M8 15h4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          {activeCount > 0 ? `Filters (${activeCount})` : "Filters"}
        </button>
      ) : null}

      <Dialog
        open={sheetOpen}
        title="Filters"
        className="hamd-dialog--sheet"
        onClose={() => setSheetOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={resetAll}>
              Reset
            </Button>
            <Button variant="primary" onClick={applySheet}>
              Apply Filters
            </Button>
          </>
        }
      >
        <div className="hamd-module-toolbar__sheet">{advanced}</div>
      </Dialog>
    </div>
  );
}
