import { describe, expect, it } from "vitest";

import { createPaymentSchema } from "../api/payment-schemas.js";

const invoiceId = "00000000-0000-4000-8000-000000000001";

describe("payment schemas", () => {
  it("accepts a manual payment receipt and allocation", () => {
    const parsed = createPaymentSchema.parse({
      amount: "15.25",
      currencyCode: "usd",
      evidence: { reference: "WIRE-001" },
      allocations: [{ invoiceId, amount: 15.25 }],
    });

    expect(parsed.currencyCode).toBe("USD");
    expect(parsed.amount).toBe(15.25);
  });

  it("rejects empty evidence and non-positive allocations", () => {
    expect(() => createPaymentSchema.parse({
      amount: 10,
      evidence: { reference: "" },
      allocations: [{ invoiceId, amount: 0 }],
    })).toThrow();
  });
});
