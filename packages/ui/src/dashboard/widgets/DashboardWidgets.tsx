import { DashboardWidget } from "../DashboardWidget.js";
import { VirtualizedList } from "../VirtualizedList.js";
import type {
  AttentionItem,
  DashboardStat,
  ProcurementRequestSummary,
  QuickAction,
} from "../types.js";
import { Meta, RowLink, StatusPill, listFooter } from "./widget-bits.js";
export function OverviewHeader({
  greeting,
  subtitle,
  primaryAction,
}: {
  greeting: string;
  subtitle?: string | undefined;
  primaryAction?: QuickAction | undefined;
}) {
  return (
    <header className="hamd-dash-overview">
      <div>
        <p className="hamd-dash-overview__eyebrow">Overview</p>
        <h2 className="hamd-dash-overview__greeting">{greeting}</h2>
        {subtitle ? <p className="hamd-dash-overview__sub">{subtitle}</p> : null}
      </div>
      {primaryAction ? (
        <a
          href={primaryAction.href}
          className="hamd-dash-primary"
          data-primary-action={primaryAction.id}
        >
          {primaryAction.label}
        </a>
      ) : null}
    </header>
  );
}

export function StatisticsStrip({
  stats,
  loading,
}: {
  stats: DashboardStat[];
  loading?: boolean | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-statistics"
      title="Statistics"
      description="Supporting signals - not the primary job."
      size="xl"
      layout={{ colSpan: 12 }}
      loading={loading}
      resizable={false}
    >
      <ul className="hamd-dash-stats" aria-label="Key statistics">
        {stats.map((stat) => (
          <li key={stat.id} data-tone={stat.tone ?? "neutral"}>
            {stat.href ? (
              <a href={stat.href} className="hamd-dash-stat">
                <span className="hamd-dash-stat__label">{stat.label}</span>
                <span className="hamd-dash-stat__value">{stat.value}</span>
                {stat.delta ? (
                  <span className="hamd-dash-stat__delta">{stat.delta}</span>
                ) : null}
              </a>
            ) : (
              <div className="hamd-dash-stat">
                <span className="hamd-dash-stat__label">{stat.label}</span>
                <span className="hamd-dash-stat__value">{stat.value}</span>
                {stat.delta ? (
                  <span className="hamd-dash-stat__delta">{stat.delta}</span>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </DashboardWidget>
  );
}

export function QuickActionsWidget({
  actions,
  loading,
}: {
  actions: QuickAction[];
  loading?: boolean | undefined;
}) {
  const secondary = actions.filter((a) => !a.primary);
  return (
    <DashboardWidget
      id="widget-quick-actions"
      title="Quick actions"
      description="Secondary paths - one filled primary lives in Overview."
      size="md"
      layout={{ colSpan: 4 }}
      loading={loading}
    >
      <ul className="hamd-dash-actions">
        {secondary.map((action) => (
          <li key={action.id}>
            <a href={action.href} className="hamd-dash-action">
              <span className="hamd-dash-action__label">{action.label}</span>
              {action.description ? (
                <span className="hamd-dash-action__desc">{action.description}</span>
              ) : null}
              {action.badge ? (
                <span className="hamd-dash-action__badge">{action.badge}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </DashboardWidget>
  );
}

export function AttentionQueueWidget({
  items,
  loading,
  onOpen,
}: {
  items: AttentionItem[];
  loading?: boolean | undefined;
  onOpen?: ((item: AttentionItem) => void) | undefined;
}) {
  const top = items[0];
  return (
    <DashboardWidget
      id="widget-attention"
      title="Needs your attention"
      description="Resolve the top item - one primary focus."
      size="lg"
      layout={{ colSpan: 8 }}
      attention
      loading={loading}
      actions={
        items.length > 1 ? (
          <span className="hamd-dash-count">{items.length} open</span>
        ) : null
      }
    >
      {top ? (
        <div className="hamd-dash-attention">
          <a
            href={top.href}
            className="hamd-dash-attention__primary"
            onClick={() => onOpen?.(top)}
          >
            <span className="hamd-dash-attention__kind">{top.kind}</span>
            <span className="hamd-dash-attention__title">{top.title}</span>
            <span className="hamd-dash-attention__detail">{top.detail}</span>
            <span className="hamd-dash-attention__cta">Resolve</span>
          </a>
          {items.length > 1 ? (
            <ul className="hamd-dash-attention__rest" aria-label="More attention items">
              {items.slice(1, 5).map((item) => (
                <li key={item.id}>
                  <a href={item.href} onClick={() => onOpen?.(item)}>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="hamd-dash-empty" role="status">
          You're clear - no urgent items.
        </p>
      )}
    </DashboardWidget>
  );
}

export function RecentRequestsWidget({
  items,
  viewAllHref = "/requests",
  loading,
  listHeight = 280,
}: {
  items: ProcurementRequestSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-recent-requests"
      title="Recent requests"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all requests")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Recent procurement requests"
        getKey={(item) => item.id}
        empty="No requests yet. Create your first procurement request."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={`${item.publicCode} Â· ${item.title}`}
            meta={
              <>
                <StatusPill status={item.status} />
                <Meta>{item.priority}</Meta>
              </>
            }
            trailing={
              item.budgetAmount
                ? `${item.currencyCode ?? ""} ${item.budgetAmount}`.trim()
                : undefined
            }
          />
        )}
      />
    </DashboardWidget>
  );
}

