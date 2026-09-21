import { createHash } from "node:crypto";
import {
  categoryFitsPhysicalIdentity,
  normalizedIdentity,
} from "./new-catalogue-plan.js";
import { isPublicCatalogueFiller } from "./catalogue-audit.js";

export type ReviewProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  category: {
    id?: string;
    slug: string;
    name?: string;
    status?: string;
    imageUrl?: string | null;
    imageStorageKey?: string | null;
  } | null;
  brand?: { name: string } | null;
  images: {
    id: string;
    url: string;
    storageKey?: string | null;
    position: number;
    isPrimary?: boolean;
    altText?: string | null;
  }[];
};
export type PublicationReview = {
  productId: string;
  slug: string;
  productName: string;
  fingerprint: string;
  identityStatus: "approved";
  categoryStatus: "approved";
  duplicateStatus: "clear";
  mediaStatus: "approved";
  mediaSemanticStatus: "approved";
  commercialRelevance: string;
  reviewedBy: string;
  checkedAt: string;
  primaryImageId: string;
  sha256: string;
  mediaIdentity: string;
  semanticEvidence: string;
  mediaSource: string;
  mediaRights: string;
  priorityTier: "P1_SHOWCASE" | "P2_CORE" | "P3_EXPANSION";
  research?: {
    manufacturer: string;
    model: string;
    generation: string;
    marketStatus: string;
    officialSource: string;
    checkedAt: string;
  };
  sharedMedia?: { physicalModel: string; productIds: string[]; reason: string };
};

// Reviewed release data, not an automatic approval from a successful upload.
// No legacy published rows have been visually/editorially approved under this standard.
// Add records only after inspecting the actual binary, rights and current identity.
export const productPublicationReviews: readonly PublicationReview[] = [];

export function primaryImage(product: ReviewProduct) {
  return (
    product.images.find((image) => image.isPrimary) ??
    product.images.find((image) => image.position === 0)
  );
}
export function reviewFingerprint(product: ReviewProduct): string {
  const image = primaryImage(product);
  return createHash("sha256")
    .update(
      JSON.stringify([
        product.id,
        product.slug,
        product.name,
        product.description,
        product.brand?.name ?? null,
        product.category?.id,
        product.category?.slug,
        product.category?.name,
        image?.id,
        image?.url,
        image?.storageKey ?? null,
      ]),
    )
    .digest("hex");
}
export function requiresProductResearch(
  product: Pick<ReviewProduct, "name" | "brand">,
): boolean {
  return (
    Boolean(product.brand?.name) ||
    /\b(apple|iphone|ipad|airpods|samsung|galaxy|hp|elitebook|lenovo|thinkpad|dell|gucci|bottega|nike|adidas|sony|xiaomi|huawei|asus|acer|bosch|lg|canon|epson|louis vuitton|prada|chanel)\b/i.test(
      product.name,
    )
  );
}
export function weakProductIdentity(name: string): boolean {
  return (
    isPublicCatalogueFiller(name) ||
    /^(?:(?:5g|enterprise|premium|rugged|professional|advanced|modern|generic)\s+)+(?:smartphone|phone|tablet|gadget|charger)s?$/i.test(
      name.trim(),
    ) ||
    /\b(test product|demo product|placeholder|research required|awaiting research)\b/i.test(
      name,
    )
  );
}
export function conceptIdentity(name: string): string {
  return normalizedIdentity(name.replace(/\b(enterprise|5g|rugged)\b/gi, " "));
}
export function mediaKeys(
  product: ReviewProduct,
  sha256?: string | null,
): string[] {
  const image = primaryImage(product);
  if (!image) return [];
  return [
    image.url ? `url:${image.url}` : "",
    image.storageKey ? `key:${image.storageKey}` : "",
    sha256 ? `sha256:${sha256}` : "",
  ].filter(Boolean);
}
export const rejectedMediaHashes: Readonly<Record<string, string>> = {
  c04f15b5198b50edd9c3715e17c64ac4d569abb4c6aef952b99176f45c083143:
    "Inspected 2026-09-18: abacus and laptop scene with small older phone; not isolated smartphone catalogue imagery.",
};
export function physicalCategoryMatches(product: ReviewProduct): boolean {
  if (!product.category) return false;
  if (
    product.category.slug === "iphones-gadgets" &&
    /charger|charging|usb.?hub|gimbal|tripod|phone case|screen protector|keyboard case/i.test(
      product.name,
    )
  )
    return true;
  // The existing legacy slug is assigned to the broader electronics category.
  if (
    product.category.slug === "iphones-gadgets" &&
    /Electronics, Mobile & Digital Technology/i.test(
      product.category.name ?? "",
    ) &&
    categoryFitsPhysicalIdentity(product.name, "office-business")
  )
    return true;
  return categoryFitsPhysicalIdentity(product.name, product.category.slug);
}
export function categoryArtUsed(product: ReviewProduct): boolean {
  const image = primaryImage(product);
  return Boolean(
    image &&
    ((product.category?.imageUrl && image.url === product.category.imageUrl) ||
      (image.storageKey &&
        image.storageKey === product.category?.imageStorageKey)),
  );
}
export function reviewIsCurrent(
  product: ReviewProduct,
  review?: PublicationReview,
): boolean {
  if (
    !review ||
    product.status !== "published" ||
    product.category?.status !== "published" ||
    weakProductIdentity(product.name) ||
    !physicalCategoryMatches(product) ||
    categoryArtUsed(product)
  )
    return false;
  if (
    review.productId !== product.id ||
    review.slug !== product.slug ||
    review.productName !== product.name ||
    Boolean(rejectedMediaHashes[review.sha256]) ||
    review.fingerprint !== reviewFingerprint(product) ||
    review.primaryImageId !== primaryImage(product)?.id ||
    !/^[a-f0-9]{64}$/i.test(review.sha256)
  )
    return false;
  if (
    review.identityStatus !== "approved" ||
    review.categoryStatus !== "approved" ||
    review.duplicateStatus !== "clear" ||
    review.mediaStatus !== "approved" ||
    review.mediaSemanticStatus !== "approved"
  )
    return false;
  if (
    ![
      review.commercialRelevance,
      review.reviewedBy,
      review.mediaIdentity,
      review.semanticEvidence,
      review.mediaSource,
      review.mediaRights,
    ].every((value) => value?.trim()) ||
    !Number.isFinite(Date.parse(review.checkedAt)) ||
    Date.parse(review.checkedAt) > Date.now()
  )
    return false;
  if (requiresProductResearch(product)) {
    const research = review.research;
    if (
      !research ||
      ![
        research.manufacturer,
        research.model,
        research.generation,
        research.marketStatus,
      ].every((value) => value?.trim()) ||
      !/^https:\/\//.test(research.officialSource) ||
      !Number.isFinite(Date.parse(research.checkedAt)) ||
      Date.parse(research.checkedAt) > Date.now()
    )
      return false;
  }
  return true;
}

export function legitimateSharedMedia(
  a: PublicationReview | undefined,
  b: PublicationReview | undefined,
): boolean {
  return Boolean(
    a &&
    b &&
    a.sharedMedia?.physicalModel &&
    a.sharedMedia.reason.trim() &&
    b.sharedMedia?.reason.trim() &&
    a.sharedMedia.physicalModel === b.sharedMedia?.physicalModel &&
    [a.productId, b.productId].every(
      (id) =>
        a.sharedMedia!.productIds.includes(id) &&
        b.sharedMedia!.productIds.includes(id),
    ),
  );
}
