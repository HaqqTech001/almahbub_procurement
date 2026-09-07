import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ActivityFeed,
  type ActivityItem,
  type ActivityKind,
} from "@hamd/ui/dashboard";
import { procurementStatusLabel } from "@hamd/ui/procurement";
import { resolveNotificationHref } from "@hamd/ui/notifications";

import { useAuth } from "../session/AuthProvider.js";
import {
  listProcurementRequests,
  requireProcurementToken,
} from "../../procurement/procurement-api.js";
import {
  listNotifications,
  requireNotificationToken,
} from "../../notifications/notification-api.js";
import { listQuotations } from "../../quotations/quotation-api.js";
import { listShipments } from "../../shipments/shipment-api.js";

const CLOSED = new Set(["fulfilled", "closed", "cancelled", "declined", "expired"]);
const ACTION = new Set(["draft", "needs_clarification", "quote_issued", "revision_requested"]);

export function workspaceGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function workspaceGivenName(user: {
  firstName?: string | null;
  displayName?: string | null;
  email?: string | null;
} | null | undefined): string {
  const first = user?.firstName?.trim();
  if (first) return first;
  const display = user?.displayName?.trim();
  if (display) return display.split(/\s+/)[0] ?? display;
  const email = user?.email?.trim();
  if (email?.includes("@")) return email.slice(0, email.indexOf("@"));
  return "there";
}

function kindFromNotice(type: string, href: string): ActivityKind {
  const blob = `${type} ${href}`.toLowerCase();
  if (blob.includes("clarif")) return "clarification";
  if (blob.includes("quot")) return "quotation";
  if (blob.includes("payment")) return "payment";
  if (blob.includes("invoice")) return "invoice";
  if (blob.includes("ship")) return "shipment";
  if (blob.includes("chat") || blob.includes("support")) return "support";
  if (blob.includes("announce")) return "announcement";
  if (blob.includes("request") || blob.includes("procurement")) return "request";
  return "status";
}

function requestActivity(row: {
  id: string;
  status: string;
  title: string;
  publicCode: string;
  updatedAt: string;
}): ActivityItem {
  const needsClarify = row.status === "needs_clarification";
  const quoted = row.status === "quote_issued";
  const href = needsClarify
    ? `/app/requests/${row.id}#clarification`
    : `/app/requests/${row.id}`;
  let title = "Request updated";
  let kind: ActivityKind = "status";
  if (row.status === "submitted" || row.status === "draft") {
    title = row.status === "draft" ? "Draft saved" : "Request submitted";
    kind = "request";
  } else if (needsClarify) {
    title = "Clarification requested";
    kind = "clarification";
  } else if (quoted) {
    title = "Quotation available";
    kind = "quotation";
  }
  return {
    id: `r-${row.id}`,
    kind,
    title,
    detail: row.publicCode,
    href,
    at: row.updatedAt,
    statusLabel: procurementStatusLabel(row.status),
  };
}

function MetricIcon({ name }: { name: "requests" | "action" | "quotes" | "ship" }) {
  const common = {
    viewBox: "0 0 20 20",
    width: 16,
    height: 16,
    "aria-hidden": true as const,
  };
  if (name === "action") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 7v3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="13.2" r="0.8" fill="currentColor" />
      </svg>
    );
  }
  if (name === "quotes") {
    return (
      <svg {...common}>
        <path d="M6 3.5h6.2L16 7.2V16.5H6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3.5V7.5h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "ship") {
    return (
      <svg {...common}>
        <path d="M3 13.5h10.5V7H8.2L6.4 4.5H3z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6.2" cy="15.2" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12.2" cy="15.2" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M5.5 3.5h6.4L16 7.5v9H5.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M11.7 3.5V7.6H16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ActionIcon({ name }: { name: "plus" | "catalog" | "quote" | "chat" }) {
  const common = {
    viewBox: "0 0 20 20",
    width: 16,
    height: 16,
    "aria-hidden": true as const,
  };
  if (name === "catalog") {
    return (
      <svg {...common}>
        <rect x="3.5" y="4" width="5.2" height="5.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11.3" y="4" width="5.2" height="5.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="3.5" y="11.5" width="5.2" height="5.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11.3" y="11.5" width="5.2" height="5.2" rx="0.8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "quote") {
    return (
      <svg {...common}>
        <path d="M6 3.5h6.2L16 7.2V16.5H6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3.5V7.5h4M8 11h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (name === "chat") {
    return (
      <svg {...common}>
        <path
          d="M4 5.5h12v7.2c0 .4-.3.8-.8.8H9l-3.2 2.4V13.5H4.8c-.4 0-.8-.4-.8-.8V5.5z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M10 4.5v11M4.5 10h11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function WorkspaceHomePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const name = workspaceGivenName(auth.user);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [metrics, setMetrics] = useState({
    active: 0,
    action: 0,
    quotations: 0,
    shipments: 0,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingActivity(true);
      try {
        const token = await requireProcurementToken(auth.ensureSession);
        const noticeToken = await requireNotificationToken(auth.ensureSession).catch(() => token);
        const [rows, notices, quotations, shipments] = await Promise.all([
          listProcurementRequests(token, { pageSize: 12 }),
          listNotifications(noticeToken, { pageSize: 8 }).catch(() => []),
          listQuotations(token, { pageSize: 8 }).catch(() => []),
          listShipments(token, { pageSize: 8 }).catch(() => []),
        ]);
        if (cancelled) return;

        const fromNotices = notices.flatMap((item) => {
          const href = resolveNotificationHref(item, "app");
          if (!href) return [];
          return [
            {
              id: `n-${item.id}`,
              kind: kindFromNotice(String(item.type ?? ""), href),
              title: item.title,
              detail: item.body?.trim() || undefined,
              href,
              at: item.createdAt,
            } satisfies ActivityItem,
          ];
        });
        const covered = new Set(
          fromNotices.map((item) => item.href.replace(/#.*$/, "")),
        );
        const fromRequests = rows
          .map(requestActivity)
          .filter((item) => !covered.has(item.href.replace(/#.*$/, "")));
        const merged = [...fromNotices, ...fromRequests]
          .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
          .slice(0, 7);

        setActivity(merged);
        setMetrics({
          active: rows.filter((row) => !CLOSED.has(row.status)).length,
          action: rows.filter((row) => ACTION.has(row.status)).length,
          quotations: quotations.filter((row) =>
            ["issued", "sent", "quote_issued", "open", "published"].includes(row.status),
          ).length,
          shipments: shipments.filter((row) =>
            !["delivered", "cancelled", "closed"].includes(row.status),
          ).length,
        });
      } catch {
        if (!cancelled) {
          setActivity([]);
        }
      } finally {
        if (!cancelled) setLoadingActivity(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth.ensureSession]);

  const metricItems = useMemo(
    () => [
      {
        id: "active",
        label: "Active requests",
        value: metrics.active,
        href: "/app/requests",
        icon: "requests" as const,
      },
      {
        id: "action",
        label: "Action required",
        value: metrics.action,
        href: "/app/requests",
        icon: "action" as const,
      },
      {
        id: "quotes",
        label: "Quotations",
        value: metrics.quotations,
        href: "/app/quotations",
        icon: "quotes" as const,
      },
      {
        id: "ship",
        label: "Shipments",
        value: metrics.shipments,
        href: "/app/shipments",
        icon: "ship" as const,
      },
    ],
    [metrics],
  );

  return (
    <div className="hamd-workspace-home" data-guide="dashboard-stats">
      <div className="hamd-workspace-home__main">
        <header className="hamd-workspace-home__header">
          <h1>
            <span className="hamd-workspace-home__greet">{workspaceGreeting()},</span>
            <span className="hamd-workspace-home__name">{name}</span>
          </h1>
          <p>Track requests, quotations, and fulfilment from this workspace.</p>
        </header>

        <section className="hamd-workspace-home__metrics" aria-label="Procurement overview">
          {metricItems.map((item) => (
            <Link key={item.id} className="hamd-workspace-home__metric" to={item.href}>
              <span className="hamd-workspace-home__metric-icon">
                <MetricIcon name={item.icon} />
              </span>
              <span className="hamd-workspace-home__metric-label">{item.label}</span>
              <strong className="hamd-workspace-home__metric-value">{item.value}</strong>
            </Link>
          ))}
        </section>

        <nav className="hamd-workspace-home__actions" aria-label="Primary actions" data-guide="dashboard-attention">
          <Link
            className="hamd-workspace-home__action hamd-workspace-home__action--primary"
            to="/app/requests/new"
            data-tour="create-request"
            data-guide="create-request"
          >
            <ActionIcon name="plus" />
            New request
          </Link>
          <Link className="hamd-workspace-home__action" to="/app/products">
            <ActionIcon name="catalog" />
            Browse products
          </Link>
          <Link className="hamd-workspace-home__action" to="/app/quotations">
            <ActionIcon name="quote" />
            View quotations
          </Link>
          <Link className="hamd-workspace-home__action" to="/app/chat">
            <ActionIcon name="chat" />
            Chat
          </Link>
        </nav>

        <ActivityFeed
          items={activity}
          loading={loadingActivity}
          limit={7}
          title="Recent activity"
          viewAllHref="/app/notifications"
          viewAllLabel="View all"
          onNavigate={(href) => navigate(href)}
        />
      </div>

      <aside className="hamd-workspace-home__aside" aria-label="More workspace links">
        <h2>Your records</h2>
        <p>Open invoices, payments, or announcements when you need them.</p>
        <nav className="hamd-workspace-home__aside-links">
          <Link to="/app/requests">My requests</Link>
          <Link to="/app/invoices">Invoices</Link>
          <Link to="/app/payments">Payments</Link>
          <Link to="/app/shipments">Shipments</Link>
          <Link to="/app/announcements">Announcements</Link>
          <Link to="/app/profile">Profile</Link>
        </nav>
      </aside>
    </div>
  );
}
