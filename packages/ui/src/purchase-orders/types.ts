/** Purchase order contracts - Prisma PurchaseOrderStatus + workflow extensions. */

export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "issued",
  "partially_fulfilled",
  "fulfilled",
  "cancelled",
  "closed",
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_ORDER_COMMANDS = [
  "approve",
  "issue",
  "supplier_accept",
  "supplier_reject",
  "revise",
  "mark_partially_fulfilled",
  "mark_fulfilled",
  "cancel",
  "close",
] as const;
export type PurchaseOrderCommand = (typeof PURCHASE_ORDER_COMMANDS)[number];

export type SupplierAcceptanceState =
  | "pending"
  | "accepted"
  | "rejected"
  | "not_required";

export type PurchaseOrderLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  lineAmount?: number | undefined;
};

export type PurchaseOrderDocument = {
  id: string;
  name: string;
  href: string;
  kind?: string | undefined;
  uploadedAt: string;
};

export type PurchaseOrderHistoryEvent = {
  id: string;
  fromStatus?: string | null | undefined;
  toStatus: string;
  command: string;
  reason?: string | null | undefined;
  actorName?: string | null | undefined;
  createdAt: string;
};

export type PurchaseOrderRevision = {
  id: string;
  versionNumber: number;
  publicCode: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  current?: boolean | undefined;
  note?: string | undefined;
};

export type DeliveryTrackingMilestone = {
  id: string;
  label: string;
  status: string;
  occurredAt?: string | null | undefined;
  estimatedAt?: string | null | undefined;
};

export type DeliveryTrackingSummary = {
  shipmentId: string;
  publicCode: string;
  status: string;
  carrierName?: string | null | undefined;
  trackingNumber?: string | null | undefined;
  estimatedArrivalAt?: string | null | undefined;
  actualDeliveryAt?: string | null | undefined;
  href?: string | undefined;
  milestones: DeliveryTrackingMilestone[];
};

export type PurchaseOrderRecord = {
  id: string;
  publicCode: string;
  status: PurchaseOrderStatus | string;
  currencyCode: string;
  totalAmount: number;
  rowVersion: number;
  procurementRequestId: string;
  procurementRequestCode?: string | undefined;
  quotationId?: string | null | undefined;
  quotationCode?: string | null | undefined;
  supplierId?: string | null | undefined;
  supplierName?: string | null | undefined;
  supplierAcceptance: SupplierAcceptanceState | string;
  versionNumber: number;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderLineItem[];
  documents: PurchaseOrderDocument[];
  attachments: PurchaseOrderDocument[];
  history: PurchaseOrderHistoryEvent[];
  revisions: PurchaseOrderRevision[];
  deliveries: DeliveryTrackingSummary[];
};

export type PurchaseOrderCreateInput = {
  procurementRequestId: string;
  quotationId?: string | undefined;
  supplierId?: string | undefined;
  currencyCode: string;
  items: Array<{ description: string; quantity: number; unitAmount: number }>;
};

export type PurchaseOrderDirectoryFilters = {
  query: string;
  status: "all" | string;
  page: number;
  pageSize: number;
};

export const emptyPurchaseOrderFilters = (): PurchaseOrderDirectoryFilters => ({
  query: "",
  status: "all",
  page: 1,
  pageSize: 8,
});

export function purchaseOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    issued: "Issued",
    partially_fulfilled: "Partially fulfilled",
    fulfilled: "Fulfilled",
    cancelled: "Cancelled",
    closed: "Closed",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function purchaseOrderCommandLabel(command: string): string {
  const labels: Record<string, string> = {
    approve: "Approve",
    issue: "Issue to supplier",
    supplier_accept: "Record supplier acceptance",
    supplier_reject: "Record supplier rejection",
    revise: "Create revision",
    mark_partially_fulfilled: "Mark partially fulfilled",
    mark_fulfilled: "Mark fulfilled",
    cancel: "Cancel",
    close: "Close",
  };
  return labels[command] ?? command.replaceAll("_", " ");
}

export function supplierAcceptanceLabel(state: string): string {
  const labels: Record<string, string> = {
    pending: "Awaiting supplier",
    accepted: "Supplier accepted",
    rejected: "Supplier rejected",
    not_required: "N/A",
  };
  return labels[state] ?? state.replaceAll("_", " ");
}

export function availablePurchaseOrderCommands(
  status: string,
  acceptance: string,
): PurchaseOrderCommand[] {
  switch (status) {
    case "draft":
      return ["approve", "issue", "cancel"];
    case "issued":
      return [
        ...(acceptance === "pending"
          ? (["supplier_accept", "supplier_reject"] as const)
          : []),
        "revise",
        "mark_partially_fulfilled",
        "mark_fulfilled",
        "cancel",
      ];
    case "partially_fulfilled":
      return ["mark_fulfilled", "close"];
    case "fulfilled":
      return ["close"];
    default:
      return [];
  }
}

export function filterPurchaseOrders(
  rows: PurchaseOrderRecord[],
  filters: PurchaseOrderDirectoryFilters,
): PurchaseOrderRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!q) return true;
    const hay = [
      row.publicCode,
      row.supplierName ?? "",
      row.procurementRequestCode ?? "",
      row.quotationCode ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginatePurchaseOrderRows<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageCount: number } {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}
