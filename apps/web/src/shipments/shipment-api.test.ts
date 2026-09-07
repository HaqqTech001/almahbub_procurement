import { describe, expect, it } from "vitest";

import { mapApiShipmentToRecord } from "./shipment-api.js";

describe("shipment API mapping", () => {
  it("projects enriched API serialize into ShipmentRecord", () => {
    const mapped = mapApiShipmentToRecord({
      id: "11111111-1111-1111-1111-111111111111",
      purchaseOrderId: "22222222-2222-2222-2222-222222222222",
      purchaseOrderCode: "PO-551",
      publicCode: "SH-901",
      status: "planned",
      carrierName: "Maersk",
      trackingNumber: null,
      estimatedArrivalAt: "2026-08-20T12:00:00.000Z",
      rowVersion: 1,
      createdAt: "2026-08-01T12:00:00.000Z",
      updatedAt: "2026-08-01T12:00:00.000Z",
      destinationLabel: "Lagos, NG",
      milestones: [
        {
          id: "m1",
          type: "po_confirmed",
          label: "Po Confirmed",
          confidence: "confirmed",
          occurredAt: "2026-08-01T13:00:00.000Z",
        },
      ],
      timeline: [
        {
          id: "t1",
          label: "Status → planned",
          at: "2026-08-01T12:00:00.000Z",
          kind: "status",
        },
      ],
      documents: [],
      history: [],
      proofOfDelivery: { confirmed: false },
      map: {
        label: "Destination · Lagos, NG",
        region: "NG",
        latitude: null,
        longitude: null,
      },
    });

    expect(mapped.publicCode).toBe("SH-901");
    expect(mapped.purchaseOrderCode).toBe("PO-551");
    expect(mapped.milestones[0]?.label).toBe("Po Confirmed");
    expect(mapped.map.latitude).toBeNull();
    expect(mapped.proofOfDelivery.confirmed).toBe(false);
  });
});
