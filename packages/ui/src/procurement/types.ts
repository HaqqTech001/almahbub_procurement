/** Procurement request contracts aligned with Prisma + apps/api state machine. */

export const PROCUREMENT_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "needs_clarification",
  "accepted_for_sourcing",
  "sourcing",
  "quote_issued",
  "revision_requested",
  "approved",
  "declined",
  "expired",
  "purchase_in_progress",
  "fulfilled",
  "cancelled",
  "closed",
] as const;

export type ProcurementRequestStatus =
  (typeof PROCUREMENT_REQUEST_STATUSES)[number];

/** Mission UX labels — display only; never replace API status codes. */
export const MISSION_STATUS_ALIASES: Record<
  string,
  ProcurementRequestStatus | ProcurementRequestStatus[]
> = {
  Draft: "draft",
  Submitted: "submitted",
  Review: ["submitted", "accepted_for_sourcing"],
  "Pending Supplier": "sourcing",
  Quoted: "quote_issued",
  Approved: "approved",
  Rejected: "declined",
  Cancelled: "cancelled",
  Closed: "closed",
};

export const PROCUREMENT_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
] as const;
export type ProcurementPriority = (typeof PROCUREMENT_PRIORITIES)[number];

export const PROCUREMENT_COMMANDS = [
  "submit",
  "request_clarification",
  "accept_for_sourcing",
  "start_sourcing",
  "request_revision",
  "approve",
  "decline",
  "start_purchase",
  "fulfill",
  "close",
  "cancel",
] as const;
export type ProcurementCommand = (typeof PROCUREMENT_COMMANDS)[number];

export type ProcurementLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  targetUnitAmount?: number | null | undefined;
  productVariantId?: string | null | undefined;
};

export type ProcurementStatusEvent = {
  id: string;
  fromStatus?: string | null | undefined;
  toStatus: string;
  command?: string | null | undefined;
  actorName?: string | null | undefined;
  reason?: string | null | undefined;
  createdAt: string;
};

export type ProcurementComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  internal?: boolean | undefined;
};

export type ProcurementAttachment = {
  id: string;
  name: string;
  kind: string;
  sizeLabel?: string | undefined;
  href: string;
  uploadedAt: string;
  uploadedBy?: string | undefined;
};

export type ProcurementInternalNote = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ProcurementApproval = {
  id: string;
  kind: "approve" | "decline" | "clarify" | string;
  status: "pending" | "approved" | "rejected" | "cancelled" | string;
  actorName?: string | null | undefined;
  decidedAt?: string | null | undefined;
  note?: string | null | undefined;
};

export type ProcurementActivityItem = {
  id: string;
  type:
    | "status"
    | "comment"
    | "attachment"
    | "note"
    | "approval"
    | "notification"
    | "assignment"
    | string;
  title: string;
  detail?: string | undefined;
  createdAt: string;
  actorName?: string | null | undefined;
};

export type ProcurementNotificationHint = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  unread?: boolean | undefined;
};

export type ProcurementRequestRecord = {
  id: string;
  publicCode: string;
  title: string;
  status: ProcurementRequestStatus | string;
  priority: ProcurementPriority | string;
  currencyCode: string;
  notes?: string | null | undefined;
  destinationCountryCode?: string | null | undefined;
  destinationAddress?: string | null | undefined;
  requiredByDate?: string | null | undefined;
  budgetAmount?: number | null | undefined;
  restrictedGoodsDeclared?: boolean | undefined;
  rowVersion: number;
  requesterName: string;
  assigneeName?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
  items: ProcurementLineItem[];
  timeline: ProcurementStatusEvent[];
  comments: ProcurementComment[];
  attachments: ProcurementAttachment[];
  internalNotes: ProcurementInternalNote[];
  history: ProcurementStatusEvent[];
  approvals: ProcurementApproval[];
  notifications: ProcurementNotificationHint[];
  activity: ProcurementActivityItem[];
};

export type ProcurementDraftPatch = {
  title?: string | undefined;
  notes?: string | null | undefined;
  destinationCountryCode?: string | null | undefined;
  destinationAddress?: string | null | undefined;
  requiredByDate?: string | null | undefined;
  budgetAmount?: number | null | undefined;
  priority?: ProcurementPriority | string | undefined;
  currencyCode?: string | undefined;
  restrictedGoodsDeclared?: boolean | undefined;
  items?: ProcurementLineItem[] | undefined;
  documentIds?: string[] | undefined;
  rowVersion: number;
};

export type ProcurementDirectoryFilters = {
  query: string;
  status: "all" | string;
  priority: "all" | string;
  page: number;
  pageSize: number;
};

export const emptyProcurementFilters = (): ProcurementDirectoryFilters => ({
  query: "",
  status: "all",
  priority: "all",
  page: 1,
  pageSize: 8,
});

export function procurementStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    needs_clarification: "Needs clarification",
    accepted_for_sourcing: "Accepted for sourcing",
    sourcing: "Pending supplier",
    quote_issued: "Quoted",
    revision_requested: "Revision requested",
    approved: "Approved",
    declined: "Rejected",
    expired: "Expired",
    purchase_in_progress: "Purchase in progress",
    fulfilled: "Fulfilled",
    cancelled: "Cancelled",
    closed: "Closed",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function missionPhaseForStatus(status: string): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
    case "accepted_for_sourcing":
      return "Review";
    case "needs_clarification":
      return "Submitted";
    case "sourcing":
      return "Pending Supplier";
    case "quote_issued":
    case "revision_requested":
      return "Quoted";
    case "approved":
      return "Approved";
    case "declined":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "closed":
    case "fulfilled":
      return "Closed";
    case "purchase_in_progress":
      return "Approved";
    case "expired":
      return "Quoted";
    default:
      return procurementStatusLabel(status);
  }
}

export function availableCommands(
  status: string,
): ProcurementCommand[] {
  const map: Record<string, ProcurementCommand[]> = {
    draft: ["submit", "cancel"],
    submitted: ["request_clarification", "accept_for_sourcing", "cancel"],
    needs_clarification: ["submit", "cancel"],
    accepted_for_sourcing: ["start_sourcing", "cancel"],
    sourcing: ["cancel"],
    quote_issued: ["request_revision", "approve", "decline"],
    revision_requested: [],
    approved: ["start_purchase"],
    declined: [],
    expired: [],
    purchase_in_progress: ["fulfill"],
    fulfilled: ["close"],
    cancelled: [],
    closed: [],
  };
  return map[status] ?? [];
}

export function filterProcurementRequests(
  rows: ProcurementRequestRecord[],
  filters: ProcurementDirectoryFilters,
): ProcurementRequestRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.priority !== "all" && row.priority !== filters.priority) {
      return false;
    }
    if (!q) return true;
    const hay = [
      row.publicCode,
      row.title,
      row.requesterName,
      row.assigneeName ?? "",
      row.destinationCountryCode ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateProcurementRows<T>(
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

export function commandLabel(command: string): string {
  return command.replaceAll("_", " ");
}
