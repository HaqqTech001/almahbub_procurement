import type { ShipmentStatus } from "@hamd/database";

import { AppError } from "../../../../lib/app-error.js";

export type ShipmentCommand =
  | "supplier_ready"
  | "schedule_pickup"
  | "pick_up"
  | "clear_export"
  | "depart"
  | "arrive"
  | "clear_import"
  | "receive_warehouse"
  | "dispatch"
  | "out_for_delivery"
  | "deliver"
  | "complete"
  | "hold"
  | "resume"
  | "cancel";

const transitions: Readonly<Record<ShipmentStatus, Partial<Record<ShipmentCommand, ShipmentStatus>>>> = {
  planned: { supplier_ready: "supplier_ready", hold: "held", cancel: "cancelled" },
  supplier_ready: { schedule_pickup: "pickup_scheduled", hold: "held", cancel: "cancelled" },
  inspection_pending: { schedule_pickup: "pickup_scheduled", hold: "held", cancel: "cancelled" },
  pickup_scheduled: { pick_up: "picked_up", hold: "held", cancel: "cancelled" },
  picked_up: { clear_export: "export_cleared", depart: "departed", hold: "held" },
  export_cleared: { depart: "departed", hold: "held" },
  departed: { arrive: "arrived", hold: "held" },
  transshipment: { arrive: "arrived", hold: "held" },
  arrived: { clear_import: "import_cleared", hold: "held" },
  import_cleared: { receive_warehouse: "warehouse_received", dispatch: "dispatched", hold: "held" },
  warehouse_received: { dispatch: "dispatched", hold: "held" },
  quality_checked: { dispatch: "dispatched", hold: "held" },
  dispatched: { out_for_delivery: "out_for_delivery", hold: "held" },
  out_for_delivery: { deliver: "delivered", hold: "held" },
  delivered: { complete: "completed", hold: "held" },
  held: { resume: "planned", cancel: "cancelled" },
  completed: {},
  cancelled: {},
  returned: {},
  lost: {},
};

export function transitionShipment(status: ShipmentStatus, command: ShipmentCommand): ShipmentStatus {
  const target = transitions[status][command];
  if (!target) {
    throw new AppError({
      statusCode: 409,
      code: "INVALID_STATE_TRANSITION",
      message: `Cannot ${command.replaceAll("_", " ")} a shipment in ${status} status.`,
    });
  }
  return target;
}
