import type { PublicCatalogProduct } from "../api/catalog-api.js";
import { resolveMediaUrl } from "./media-url.js";
import { orderedProductImages } from "@hamd/constants";

export type CatalogCardModel = {
  slug: string;
  name: string;
  href: string;
  requestHref: string;
  description: string | null;
  entryType: PublicCatalogProduct["entryType"];
  availabilityStatus: PublicCatalogProduct["availabilityStatus"];
  categoryName: string | null;
  categorySlug: string | null;
  brandName: string | null;
  manufacturerName: string | null;
  imageSrc?: string;
  imageSources?: string[];
  imageAlt: string;
  hasVideo: boolean;
};

export function productRequestHref(
  slug: string,
  options: {
    workspace?: boolean;
    authenticated?: boolean;
    variant?: string | null;
  } = {},
): string {
  const params = new URLSearchParams({ product: slug });
  if (options.variant?.trim()) params.set("variant", options.variant.trim());
  const next = `/app/requests/new?${params.toString()}`;
  if (options.workspace || options.authenticated) return next;
  return `/login?returnTo=${encodeURIComponent(next)}`;
}

export function toCatalogCard(
  product: PublicCatalogProduct,
  options?: { workspace?: boolean; authenticated?: boolean },
): CatalogCardModel {
  const images = orderedProductImages(product.images);
  const primary = images[0];
  const imageSrc = resolveMediaUrl(primary?.url);
  const maker = product.brandName || product.manufacturerName;
  const hasVideo = (product.videos ?? []).some(
    (video) => video.url.trim().length > 0,
  );
  const workspace = Boolean(options?.workspace);
  return {
    slug: product.slug,
    name: product.name,
    href: workspace ? `/app/products/${product.slug}` : `/product/${product.slug}`,
    requestHref: productRequestHref(product.slug, {
      workspace,
      authenticated: options?.authenticated,
    }),
    description: product.summary ?? product.description,
    entryType: product.entryType,
    availabilityStatus: product.availabilityStatus,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    brandName: product.brandName,
    manufacturerName: product.manufacturerName,
    ...(imageSrc ? { imageSrc } : {}),
    imageSources: images
      .map(image => resolveMediaUrl(image.url))
      .filter((src): src is string => Boolean(src)),
    imageAlt:
      primary?.altText?.trim() ||
      `${product.name}${maker ? ` - ${maker}` : ""}`,
    hasVideo,
  };
}

export function formatSpecificationLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function sourcingStatusLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value === "available_for_procurement") return "Available for procurement";
  return formatSpecificationLabel(value.replace(/_/g, " "));
}

export function productsPath(options: {
  category?: string | null;
  q?: string | null;
  page?: number | null;
  workspace?: boolean | null;
}): string {
  const params = new URLSearchParams();
  if (options.category) params.set("category", options.category);
  if (options.q) params.set("q", options.q);
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const qs = params.toString();
  const base = options.workspace ? "/app/products" : "/products";
  return qs ? `${base}?${qs}` : base;
}


export function availabilityLabel(
  value: PublicCatalogProduct["availabilityStatus"],
): string {
  if (value === "COMING_SOON") return "Coming soon";
  if (value === "PRE_ORDER") return "Pre-order";
  if (value === "OUT_OF_STOCK") return "Out of stock";
  return "Available on request";
}

export function entryTypeLabel(
  value: PublicCatalogProduct["entryType"],
): string | null {
  if (value === "PRODUCT_FAMILY") return "Product series";
  if (value === "PROCUREMENT_SERVICE") return "Procurement service";
  if (value === "CONFIGURABLE_PRODUCT") return "Configurable product";
  return null;
}
