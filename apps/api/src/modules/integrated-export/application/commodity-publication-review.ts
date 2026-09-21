import { createHash } from "node:crypto";
import { reviewedMediaHash } from "../../catalog/infrastructure/reviewed-media-hash.js";
import { publicProductMediaHealth } from "../../catalog/infrastructure/product-media-health.js";

export type CommodityReviewInput = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  heroMedia: unknown;
  gallery: unknown;
};
export type CommodityPublicationReview = {
  commodityId: string;
  fingerprint: string;
  identityApproved: true;
  reviewedBy: string;
  checkedAt: string;
  media: {
    src: string;
    sha256: string;
    semanticApproved: true;
    sourceUrl: string;
    usageEvidence: string;
  }[];
};
// Import reports have no source-to-binary evidence. Add approvals only after
// verifying identity, every displayed asset, and rights for those exact bytes.
export const commodityPublicationReviews: readonly CommodityPublicationReview[] =
  [];
export function commodityFingerprint(row: CommodityReviewInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        row.id,
        row.slug,
        row.name,
        row.description,
        row.heroMedia,
        row.gallery,
      ]),
    )
    .digest("hex");
}
export async function commodityPublicationApproved(
  row: CommodityReviewInput,
  reviews = commodityPublicationReviews,
  hash = reviewedMediaHash,
  health = publicProductMediaHealth,
): Promise<boolean> {
  const review = reviews.find((item) => item.commodityId === row.id);
  if (
    !review ||
    !review.identityApproved ||
    review.fingerprint !== commodityFingerprint(row) ||
    !review.reviewedBy.trim() ||
    !Number.isFinite(Date.parse(review.checkedAt))
  )
    return false;
  const sources = [
    row.heroMedia,
    ...(Array.isArray(row.gallery) ? row.gallery : []),
  ];
  for (const value of sources) {
    if (
      !value ||
      typeof value !== "object" ||
      !("src" in value) ||
      typeof value.src !== "string"
    )
      return false;
    const evidence = review.media.find((item) => item.src === value.src);
    if (
      !evidence?.semanticApproved ||
      !/^https:\/\//.test(evidence.sourceUrl) ||
      !evidence.usageEvidence.trim() ||
      !/^[a-f0-9]{64}$/.test(evidence.sha256)
    )
      return false;
    if (
      (await health(value.src)) !== "valid" ||
      (await hash(value.src)) !== evidence.sha256
    )
      return false;
  }
  return true;
}
