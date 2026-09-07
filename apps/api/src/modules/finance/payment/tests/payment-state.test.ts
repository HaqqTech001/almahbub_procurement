import { describe, expect, it } from "vitest";

import { transitionPayment } from "../domain/payment-state.js";

describe("payment state", () => {
  it("requires a manual payment to be submitted before confirmation", () => {
    expect(transitionPayment("draft", "submit")).toBe("pending_confirmation");
    expect(transitionPayment("pending_confirmation", "confirm")).toBe("confirmed");
  });

  it("rejects confirmation from any other lifecycle state", () => {
    expect(() => transitionPayment("draft", "confirm")).toThrow("Cannot confirm");
    expect(() => transitionPayment("confirmed", "confirm")).toThrow("Cannot confirm");
  });
});
