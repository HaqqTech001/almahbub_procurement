import { describe, expect, it } from "vitest";

import { buildVerifiedManifestDescription } from "./master-catalogue-content.js";

describe("master catalogue verified descriptions", () => {
  it("builds a family description only from supplied manifest facts", () => {
    const description = buildVerifiedManifestDescription({
      name: "Phone Pro Series",
      entryType: "PRODUCT_FAMILY",
      summary: "A verified professional smartphone family.",
      keySpecs: { chip: "Example Chip" },
      variants: [{ name: "Phone Pro" }, { name: "Phone Pro Max" }],
      availabilityStatus: "ON_REQUEST",
    });

    expect(description).toContain("Phone Pro, Phone Pro Max");
    expect(description).toContain("Chip: Example Chip");
    expect(description).toContain("Available on request");
  });

  it("describes procurement services as services, not inventory", () => {
    const description = buildVerifiedManifestDescription({
      name: "Custom Product Sourcing",
      entryType: "PROCUREMENT_SERVICE",
      summary: "Source items not already listed.",
      availabilityStatus: "ON_REQUEST",
    });

    expect(description).toContain("procurement service rather than warehouse inventory");
  });

  it("does not stringify nested objects as invented prose", () => {
    const description = buildVerifiedManifestDescription({
      name: "Configurable System",
      entryType: "CONFIGURABLE_PRODUCT",
      summary: "Configured to request.",
      keySpecs: { ignoredNested: { unverified: "value" }, capacity: "10 units" },
      availabilityStatus: "ON_REQUEST",
    });

    expect(description).toContain("Capacity: 10 units");
    expect(description).not.toContain("unverified");
  });
});
