import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ModuleEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  onReset?: () => void;
  className?: string;
};

export function ModuleEmptyState({
  icon,
  title,
  description,
  action,
  onReset,
  className,
}: ModuleEmptyStateProps) {
  return (
    <div className={cx("hamd-module-workspace__empty", className)}>
      {icon ? (
        <div className="hamd-module-workspace__empty-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="hamd-module-workspace__empty-title">{title}</h2>
      <p className="hamd-module-workspace__empty-description">{description}</p>
      {action ? <div>{action}</div> : null}
      {onReset ? (
        <button
          type="button"
          className="hamd-btn hamd-btn--ghost"
          onClick={onReset}
          style={{ marginTop: "var(--hamd-space-3, 0.75rem)" }}
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
