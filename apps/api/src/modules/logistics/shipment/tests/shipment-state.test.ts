import { describe, expect, it } from "vitest";

import { transitionShipment } from "../domain/shipment-state.js";

describe("shipment lifecycle", () => {
  it("permits only governed physical lifecycle commands", () => {
    expect(transitionShipment("planned", "supplier_ready")).toBe("supplier_ready");
    expect(transitionShipment("supplier_ready", "schedule_pickup")).toBe("pickup_scheduled");
    expect(transitionShipment("out_for_delivery", "deliver")).toBe("delivered");
    expect(transitionShipment("delivered", "complete")).toBe("completed");
  });

  it("does not permit direct completion or terminal-state mutations", () => {
    expect(() => transitionShipment("planned", "complete")).toThrow("Cannot complete");
    expect(() => transitionShipment("completed", "hold")).toThrow("Cannot hold");
  });
});
