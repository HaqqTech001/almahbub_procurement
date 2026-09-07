import { describe, expect, it } from "vitest";

import { mapApiQuotationToRecord, unwrapQuotationList, type ApiQuotation } from "./quotation-api.js";

const sample: ApiQuotation = {
  id: "11111111-1111-1111-1111-111111111111",
  familyId: "22222222-2222-2222-2222-222222222222",
  versionNumber: 1,
  publicCode: "QT-TEST",
  procurementRequestId: "33333333-3333-3333-3333-333333333333",
  procurementRequestCode: "PR-1",
  supplierId: null,
  supplierName: "Acme Valves",
  status: "issued",
  currencyCode: "USD",
  price: {
    subtotalAmount: "100",
    discountAmount: "10",
    taxAmount: "5",
    shippingAmount: "2",
    dutyAmount: "0",
    otherAmount: "0",
    totalAmount: "97",
  },
  expiresAt: null,
  deliveryLeadTimeDays: 14,
  minimumOrderQuantity: "1",
  paymentTerms: "Net 30",
  commercialTerms: "FOB",
  rowVersion: 2,
  documentIds: [],
  attachments: [],
  versions: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      versionNumber: 1,
      publicCode: "QT-TEST",
      status: "issued",
      totalAmount: "97",
      createdAt: "2026-08-01T00:00:00.000Z",
      current: true,
    },
  ],
  items: [
    {
      id: "44444444-4444-4444-4444-444444444444",
      description: "Valve",
      quantity: "2",
      unitAmount: "50",
      lineAmount: "100",
    },
  ],
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

describe("quotation API mapping", () => {
  it("flattens API price envelopes into UI records", () => {
    const mapped = mapApiQuotationToRecord(sample, [
      {
        id: "h1",
        toStatus: "issued",
        command: "issue",
        createdAt: "2026-08-01T12:00:00.000Z",
      },
    ]);
    expect(mapped.totalAmount).toBe(97);
    expect(mapped.supplierName).toBe("Acme Valves");
    expect(mapped.versions).toHaveLength(1);
    expect(mapped.history).toHaveLength(1);
    expect(mapped.items[0]?.lineAmount).toBe(100);
  });

  it("unwraps list envelopes and maps rows without a price block", () => {
    expect(unwrapQuotationList({ data: [sample] })).toHaveLength(1);
    expect(unwrapQuotationList(null)).toEqual([]);
    const mapped = mapApiQuotationToRecord({
      ...sample,
      price: undefined,
      items: undefined,
    });
    expect(mapped.totalAmount).toBe(0);
    expect(mapped.items).toEqual([]);
  });
});
