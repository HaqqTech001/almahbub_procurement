import type { CatalogProduct } from "@hamd/ui/catalog";
import type { ProductCategoryItem } from "@hamd/ui/homepage";
import {
  CatalogApiError,
  listPublicCategories,
  listPublicProducts,
  type PublicCatalogCategory,
  type PublicCatalogProduct,
} from "../api/catalog-api.js";
import { resolveMediaUrl } from "./media-url.js";
import { INTERNATIONAL_PRESENTATION_MEDIA, presentationSource } from "../content/presentation-media.js";
import { CANONICAL_PRESENTATION } from "../content/canonical-presentation.js";

export type HomepageProductCategory = {
  id: string;
  name: string;
  href: string;
};

export type HomepageProductsResult = {
  products: CatalogProduct[];
  categories: HomepageProductCategory[];
  categoryItems: ProductCategoryItem[];
  source: "api" | "empty" | "error";
};

export function toHomepageCatalogProduct(
  product: PublicCatalogProduct,
): CatalogProduct {
  const primary = product.images.find((image) => image.url.trim().length > 0);
  const imageSrc = resolveMediaUrl(primary?.url);
  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    href: `/product/${product.slug}`,
    requestHref: `/contact?product=${encodeURIComponent(product.slug)}`,
    manufacturer: product.manufacturerName ?? product.brandName ?? "",
    country: "",
    moq: "",
    leadTime: "",
    availability: "unknown",
    ...(product.description ? { description: product.description } : {}),
    ...(product.category?.name ? { categoryName: product.category.name } : {}),
    ...(imageSrc ? { imageSrc } : {}),
    imageAlt: primary?.altText?.trim() || product.name,
  };
}

export function toHomepageCategory(
  category: PublicCatalogCategory,
): HomepageProductCategory {
  return {
    id: category.slug,
    name: category.name,
    href: `/products?category=${encodeURIComponent(category.slug)}`,
  };
}

const CATEGORY_BLURBS: Record<string, string> = {
  "iphones-gadgets": "Consumer electronics and gadgets sourced to specification.",
  "medical-equipments": "Medical equipment and healthcare supplies.",
  "home-garden-wares": "Home and garden goods for project and retail demand.",
  machineries: "Machinery and industrial equipment procurement.",
  "general-procurement": "Broader sourcing when your need spans multiple categories.",
};

export function toCategoryItem(
  category: PublicCatalogCategory,
): ProductCategoryItem {
  const imageSrc = presentationSource(category.imageUrl, INTERNATIONAL_PRESENTATION_MEDIA[category.slug]);
  const imageAlt = CANONICAL_PRESENTATION.find(row => row.business === "International" && row.slug === category.slug)?.alt || category.imageAlt?.trim() || category.name;
  return {
    id: category.slug,
    name: category.name,
    description:
      CATEGORY_BLURBS[category.slug] ??
      "Browse published items in this category, or request procurement if the exact item is not listed yet.",
    href: `/products?category=${encodeURIComponent(category.slug)}`,
    ...(imageSrc ? { imageSrc, imageAlt } : {}),
  };
}

export function listInternationalCategoryCards(
  categories: readonly PublicCatalogCategory[] = [],
): ProductCategoryItem[] {
  return categories.map(toCategoryItem);
}

/**
 * Homepage catalogue — published products and the same ProductCategory rows Ops uses.
 * A failed request is not treated as an empty catalogue.
 */
export async function loadHomepageProducts(): Promise<HomepageProductsResult> {
  try {
    const [productsResult, categoriesResult] = await Promise.all([
      listPublicProducts({ page: 1, pageSize: 6, sort: "recommended" }),
      listPublicCategories({ page: 1, pageSize: 50 }),
    ]);
    const products = productsResult.data.map(toHomepageCatalogProduct);
    const categorySource = categoriesResult.data;
    return {
      products,
      categories: categorySource.map(toHomepageCategory),
      categoryItems: categorySource.map(toCategoryItem),
      source: products.length > 0 || categorySource.length > 0 ? "api" : "empty",
    };
  } catch (error) {
    const failed = error instanceof CatalogApiError ? error : null;
    void failed;
    return {
      products: [],
      categories: [],
      categoryItems: [],
      source: "error",
    };
  }
}
