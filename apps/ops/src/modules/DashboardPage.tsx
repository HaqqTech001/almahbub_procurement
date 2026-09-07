import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActivityFeed, type ActivityItem, type ActivityKind } from "@hamd/ui/dashboard";

import {
  fetchOpsDashboard,
  OpsApiError,
  requireToken,
  type OpsDashboardData,
  type OpsSeriesPoint,
} from "../api/ops-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsLoading, OpsPage } from "../components/OpsChrome.js";

type SeriesRange = "7d" | "30d" | "90d";

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function weekday(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

function activityHref(event: {
  action: string;
  resourceType: string;
  resourceId: string;
}): string {
  const type = event.resourceType.toLowerCase();
  const id = event.resourceId;
  if (type.includes("product") && id) return `/products/${id}`;
  if ((type.includes("request") || type.includes("procurement")) && id) {
    return `/requests/${id}`;
  }
  if (type.includes("quotation")) return id ? `/quotations` : "/quotations";
  if (type.includes("user") || type.includes("membership")) return "/users";
  if (type.includes("categ") && id) return `/categories/${id}`;
  if (type.includes("shipment")) return "/shipments";
  if (type.includes("payment")) return "/payments";
  if (type.includes("invoice")) return "/invoices";
  if (type.includes("org")) return "/organizations";
  return "/audit";
}

function activityKind(event: { action: string; resourceType: string }): ActivityKind {
  const blob = `${event.action} ${event.resourceType}`.toLowerCase();
  if (blob.includes("clarif")) return "clarification";
  if (blob.includes("quot")) return "quotation";
  if (blob.includes("pay")) return "payment";
  if (blob.includes("invoice")) return "invoice";
  if (blob.includes("ship")) return "shipment";
  if (blob.includes("announce")) return "announcement";
  if (blob.includes("product")) return "request";
  if (blob.includes("request") || blob.includes("procurement")) return "request";
  return "status";
}

function Sparkline({ points }: { points: OpsSeriesPoint[] }) {
  const max = Math.max(1, ...points.map((point) => point.count));
  return (
    <div className="hamd-admin-chart" role="img" aria-label="Procurement requests by day">
      <ul className="hamd-admin-chart__bars">
        {points.map((point) => (
          <li key={point.date}>
            <span
              className="hamd-admin-chart__bar"
              style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }}
              title={`${point.date}: ${point.count}`}
            />
            <span className="hamd-admin-chart__tick">{weekday(point.date)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Distribution({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number; href?: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  return (
    <section className="hamd-admin-panel" aria-label={title}>
      <h3>{title}</h3>
      {total === 0 ? (
        <p className="hamd-ops-empty" role="status">
          No records yet.
        </p>
      ) : (
        <ul className="hamd-admin-dist">
          {items.map((item) => (
            <li key={item.label}>
              {item.href ? <Link to={item.href}>{item.label}</Link> : <span>{item.label}</span>}
              <span>{item.count}</span>
              <span className="hamd-admin-dist__track" aria-hidden="true">
                <span
                  className="hamd-admin-dist__fill"
                  style={{ width: `${Math.round((item.count / Math.max(total, 1)) * 100)}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<OpsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<SeriesRange>("7d");

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireToken(auth.ensureSession);
      setData(await fetchOpsDashboard(token));
    } catch (err) {
      setData(null);
      if (err instanceof OpsApiError && (err.status === 401 || err.status === 403)) {
        setError(
          err.status === 401
            ? "Your session expired. Sign in again to load the dashboard."
            : "You do not have permission to view operations data.",
        );
        return;
      }
      setError(
        err instanceof Error ? err.message : "Unable to load the operations dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const name = auth.user?.firstName || auth.user?.displayName || "Admin";
  const series = data?.requestSeries?.[range] ?? [];
  const seriesHasData = series.some((point) => point.count > 0);
  const quickActions = useMemo(() => {
    const permissions = new Set(auth.permissions);
    return (data?.quickActions ?? []).filter(
      (action) =>
        !action.permission ||
        permissions.has(action.permission) ||
        permissions.has("ops:access"),
    );
  }, [auth.permissions, data?.quickActions]);

  const recentActivity = (data?.recentActivity ?? []).slice(0, 7);
  const recentProducts = (data?.recentProducts ?? []).slice(0, 5);
  const recentActivityItems: ActivityItem[] = recentActivity.map((event) => ({
    id: event.id,
    kind: activityKind(event),
    title: `${event.actorName} · ${event.action.replaceAll(".", " ")}`,
    detail: event.resourceType,
    href: activityHref(event),
    at: event.occurredAt,
  }));
  const recentProductItems: ActivityItem[] = recentProducts.map((product) => ({
    id: product.id,
    kind: "request",
    title: product.name,
    detail: [product.status, product.categoryName].filter(Boolean).join(" · "),
    href: product.href?.includes("/products/") ? product.href : `/products/${product.id}`,
    at: product.updatedAt,
    statusLabel: product.status,
  }));
  const requestStatusItems = (data?.requestPipeline ?? []).map((stage) => ({
    label: stage.label,
    count: stage.count,
    href: stage.href,
  }));

  return (
    <OpsPage className="hamd-ops-dashboard hamd-admin-dashboard">
      <header className="hamd-admin-dashboard__header">
        <div>
          <p className="hamd-admin-kicker">Internal operations</p>
          <h1>
            {greeting()}, {name}
          </h1>
          <p>Here&apos;s what&apos;s happening across Almahbub.</p>
        </div>
        <div className="hamd-admin-dashboard__controls">
          <label>
            Range
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as SeriesRange)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </label>
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() => {
              setLoading(true);
              void refresh();
            }}
          >
            Refresh
          </button>
        </div>
      </header>

      {error ? (
        <OpsAlert>
          {error}{" "}
          <button
            type="button"
            className="hamd-btn hamd-btn--ghost"
            onClick={() => {
              setLoading(true);
              void refresh();
            }}
          >
            Retry
          </button>
        </OpsAlert>
      ) : null}

      {loading ? <OpsLoading label="Loading dashboard…" /> : null}

      {!loading && !error && data ? (
        <>
          <ul className="hamd-ops-kpi-grid">
            {data.kpis.map((kpi) => (
              <li key={kpi.id}>
                <Link
                  to={kpi.href ?? "/"}
                  className="hamd-ops-kpi-card"
                  data-kpi={kpi.id}
                >
                  <span className="hamd-ops-kpi-card__label">{kpi.label}</span>
                  <strong className="hamd-ops-kpi-card__value">{kpi.value}</strong>
                  {kpi.delta ? (
                    <span className="hamd-ops-kpi-card__delta">{kpi.delta}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>

          {quickActions.length ? (
            <nav className="hamd-ops-dashboard__actions" aria-label="Operational actions">
              {quickActions.map((action) => (
                <Link key={action.id} to={action.href} className="hamd-btn hamd-btn--secondary">
                  {action.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="hamd-ops-dashboard__columns">
            <section className="hamd-admin-panel" aria-labelledby="admin-series">
              <h2 id="admin-series">Procurement activity</h2>
              {seriesHasData ? (
                <Sparkline points={series} />
              ) : (
                <p className="hamd-ops-empty" role="status">
                  No procurement requests in this range yet.
                </p>
              )}
            </section>
            <Distribution title="Request status" items={requestStatusItems} />
          </div>

          <section className="hamd-admin-panel" aria-labelledby="admin-attention">
            <h2 id="admin-attention">Requires attention</h2>
            {(data.attention ?? []).length === 0 ? (
              <p className="hamd-ops-empty" role="status">
                You&apos;re all caught up.
              </p>
            ) : (
              <ul className="hamd-admin-attention">
                {(data.attention ?? []).map((item) => (
                  <li key={item.id}>
                    <Link to={item.href}>
                      <strong>{item.count}</strong> {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="hamd-ops-dashboard__columns">
            <section className="hamd-admin-panel">
              <ActivityFeed
                items={recentActivityItems}
                title="Recent activity"
                viewAllHref="/audit"
                viewAllLabel="View all activity"
                emptyTitle="No audit activity yet"
                emptyDescription="Operational changes will appear here as staff work requests, products, and records."
                limit={7}
                onNavigate={(href) => navigate(href)}
              />
            </section>
            <section className="hamd-admin-panel">
              <ActivityFeed
                items={recentProductItems}
                title="Recent products"
                viewAllHref="/products"
                viewAllLabel="View all products"
                emptyTitle="No products yet"
                emptyDescription="Newly created catalogue records will appear here."
                limit={5}
                onNavigate={(href) => navigate(href)}
              />
            </section>
          </div>
        </>
      ) : null}
    </OpsPage>
  );
}
