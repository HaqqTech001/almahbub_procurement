import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ModuleCardGridProps<T> = {
  items: readonly T[];
  getRowId: (item: T) => string | number;
  renderCard: (item: T) => ReactNode;
  empty?: ReactNode;
  className?: string;
};

export function ModuleCardGrid<T>({
  items,
  getRowId,
  renderCard,
  empty,
  className,
}: ModuleCardGridProps<T>) {
  if (!items.length && empty) {
    return <div className={cx("hamd-module-card-grid-empty", className)}>{empty}</div>;
  }

  return (
    <div className={cx("hamd-module-card-grid", className)}>
      {items.map((item) => (
        <div key={getRowId(item)}>{renderCard(item)}</div>
      ))}
    </div>
  );
}
