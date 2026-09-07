import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  ANALYTICS_EXPORT_FORMATS,
  ANALYTICS_PERIODS,
  analyticsExportLabel,
  analyticsPeriodLabel,
  emptyAnalyticsFilters,
  filterAnalyticsMetrics,
  type AnalyticsExportFormat,
  type AnalyticsExportRequest,
  type AnalyticsFilters,
  type AnalyticsMetric,
  type AnalyticsSnapshot,
} from "./types.js";

export type AnalyticsWorkspaceProps = {
  snapshot: AnalyticsSnapshot;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  /** Controlled filters; omit to manage locally. */
  filters?: AnalyticsFilters | undefined;
  defaultFilters?: AnalyticsFilters | undefined;
  onFiltersChange?: ((filters: AnalyticsFilters) => void) | undefined;
  /** Host refreshes snapshot for the selected period/range. */
  onApplyFilters?: ((filters: AnalyticsFilters) => void | Promise<void>) | undefined;
  /** Host runs async CSV / Excel / PDF export (docs/23). */
  onExport?: ((request: AnalyticsExportRequest) => void | Promise<void>) | undefined;
  onSelectMetric?: ((metric: AnalyticsMetric) => void) | undefined;
  canExport?: boolean | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

function Sparkline({
  title,
  points,
}: {
  title: string;
  points: { label: string; value: number }[];
}) {
  const w = 280;
  const h = 72;
  const pad = 8;
  const max = Math.max(1, ...points.map((p) => p.value));
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * (w - pad * 2);
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const path = coords.length
    ? `M ${coords.join(" L ")}`
    : `M ${pad},${h - pad}`;

  return (
    <figure className="hamd-an-spark" aria-label={`${title} trend`}>
      <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" focusable="false">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.25" />
      </svg>
      <table className="hamd-an-spark__table">
        <caption className="hamd-sr-only">{title} data table</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.label}>
              <th scope="row">{p.label}</th>
              <td>{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function AnalyticsWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-an", "hamd-an--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-an-skel hamd-an-skel--bar" />
      <div className="hamd-an-skel-grid">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="hamd-an-skel hamd-an-skel--card" />
        ))}
      </div>
    </div>
  );
}

/**
 * Enterprise Analytics workspace - governed track metrics, period filters,
 * and CSV/Excel/PDF export hooks. Presentational; hosts own projections.
 */
export function AnalyticsWorkspace({
  snapshot,
  title = "Enterprise Analytics",
  loading,
  className,
  filters: controlledFilters,
  defaultFilters,
  onFiltersChange,
  onApplyFilters,
  onExport,
  onSelectMetric,
  canExport = true,
}: AnalyticsWorkspaceProps) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilters>(
    defaultFilters ?? emptyAnalyticsFilters(),
  );
  const filters = controlledFilters ?? localFilters;
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(
    snapshot.metrics[0]?.key ?? null,
  );
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [exportBusy, setExportBusy] = useState(false);

  const setFilters = (next: AnalyticsFilters) => {
    if (!controlledFilters) setLocalFilters(next);
    onFiltersChange?.(next);
  };

  const metrics = useMemo(
    () => filterAnalyticsMetrics(snapshot.metrics, query),
    [snapshot.metrics, query],
  );

  const selected =
    metrics.find((m) => m.key === selectedKey) ?? metrics[0] ?? null;

  if (loading) {
    return <AnalyticsWorkspaceSkeleton className={className} />;
  }

  const run = async (fn?: () => void | Promise<void>, ok?: string) => {
    setError(null);
    try {
      await fn?.();
      if (ok) setToast(ok);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const exportFormat = async (format: AnalyticsExportFormat) => {
    setExportBusy(true);
    try {
      await run(
        () =>
          onExport?.({
            format,
            filters,
            metricKeys: metrics.map((m) => String(m.key)),
          }),
        `${analyticsExportLabel(format)} export started`,
      );
    } finally {
      setExportBusy(false);
    }
  };

  return (
    <div className={cx("hamd-an", className)}>
      <a className="hamd-an__skip" href="#hamd-an-detail">
        Skip to metric detail
      </a>

      <header className="hamd-an__header">
        <div>
          <h1 className="hamd-an__title">{title}</h1>
          <p className="hamd-an__subtitle">
            Track visitors, users, conversion, procurement, suppliers,
            quotations, revenue, response time, order completion, and CSAT -
            with period filters and governed exports.
          </p>
          <p className="hamd-an__meta">
            Snapshot {formatWhen(snapshot.generatedAt)}
            {snapshot.timezone ? ` · ${snapshot.timezone}` : ""}
            {snapshot.currency ? ` · ${snapshot.currency}` : ""}
          </p>
        </div>
      </header>

      <section className="hamd-an-toolbar" aria-label="Analytics filters and export">
        <div className="hamd-an-periods" role="group" aria-label="Period">
          {ANALYTICS_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              className={cx(
                "hamd-an-chip",
                filters.period === period && "is-active",
              )}
              aria-pressed={filters.period === period}
              onClick={() =>
                setFilters({
                  ...filters,
                  period,
                })
              }
            >
              {analyticsPeriodLabel(period)}
            </button>
          ))}
        </div>

        {filters.period === "custom" ? (
          <div className="hamd-an-range" aria-label="Custom range">
            <label>
              From
              <input
                type="date"
                value={filters.from ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    from: e.target.value || undefined,
                  })
                }
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={filters.to ?? ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    to: e.target.value || undefined,
                  })
                }
              />
            </label>
          </div>
        ) : null}

        <button
          type="button"
          className="hamd-an-btn hamd-an-btn--primary"
          onClick={() =>
            void run(() => onApplyFilters?.(filters), "Filters applied")
          }
        >
          Apply filters
        </button>

        {canExport ? (
          <div className="hamd-an-export" role="group" aria-label="Export">
            <span className="hamd-an-export__label">Export</span>
            {ANALYTICS_EXPORT_FORMATS.map((format) => (
              <button
                key={format}
                type="button"
                className="hamd-an-btn"
                disabled={exportBusy}
                onClick={() => void exportFormat(format)}
              >
                {analyticsExportLabel(format)}
              </button>
            ))}
          </div>
        ) : null}

        <label className="hamd-an-search">
          <span className="hamd-sr-only">Search metrics</span>
          <input
            type="search"
            placeholder="Search metrics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </section>

      <div className="hamd-an__layout">
        <ul className="hamd-an-grid" aria-label="Tracked metrics">
          {metrics.length === 0 ? (
            <li className="hamd-an-empty" role="status">
              No metrics match this filter.
            </li>
          ) : (
            metrics.map((metric) => {
              const active = selected?.key === metric.key;
              return (
                <li key={String(metric.key)}>
                  <button
                    type="button"
                    className={cx("hamd-an-card", active && "is-active")}
                    data-tone={metric.tone ?? "neutral"}
                    aria-current={active ? "true" : undefined}
                    onClick={() => {
                      setSelectedKey(String(metric.key));
                      onSelectMetric?.(metric);
                    }}
                  >
                    <span className="hamd-an-card__label">{metric.label}</span>
                    <strong className="hamd-an-card__value">
                      {metric.value}
                      {metric.unit ? (
                        <span className="hamd-an-card__unit">
                          {" "}
                          {metric.unit}
                        </span>
                      ) : null}
                    </strong>
                    {metric.delta ? (
                      <span className="hamd-an-card__delta">{metric.delta}</span>
                    ) : null}
                    <Sparkline title={metric.label} points={metric.series} />
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <section
          id="hamd-an-detail"
          className="hamd-an__detail"
          aria-label="Metric detail"
        >
          {selected ? (
            <>
              <header className="hamd-an-detail__head">
                <h2>{selected.label}</h2>
                <p className="hamd-an-detail__value">{selected.value}</p>
                {selected.delta ? (
                  <p className="hamd-an-detail__delta">{selected.delta}</p>
                ) : null}
              </header>
              <dl className="hamd-an-facts">
                <div>
                  <dt>Definition</dt>
                  <dd>{selected.definition || "Governed metric definition."}</dd>
                </div>
                <div>
                  <dt>Freshness</dt>
                  <dd>
                    {selected.freshnessAt
                      ? formatWhen(selected.freshnessAt)
                      : "-"}
                  </dd>
                </div>
                <div>
                  <dt>Key</dt>
                  <dd>
                    <code>{selected.key}</code>
                  </dd>
                </div>
              </dl>
              <Sparkline title={selected.label} points={selected.series} />
              <p className="hamd-an-muted">
                Period: {analyticsPeriodLabel(filters.period)}
                {filters.period === "custom" && filters.from && filters.to
                  ? ` (${filters.from} → ${filters.to})`
                  : ""}
              </p>
            </>
          ) : (
            <p className="hamd-an-empty" role="status">
              Select a metric to inspect definition and trend.
            </p>
          )}
        </section>
      </div>

      {error ? (
        <p className="hamd-an-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
