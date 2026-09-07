import { z } from "zod";

const uuid = z.string().uuid();
const date = z.coerce.date();
const text = z.string().trim().min(1);
const rowVersion = z.coerce.number().int().nonnegative();
const shipmentStatuses = [
  "planned", "supplier_ready", "inspection_pending", "pickup_scheduled", "picked_up", "export_cleared",
  "departed", "transshipment", "arrived", "import_cleared", "warehouse_received", "quality_checked",
  "dispatched", "out_for_delivery", "delivered", "completed", "cancelled", "held", "returned", "lost",
] as const;
const milestoneTypes = [
  "po_confirmed", "supplier_ready", "inspection_booked", "inspection_passed", "inspection_failed",
  "pickup_scheduled", "picked_up", "export_cleared", "departed", "transshipment", "arrived",
  "import_cleared", "warehouse_arrival", "quality_checked", "dispatched", "out_for_delivery",
  "delivery_attempted", "delivered", "delivery_confirmed", "completed", "exception_opened",
] as const;

export const shipmentIdSchema = z.object({ shipmentId: uuid });
export const createShipmentSchema = z.object({
  purchaseOrderId: uuid,
  publicCode: z.string().trim().min(3).max(100).optional(),
  carrierName: z.string().trim().min(1).max(200).optional(),
  trackingNumber: z.string().trim().min(1).max(200).optional(),
  transportMode: z.string().trim().min(1).max(50).optional(),
  estimatedArrivalAt: date.optional(),
});
export const updateShipmentSchema = z.object({
  rowVersion,
  carrierName: z.string().trim().min(1).max(200).nullable().optional(),
  trackingNumber: z.string().trim().min(1).max(200).nullable().optional(),
  transportMode: z.string().trim().min(1).max(50).nullable().optional(),
  estimatedArrivalAt: date.nullable().optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "rowVersion"), "Provide at least one editable field.");
export const listShipmentsSchema = z.object({
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.enum(shipmentStatuses).optional(),
  purchaseOrderId: uuid.optional(),
  carrierName: z.string().trim().min(1).max(200).optional(),
});
export const shipmentCommandSchema = z.object({
  rowVersion,
  command: z.enum(["supplier_ready", "schedule_pickup", "pick_up", "clear_export", "depart", "arrive", "clear_import", "receive_warehouse", "dispatch", "out_for_delivery", "deliver", "complete", "hold", "resume", "cancel"]),
  reason: z.string().trim().min(3).max(2_000).optional(),
});
export const milestoneSchema = z.object({
  type: z.enum(milestoneTypes),
  confidence: z.enum(["confirmed", "probable", "estimated", "unverified"]).default("confirmed"),
  occurredAt: date.optional(),
  estimatedAt: date.optional(),
  location: z.string().trim().min(1).max(500).optional(),
  source: z.string().trim().min(1).max(100),
  evidenceDocumentIds: z.array(uuid).max(20).default([]),
});
export const containerSchema = z.object({
  containerNumber: text.max(100),
  containerType: z.string().trim().min(1).max(100).optional(),
  sealNumber: z.string().trim().min(1).max(100).optional(),
});
export const trackingSchema = z.object({
  rowVersion,
  carrierName: text.max(200),
  trackingNumber: text.max(200),
  transportMode: z.string().trim().min(1).max(50).optional(),
});
export const documentSchema = z.object({ documentId: uuid, role: text.max(100) });
export const inspectionSchema = z.object({
  status: z.enum(["pending", "passed", "conditional_pass", "failed", "not_required"]),
  inspector: z.string().trim().min(1).max(200).optional(),
  notes: z.string().trim().min(1).max(4_000).optional(),
  evidenceDocumentIds: z.array(uuid).max(20).default([]),
  inspectedAt: date.optional(),
});
export const deliveryConfirmationSchema = z.object({
  rowVersion,
  recipientName: text.max(200),
  evidenceDocumentIds: z.array(uuid).min(1).max(20),
  note: z.string().trim().min(1).max(2_000).optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;
export type ListShipmentsInput = z.infer<typeof listShipmentsSchema>;
export type ShipmentCommandInput = z.infer<typeof shipmentCommandSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;
export type ContainerInput = z.infer<typeof containerSchema>;
export type TrackingInput = z.infer<typeof trackingSchema>;
export type DocumentInput = z.infer<typeof documentSchema>;
export type InspectionInput = z.infer<typeof inspectionSchema>;
export type DeliveryConfirmationInput = z.infer<typeof deliveryConfirmationSchema>;
