import type { ProcurementCommand } from "./types.js";
import { availableCommands } from "./types.js";

export const REQUEST_LIFECYCLE_STAGES = [
  { id: "submitted", label: "Submitted" },
  { id: "review", label: "Review" },
  { id: "sourcing", label: "Sourcing" },
  { id: "quotation", label: "Quotation" },
  { id: "decision", label: "Customer Decision" },
  { id: "fulfilment", label: "Fulfilment" },
  { id: "shipment", label: "Shipment" },
  { id: "completion", label: "Completion" },
] as const;

/** Customer-facing journey shown on progress tracks. */
export const BUYER_JOURNEY_STAGES = [
  { id: "submitted", label: "Submitted" },
  { id: "review", label: "Review" },
  { id: "sourcing", label: "Sourcing" },
  { id: "quotation", label: "Quote" },
  { id: "purchase", label: "Purchase" },
  { id: "delivery", label: "Delivery" },
  { id: "completed", label: "Completed" },
] as const;

export type BuyerJourneyStageId = (typeof BUYER_JOURNEY_STAGES)[number]["id"];

export type RequestLifecycleStageId =
  (typeof REQUEST_LIFECYCLE_STAGES)[number]["id"];

export type RequestRelatedSummary = {
  quotations?: ReadonlyArray<{ status: string }>;
  purchaseOrders?: ReadonlyArray<{ status: string }>;
  shipments?: ReadonlyArray<{ status: string }>;
  invoices?: ReadonlyArray<{ status: string }>;
  payments?: ReadonlyArray<{ status: string }>;
};

export function mapRequestLifecycleStage(
  status: string,
  related?: RequestRelatedSummary | null,
): RequestLifecycleStageId {
  const quotationStatuses = related?.quotations?.map((row) => row.status) ?? [];
  const hasIssuedQuote = quotationStatuses.includes("issued");
  const hasAcceptedQuote = quotationStatuses.includes("accepted");
  const shipmentStatuses = related?.shipments?.map((row) => row.status) ?? [];
  const shipmentActive = shipmentStatuses.some(
    (value) => value !== "cancelled" && value !== "completed",
  );
  const shipmentDone = shipmentStatuses.some((value) => value === "completed");

  switch (status) {
    case "draft":
      return "submitted";
    case "submitted":
      return "review";
    case "needs_clarification":
      return "review";
    case "accepted_for_sourcing":
    case "sourcing":
      return quotationStatuses.some(
        (value) => value === "draft" || value === "internally_reviewed",
      )
        ? "quotation"
        : "sourcing";
    case "quote_issued":
    case "revision_requested":
      return hasIssuedQuote || hasAcceptedQuote ? "decision" : "quotation";
    case "approved":
    case "purchase_in_progress":
      if (shipmentDone && (status === "purchase_in_progress" || status === "approved")) {
        return shipmentActive ? "shipment" : "fulfilment";
      }
      if (shipmentActive) return "shipment";
      return "fulfilment";
    case "fulfilled":
    case "closed":
      return "completion";
    case "declined":
    case "cancelled":
    case "expired":
      return hasIssuedQuote ? "decision" : "review";
    default:
      return "submitted";
  }
}

export function lifecycleStageIndex(
  status: string,
  related?: RequestRelatedSummary | null,
): number {
  const current = mapRequestLifecycleStage(status, related);
  return Math.max(
    0,
    REQUEST_LIFECYCLE_STAGES.findIndex((stage) => stage.id === current),
  );
}

export function mapBuyerJourneyStage(
  status: string,
  related?: RequestRelatedSummary | null,
): BuyerJourneyStageId {
  const internal = mapRequestLifecycleStage(status, related);
  if (internal === "quotation" || internal === "decision") return "quotation";
  if (internal === "fulfilment") return "purchase";
  if (internal === "shipment") return "delivery";
  if (internal === "completion") return "completed";
  if (
    internal === "submitted" ||
    internal === "review" ||
    internal === "sourcing"
  ) {
    return internal;
  }
  return "submitted";
}

export function buyerJourneyIndex(
  status: string,
  related?: RequestRelatedSummary | null,
): number {
  const current = mapBuyerJourneyStage(status, related);
  return Math.max(
    0,
    BUYER_JOURNEY_STAGES.findIndex((stage) => stage.id === current),
  );
}

export function contextualLifecycleState(status: string): {
  label: string;
  tone: "warning" | "danger" | "info";
} | null {
  if (status === "needs_clarification") {
    return { label: "Clarification required", tone: "warning" };
  }
  if (status === "cancelled") return { label: "Cancelled", tone: "danger" };
  if (status === "declined") return { label: "Rejected", tone: "danger" };
  if (status === "expired") return { label: "Expired", tone: "danger" };
  if (status === "quote_issued" || status === "revision_requested") {
    return { label: "Your decision is needed", tone: "info" };
  }
  return null;
}

export function relatedStateLabel(
  rows: ReadonlyArray<{ status: string }> | undefined,
  empty: string,
): string {
  const latest = rows?.[0];
  if (!latest) return empty;
  return latest.status.replaceAll("_", " ");
}

const CUSTOMER_REQUEST_COMMANDS = new Set<ProcurementCommand>([
  "submit",
  "cancel",
  "request_revision",
]);

const ADMIN_REQUEST_COMMANDS = new Set<ProcurementCommand>([
  "request_clarification",
  "accept_for_sourcing",
  "start_sourcing",
  "approve",
  "decline",
  "start_purchase",
  "fulfill",
  "close",
  "cancel",
]);

export function customerRequestCommands(
  status: string,
  permissions: readonly string[],
): ProcurementCommand[] {
  const allowed = new Set(permissions);
  return availableCommands(status).filter((command) => {
    if (!CUSTOMER_REQUEST_COMMANDS.has(command)) return false;
    if (command === "submit") return allowed.has("request:submit");
    if (command === "cancel") return allowed.has("request:cancel");
    if (command === "request_revision") return allowed.has("request:submit");
    return false;
  });
}

export function adminRequestCommands(
  status: string,
  permissions: readonly string[],
): ProcurementCommand[] {
  const allowed = new Set(permissions);
  return availableCommands(status).filter((command) => {
    if (!ADMIN_REQUEST_COMMANDS.has(command)) return false;
    if (command === "cancel") {
      return allowed.has("request:cancel") || allowed.has("request:manage");
    }
    return allowed.has("request:manage");
  });
}

export function customerQuotationCommands(
  quotationStatus: string | null | undefined,
  permissions: readonly string[],
): Array<"accept" | "decline"> {
  if (quotationStatus !== "issued") return [];
  if (!permissions.includes("quotation:read") && !permissions.includes("request:read")) {
    return [];
  }
  return ["accept", "decline"];
}

export function adminQuotationCommands(
  quotationStatus: string | null | undefined,
  permissions: readonly string[],
): Array<"review" | "issue"> {
  if (quotationStatus === "draft" && permissions.includes("quotation:review")) {
    return ["review"];
  }
  if (
    quotationStatus === "internally_reviewed" &&
    permissions.includes("quotation:issue")
  ) {
    return ["issue"];
  }
  return [];
}
