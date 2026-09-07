import { useParams } from "react-router-dom";

import { ShipmentsPage } from "./ShipmentsPage.js";

/** Deep-linked shipment detail hosted inside the workspace. */
export function ShipmentDetailPage() {
  const { id } = useParams();
  return <ShipmentsPage {...(id ? { initialSelectedId: id } : {})} />;
}
