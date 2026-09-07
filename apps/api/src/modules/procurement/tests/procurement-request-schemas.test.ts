import { describe, expect, it } from "vitest";

import {
  createProcurementRequestSchema,
  listProcurementRequestsSchema,
  transitionProcurementRequestSchema,
  updateProcurementRequestSchema,
} from "../api/procurement-request-schemas.js";

describe("Procurement Request schemas", () => {
  it("normalizes a valid draft request", () => {
    const request = createProcurementRequestSchema.parse({
      title: "Replacement manufacturing line components",
      destinationCountryCode: "ng",
      destinationAddress: "1 Marina Road, Lagos",
      items: [
        { description: "Industrial bearing", quantity: "10", unit: "pcs" },
      ],
    });

    expect(request.currencyCode).toBe("USD");
    expect(request.destinationCountryCode).toBe("NG");
    expect(request.priority).toBe("normal");
    expect(request.lob).toBe("international");
    expect(request.items[0]?.quantity).toBe(10);
  });

  it("accepts explicit integrated_export LOB", () => {
    const request = createProcurementRequestSchema.parse({
      title: "Integrated Export commodity enquiry",
      lob: "integrated_export",
      items: [{ description: "Sesame enquiry lot", quantity: 12, unit: "mt" }],
    });
    expect(request.lob).toBe("integrated_export");
  });

  it("rejects invalid LOB values", () => {
    expect(() =>
      createProcurementRequestSchema.parse({
        title: "Bad LOB",
        lob: "export",
        items: [{ description: "Item", quantity: 1, unit: "pcs" }],
      }),
    ).toThrow();
  });

  it("omits list LOB filter when the query does not specify one", () => {
    expect(listProcurementRequestsSchema.parse({}).lob).toBeUndefined();
  });

  it("does not allow changing lob on update", () => {
    const updated = updateProcurementRequestSchema.parse({
      rowVersion: 0,
      title: "Updated title only",
      lob: "integrated_export",
    });
    expect(Object.prototype.hasOwnProperty.call(updated, "lob")).toBe(false);
  });

  it("requires a row version for lifecycle commands", () => {
    expect(() =>
      transitionProcurementRequestSchema.parse({ command: "submit" }),
    ).toThrow();
  });
});
