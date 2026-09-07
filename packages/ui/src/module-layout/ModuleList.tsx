import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ModuleListRow = {
  id: string | number;
  primary: ReactNode;
  secondary?: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
};

export type ModuleListProps = {
  items: readonly ModuleListRow[];
  onRowClick?: (item: ModuleListRow) => void;
  selectedId?: string | number;
  empty?: ReactNode;
  className?: string;
};

export function ModuleList({
  items,
  onRowClick,
  selectedId,
  empty,
  className,
}: ModuleListProps) {
  if (!items.length && empty) {
    return <div className={cx("hamd-module-list-empty", className)}>{empty}</div>;
  }

  return (
    <div className={cx("hamd-module-list", className)}>
      {items.map((item) => {
        const active = selectedId != null && item.id === selectedId;
        return (
          <div
            key={item.id}
            className={cx("hamd-module-list__row", active && "is-selected")}
            onClick={() => onRowClick?.(item)}
            style={onRowClick ? { cursor: "pointer" } : undefined}
          >
            <div className="hamd-module-list__row-primary">
              <div className="hamd-module-list__row-title">{item.primary}</div>
              {item.secondary ? (
                <div className="hamd-module-list__row-meta">{item.secondary}</div>
              ) : null}
            </div>
            {item.aside || item.actions ? (
              <div className="hamd-module-list__row-aside">
                {item.aside}
                {item.actions}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
