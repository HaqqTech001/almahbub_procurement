import { describe, expect, it } from "vitest";

import { AppError } from "../../../../lib/app-error.js";
import {
  createQuotationSchema,
  quotationCommandSchema,
} from "../api/quotation-schemas.js";
import { transitionQuotation } from "../domain/quotation-state.js";

describe("Quotation state machine", () => {
  it("enforces the reviewed quotation lifecycle", () => {
    expect(transitionQuotation("draft", "review")).toBe("internally_reviewed");
    expect(transitionQuotation("internally_reviewed", "issue")).toBe("issued");
    expect(transitionQuotation("issued", "accept")).toBe("accepted");
    expect(transitionQuotation("issued", "decline")).toBe("declined");
  });

  it("rejects invalid lifecycle changes", () => {
    expect(() => transitionQuotation("draft", "issue")).toThrow(AppError);
    expect(() => transitionQuotation("accepted", "review")).toThrow(AppError);
  });
});

describe("Quotation schemas", () => {
  it("accepts UUID-only document references and normalizes commercial input", () => {
    const quotation = createQuotationSchema.parse({
      procurementRequestId: "550e8400-e29b-41d4-a716-446655440000",
      currencyCode: "usd",
      documentIds: ["550e8400-e29b-41d4-a716-446655440001"],
      items: [{ description: "Industrial pump", quantity: 2, unitAmount: 34.5 }],
    });

    expect(quotation.currencyCode).toBe("USD");
    expect(quotation.documentIds).toHaveLength(1);
    expect(quotationCommandSchema.parse({ command: "review", rowVersion: 0 })).toMatchObject({
      command: "review",
    });
  });
});
