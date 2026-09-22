/**
 * Almahbub International catalogue merchandising rules.
 *
 * Fashion & Accessories remains an active category, but Almahbub does not
 * catalogue textile/fabric-roll procurement or uniform products.
 */

const FASHION_CATEGORY_SLUG = "fashion-textiles";

const DISALLOWED_FASHION_TERMS = [
  /\bfabric\b/i,
  /\btextile\b/i,
  /\buniform\b/i,
  /\bscrub(?:s)?\b/i,
] as const;

export function isDisallowedFashionCatalogueProduct(input: {
  categorySlug: string | null | undefined;
  slug: string;
  name: string;
}): boolean {
  if (input.categorySlug !== FASHION_CATEGORY_SLUG) return false;
  const value = `${input.slug.replace(/-/g, " ")} ${input.name}`;
  return DISALLOWED_FASHION_TERMS.some((pattern) => pattern.test(value));
}
