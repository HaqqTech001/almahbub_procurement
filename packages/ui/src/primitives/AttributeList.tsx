import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type AttributeItem = {
  label: string;
  value: ReactNode;
};

export type AttributeListProps = {
  items: readonly AttributeItem[];
  className?: string | undefined;
};

export function AttributeList({ items, className }: AttributeListProps) {
  const visible = items.filter((item) => {
    if (item.value == null || item.value === false) return false;
    if (typeof item.value === "string" && !item.value.trim()) return false;
    return true;
  });
  if (visible.length === 0) return null;
  return (
    <dl className={cx("hamd-attr-list", className)}>
      {visible.map((item) => (
        <div key={item.label} className="hamd-attr-list__row">
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
