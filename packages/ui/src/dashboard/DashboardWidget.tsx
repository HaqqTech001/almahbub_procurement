import {
  type DragEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cx } from "../utils/cx.js";
import type { WidgetLayoutHint, WidgetSize } from "./types.js";

export type DashboardWidgetProps = {
  id: string;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  size?: WidgetSize | undefined;
  layout?: WidgetLayoutHint | undefined;
  /** Marks the single primary attention region on the page. */
  attention?: boolean | undefined;
  /** Resizable-ready: expose a drag handle for host layout engines. */
  resizable?: boolean | undefined;
  onResizeStart?: ((event: PointerEvent<HTMLButtonElement>) => void) | undefined;
  /** Collapse body while keeping the header visible. */
  collapsible?: boolean | undefined;
  collapsed?: boolean | undefined;
  onToggleCollapse?: (() => void) | undefined;
  /** HTML5 drag reorder handle. */
  draggable?: boolean | undefined;
  onDragStart?: ((event: DragEvent<HTMLButtonElement>) => void) | undefined;
  onDragOver?: ((event: DragEvent<HTMLElement>) => void) | undefined;
  onDrop?: ((event: DragEvent<HTMLElement>) => void) | undefined;
  onDragEnd?: (() => void) | undefined;
  dragging?: boolean | undefined;
  dropTarget?: boolean | undefined;
};

export function DashboardWidgetSkeleton({
  className,
  lines = 4,
}: {
  className?: string | undefined;
  lines?: number | undefined;
}) {
  return (
    <div
      className={cx("hamd-dash-widget hamd-dash-widget--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-dash-skel hamd-dash-skel--title" />
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="hamd-dash-skel hamd-dash-skel--line" />
      ))}
    </div>
  );
}

/**
 * Modular dashboard panel - Notion-like composition, Stripe calm chrome.
 * Supports collapse, drag reorder, and resize for executive layout engines.
 */
export function DashboardWidget({
  id,
  title,
  description,
  children,
  actions,
  footer,
  loading,
  className,
  size = "md",
  layout,
  attention,
  resizable = true,
  onResizeStart,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragging,
  dropTarget,
}: DashboardWidgetProps) {
  if (loading) {
    return <DashboardWidgetSkeleton className={className} />;
  }

  const colSpan =
    layout?.colSpan ?? (size === "xl" ? 12 : size === "lg" ? 8 : size === "sm" ? 3 : 6);
  const rowSpan = layout?.rowSpan ?? 1;

  return (
    <section
      id={id}
      className={cx(
        "hamd-dash-widget",
        attention && "hamd-dash-widget--attention",
        collapsed && "is-collapsed",
        dragging && "is-dragging",
        dropTarget && "is-drop-target",
        className,
      )}
      data-widget-id={id}
      data-size={size}
      data-col-span={colSpan}
      data-row-span={rowSpan}
      data-resizable={resizable ? "true" : "false"}
      data-collapsed={collapsed ? "true" : "false"}
      style={{
        ["--hamd-dash-col-span" as string]: String(colSpan),
        ["--hamd-dash-row-span" as string]: String(rowSpan),
        minWidth: layout?.minWidthPx,
        minHeight: layout?.minHeightPx,
      }}
      aria-labelledby={`${id}-title`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <header className="hamd-dash-widget__header">
        {draggable ? (
          <button
            type="button"
            className="hamd-dash-widget__drag"
            aria-label={`Reorder ${title} widget`}
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <span aria-hidden="true">⠿</span>
          </button>
        ) : null}
        <div className="hamd-dash-widget__heading">
          <h2 id={`${id}-title`} className="hamd-dash-widget__title">
            {title}
          </h2>
          {description ? (
            <p className="hamd-dash-widget__desc">{description}</p>
          ) : null}
        </div>
        <div className="hamd-dash-widget__actions">
          {actions}
          {collapsible ? (
            <button
              type="button"
              className="hamd-dash-widget__collapse"
              aria-expanded={!collapsed}
              aria-controls={`${id}-body`}
              onClick={onToggleCollapse}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          ) : null}
        </div>
        {resizable ? (
          <button
            type="button"
            className="hamd-dash-widget__resize"
            aria-label={`Resize ${title} widget`}
            onPointerDown={onResizeStart}
          >
            <span aria-hidden="true" />
          </button>
        ) : null}
      </header>
      {!collapsed ? (
        <div id={`${id}-body`} className="hamd-dash-widget__body">
          {children}
        </div>
      ) : null}
      {!collapsed && footer ? (
        <footer className="hamd-dash-widget__footer">{footer}</footer>
      ) : null}
    </section>
  );
}
