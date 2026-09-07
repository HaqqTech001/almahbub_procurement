import { useCallback, useMemo, useState } from "react";
import {
  emptySupplierFilters,
  filterSuppliers,
  paginateSupplierRows,
  suppliersToCsv,
  type SupplierDirectoryFilters,
  type SupplierRecord,
} from "./types.js";

export function useSupplierDirectory(
  suppliers: SupplierRecord[],
  options?: {
    onExportCsv?: ((csv: string) => void) | undefined;
  },
) {
  const [filters, setFilters] = useState<SupplierDirectoryFilters>(
    emptySupplierFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    suppliers[0]?.id ?? null,
  );
  const [announce, setAnnounce] = useState("");

  const filtered = useMemo(
    () => filterSuppliers(suppliers, filters),
    [suppliers, filters],
  );
  const page = useMemo(
    () => paginateSupplierRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );

  const selected =
    filtered.find((s) => s.id === selectedId) ??
    page.items[0] ??
    filtered[0] ??
    null;

  const select = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const exportCsv = useCallback(() => {
    const csv = suppliersToCsv(filtered);
    options?.onExportCsv?.(csv);
    setAnnounce(`Exported ${filtered.length} suppliers`);
  }, [filtered, options]);

  return {
    filters,
    setFilters,
    filtered,
    page,
    selected,
    select,
    exportCsv,
    announce,
  };
}
