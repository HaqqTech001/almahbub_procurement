import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type StatItem = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: "up" | "down";
  iconVariant?: "default" | "success" | "warning" | "danger" | "info";
};

export type StatsRowProps = {
  items: readonly StatItem[];
  className?: string;
};

function StatCards({ items }: { items: readonly StatItem[] }) {
  return (
    <div className="hamd-module-workspace__stats">
      {items.map((item) => (
        <div key={item.label} className="hamd-module-stat">
          {item.icon ? (
            <span
              className={cx(
                "hamd-module-stat__icon",
                item.iconVariant === "success" && "hamd-module-stat__icon--success",
                item.iconVariant === "warning" && "hamd-module-stat__icon--warning",
                item.iconVariant === "danger" && "hamd-module-stat__icon--danger",
                item.iconVariant === "info" && "hamd-module-stat__icon--info",
              )}
              aria-hidden="true"
            >
              {item.icon}
            </span>
          ) : null}
          <div className="hamd-module-stat__content">
            <div className="hamd-module-stat__value">{item.value}</div>
            <div className="hamd-module-stat__label">{item.label}</div>
            {item.trend ? (
              <div
                className={cx(
                  "hamd-module-stat__trend",
                  item.trendDirection === "up" && "hamd-module-stat__trend--up",
                  item.trendDirection === "down" && "hamd-module-stat__trend--down",
                )}
              >
                {item.trend}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsRow({ items, className }: StatsRowProps) {
  if (!items.length) return null;

  return (
    <div className={cx("hamd-module-overview", className)}>
      <details className="hamd-module-overview__mobile">
        <summary className="hamd-module-overview__summary">
          <span className="hamd-module-overview__summary-title">Overview</span>
          <span className="hamd-module-overview__chips">
            {items.map((item) => (
              <span key={item.label} className="hamd-module-overview__chip">
                <strong>{item.value}</strong>
                {item.label}
              </span>
            ))}
          </span>
        </summary>
        <StatCards items={items} />
      </details>
      <div className="hamd-module-overview__desktop">
        <StatCards items={items} />
      </div>
    </div>
  );
}
