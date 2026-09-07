import { useEffect, useMemo, useState } from "react";
import {
  emptyQuotationFilters,
  filterQuotations,
  paginateQuotationRows,
  type QuotationDirectoryFilters,
  type QuotationRecord,
} from "./types.js";

export type QuotationSortKey =
  | "updatedAt"
  | "totalAmount"
  | "publicCode"
  | "status"
  | "expiresAt";

export function useQuotationDirectory(
  quotations: QuotationRecord[],
  options?: {
    initialSelectedId?: string | null | undefined;
    sortKey?: QuotationSortKey | undefined;
    sortDir?: "asc" | "desc" | undefined;
  },
) {
  const [filters, setFilters] = useState<QuotationDirectoryFilters>(
    emptyQuotationFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    options?.initialSelectedId ?? quotations[0]?.id ?? null,
  );
  const [sortKey, setSortKey] = useState<QuotationSortKey>(
    options?.sortKey ?? "updatedAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">(
    options?.sortDir ?? "desc",
  );
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  useEffect(() => {
    if (options?.initialSelectedId) {
      setSelectedId(options.initialSelectedId);
    }
  }, [options?.initialSelectedId]);

  const filtered = useMemo(() => {
    const base = filterQuotations(quotations, filters);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const left = sortValue(a, sortKey);
      const right = sortValue(b, sortKey);
      if (left < right) return -1 * dir;
      if (left > right) return 1 * dir;
      return 0;
    });
  }, [quotations, filters, sortKey, sortDir]);

  const page = useMemo(
    () => paginateQuotationRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((q) => q.id === selectedId) ??
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
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    checkedIds,
    setCheckedIds,
    toggleChecked: (id: string) => {
      setCheckedIds((prev) =>
        prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
      );
    },
    clearChecked: () => setCheckedIds([]),
  };
}

function sortValue(row: QuotationRecord, key: QuotationSortKey): string | number {
  switch (key) {
    case "totalAmount":
      return row.totalAmount;
    case "publicCode":
      return row.publicCode.toLowerCase();
    case "status":
      return String(row.status);
    case "expiresAt":
      return row.expiresAt ? new Date(row.expiresAt).getTime() : 0;
    case "updatedAt":
    default:
      return new Date(row.updatedAt).getTime();
  }
}
