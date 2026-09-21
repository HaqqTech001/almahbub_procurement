import { createHash } from "node:crypto";
import {
  reviewFingerprint,
  primaryImage,
  type ReviewProduct,
  type PublicationReview,
} from "../application/product-publication-review.js";
export function reviewed(
  product: ReviewProduct,
  tier: PublicationReview["priorityTier"] = "P2_CORE",
): PublicationReview {
  return {
    productId: product.id,
    productName: product.name,
    slug: product.slug,
    fingerprint: reviewFingerprint(product),
    identityStatus: "approved",
    categoryStatus: "approved",
    duplicateStatus: "clear",
    mediaStatus: "approved",
    mediaSemanticStatus: "approved",
    commercialRelevance: "Verified procurement use",
    reviewedBy: "test-reviewer",
    checkedAt: "2026-01-01T00:00:00Z",
    primaryImageId: primaryImage(product)!.id,
    sha256: createHash("sha256").update(product.id).digest("hex"),
    mediaIdentity: product.name,
    semanticEvidence: "Inspected complete product image",
    mediaSource: "test fixture",
    mediaRights: "test fixture",
    priorityTier: tier,
    research: {
      manufacturer: "Apple",
      model: product.name,
      generation: "15",
      marketStatus: "previous",
      officialSource: "https://www.apple.com/",
      checkedAt: "2026-01-01T00:00:00Z",
    },
  };
}

export async function fixtureHash(url: string) {
  return createHash("sha256")
    .update(
      url === "https://cdn.example/iphone.jpg"
        ? "phone"
        : url.replace(/^\//, "").replace(/\.png$/, ""),
    )
    .digest("hex");
}
