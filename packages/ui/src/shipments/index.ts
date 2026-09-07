export type * from "./types.js";
export {
  MILESTONE_CONFIDENCES,
  SHIPMENT_COMMANDS,
  SHIPMENT_STATUSES,
  availableShipmentCommands,
  emptyShipmentFilters,
  filterShipments,
  milestoneConfidenceLabel,
  paginateShipmentRows,
  shipmentCommandLabel,
  shipmentStatusLabel,
} from "./types.js";
export {
  ShipmentWorkspace,
  ShipmentWorkspaceSkeleton,
} from "./ShipmentWorkspace.js";
export type {
  ShipmentWorkspaceProps,
  ShipmentWorkspaceTab,
} from "./ShipmentWorkspace.js";
export { useShipmentDirectory } from "./useShipmentDirectory.js";
export { useShipmentMapSlot } from "./useShipmentMapSlot.js";
export { shipmentRecordsFixture } from "./fixtures.js";

export const shipmentsLazy = {
  ShipmentWorkspace: () => import("./ShipmentWorkspace.js"),
} as const;
