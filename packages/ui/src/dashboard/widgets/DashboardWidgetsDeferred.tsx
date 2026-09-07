import { DashboardWidget } from "../DashboardWidget.js";
import { VirtualizedList } from "../VirtualizedList.js";
import { OptimizedImage } from "../../primitives/OptimizedImage.js";
import type {
  BookmarkSummary,
  DocumentSummary,
  InvoiceSummary,
  MessageThreadSummary,
  NotificationSummary,
  OrderSummary,
  PaymentSummary,
  ProductViewSummary,
  QuotationSummary,
  RecommendationSummary,
  RfqSummary,
  ShipmentSummary,
} from "../types.js";
import { Meta, RowLink, StatusPill, listFooter } from "./widget-bits.js";
export function ActiveRfqsWidget({
  items,
  viewAllHref = "/rfqs",
  loading,
  listHeight = 240,
}: {
  items: RfqSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-active-rfqs"
      title="Active RFQs"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all RFQs")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Active RFQs"
        getKey={(i) => i.id}
        empty="No active RFQs."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={`${item.publicCode} Â· ${item.title}`}
            meta={
              <>
                <StatusPill status={item.status} />
                <Meta>{item.supplierCount} suppliers</Meta>
              </>
            }
          />
        )}
      />
    </DashboardWidget>
  );
}

export function QuotationsWidget({
  items,
  viewAllHref = "/quotations",
  loading,
  listHeight = 240,
}: {
  items: QuotationSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-quotations"
      title="Quotations"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all quotations")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Quotations"
        getKey={(i) => i.id}
        empty="No quotations yet."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={`${item.publicCode} Â· ${item.requestCode}`}
            meta={<StatusPill status={item.status} />}
            trailing={`${item.currencyCode} ${item.totalAmount}`}
          />
        )}
      />
    </DashboardWidget>
  );
}

export function OrdersWidget({
  items,
  viewAllHref = "/orders",
  loading,
  listHeight = 240,
}: {
  items: OrderSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-orders"
      title="Orders"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all orders")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Purchase orders"
        getKey={(i) => i.id}
        empty="No purchase orders yet."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={item.publicCode}
            meta={<StatusPill status={item.status} />}
            trailing={`${item.currencyCode} ${item.totalAmount}`}
          />
        )}
      />
    </DashboardWidget>
  );
}

export function ShipmentsWidget({
  items,
  viewAllHref = "/shipments",
  loading,
  listHeight = 240,
}: {
  items: ShipmentSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-shipments"
      title="Shipments"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all shipments")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Shipments"
        getKey={(i) => i.id}
        empty="No shipments in progress."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={item.publicCode}
            meta={
              <>
                <StatusPill status={item.status} />
                {item.carrierName ? <Meta>{item.carrierName}</Meta> : null}
              </>
            }
            trailing={item.trackingNumber ?? undefined}
          />
        )}
      />
    </DashboardWidget>
  );
}

export function InvoicesWidget({
  items,
  viewAllHref = "/invoices",
  loading,
  listHeight = 240,
}: {
  items: InvoiceSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-invoices"
      title="Invoices"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all invoices")}
    >
      <VirtualizedList
        items={items}
        itemHeight={56}
        height={listHeight}
        aria-label="Invoices"
        getKey={(i) => i.id}
        empty="No invoices."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={item.invoiceNumber}
            meta={<StatusPill status={item.status} />}
            trailing={`${item.currencyCode} ${item.totalAmount}`}
          />
        )}
      />
    </DashboardWidget>
  );
}

export function PaymentsWidget({
  items,
  viewAllHref = "/payments",
  loading,
  listHeight = 240,
  onMarkConfirmed,
}: {
  items: PaymentSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
  onMarkConfirmed?: ((id: string) => void) | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-payments"
      title="Payments"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all payments")}
    >
      <VirtualizedList
        items={items}
        itemHeight={64}
        height={listHeight}
        aria-label="Payments"
        getKey={(i) => i.id}
        empty="No payments recorded."
        renderItem={(item) => (
          <div className="hamd-dash-row hamd-dash-row--static">
            <a className="hamd-dash-row__main" href={item.href}>
              <span className="hamd-dash-row__title">
                {item.currencyCode} {item.amount}
              </span>
              <span className="hamd-dash-row__meta">
                <StatusPill status={item.status} />
                {item.reference ? <Meta>{item.reference}</Meta> : null}
              </span>
            </a>
            {onMarkConfirmed && item.status === "pending_confirmation" ? (
              <button
                type="button"
                className="hamd-dash-ghost"
                onClick={() => onMarkConfirmed(item.id)}
              >
                Mark confirmed
              </button>
            ) : null}
          </div>
        )}
      />
    </DashboardWidget>
  );
}

export function NotificationsWidget({
  items,
  viewAllHref = "/notifications",
  loading,
  listHeight = 280,
  onMarkRead,
}: {
  items: NotificationSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
  onMarkRead?: ((id: string) => void) | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-notifications"
      title="Notifications"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "View all notifications")}
    >
      <VirtualizedList
        items={items}
        itemHeight={72}
        height={listHeight}
        aria-label="Notifications"
        getKey={(i) => i.id}
        empty="No notifications."
        renderItem={(item) => (
          <div
            className="hamd-dash-row hamd-dash-row--static"
            data-unread={item.status === "unread" ? "true" : "false"}
          >
            <a
              className="hamd-dash-row__main"
              href={item.deepLink ?? viewAllHref}
            >
              <span className="hamd-dash-row__title">{item.title}</span>
              <span className="hamd-dash-row__meta">{item.body}</span>
            </a>
            {onMarkRead && item.status === "unread" ? (
              <button
                type="button"
                className="hamd-dash-ghost"
                onClick={() => onMarkRead(item.id)}
              >
                Mark read
              </button>
            ) : null}
          </div>
        )}
      />
    </DashboardWidget>
  );
}

export function MessagesWidget({
  items,
  viewAllHref = "/messages",
  loading,
  listHeight = 240,
}: {
  items: MessageThreadSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-messages"
      title="Messages"
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
      footer={listFooter(viewAllHref, "Open inbox")}
    >
      <VirtualizedList
        items={items}
        itemHeight={64}
        height={listHeight}
        aria-label="Message threads"
        getKey={(i) => i.id}
        empty="No messages."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={item.subject}
            meta={item.preview}
            trailing={
              item.unreadCount > 0 ? (
                <span className="hamd-client-shell__badge">{item.unreadCount}</span>
              ) : undefined
            }
          />
        )}
      />
    </DashboardWidget>
  );
}

export function DocumentsWidget({
  items,
  viewAllHref = "/documents",
  loading,
  listHeight = 220,
}: {
  items: DocumentSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
  listHeight?: number | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-documents"
      title="Documents"
      size="sm"
      layout={{ colSpan: 4 }}
      loading={loading}
      footer={listFooter(viewAllHref, "Document vault")}
    >
      <VirtualizedList
        items={items}
        itemHeight={48}
        height={listHeight}
        aria-label="Documents"
        getKey={(i) => i.id}
        empty="No documents."
        renderItem={(item) => (
          <RowLink
            href={item.href}
            title={item.name}
            meta={<Meta>{item.kind}</Meta>}
          />
        )}
      />
    </DashboardWidget>
  );
}

export function BookmarksWidget({
  items,
  viewAllHref = "/bookmarks",
  loading,
}: {
  items: BookmarkSummary[];
  viewAllHref?: string | undefined;
  loading?: boolean | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-bookmarks"
      title="Bookmarks"
      size="sm"
      layout={{ colSpan: 4 }}
      loading={loading}
      footer={listFooter(viewAllHref, "Manage bookmarks")}
    >
      {items.length === 0 ? (
        <p className="hamd-dash-empty" role="status">
          Save products or requests for later.
        </p>
      ) : (
        <ul className="hamd-dash-chips">
          {items.map((item) => (
            <li key={item.id}>
              <a href={item.href} className="hamd-dash-chip" data-kind={item.kind}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}

export function RecentlyViewedProductsWidget({
  items,
  loading,
}: {
  items: ProductViewSummary[];
  loading?: boolean | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-recently-viewed"
      title="Recently viewed products"
      size="sm"
      layout={{ colSpan: 4 }}
      loading={loading}
    >
      {items.length === 0 ? (
        <p className="hamd-dash-empty" role="status">
          Products you open will appear here.
        </p>
      ) : (
        <ul className="hamd-dash-products">
          {items.map((item) => (
            <li key={item.id}>
              <a href={item.href} className="hamd-dash-product">
                {item.imageSrc ? (
                  <OptimizedImage
                    src={item.imageSrc}
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                  />
                ) : (
                  <span className="hamd-dash-product__ph" aria-hidden="true" />
                )}
                <span>
                  <span className="hamd-dash-product__name">{item.name}</span>
                  {item.category ? (
                    <span className="hamd-dash-product__cat">{item.category}</span>
                  ) : null}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}

export function RecommendationsWidget({
  items,
  loading,
}: {
  items: RecommendationSummary[];
  loading?: boolean | undefined;
}) {
  return (
    <DashboardWidget
      id="widget-recommendations"
      title="Recommendations"
      description="Suggested next moves based on your workspace."
      size="md"
      layout={{ colSpan: 6 }}
      loading={loading}
    >
      {items.length === 0 ? (
        <p className="hamd-dash-empty" role="status">
          Recommendations will appear as your corridor activity grows.
        </p>
      ) : (
        <ul className="hamd-dash-recs">
          {items.map((item) => (
            <li key={item.id}>
              <a href={item.href} className="hamd-dash-rec">
                <span className="hamd-dash-rec__title">{item.title}</span>
                <span className="hamd-dash-rec__reason">{item.reason}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}
