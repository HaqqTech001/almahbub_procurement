/**
 * Canonical V1 production category taxonomy.
 *
 * These slugs match V1 `/category/:slug` routes. Names are preserved exactly.
 * Future categories (Industrial Supplies, Agro & Commodities) are not included
 * unless separately approved.
 */
export const V1_PUBLIC_CATEGORIES = [
  {
    id: "0190c8a0-1000-7000-8000-000000000001",
    name: "iPhones & Gadgets",
    slug: "iphones-gadgets",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000002",
    name: "Medical Equipments",
    slug: "medical-equipments",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000003",
    name: "Home & Garden Wares",
    slug: "home-garden-wares",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000004",
    name: "Machineries",
    slug: "machineries",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000005",
    name: "General Procurement",
    slug: "general-procurement",
  },
] as const;

export type V1PublicCategorySlug = (typeof V1_PUBLIC_CATEGORIES)[number]["slug"];

export const V1_PUBLIC_CATEGORY_SLUGS = V1_PUBLIC_CATEGORIES.map(
  (category) => category.slug,
) as readonly V1PublicCategorySlug[];
