/** Quotation contracts aligned with Prisma QuotationStatus + apps/api. */

export const QUOTATION_STATUSES = [
  "draft",
  "internally_reviewed",
  "issued",
  "accepted",
  "declined",
  "expired",
  "superseded",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_COMMANDS = [
  "review",
  "issue",
  "accept",
  "decline",
] as const;
export type QuotationCommand = (typeof QUOTATION_COMMANDS)[number];

export type QuotationLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
  lineAmount: number;
  procurementRequestItemId?: string | null | undefined;
  productVariantId?: string | null | undefined;
};

export type QuotationAttachment = {
  id: string;
  name: string;
  href: string;
  kind?: string | undefined;
  uploadedAt: string;
};

export type QuotationVersionSummary = {
  id: string;
  versionNumber: number;
  publicCode: string;
  status: QuotationStatus | string;
  totalAmount: number;
  createdAt: string;
  current?: boolean | undefined;
};

export type QuotationHistoryEvent = {
  id: string;
  fromStatus?: string | null | undefined;
  toStatus: string;
  command: string;
  reason?: string | null | undefined;
  actorName?: string | null | undefined;
  createdAt: string;
};

export type QuotationNegotiationNote = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  kind?: "buyer" | "ops" | "supplier" | string | undefined;
};

export type QuotationRecord = {
  id: string;
  publicCode: string;
  status: QuotationStatus | string;
  versionNumber: number;
  familyId: string;
  procurementRequestId: string;
  procurementRequestCode?: string | undefined;
  supplierId?: string | null | undefined;
  supplierName?: string | null | undefined;
  currencyCode: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  dutyAmount: number;
  otherAmount: number;
  totalAmount: number;
  expiresAt?: string | null | undefined;
  deliveryLeadTimeDays?: number | null | undefined;
  minimumOrderQuantity?: number | null | undefined;
  paymentTerms?: string | null | undefined;
  commercialTerms?: string | null | undefined;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  items: QuotationLineItem[];
  attachments: QuotationAttachment[];
  versions: QuotationVersionSummary[];
  history: QuotationHistoryEvent[];
  negotiation: QuotationNegotiationNote[];
};

export type QuotationCreateInput = {
  procurementRequestId: string;
  supplierId?: string | undefined;
  currencyCode: string;
  expiresAt?: string | null | undefined;
  deliveryLeadTimeDays?: number | null | undefined;
  discountAmount: number;
  taxAmount: number;
  shippingAmount?: number | undefined;
  dutyAmount?: number | undefined;
  otherAmount?: number | undefined;
  paymentTerms?: string | undefined;
  commercialTerms?: string | undefined;
  items: Array<{
    description: string;
    quantity: number;
    unitAmount: number;
  }>;
};

export type QuotationDirectoryFilters = {
  query: string;
  status: "all" | string;
  page: number;
  pageSize: number;
};

export const emptyQuotationFilters = (): QuotationDirectoryFilters => ({
  query: "",
  status: "all",
  page: 1,
  pageSize: 8,
});

export function quotationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    internally_reviewed: "Internally reviewed",
    issued: "Issued",
    accepted: "Accepted",
    declined: "Rejected",
    expired: "Expired",
    superseded: "Superseded",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function quotationCommandLabel(command: string): string {
  return command.replaceAll("_", " ");
}

export function availableQuotationCommands(status: string): QuotationCommand[] {
  switch (status) {
    case "draft":
      return ["review"];
    case "internally_reviewed":
      return ["issue"];
    case "issued":
      return ["accept", "decline"];
    default:
      return [];
  }
}

export function canReviseQuotation(status: string): boolean {
  return status === "issued" || status === "declined" || status === "expired";
}

export function computeQuotationTotal(input: {
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount?: number | undefined;
  dutyAmount?: number | undefined;
  otherAmount?: number | undefined;
}): number {
  return (
    input.subtotalAmount -
    input.discountAmount +
    input.taxAmount +
    (input.shippingAmount ?? 0) +
    (input.dutyAmount ?? 0) +
    (input.otherAmount ?? 0)
  );
}

export function lineAmount(quantity: number, unitAmount: number): number {
  return Math.round(quantity * unitAmount * 100) / 100;
}

export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}

export function filterQuotations(
  rows: QuotationRecord[],
  filters: QuotationDirectoryFilters,
): QuotationRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!q) return true;
    const hay = [
      row.publicCode,
      row.supplierName ?? "",
      row.procurementRequestCode ?? "",
      row.currencyCode,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateQuotationRows<T>(
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

export function isQuotationExpired(
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < now;
}
