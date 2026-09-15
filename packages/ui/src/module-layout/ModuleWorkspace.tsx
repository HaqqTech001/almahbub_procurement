import type { ReactNode } from "react";
import { cx } from "../utils/cx.js";
import { ModuleHeader, type ModuleHeaderProps } from "./ModuleHeader.js";
import { FilterToolbar, type FilterToolbarProps } from "./FilterToolbar.js";
import { StatsRow, type StatsRowProps } from "./StatsRow.js";
import { ModuleEmptyState, type ModuleEmptyStateProps } from "./ModuleEmptyState.js";
import { ModuleSkeleton } from "./ModuleSkeleton.js";
import { ErrorState } from "../primitives/ErrorState.js";

export type ModuleWorkspaceProps = {
  header: ModuleHeaderProps;
  toolbar?: FilterToolbarProps;
  stats?: StatsRowProps["items"];
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  errorTitle?: string;
  retryLabel?: string;
  onRetry?: () => void;
  empty?: ModuleEmptyStateProps | null;
  isEmpty?: boolean;
  pagination?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ModuleWorkspace({
  header,
  toolbar,
  stats,
  loading,
  loadingLabel = "Loading…",
  error,
  errorTitle = "Unable to load this module",
  retryLabel,
  onRetry,
  empty,
  isEmpty,
  pagination,
  children,
  className,
}: ModuleWorkspaceProps) {
  const showEmpty = !loading && !error && Boolean(empty) && (isEmpty ?? !children);
  const showRecords = !loading && !error && !showEmpty && Boolean(children);

  return (
    <div className={cx("hamd-module-workspace", "hamd-list-module-frame", className)}>
      <ModuleHeader {...header} />

      <div className="hamd-module-workspace__chrome">
        {toolbar ? <FilterToolbar {...toolbar} /> : null}
        {stats && stats.length > 0 ? <StatsRow items={stats} /> : null}
        {pagination ? <div className="hamd-module-workspace__pager">{pagination}</div> : null}
      </div>

      <div className="hamd-module-workspace__body">
        {loading && !error ? (
          <div className="hamd-module-workspace__loading" aria-busy="true" aria-live="polite">
            <span className="hamd-sr-only">{loadingLabel}</span>
            <ModuleSkeleton variant="table" count={6} />
          </div>
        ) : null}

        {error ? (
          <ErrorState
            title={errorTitle}
            description={error}
            {...(onRetry ? { onRetry } : {})}
            {...(retryLabel ? { retryLabel } : {})}
          />
        ) : null}

        {showEmpty && empty ? (
          <div className="hamd-module-workspace__records hamd-module-workspace__records--empty">
            <ModuleEmptyState
              title={empty.title}
              description={empty.description}
              {...(empty.icon !== undefined ? { icon: empty.icon } : {})}
              {...(empty.action !== undefined ? { action: empty.action } : {})}
              {...(empty.onReset ? { onReset: empty.onReset } : {})}
              {...(empty.className ? { className: empty.className } : {})}
            />
          </div>
        ) : null}

        {showRecords ? (
          <div
            className="hamd-module-workspace__records"
            aria-busy={loading ? "true" : undefined}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
