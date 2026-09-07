import { useMemo, useState } from "react";
import {
  emptyAuditFilters,
  filterAuditEvents,
  paginateAuditEvents,
  sortAuditTimeline,
  type AuditDirectoryFilters,
  type AuditEvent,
} from "./types.js";

export function useAuditDirectory(events: AuditEvent[]) {
  const [filters, setFilters] = useState<AuditDirectoryFilters>(
    emptyAuditFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    events[0]?.id ?? null,
  );

  const filtered = useMemo(
    () => sortAuditTimeline(filterAuditEvents(events, filters)),
    [events, filters],
  );
  const page = useMemo(
    () => paginateAuditEvents(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );
  const selected =
    filtered.find((event) => event.id === selectedId) ??
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
