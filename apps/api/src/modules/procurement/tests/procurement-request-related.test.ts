import { describe, expect, it } from "vitest";

import {
  scopeProcurementListOwner,
  serializeRequestRelated,
} from "../api/procurement-request-related.js";

describe("serializeRequestRelated", () => {
  it("returns empty collections when no relations exist", () => {
    expect(serializeRequestRelated({})).toEqual({
      quotations: [],
      purchaseOrders: [],
      shipments: [],
      invoices: [],
      payments: [],
    });
  });

  it("flattens quotations, POs, shipments, invoices and payments", () => {
    const related = serializeRequestRelated({
      quotations: [
        {
          id: "q1",
          publicCode: "QT-AAA",
          status: "issued",
          versionNumber: 1,
          totalAmount: { toString: () => "1200.00" },
          currencyCode: "USD",
          expiresAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      purchaseOrders: [
        {
          id: "po1",
          publicCode: "PO-BBB",
          status: "issued",
          totalAmount: "1200.00",
          currencyCode: "USD",
          updatedAt: "2026-08-02T00:00:00.000Z",
          shipments: [
            {
              id: "sh1",
              publicCode: "SH-CCC",
              status: "planned",
              carrierName: "DHL",
              trackingNumber: "TRK-1",
              estimatedArrivalAt: null,
              updatedAt: "2026-08-03T00:00:00.000Z",
            },
          ],
          invoices: [
            {
              id: "inv1",
              invoiceNumber: "INV-100",
              status: "issued",
              totalAmount: "1200.00",
              currencyCode: "USD",
              dueAt: null,
              updatedAt: "2026-08-04T00:00:00.000Z",
              allocations: [
                {
                  payment: {
                    id: "pay1",
                    status: "confirmed",
                    amount: "1200.00",
                    updatedAt: "2026-08-05T00:00:00.000Z",
                  },
                },
                {
                  payment: {
                    id: "pay1",
                    status: "confirmed",
                    amount: "1200.00",
                    updatedAt: "2026-08-05T00:00:00.000Z",
                  },
                },
              ],
            },
          ],
        },
      ],
    });

    expect(related.quotations).toHaveLength(1);
    expect(related.quotations[0]?.publicCode).toBe("QT-AAA");
    expect(related.purchaseOrders[0]?.publicCode).toBe("PO-BBB");
    expect(related.shipments[0]).toMatchObject({
      publicCode: "SH-CCC",
      trackingNumber: "TRK-1",
      purchaseOrderId: "po1",
    });
    expect(related.invoices[0]?.invoiceNumber).toBe("INV-100");
    expect(related.payments).toHaveLength(1);
    expect(related.payments[0]?.id).toBe("pay1");
  });
});

describe("scopeProcurementListOwner", () => {
  it("forces buyer lists to the acting user", () => {
    expect(scopeProcurementListOwner(false, "user-1", "user-2")).toBe("user-1");
  });

  it("lets ops filter by requested owner", () => {
    expect(scopeProcurementListOwner(true, "ops-1", "user-2")).toBe("user-2");
    expect(scopeProcurementListOwner(true, "ops-1")).toBeUndefined();
  });
});
