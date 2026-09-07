import { type DragEvent, type ReactNode, useMemo } from "react";
import { cx } from "../utils/cx.js";
import { DashboardWidget } from "./DashboardWidget.js";
import {
  AreaChart,
  BarChart,
  DonutChart,
  HeatmapPlaceholder,
  LineChart,
} from "./charts/DashboardCharts.js";
import type { ExecutiveDashboardData } from "./executive-types.js";
import { executiveLayoutDefaults } from "./executive-fixtures.js";
import { useDashboardLayout } from "./useDashboardLayout.js";

export type ExecutiveDashboardProps = {
  data: ExecutiveDashboardData;
  title?: string | undefined;
  subtitle?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  persistLayout?: boolean | undefined;
  storageKey?: string | undefined;
  onOpenHref?: ((href: string) => void) | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function ExecutiveDashboardSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-dash", "hamd-exec", "hamd-exec--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-dash-skel hamd-dash-skel--title" />
      <div className="hamd-exec-skel-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="hamd-dash-skel hamd-dash-skel--line" />
        ))}
      </div>
    </div>
  );
}

/**
 * Executive Operations Dashboard - post-login command center.
 * Attention → KPIs → Trends → Execution. Widgets reorder / collapse / resize
 * with optional localStorage persistence.
 */
export function ExecutiveDashboard({
  data,
  title = "Operations overview",
  subtitle = "Executive command center - performance, risk, and next actions",
  loading,
  className,
  persistLayout = true,
  storageKey = "hamd.executive.dashboard.layout",
  onOpenHref,
}: ExecutiveDashboardProps) {
  const layout = useDashboardLayout({
    defaults: executiveLayoutDefaults,
    persist: persistLayout,
    storageKey,
  });

  const widgets = useMemo(() => {
    const open = (href: string) => onOpenHref?.(href);

    const map: Record<
      string,
      {
        title: string;
        description?: string;
        node: ReactNode;
        attention?: boolean;
      }
    > = {
      "exec-kpis": {
        title: "Executive KPIs",
        description: "Definition, range, freshness, and trend",
        node: (
          <ul className="hamd-exec-kpis" aria-label="Executive KPI cards">
            {data.kpis.map((kpi) => (
              <li key={kpi.id} data-tone={kpi.tone}>
                <button
                  type="button"
                  className="hamd-exec-kpi"
                  onClick={() => (kpi.href ? open(kpi.href) : undefined)}
                >
                  <span className="hamd-exec-kpi__label">{kpi.label}</span>
                  <strong className="hamd-exec-kpi__value">{kpi.value}</strong>
                  {kpi.delta ? (
                    <span className="hamd-exec-kpi__delta">{kpi.delta}</span>
                  ) : null}
                  {kpi.definition ? (
                    <span className="hamd-exec-kpi__def">{kpi.definition}</span>
                  ) : null}
                  <span className="hamd-exec-kpi__meta">
                    {[kpi.timeRange, kpi.freshness].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-revenue": {
        title: "Revenue overview",
        description: "Line trend with accessible table",
        node: (
          <div className="hamd-exec-chart-block">
            <LineChart title="Revenue by month" points={data.revenueSeries} />
            <AreaChart
              title="Cash collection"
              points={data.cashCollection}
              className="hamd-exec-chart-secondary"
            />
          </div>
        ),
      },
      "exec-pipeline": {
        title: "Procurement pipeline",
        description: "Stage funnel counts",
        node: (
          <div>
            <BarChart
              title="Pipeline stage volume"
              points={data.pipeline.map((s) => ({
                label: s.label,
                value: s.count,
              }))}
            />
            <ul className="hamd-exec-pipeline">
              {data.pipeline.map((stage) => (
                <li key={stage.id}>
                  <strong>{stage.label}</strong>
                  <span>
                    {stage.count}
                    {stage.amount ? ` · ${stage.amount}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ),
      },
      "exec-approvals": {
        title: "Pending approvals",
        description: "Attention now",
        attention: true,
        node: (
          <ul className="hamd-exec-list" aria-label="Pending approvals">
            {data.pendingApprovals.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="hamd-exec-row"
                  data-urgency={item.urgency}
                  onClick={() => open(item.href)}
                >
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-requests": {
        title: "Recent procurement requests",
        node: (
          <ul className="hamd-exec-list" aria-label="Recent procurement requests">
            {data.recentRequests.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="hamd-exec-row"
                  onClick={() => open(row.href)}
                >
                  <strong>
                    {row.publicCode} · {row.title}
                  </strong>
                  <span>
                    {row.status} · {row.priority} · {formatWhen(row.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-suppliers": {
        title: "Supplier performance",
        node: (
          <table className="hamd-exec-table">
            <caption className="hamd-sr-only">Supplier performance</caption>
            <thead>
              <tr>
                <th scope="col">Supplier</th>
                <th scope="col">OTIF</th>
                <th scope="col">Quality</th>
                <th scope="col">On-time</th>
              </tr>
            </thead>
            <tbody>
              {data.supplierPerformance.map((row) => (
                <tr key={row.id}>
                  <th scope="row">
                    <button
                      type="button"
                      className="hamd-exec-linkish"
                      onClick={() => open(row.href)}
                    >
                      {row.name}
                    </button>
                  </th>
                  <td>{row.otif}%</td>
                  <td>{row.quality}%</td>
                  <td>{row.onTimeRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      "exec-finance": {
        title: "Financial summary",
        node: (
          <div>
            <ul className="hamd-exec-finance" aria-label="Financial summary">
              {data.financialSummary.map((bucket) => (
                <li key={bucket.id} data-tone={bucket.tone}>
                  <span>{bucket.label}</span>
                  <strong>{bucket.amount}</strong>
                </li>
              ))}
            </ul>
            <BarChart
              title="Procurement volume"
              points={data.procurementVolume}
            />
          </div>
        ),
      },
      "exec-shipments": {
        title: "Shipment status",
        node: (
          <DonutChart
            title="Shipments by status"
            points={data.shipmentStatus.map((s) => ({
              label: s.label,
              value: s.count,
            }))}
          />
        ),
      },
      "exec-inventory": {
        title: "Inventory snapshot",
        description: "Future-ready",
        node: (
          <div className="hamd-exec-future" role="status">
            <p>{data.inventory.note}</p>
            {!data.inventory.ready ? (
              <span className="hamd-exec-pill" data-availability="future">
                Future
              </span>
            ) : null}
          </div>
        ),
      },
      "exec-customers": {
        title: "Customer activity",
        node: (
          <ul className="hamd-exec-list" aria-label="Customer activity">
            {data.customerActivity.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="hamd-exec-row"
                  onClick={() => open(row.href)}
                >
                  <strong>{row.organizationName}</strong>
                  <span>
                    {row.event} · {formatWhen(row.at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-notifications": {
        title: "Recent notifications",
        node: (
          <ul className="hamd-exec-list" aria-label="Recent notifications">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={cx(
                    "hamd-exec-row",
                    n.status === "unread" && "is-unread",
                  )}
                  onClick={() =>
                    n.deepLink ? open(n.deepLink) : undefined
                  }
                >
                  <strong>{n.title}</strong>
                  <span>
                    {n.body} · {formatWhen(n.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-health": {
        title: "System health",
        node: (
          <ul className="hamd-exec-health" aria-label="System health">
            {data.systemHealth.map((item) => (
              <li key={item.id} data-status={item.status}>
                <strong>{item.service}</strong>
                <span>
                  {item.status}
                  {item.latencyMs != null ? ` · ${item.latencyMs}ms` : ""}
                  {item.detail ? ` · ${item.detail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-ai": {
        title: "AI procurement insights",
        description: "Human-reviewable recommendations",
        node: (
          <ul className="hamd-exec-list" aria-label="AI procurement insights">
            {data.aiInsights.map((insight) => (
              <li key={insight.id}>
                <button
                  type="button"
                  className="hamd-exec-row"
                  onClick={() =>
                    insight.href ? open(insight.href) : undefined
                  }
                >
                  <strong>{insight.title}</strong>
                  <span>
                    {insight.summary} · {insight.confidence} confidence
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-actions": {
        title: "Quick actions",
        node: (
          <ul className="hamd-exec-actions" aria-label="Quick actions">
            {data.quickActions.map((action) => (
              <li key={action.id}>
                <button
                  type="button"
                  className={cx(
                    "hamd-exec-action",
                    action.primary && "is-primary",
                  )}
                  onClick={() => open(action.href)}
                >
                  {action.label}
                  {action.badge != null ? (
                    <span className="hamd-exec-badge">{action.badge}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-audit": {
        title: "Recent audit events",
        node: (
          <ul className="hamd-exec-list" aria-label="Recent audit events">
            {data.auditEvents.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  className="hamd-exec-row"
                  onClick={() =>
                    event.href ? open(event.href) : undefined
                  }
                >
                  <strong>{event.action}</strong>
                  <span>
                    {event.actor} · {event.target} · {formatWhen(event.at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ),
      },
      "exec-heatmap": {
        title: "Corridor activity",
        description: "Heatmap placeholder",
        node: <HeatmapPlaceholder title="Corridor × period activity" />,
      },
    };

    return map;
  }, [data, onOpenHref]);

  if (loading) {
    return <ExecutiveDashboardSkeleton className={className} />;
  }

  const onDragStart = (id: string) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
    layout.setDraggingId(id);
  };

  const onDragOver = (id: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    layout.setDropTargetId(id);
  };

  const onDrop = (id: string) => (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const from = event.dataTransfer.getData("text/plain") || layout.draggingId;
    if (from) layout.reorder(from, id);
    layout.setDraggingId(null);
    layout.setDropTargetId(null);
  };

  return (
    <div className={cx("hamd-dash", "hamd-exec", className)}>
      <a className="hamd-exec__skip" href="#hamd-exec-grid">
        Skip to dashboard widgets
      </a>

      <header className="hamd-exec__header">
        <div>
          <h1 className="hamd-exec__title">{title}</h1>
          <p className="hamd-exec__subtitle">{subtitle}</p>
        </div>
        <div className="hamd-exec__toolbar">
          <button
            type="button"
            className="hamd-exec-btn"
            onClick={() => layout.reset()}
          >
            Reset layout
          </button>
          <span className="hamd-exec__persist" role="status">
            {persistLayout ? "Layout saved locally" : "Layout session-only"}
          </span>
        </div>
      </header>

      <div
        id="hamd-exec-grid"
        className="hamd-exec-grid"
        role="region"
        aria-label="Executive dashboard widgets"
      >
        {layout.layouts.map((item) => {
          const widget = widgets[item.id];
          if (!widget) return null;
          return (
            <DashboardWidget
              key={item.id}
              id={item.id}
              title={widget.title}
              description={widget.description}
              attention={widget.attention}
              collapsible
              collapsed={item.collapsed}
              onToggleCollapse={() => layout.toggleCollapse(item.id)}
              resizable
              onResizeStart={() => layout.cycleResize(item.id)}
              layout={{ colSpan: item.colSpan, rowSpan: item.rowSpan }}
              draggable
              dragging={layout.draggingId === item.id}
              dropTarget={layout.dropTargetId === item.id}
              onDragStart={onDragStart(item.id)}
              onDragOver={onDragOver(item.id)}
              onDrop={onDrop(item.id)}
              onDragEnd={() => {
                layout.setDraggingId(null);
                layout.setDropTargetId(null);
              }}
            >
              {widget.node}
            </DashboardWidget>
          );
        })}
      </div>
    </div>
  );
}
