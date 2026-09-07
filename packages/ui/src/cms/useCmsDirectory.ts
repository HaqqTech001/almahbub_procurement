import { useMemo, useState } from "react";
import {
  emptyCmsFilters,
  filterCmsContent,
  paginateCmsRows,
  type CmsContentRecord,
  type CmsDirectoryFilters,
} from "./types.js";

export function useCmsDirectory(items: CmsContentRecord[]) {
  const [filters, setFilters] = useState<CmsDirectoryFilters>(emptyCmsFilters());
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const filtered = useMemo(
    () => filterCmsContent(items, filters),
    [items, filters],
  );
  const page = useMemo(
    () => paginateCmsRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((item) => item.id === selectedId) ??
    page.items[0] ??
    filtered[0] ??
    null;

  return {
    filters,
    setFilters,
    filtered,
    page,
    selected,
    select: setSelectedId,
  };
}
