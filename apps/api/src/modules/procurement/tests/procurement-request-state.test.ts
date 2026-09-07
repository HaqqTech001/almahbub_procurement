import { describe, expect, it } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import { transitionProcurementRequest } from "../domain/procurement-request-state.js";

describe("Procurement Request state machine", () => {
  it("allows the governed sourcing path", () => {
    expect(transitionProcurementRequest("draft", "submit")).toBe("submitted");
    expect(
      transitionProcurementRequest("submitted", "accept_for_sourcing"),
    ).toBe("accepted_for_sourcing");
    expect(
      transitionProcurementRequest("accepted_for_sourcing", "start_sourcing"),
    ).toBe("sourcing");
  });

  it("prevents direct or invalid lifecycle changes", () => {
    expect(() => transitionProcurementRequest("draft", "fulfill")).toThrow(
      AppError,
    );
    expect(() =>
      transitionProcurementRequest("declined", "start_purchase"),
    ).toThrow(AppError);
  });

  it("allows cancellation only before commercial commitment", () => {
    expect(transitionProcurementRequest("sourcing", "cancel")).toBe(
      "cancelled",
    );
    expect(() => transitionProcurementRequest("approved", "cancel")).toThrow(
      AppError,
    );
  });

  it("maps quote-stage approve and reject onto governed statuses", () => {
    expect(transitionProcurementRequest("quote_issued", "approve")).toBe(
      "approved",
    );
    expect(transitionProcurementRequest("quote_issued", "decline")).toBe(
      "declined",
    );
    expect(transitionProcurementRequest("approved", "start_purchase")).toBe(
      "purchase_in_progress",
    );
    expect(() =>
      transitionProcurementRequest("submitted", "approve"),
    ).toThrow(AppError);
    expect(() =>
      transitionProcurementRequest("fulfilled", "accept_for_sourcing"),
    ).toThrow(AppError);
  });
});
