import { describe, expect, it } from "vitest";

import { SITE } from "../content/site.js";
import {
  buildIeEnquiryMailto,
  buildIeProcurementCreateBody,
  IE_ENQUIRY_EMPTY,
  validateIeEnquiry,
} from "./ie-enquiry-form.js";

describe("IE-8 enquiry form contract", () => {
  it("requires name, email, and commodity", () => {
    const errors = validateIeEnquiry(IE_ENQUIRY_EMPTY);
    expect(errors.companyName).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.commodity).toBeTruthy();
  });

  it("rejects invalid email and whitespace-only required values", () => {
    const errors = validateIeEnquiry({
      ...IE_ENQUIRY_EMPTY,
      companyName: "   ",
      email: "not-an-email",
      commodity: "  ",
    });
    expect(errors.companyName).toBeTruthy();
    expect(errors.email).toMatch(/valid email/i);
    expect(errors.commodity).toBeTruthy();
  });

  it("accepts a minimal valid enquiry and builds mailto without a request id", () => {
    const values = {
      ...IE_ENQUIRY_EMPTY,
      companyName: "Acme Trading",
      email: "buyer@example.com",
      commodity: "Agro commodity requirement",
      quantity: "2",
      unit: "MT",
    };
    expect(validateIeEnquiry(values)).toEqual({});
    const href = buildIeEnquiryMailto(SITE.contactEmail, values);
    expect(href.startsWith(`mailto:${SITE.contactEmail}?`)).toBe(true);
    expect(href).toMatch(/Integrated%20Export%20quote%20enquiry/);
    expect(href).not.toMatch(/request[-_]?id/i);
    expect(SITE.contactEmail).toBe("almahbubinternational@gmail.com");
  });

  it("maps a valid enquiry onto an Integrated Export procurement create body", () => {
    const body = buildIeProcurementCreateBody({
      ...IE_ENQUIRY_EMPTY,
      companyName: "Acme Trading",
      email: "buyer@example.com",
      commodity: "TEST COMMODITY ONLY",
      quantity: "12.5",
      unit: "MT",
      destination: "Lagos free zone",
    });
    expect(body.lob).toBe("integrated_export");
    expect(body.title).toMatch(/TEST COMMODITY ONLY/);
    expect(body.items[0]?.quantity).toBe(12.5);
    expect(body.items[0]?.unit).toBe("MT");
    expect(body.destinationAddress).toBe("Lagos free zone");
    expect(body.notes).toMatch(/Acme Trading/);
  });
});
