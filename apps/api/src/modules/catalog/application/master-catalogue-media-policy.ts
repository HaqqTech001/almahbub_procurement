export type MasterCatalogueEntryType =
  | "STANDARD_PRODUCT"
  | "PRODUCT_FAMILY"
  | "PROCUREMENT_SERVICE"
  | "CONFIGURABLE_PRODUCT";

export type MasterCatalogueMediaDecision =
  | {
      action: "AUTO_CANDIDATE_ALLOWED";
      reason: string;
    }
  | {
      action: "HUMAN_REVIEW_REQUIRED";
      reason: string;
    }
  | {
      action: "SERVICE_VISUAL_REQUIRED";
      reason: string;
    };

export function masterCatalogueMediaDecision(
  entryType: MasterCatalogueEntryType,
): MasterCatalogueMediaDecision {
  if (entryType === "PROCUREMENT_SERVICE") {
    return {
      action: "SERVICE_VISUAL_REQUIRED",
      reason:
        "Procurement services require curated service/category visuals rather than physical-product photography.",
    };
  }

  if (entryType === "PRODUCT_FAMILY") {
    return {
      action: "HUMAN_REVIEW_REQUIRED",
      reason:
        "Product-family hero media must be confirmed to represent the collection/series rather than only one sibling variant.",
    };
  }

  return {
    action: "AUTO_CANDIDATE_ALLOWED",
    reason:
      "Exact or configurable physical-product imagery may proceed through fail-closed identity, licensing, and media validation.",
  };
}
