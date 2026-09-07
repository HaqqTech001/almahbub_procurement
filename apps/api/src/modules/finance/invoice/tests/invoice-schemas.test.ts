import { describe, expect, it } from "vitest";

import {
  createInvoiceSchema,
  listInvoicesSchema,
  voidInvoiceSchema,
} from "../api/invoice-schemas.js";
import { transitionInvoice } from "../domain/invoice-state.js";

describe("Invoice schemas", () => {
  it("accepts issued-PO draft data with UUID-only document references", () => {
    const invoice = createInvoiceSchema.parse({
      purchaseOrderId: "550e8400-e29b-41d4-a716-446655440000",
      invoiceNumber: "SUP-2026-001",
      currencyCode: "usd",
      documentIds: ["550e8400-e29b-41d4-a716-446655440001"],
      items: [{ description: "Industrial pump", quantity: 2, unitAmount: 34.5 }],
    });
    expect(invoice.currencyCode).toBe("USD");
    expect(invoice.documentIds).toHaveLength(1);
  });

  it("enforces controlled filters and mandatory void rationale", () => {
    expect(listInvoicesSchema.parse({ sort: "totalAmount", direction: "asc" })).toMatchObject({
      pageSize: 25,
      sort: "totalAmount",
    });
    expect(() => voidInvoiceSchema.parse({ rowVersion: 0, reason: "no" })).toThrow();
  });

  it("enforces the governed invoice lifecycle", () => {
    expect(transitionInvoice("draft", "issue")).toBe("issued");
    expect(transitionInvoice("issued", "void")).toBe("voided");
    expect(() => transitionInvoice("paid", "void")).toThrow();
  });
});
