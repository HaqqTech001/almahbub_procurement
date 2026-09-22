import { describe, expect, it } from "vitest";

import {
  availabilityLabel,
  entryTypeLabel,
  productRequestHref,
} from "./catalog-display.js";

describe("catalog display helpers", () => {
  it("carries a selected family variant into an authenticated procurement request", () => {
    expect(
      productRequestHref("apple-iphone-18-pro-series", {
        authenticated: true,
        variant: "iPhone 18 Pro Max",
      }),
    ).toBe(
      "/app/requests/new?product=apple-iphone-18-pro-series&variant=iPhone+18+Pro+Max",
    );
  });

  it("preserves the selected variant through login returnTo", () => {
    const href = productRequestHref("apple-iphone-18-pro-series", {
      variant: "iPhone 18 Pro",
    });
    expect(decodeURIComponent(href)).toContain(
      "/app/requests/new?product=apple-iphone-18-pro-series&variant=iPhone+18+Pro",
    );
  });

  it("uses procurement-safe availability labels", () => {
    expect(availabilityLabel("ON_REQUEST")).toBe("Available on request");
    expect(availabilityLabel("COMING_SOON")).toBe("Coming soon");
  });

  it("labels family and service entries without relabelling standard products", () => {
    expect(entryTypeLabel("PRODUCT_FAMILY")).toBe("Product series");
    expect(entryTypeLabel("PROCUREMENT_SERVICE")).toBe("Procurement service");
    expect(entryTypeLabel("STANDARD_PRODUCT")).toBeNull();
  });
});
