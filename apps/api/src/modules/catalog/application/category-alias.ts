export const ELECTRONICS_CATEGORY_ALIAS =
  "electronics-mobile-digital-technology";
export const ELECTRONICS_CATEGORY_SLUG = "iphones-gadgets";
export function resolveCategorySlug(slug: string): string {
  return slug === ELECTRONICS_CATEGORY_ALIAS ? ELECTRONICS_CATEGORY_SLUG : slug;
}
