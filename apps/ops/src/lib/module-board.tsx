import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";

import { FilterToolbar } from "@hamd/ui/module-layout";
import { OpsAlert, OpsLoading, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import { downloadCsv, parseCsv } from "./csv.js";

export type OpsColumn = {
  key: string;
  label: string;
  sortable?: boolean;
};

export type OpsBulkAction = {
  id: string;
  label: string;
  onAction: (ids: string[]) => void | Promise<void>;
};

export type OpsModuleBoardProps = {
  title: string;
  rows: Record<string, unknown>[];
  columns: OpsColumn[];
  loading?: boolean;
  error?: string | null;
  success?: string | null;
  onRefresh?: () => void | Promise<void>;
  onExport?: (rows: Record<string, unknown>[]) => void;
  onImport?: (rows: Record<string, string>[]) => void | Promise<void>;
  bulkActions?: OpsBulkAction[];
  searchKeys?: string[];
  emptyMessage?: string;
  idKey?: string;
  children?: ReactNode;
  onRowClick?: (row: Record<string, unknown>) => void;
  /** When true (default), header/filters stay fixed and only the table body scrolls. */
  queueLayout?: boolean;
  className?: string;
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const PAGE_SIZE = 10;

function cellValue(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value == null) return "";
  return String(value);
}

/**
 * Shared ops list module - search, status filter, sort, pagination, bulk, import/export.
 */
export function OpsModuleBoard({
  title,
  rows,
  columns,
  loading = false,
  error = null,
  success = null,
  onRefresh,
  onExport,
  onImport,
  bulkActions = [],
  searchKeys,
  emptyMessage = "No records found.",
  idKey = "id",
  children,
  onRowClick,
  queueLayout = true,
  className,
}: OpsModuleBoardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const hasStatus = rows.some((row) => "status" in row);
  const keys = searchKeys ?? columns.map((column) => column.key);
  const sortableKeys = columns.filter((c) => c.sortable !== false).map((c) => c.key);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.status != null && String(row.status)) set.add(String(row.status));
    }
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let next = rows;
    if (hasStatus && statusFilter !== "all") {
      next = next.filter((row) => String(row.status ?? "") === statusFilter);
    }
    if (q) {
      next = next.filter((row) =>
        keys.some((key) => cellValue(row, key).toLowerCase().includes(q)),
      );
    }
    if (sortKey) {
      const key = sortKey;
      next = [...next].sort((a, b) => {
        const left = cellValue(a, key).toLowerCase();
        const right = cellValue(b, key).toLowerCase();
        if (left < right) return sortDir === "asc" ? -1 : 1;
        if (left > right) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return next;
  }, [rows, query, statusFilter, hasStatus, keys, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortKey, sortDir, rows]);

  useEffect(() => {
    if (success) setToast(success);
  }, [success]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(pageRows.map((row) => cellValue(row, idKey))));
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filtered);
      return;
    }
    downloadCsv(
      `${title.toLowerCase().replace(/\s+/g, "-")}.csv`,
      filtered,
      columns.map((column) => column.key),
    );
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onImport) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    await onImport(parsed);
    setToast(`Imported ${parsed.length} row(s).`);
  };

  return (
    <OpsPage
      className={cx(
        "hamd-ops-module",
        queueLayout && "hamd-list-queue",
        className,
      )}
    >
      <header className="hamd-ops-module__header">
        <h2 className="hamd-ops-module__title">{title}</h2>
        <div className="hamd-ops-module__actions">
          {onRefresh ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => void onRefresh()}
            >
              Refresh
            </button>
          ) : null}
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={handleExport}
          >
            Export CSV
          </button>
          {onImport ? (
            <label className="hamd-btn hamd-btn--ghost hamd-ops-module__import">
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hamd-sr-only"
                onChange={(event) => void handleImport(event)}
              />
            </label>
          ) : null}
        </div>
      </header>

      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {toast ? <OpsStatus tone="success">{toast}</OpsStatus> : null}
      {children}

      <FilterToolbar
        search={{
          value: query,
          onChange: setQuery,
          placeholder: `Search ${title}`,
        }}
        filters={
          hasStatus
            ? [
                {
                  label: "Status",
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "all", label: "All" },
                    ...statuses.map((status) => ({ value: status, label: status })),
                  ],
                },
              ]
            : undefined
        }
        sort={
          sortableKeys.length > 0
            ? {
                value: sortKey,
                onChange: (value) => {
                  setSortKey(value);
                  setSortDir("asc");
                },
                options: [
                  { value: "", label: "Default" },
                  ...sortableKeys.map((key) => ({
                    value: key,
                    label: columns.find((c) => c.key === key)?.label ?? key,
                  })),
                ],
              }
            : undefined
        }
        onReset={() => {
          setQuery("");
          setStatusFilter("all");
          setSortKey("");
        }}
      />

      {bulkActions.length > 0 && selected.size > 0 ? (
        <div className="hamd-ops-module__bulk" role="group" aria-label="Bulk actions">
          <span>{selected.size} selected</span>
          {bulkActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="hamd-btn hamd-btn--ghost"
              onClick={() => void action.onAction([...selected])}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? <OpsLoading label={`Loading ${title}…`} /> : null}

      {!loading && filtered.length === 0 ? (
        <p className="hamd-ops-empty" role="status">
          {emptyMessage}
        </p>
      ) : null}

      {!loading && pageRows.length > 0 ? (
        <div className="hamd-ops-module__table-wrap">
          <table className="hamd-ops-module__table">
            <thead>
              <tr>
                {bulkActions.length > 0 ? (
                  <th scope="col">
                    <input
                      type="checkbox"
                      aria-label="Select page"
                      checked={
                        pageRows.length > 0 &&
                        pageRows.every((row) =>
                          selected.has(cellValue(row, idKey)),
                        )
                      }
                      onChange={(event) => toggleAll(event.target.checked)}
                    />
                  </th>
                ) : null}
                {columns.map((column) => (
                  <th key={column.key} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const id = cellValue(row, idKey);
                return (
                  <tr
                    key={id || JSON.stringify(row)}
                    {...(onRowClick
                      ? {
                          onClick: () => onRowClick(row),
                          style: { cursor: "pointer" },
                        }
                      : {})}
                  >
                    {bulkActions.length > 0 ? (
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${id}`}
                          checked={selected.has(id)}
                          onChange={(event) =>
                            toggleOne(id, event.target.checked)
                          }
                        />
                      </td>
                    ) : null}
                    {columns.map((column) => (
                      <td key={column.key}>{cellValue(row, column.key)}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <nav className="hamd-ops-module__pager" aria-label="Pagination">
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            disabled={safePage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </button>
          <span>
            Page {safePage} of {pageCount} · {filtered.length} rows
          </span>
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            disabled={safePage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </button>
        </nav>
      ) : null}
    </OpsPage>
  );
}

/** @deprecated Prefer OpsModuleBoard */
export const OpsModulePage = OpsModuleBoard;
