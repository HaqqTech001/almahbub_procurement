/**
 * Presentational data contracts aligned with HAMD API / Prisma field names.
 * Host apps map API responses into these shapes.
 */

export type DashboardPriority = "low" | "normal" | "high" | "urgent";

export type ProcurementRequestSummary = {
  id: string;
  publicCode: string;
  title: string;
  status: string;
  priority: DashboardPriority;
  budgetAmount?: string | null;
  currencyCode?: string;
  updatedAt: string;
  href: string;
};

export type RfqSummary = {
  id: string;
  publicCode: string;
  title: string;
  status: string;
  supplierCount: number;
  closesAt?: string | null;
  href: string;
};

export type QuotationSummary = {
  id: string;
  publicCode: string;
  requestCode: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  expiresAt?: string | null;
  href: string;
};

export type OrderSummary = {
  id: string;
  publicCode: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  updatedAt: string;
  href: string;
};

export type ShipmentSummary = {
  id: string;
  publicCode: string;
  status: string;
  carrierName?: string | null;
  trackingNumber?: string | null;
  estimatedArrivalAt?: string | null;
  href: string;
};

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: string;
  currencyCode: string;
  dueAt?: string | null;
  href: string;
};

export type PaymentSummary = {
  id: string;
  status: string;
  amount: string;
  currencyCode: string;
  reference?: string | null;
  updatedAt: string;
  href: string;
};

export type NotificationSummary = {
  id: string;
  type: string;
  priority: DashboardPriority | "medium";
  status: "unread" | "read" | "archived" | "expired";
  title: string;
  body: string;
  deepLink?: string | null;
  createdAt: string;
};

export type MessageThreadSummary = {
  id: string;
  subject: string;
  preview: string;
  unreadCount: number;
  updatedAt: string;
  href: string;
};

export type DocumentSummary = {
  id: string;
  name: string;
  kind: string;
  updatedAt: string;
  href: string;
};

export type BookmarkSummary = {
  id: string;
  label: string;
  kind: "product" | "request" | "document" | "page";
  href: string;
};

export type ProductViewSummary = {
  id: string;
  name: string;
  category?: string;
  imageSrc?: string;
  href: string;
  viewedAt: string;
};

export type RecommendationSummary = {
  id: string;
  title: string;
  reason: string;
  href: string;
};

export type DashboardStat = {
  id: string;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
  href?: string;
};

export type QuickAction = {
  id: string;
  label: string;
  description?: string;
  href: string;
  /** Visual weight - only one should be primary on the dashboard. */
  primary?: boolean;
  badge?: number;
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  urgency: DashboardPriority;
  href: string;
  kind:
    | "clarification"
    | "quote"
    | "payment"
    | "shipment"
    | "approval"
    | "message"
    | "other";
};

export type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  badge?: number;
  current?: boolean;
  /** Optional icon key rendered by the workspace shell. */
  icon?:
    | "dashboard"
    | "requests"
    | "quotations"
    | "invoices"
    | "payments"
    | "shipments"
    | "notifications"
    | "chat"
    | "settings"
    | "profile"
    | undefined;
};

export type DashboardNavSection = {
  id: string;
  label: string;
  items: readonly DashboardNavItem[];
};

export type WidgetSize = "sm" | "md" | "lg" | "xl";

export type WidgetLayoutHint = {
  /** Grid column span hint for hosts / future resize engine (1–12). */
  colSpan?: 3 | 4 | 6 | 8 | 12;
  /** Row span hint. */
  rowSpan?: 1 | 2 | 3;
  minWidthPx?: number;
  minHeightPx?: number;
};
