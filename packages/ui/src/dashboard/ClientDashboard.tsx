import { lazy, Suspense, useMemo, type ReactNode } from "react";
import {
  ClientWorkspaceShell,
  type ClientWorkspaceShellProps,
} from "./ClientWorkspaceShell.js";
import { DashboardWidgetSkeleton } from "./DashboardWidget.js";
import { useOptimisticItems } from "./useOptimisticItems.js";
import type {
  AttentionItem,
  BookmarkSummary,
  DashboardNavItem,
  DashboardStat,
  DocumentSummary,
  InvoiceSummary,
  MessageThreadSummary,
  NotificationSummary,
  OrderSummary,
  PaymentSummary,
  ProductViewSummary,
  ProcurementRequestSummary,
  QuickAction,
  QuotationSummary,
  RecommendationSummary,
  RfqSummary,
  ShipmentSummary,
} from "./types.js";
import {
  AttentionQueueWidget,
  OverviewHeader,
  QuickActionsWidget,
  RecentRequestsWidget,
  StatisticsStrip,
} from "./widgets/DashboardWidgets.js";

const ActiveRfqsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.ActiveRfqsWidget,
  })),
);
const QuotationsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.QuotationsWidget,
  })),
);
const OrdersWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.OrdersWidget,
  })),
);
const ShipmentsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.ShipmentsWidget,
  })),
);
const InvoicesWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.InvoicesWidget,
  })),
);
const PaymentsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.PaymentsWidget,
  })),
);
const NotificationsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.NotificationsWidget,
  })),
);
const MessagesWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.MessagesWidget,
  })),
);
const DocumentsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.DocumentsWidget,
  })),
);
const BookmarksWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.BookmarksWidget,
  })),
);
const RecentlyViewedProductsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.RecentlyViewedProductsWidget,
  })),
);
const RecommendationsWidget = lazy(() =>
  import("./widgets/DashboardWidgetsDeferred.js").then((m) => ({
    default: m.RecommendationsWidget,
  })),
);

function LazyPane({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DashboardWidgetSkeleton lines={3} />}>{children}</Suspense>
  );
}

export type ClientDashboardData = {
  greeting: string;
  subtitle?: string | undefined;
  stats: DashboardStat[];
  quickActions: QuickAction[];
  attention: AttentionItem[];
  recentRequests: ProcurementRequestSummary[];
  activeRfqs: RfqSummary[];
  quotations: QuotationSummary[];
  orders: OrderSummary[];
  shipments: ShipmentSummary[];
  invoices: InvoiceSummary[];
  payments: PaymentSummary[];
  notifications: NotificationSummary[];
  messages: MessageThreadSummary[];
  documents: DocumentSummary[];
  bookmarks: BookmarkSummary[];
  recentlyViewed: ProductViewSummary[];
  recommendations: RecommendationSummary[];
};

export type ClientDashboardProps = {
  data: ClientDashboardData;
  navItems?: DashboardNavItem[] | undefined;
  shell?: Omit<ClientWorkspaceShellProps, "children" | "navItems" | "pageTitle"> | undefined;
  loading?: boolean | undefined;
  /** Persist notification mark-read; UI updates optimistically. */
  onMarkNotificationRead?: ((id: string) => Promise<void>) | undefined;
  /** Persist payment confirmation; UI updates optimistically. */
  onConfirmPayment?: ((id: string) => Promise<void>) | undefined;
  onAttentionOpen?: ((item: AttentionItem) => void) | undefined;
  className?: string | undefined;
  /** When false, renders grid only (host supplies shell). */
  withShell?: boolean | undefined;
};

const defaultNav: DashboardNavItem[] = [
  { id: "overview", label: "Overview", href: "/dashboard", current: true },
  { id: "requests", label: "Requests", href: "/requests" },
  { id: "rfqs", label: "RFQs", href: "/rfqs" },
  { id: "quotations", label: "Quotations", href: "/quotations" },
  { id: "orders", label: "Orders", href: "/orders" },
  { id: "shipments", label: "Shipments", href: "/shipments" },
  { id: "invoices", label: "Invoices", href: "/invoices" },
  { id: "payments", label: "Payments", href: "/payments" },
  { id: "messages", label: "Messages", href: "/messages" },
  { id: "documents", label: "Documents", href: "/documents" },
];

/**
 * Enterprise client procurement dashboard.
 * Path: Attention → Statistics → Recent corridors → Supporting modules.
 * Principles extracted from Linear/Stripe/GitHub/Vercel/Notion - not copied.
 */
export function ClientDashboard({
  data,
  navItems = defaultNav,
  shell,
  loading,
  onMarkNotificationRead,
  onConfirmPayment,
  onAttentionOpen,
  className,
  withShell = true,
}: ClientDashboardProps) {
  const primaryAction = useMemo(
    () =>
      data.quickActions.find((a) => a.primary) ??
      data.quickActions[0] ?? {
        id: "create-request",
        label: "New procurement request",
        href: "/requests/new",
        primary: true,
      },
    [data.quickActions],
  );

  const notifications = useOptimisticItems(data.notifications, async (_next, action) => {
    if (action.type === "update" && action.id && onMarkNotificationRead) {
      await onMarkNotificationRead(action.id);
    }
  });

  const payments = useOptimisticItems(data.payments, async (_next, action) => {
    if (action.type === "update" && action.id && onConfirmPayment) {
      await onConfirmPayment(action.id);
    }
  });

  const unread = notifications.items.filter((n) => n.status === "unread").length;

  const body = (
    <div className={className ? `hamd-dash ${className}` : "hamd-dash"}>
      <OverviewHeader
        greeting={data.greeting}
        subtitle={data.subtitle}
        primaryAction={
          data.attention[0]
            ? {
                id: "resolve-attention",
                label: "Resolve top item",
                href: data.attention[0].href,
                primary: true,
              }
            : primaryAction
        }
      />

      <div className="hamd-dash-grid hamd-dash-grid--priority">
        <AttentionQueueWidget
          items={data.attention}
          loading={loading}
          onOpen={onAttentionOpen}
        />
        <QuickActionsWidget actions={data.quickActions} loading={loading} />
      </div>

      <StatisticsStrip stats={data.stats} loading={loading} />

      <div className="hamd-dash-grid">
        <RecentRequestsWidget items={data.recentRequests} loading={loading} />
        <LazyPane>
          <ActiveRfqsWidget items={data.activeRfqs} loading={loading} />
        </LazyPane>
        <LazyPane>
          <QuotationsWidget items={data.quotations} loading={loading} />
        </LazyPane>
        <LazyPane>
          <OrdersWidget items={data.orders} loading={loading} />
        </LazyPane>
        <LazyPane>
          <ShipmentsWidget items={data.shipments} loading={loading} />
        </LazyPane>
        <LazyPane>
          <InvoicesWidget items={data.invoices} loading={loading} />
        </LazyPane>
        <LazyPane>
          <PaymentsWidget
            items={payments.items}
            loading={loading}
            onMarkConfirmed={
              onConfirmPayment
                ? (id) => {
                    void payments.run({
                      type: "update",
                      id,
                      patch: { status: "confirmed" },
                    });
                  }
                : undefined
            }
          />
        </LazyPane>
        <LazyPane>
          <NotificationsWidget
            items={notifications.items}
            loading={loading}
            onMarkRead={
              onMarkNotificationRead
                ? (id) => {
                    void notifications.run({
                      type: "update",
                      id,
                      patch: { status: "read" },
                    });
                  }
                : undefined
            }
          />
        </LazyPane>
        <LazyPane>
          <MessagesWidget items={data.messages} loading={loading} />
        </LazyPane>
        <LazyPane>
          <DocumentsWidget items={data.documents} loading={loading} />
        </LazyPane>
        <LazyPane>
          <BookmarksWidget items={data.bookmarks} loading={loading} />
        </LazyPane>
        <LazyPane>
          <RecentlyViewedProductsWidget
            items={data.recentlyViewed}
            loading={loading}
          />
        </LazyPane>
        <LazyPane>
          <RecommendationsWidget items={data.recommendations} loading={loading} />
        </LazyPane>
      </div>

      {notifications.error || payments.error ? (
        <p className="hamd-dash-toast" role="alert">
          {notifications.error ?? payments.error}
        </p>
      ) : null}
    </div>
  );

  if (!withShell) {
    return body;
  }

  return (
    <ClientWorkspaceShell
      {...shell}
      navItems={navItems}
      pageTitle="Dashboard"
      notificationCount={shell?.notificationCount ?? unread}
    >
      {body}
    </ClientWorkspaceShell>
  );
}
