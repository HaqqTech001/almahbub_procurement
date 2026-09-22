import { describe, expect, it } from "vitest";

import { masterCatalogueMediaDecision } from "./master-catalogue-media-policy.js";

describe("master catalogue media policy", () => {
  it("requires curated visuals for procurement services", () => {
    expect(masterCatalogueMediaDecision("PROCUREMENT_SERVICE").action).toBe(
      "SERVICE_VISUAL_REQUIRED",
    );
  });

  it("requires human confirmation for product-family hero images", () => {
    expect(masterCatalogueMediaDecision("PRODUCT_FAMILY").action).toBe(
      "HUMAN_REVIEW_REQUIRED",
    );
  });

  it("allows exact standard products into the guarded acquisition pipeline", () => {
    expect(masterCatalogueMediaDecision("STANDARD_PRODUCT").action).toBe(
      "AUTO_CANDIDATE_ALLOWED",
    );
  });

  it("allows configurable physical products into the guarded acquisition pipeline", () => {
    expect(masterCatalogueMediaDecision("CONFIGURABLE_PRODUCT").action).toBe(
      "AUTO_CANDIDATE_ALLOWED",
    );
  });
});
