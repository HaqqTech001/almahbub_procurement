import { describe, expect, it } from "vitest";

import {
  adminRequestCommands,
  customerQuotationCommands,
  customerRequestCommands,
  mapRequestLifecycleStage,
} from "./lifecycle.js";
import { commandLabel } from "./types.js";

describe("mapRequestLifecycleStage", () => {
  it("maps V2 statuses onto the UX lifecycle without inventing states", () => {
    expect(mapRequestLifecycleStage("submitted")).toBe("review");
    expect(mapRequestLifecycleStage("needs_clarification")).toBe("review");
    expect(mapRequestLifecycleStage("sourcing")).toBe("sourcing");
    expect(
      mapRequestLifecycleStage("sourcing", {
        quotations: [{ status: "draft" }],
      }),
    ).toBe("quotation");
    expect(
      mapRequestLifecycleStage("quote_issued", {
        quotations: [{ status: "issued" }],
      }),
    ).toBe("decision");
    expect(mapRequestLifecycleStage("purchase_in_progress")).toBe("fulfilment");
    expect(
      mapRequestLifecycleStage("purchase_in_progress", {
        shipments: [{ status: "departed" }],
      }),
    ).toBe("shipment");
    expect(mapRequestLifecycleStage("fulfilled")).toBe("completion");
  });
});

describe("role-scoped commands", () => {
  it("never offers request approve/decline to customers", () => {
    const buyer = [
      "request:read",
      "request:submit",
      "request:cancel",
      "quotation:read",
    ];
    expect(customerRequestCommands("quote_issued", buyer)).toEqual([
      "request_revision",
    ]);
    expect(customerRequestCommands("submitted", buyer)).toEqual(["cancel"]);
    expect(customerQuotationCommands("issued", buyer)).toEqual([
      "accept",
      "decline",
    ]);
    expect(customerQuotationCommands("draft", buyer)).toEqual([]);
  });

  it("offers ops transitions only with request:manage", () => {
    expect(adminRequestCommands("submitted", ["request:read"])).toEqual([]);
    expect(
      adminRequestCommands("submitted", ["request:manage", "request:cancel"]),
    ).toEqual(["request_clarification", "accept_for_sourcing", "cancel"]);
    expect(adminRequestCommands("quote_issued", ["request:manage"])).toEqual([
      "approve",
      "decline",
    ]);
    expect(
      adminRequestCommands("approved", ["request:manage"]),
    ).toEqual(["start_purchase"]);
    expect(adminRequestCommands("fulfilled", ["request:manage"])).toEqual([
      "close",
    ]);
  });

  it("never offers administrative request commands to buyers", () => {
    const buyer = [
      "request:read",
      "request:submit",
      "request:cancel",
      "request:manage",
    ];
    expect(customerRequestCommands("submitted", buyer)).toEqual(["cancel"]);
    expect(customerRequestCommands("quote_issued", buyer)).toEqual([
      "request_revision",
    ]);
    expect(customerRequestCommands("approved", buyer)).toEqual([]);
  });

  it("labels V1 approve as Approve for sourcing without exposing raw command ids", () => {
    expect(commandLabel("accept_for_sourcing")).toBe("Approve for sourcing");
    expect(commandLabel("approve")).toBe("Approve quote");
    expect(commandLabel("decline")).toBe("Reject");
    expect(commandLabel("start_purchase")).toBe("Start purchase");
  });
});
