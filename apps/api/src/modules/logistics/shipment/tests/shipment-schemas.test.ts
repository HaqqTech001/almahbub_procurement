import { describe, expect, it } from "vitest";

import { createShipmentSchema, deliveryConfirmationSchema, milestoneSchema, trackingSchema } from "../api/shipment-schemas.js";

describe("shipment schemas", () => {
  it("requires source and UUID evidence for a milestone", () => {
    const milestone = milestoneSchema.parse({
      type: "picked_up",
      source: "carrier_manifest",
      evidenceDocumentIds: ["550e8400-e29b-41d4-a716-446655440000"],
    });
    expect(milestone.confidence).toBe("confirmed");
  });

  it("allows create without publicCode (server may generate)", () => {
    expect(
      createShipmentSchema.parse({
        purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).toMatchObject({ purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000" });
  });

  it("requires evidence and a recipient for delivery confirmation", () => {
    expect(() => deliveryConfirmationSchema.parse({ rowVersion: 1, recipientName: "Amina", evidenceDocumentIds: [] })).toThrow();
    expect(deliveryConfirmationSchema.parse({
      rowVersion: 1, recipientName: "Amina",
      evidenceDocumentIds: ["550e8400-e29b-41d4-a716-446655440001"],
    }).recipientName).toBe("Amina");
  });

  it("uses optimistic concurrency for carrier tracking changes", () => {
    expect(trackingSchema.parse({ rowVersion: 0, carrierName: "DHL", trackingNumber: "DH-123" })).toMatchObject({ rowVersion: 0 });
  });
});
