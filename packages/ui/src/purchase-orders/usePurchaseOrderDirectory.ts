import { useMemo, useState } from "react";
import {
  emptyPurchaseOrderFilters,
  filterPurchaseOrders,
  paginatePurchaseOrderRows,
  type PurchaseOrderDirectoryFilters,
  type PurchaseOrderRecord,
} from "./types.js";

export function usePurchaseOrderDirectory(orders: PurchaseOrderRecord[]) {
  const [filters, setFilters] = useState<PurchaseOrderDirectoryFilters>(
    emptyPurchaseOrderFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    orders[0]?.id ?? null,
  );

  const filtered = useMemo(
    () => filterPurchaseOrders(orders, filters),
    [orders, filters],
  );
  const page = useMemo(
    () =>
      paginatePurchaseOrderRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((o) => o.id === selectedId) ??
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
