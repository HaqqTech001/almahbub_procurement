/** Shipment / logistics contracts - Prisma ShipmentStatus + lifecycle commands. */

export const SHIPMENT_STATUSES = [
  "planned",
  "supplier_ready",
  "inspection_pending",
  "pickup_scheduled",
  "picked_up",
  "export_cleared",
  "departed",
  "transshipment",
  "arrived",
  "import_cleared",
  "warehouse_received",
  "quality_checked",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "completed",
  "cancelled",
  "held",
  "returned",
  "lost",
] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export const SHIPMENT_COMMANDS = [
  "supplier_ready",
  "schedule_pickup",
  "pick_up",
  "clear_export",
  "depart",
  "arrive",
  "clear_import",
  "receive_warehouse",
  "dispatch",
  "out_for_delivery",
  "deliver",
  "complete",
  "hold",
  "resume",
  "cancel",
] as const;
export type ShipmentCommand = (typeof SHIPMENT_COMMANDS)[number];

export const MILESTONE_CONFIDENCES = [
  "confirmed",
  "probable",
  "estimated",
  "unverified",
] as const;
export type MilestoneConfidence = (typeof MILESTONE_CONFIDENCES)[number];

export type ShipmentDocument = {
  id: string;
  /** Platform document UUID used by confirm-delivery evidence. */
  documentId?: string | undefined;
  name: string;
  href: string;
  role?: string | undefined;
  uploadedAt: string;
};

export type ShipmentMilestone = {
  id: string;
  type: string;
  label: string;
  confidence: MilestoneConfidence | string;
  occurredAt?: string | null | undefined;
  estimatedAt?: string | null | undefined;
  location?: string | null | undefined;
};

export type ShipmentTimelineEvent = {
  id: string;
  label: string;
  detail?: string | null | undefined;
  at: string;
  kind?: "status" | "milestone" | "document" | "evidence" | string | undefined;
};

export type ShipmentHistoryEvent = {
  id: string;
  fromStatus?: string | null | undefined;
  toStatus: string;
  command: string;
  reason?: string | null | undefined;
  actorName?: string | null | undefined;
  createdAt: string;
};

export type ProofOfDelivery = {
  confirmed: boolean;
  recipientName?: string | null | undefined;
  confirmedAt?: string | null | undefined;
  confirmedByName?: string | null | undefined;
  notes?: string | null | undefined;
  evidenceHref?: string | null | undefined;
  evidenceLabel?: string | null | undefined;
};

export type ShipmentMapPlaceholder = {
  label: string;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
  region?: string | null | undefined;
};

export type ShipmentRecord = {
  id: string;
  publicCode: string;
  status: ShipmentStatus | string;
  rowVersion: number;
  purchaseOrderId: string;
  purchaseOrderCode?: string | undefined;
  carrierName?: string | null | undefined;
  trackingNumber?: string | null | undefined;
  transportMode?: string | null | undefined;
  estimatedArrivalAt?: string | null | undefined;
  actualDeliveryAt?: string | null | undefined;
  originLabel?: string | null | undefined;
  destinationLabel?: string | null | undefined;
  createdAt: string;
  updatedAt: string;
  milestones: ShipmentMilestone[];
  timeline: ShipmentTimelineEvent[];
  documents: ShipmentDocument[];
  history: ShipmentHistoryEvent[];
  proofOfDelivery: ProofOfDelivery;
  map: ShipmentMapPlaceholder;
};

export type ShipmentCreateInput = {
  purchaseOrderId: string;
  carrierName?: string | undefined;
  trackingNumber?: string | undefined;
  transportMode?: string | undefined;
  estimatedArrivalAt?: string | undefined;
  originLabel?: string | undefined;
  destinationLabel?: string | undefined;
};

export type ShipmentConfirmDeliveryInput = {
  recipientName: string;
  notes?: string | undefined;
  /** Required by API - document UUIDs already linked to the shipment. */
  evidenceDocumentIds: string[];
};

/**
 * Host-injected map slot. Do not invent map tiles - adapters must use a real
 * provider when wired. Returning null keeps the default placeholder.
 */
export type ShipmentMapRenderContext = {
  shipment: ShipmentRecord;
  map: ShipmentMapPlaceholder;
};

export type ShipmentMapAdapter = {
  render: (context: ShipmentMapRenderContext) => unknown;
};

export type ShipmentDirectoryFilters = {
  query: string;
  status: "all" | string;
  page: number;
  pageSize: number;
};

export const emptyShipmentFilters = (): ShipmentDirectoryFilters => ({
  query: "",
  status: "all",
  page: 1,
  pageSize: 8,
});

export function shipmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: "Planned",
    supplier_ready: "Supplier ready",
    inspection_pending: "Inspection pending",
    pickup_scheduled: "Pickup scheduled",
    picked_up: "Picked up",
    export_cleared: "Export cleared",
    departed: "Departed",
    transshipment: "Transshipment",
    arrived: "Arrived",
    import_cleared: "Import cleared",
    warehouse_received: "Warehouse received",
    quality_checked: "Quality checked",
    dispatched: "Dispatched",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    completed: "Completed",
    cancelled: "Cancelled",
    held: "Held",
    returned: "Returned",
    lost: "Lost",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function shipmentCommandLabel(command: string): string {
  const labels: Record<string, string> = {
    supplier_ready: "Mark supplier ready",
    schedule_pickup: "Schedule pickup",
    pick_up: "Confirm pickup",
    clear_export: "Clear export",
    depart: "Mark departed",
    arrive: "Mark arrived",
    clear_import: "Clear import",
    receive_warehouse: "Receive at warehouse",
    dispatch: "Dispatch",
    out_for_delivery: "Out for delivery",
    deliver: "Mark delivered",
    complete: "Complete",
    hold: "Hold",
    resume: "Resume",
    cancel: "Cancel",
  };
  return labels[command] ?? command.replaceAll("_", " ");
}

export function milestoneConfidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    confirmed: "Confirmed",
    probable: "Probable",
    estimated: "Estimated",
    unverified: "Unverified",
  };
  return labels[confidence] ?? confidence.replaceAll("_", " ");
}

/** Mirrors apps/api shipment-state transition map for UI affordances. */
export function availableShipmentCommands(status: string): ShipmentCommand[] {
  switch (status) {
    case "planned":
      return ["supplier_ready", "hold", "cancel"];
    case "supplier_ready":
    case "inspection_pending":
      return ["schedule_pickup", "hold", "cancel"];
    case "pickup_scheduled":
      return ["pick_up", "hold", "cancel"];
    case "picked_up":
      return ["clear_export", "depart", "hold"];
    case "export_cleared":
      return ["depart", "hold"];
    case "departed":
    case "transshipment":
      return ["arrive", "hold"];
    case "arrived":
      return ["clear_import", "hold"];
    case "import_cleared":
      return ["receive_warehouse", "dispatch", "hold"];
    case "warehouse_received":
    case "quality_checked":
      return ["dispatch", "hold"];
    case "dispatched":
      return ["out_for_delivery", "hold"];
    case "out_for_delivery":
      return ["deliver", "hold"];
    case "delivered":
      return ["complete", "hold"];
    case "held":
      return ["resume", "cancel"];
    default:
      return [];
  }
}

export function filterShipments(
  rows: ShipmentRecord[],
  filters: ShipmentDirectoryFilters,
): ShipmentRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!q) return true;
    const hay = [
      row.publicCode,
      row.purchaseOrderCode ?? "",
      row.carrierName ?? "",
      row.trackingNumber ?? "",
      row.originLabel ?? "",
      row.destinationLabel ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateShipmentRows<T>(
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
