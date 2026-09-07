import { useEffect, useMemo, useState } from "react";
import {
  emptyShipmentFilters,
  filterShipments,
  paginateShipmentRows,
  type ShipmentDirectoryFilters,
  type ShipmentRecord,
} from "./types.js";

export function useShipmentDirectory(
  shipments: ShipmentRecord[],
  options?: {
    initialSelectedId?: string | null | undefined;
  },
) {
  const [filters, setFilters] = useState<ShipmentDirectoryFilters>(
    emptyShipmentFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    options?.initialSelectedId ?? shipments[0]?.id ?? null,
  );

  useEffect(() => {
    if (options?.initialSelectedId) {
      setSelectedId(options.initialSelectedId);
    }
  }, [options?.initialSelectedId]);

  const filtered = useMemo(
    () => filterShipments(shipments, filters),
    [shipments, filters],
  );
  const page = useMemo(
    () => paginateShipmentRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((s) => s.id === selectedId) ??
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
