import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ModuleTableColumn<T> = {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

export type ModuleTableProps<T> = {
  columns: readonly ModuleTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  selectedRowId?: string | number;
  empty?: ReactNode;
  className?: string;
};

export function ModuleTable<T>({
  columns,
  rows,
  getRowId,
  onRowClick,
  selectedRowId,
  empty,
  className,
}: ModuleTableProps<T>) {
  if (!rows.length && empty) {
    return <div className={cx("hamd-module-table-empty", className)}>{empty}</div>;
  }

  return (
    <div className={cx("hamd-module-table-wrap", className)}>
      <table className="hamd-module-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row);
            const active = selectedRowId != null && id === selectedRowId;
            return (
              <tr
                key={id}
                className={cx(active && "is-selected")}
                onClick={() => onRowClick?.(row)}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key} className={column.className} data-label={column.label}>
                    {column.render ? column.render(row) : (row as Record<string, unknown>)[column.key] as ReactNode}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
