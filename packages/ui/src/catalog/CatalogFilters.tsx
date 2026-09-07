import { useId } from "react";
import { cx } from "../utils/cx.js";
import type { CatalogFacetOption, CatalogFiltersState } from "./types.js";

export type FacetGroupProps = {
  title: string;
  options: CatalogFacetOption[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  name: string;
};

export function FacetGroup({
  title,
  options,
  selectedIds,
  onToggle,
  name,
}: FacetGroupProps) {
  const headingId = useId();
  if (options.length === 0) return null;
  return (
    <fieldset className="hamd-cat-facet" aria-labelledby={headingId}>
      <legend className="hamd-sr-only">{title}</legend>
      <h2 id={headingId} className="hamd-cat-aside__title">
        {title}
      </h2>
      <ul className="hamd-cat-facet__list">
        {options.map((opt) => {
          const checked = selectedIds.includes(opt.id);
          return (
            <li key={opt.id}>
              <label className={cx("hamd-cat-facet__label", checked && "is-selected")}>
                <input
                  type="checkbox"
                  name={name}
                  checked={checked}
                  onChange={() => onToggle(opt.id)}
                />
                <span>{opt.label}</span>
                {typeof opt.count === "number" ? (
                  <span className="hamd-cat-tree__count">{opt.count}</span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

export type CatalogSmartFiltersProps = {
  filters: CatalogFiltersState;
  onChange: (next: CatalogFiltersState) => void;
  manufacturers: CatalogFacetOption[];
  brands: CatalogFacetOption[];
  suppliers: CatalogFacetOption[];
  countries: CatalogFacetOption[];
  availabilityOptions: CatalogFacetOption[];
  onClear?: () => void;
};

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Smart facet filters - manufacturers, brands, suppliers, origin, availability. */
export function CatalogSmartFilters({
  filters,
  onChange,
  manufacturers,
  brands,
  suppliers,
  countries,
  availabilityOptions,
  onClear,
}: CatalogSmartFiltersProps) {
  return (
    <div className="hamd-cat-filters">
      <div className="hamd-cat-filters__head">
        <h2 className="hamd-cat-aside__title">Smart filters</h2>
        {onClear ? (
          <button type="button" className="hamd-cat-linkish" onClick={onClear}>
            Clear all
          </button>
        ) : null}
      </div>
      <FacetGroup
        title="Manufacturers"
        name="manufacturer"
        options={manufacturers}
        selectedIds={filters.manufacturerIds}
        onToggle={(id) =>
          onChange({
            ...filters,
            manufacturerIds: toggleId(filters.manufacturerIds, id),
          })
        }
      />
      <FacetGroup
        title="Brands"
        name="brand"
        options={brands}
        selectedIds={filters.brandIds}
        onToggle={(id) =>
          onChange({ ...filters, brandIds: toggleId(filters.brandIds, id) })
        }
      />
      <FacetGroup
        title="Suppliers"
        name="supplier"
        options={suppliers}
        selectedIds={filters.supplierIds}
        onToggle={(id) =>
          onChange({
            ...filters,
            supplierIds: toggleId(filters.supplierIds, id),
          })
        }
      />
      <FacetGroup
        title="Origin"
        name="country"
        options={countries}
        selectedIds={filters.countries}
        onToggle={(id) =>
          onChange({ ...filters, countries: toggleId(filters.countries, id) })
        }
      />
      <FacetGroup
        title="Availability"
        name="availability"
        options={availabilityOptions}
        selectedIds={filters.availability}
        onToggle={(id) =>
          onChange({
            ...filters,
            availability: toggleId(filters.availability, id),
          })
        }
      />
    </div>
  );
}
