import { useId, type MouseEvent, type ReactNode } from "react";
import { cx } from "../utils/cx.js";

export type ActivityKind =
  | "request"
  | "status"
  | "clarification"
  | "quotation"
  | "payment"
  | "invoice"
  | "shipment"
  | "support"
  | "announcement";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail?: string;
  href: string;
  at: string;
  statusLabel?: string;
};

export type ActivityFeedProps = {
  items: readonly ActivityItem[];
  title?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  limit?: number;
  loading?: boolean;
  onNavigate?: (href: string) => void;
  className?: string;
};

export function formatActivityWhen(iso: string, now = Date.now()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = now - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hr ago" : `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function KindIcon({ kind }: { kind: ActivityKind }) {
  const common = {
    viewBox: "0 0 20 20",
    width: 18,
    height: 18,
    "aria-hidden": true as const,
  };
  if (kind === "clarification" || kind === "support") {
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
  if (kind === "quotation" || kind === "invoice") {
    return (
      <svg {...common}>
        <path
          d="M6 3.5h6.2L16 7.2V16.5H6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M12 3.5V7.5h4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 11h4M8 13.5h2.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "payment") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="14" height="10" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 8.2h14" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "shipment") {
    return (
      <svg {...common}>
        <path d="M3 13.5h10.5V7H8.2L6.4 4.5H3z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6.2" cy="15.2" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12.2" cy="15.2" r="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === "announcement") {
    return (
      <svg {...common}>
        <path
          d="M10 3.6a4.6 4.6 0 0 1 1.5 8.9v2.1H8.5v-2.1A4.6 4.6 0 0 1 10 3.6z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }
  if (kind === "status") {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6.5v4l2.4 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
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

function EmptyGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="36" height="36" aria-hidden="true">
      <rect x="9" y="10" width="30" height="28" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 19h16M16 25h11" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path
        d="M7.5 4.5L13 10l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ActivityFeed({
  items,
  title = "Recent activity",
  viewAllHref,
  viewAllLabel = "View all",
  emptyTitle = "No recent activity yet",
  emptyDescription = "Your procurement updates will appear here as you create and manage requests.",
  limit = 7,
  loading = false,
  onNavigate,
  className,
}: ActivityFeedProps) {
  const headingId = useId();
  const visible = items.slice(0, limit);

  const open = (href: string, event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(href);
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="hamd-activity__list" aria-busy="true" aria-label="Loading activity">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="hamd-activity__row hamd-activity__row--skel">
            <span className="hamd-sr-only">Loading activity</span>
          </div>
        ))}
      </div>
    );
  } else if (visible.length === 0) {
    body = (
      <div className="hamd-activity__empty" role="status">
        <span className="hamd-activity__empty-icon">
          <EmptyGlyph />
        </span>
        <p className="hamd-activity__empty-title">{emptyTitle}</p>
        <p>{emptyDescription}</p>
      </div>
    );
  } else {
    body = (
      <div className="hamd-activity__list" role="list">
        {visible.map((item) => (
          <div key={item.id} role="listitem">
            <a
              className="hamd-activity__row"
              href={item.href}
              onClick={(event) => open(item.href, event)}
            >
            <span className="hamd-activity__icon" data-kind={item.kind}>
              <KindIcon kind={item.kind} />
            </span>
            <span className="hamd-activity__body">
              <span className="hamd-activity__title">{item.title}</span>
              {item.detail ? <span className="hamd-activity__detail">{item.detail}</span> : null}
            </span>
            <time className="hamd-activity__when" dateTime={item.at}>
              {formatActivityWhen(item.at)}
            </time>
            {item.statusLabel ? (
              <span className="hamd-activity__status">{item.statusLabel}</span>
            ) : null}
            <span className="hamd-activity__chevron">
              <Chevron />
            </span>
            </a>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className={cx("hamd-activity", className)} aria-labelledby={headingId}>
      <div className="hamd-activity__head">
        <h2 id={headingId}>{title}</h2>
        {viewAllHref ? (
          <a
            className="hamd-activity__all"
            href={viewAllHref}
            onClick={(event) => open(viewAllHref, event)}
          >
            {viewAllLabel}
          </a>
        ) : null}
      </div>
      {body}
    </section>
  );
}
