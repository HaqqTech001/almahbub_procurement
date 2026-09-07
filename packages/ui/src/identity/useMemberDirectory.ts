import { useCallback, useMemo, useState } from "react";
import {
  emptyDirectoryFilters,
  filterMemberships,
  membershipsToCsv,
  paginateRows,
  type BulkMemberAction,
  type IdentityDirectoryFilters,
  type MembershipRecord,
} from "./types.js";

export function useMemberDirectory(
  members: MembershipRecord[],
  options?: {
    onBulkAction?: (
      action: BulkMemberAction,
      membershipIds: string[],
      meta?: { roleId?: string },
    ) => void | Promise<void>;
    onExportCsv?: (csv: string) => void;
  },
) {
  const [filters, setFilters] = useState<IdentityDirectoryFilters>(
    emptyDirectoryFilters(),
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [announce, setAnnounce] = useState("");

  const filtered = useMemo(
    () => filterMemberships(members, filters),
    [members, filters],
  );
  const page = useMemo(
    () => paginateRows(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const togglePage = useCallback(() => {
    const ids = page.items.map((m) => m.id);
    setSelected((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  }, [page.items]);

  const clearSelection = useCallback(() => setSelected([]), []);

  const runBulk = useCallback(
    async (action: BulkMemberAction, meta?: { roleId?: string }) => {
      if (!selected.length && action !== "export") return;
      if (action === "export") {
        const rows =
          selected.length > 0
            ? members.filter((m) => selected.includes(m.id))
            : filtered;
        const csv = membershipsToCsv(rows);
        options?.onExportCsv?.(csv);
        options?.onBulkAction?.(action, rows.map((r) => r.id));
        setAnnounce(`Exported ${rows.length} members`);
        return;
      }
      await options?.onBulkAction?.(action, selected, meta);
      setAnnounce(`Applied ${action.replaceAll("_", " ")} to ${selected.length} members`);
      setSelected([]);
    },
    [filtered, members, options, selected],
  );

  return {
    filters,
    setFilters,
    selected,
    toggle,
    togglePage,
    clearSelection,
    filtered,
    page,
    runBulk,
    announce,
  };
}
