import { useMemo } from "react";
import type {
  ShipmentMapAdapter,
  ShipmentMapRenderContext,
} from "./types.js";

/**
 * Resolves a host map adapter for the shipment Map tab.
 * Returns null when no adapter is configured - UI shows the honest placeholder.
 * Never fabricates map imagery.
 */
export function useShipmentMapSlot(
  adapter: ShipmentMapAdapter | null | undefined,
  context: ShipmentMapRenderContext | null,
): unknown {
  return useMemo(() => {
    if (!adapter || !context) return null;
    return adapter.render(context);
  }, [adapter, context]);
}
