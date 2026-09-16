import { resolveMediaUrl } from "../lib/media-url.js";

/** Artwork only: never publishes a category/commodity or replaces API catalogue data. */
export const INTERNATIONAL_PRESENTATION_MEDIA: Record<string, string | null> = {
  "iphones-gadgets": "/media/international/category-iphones-gadgets.jpg",
  "medical-equipments": "/media/international/category-medical-equipments.jpg",
  "home-garden-wares": "/media/international/category-home-garden-wares.jpg",
  machineries: "/media/international/category-machineries.jpg",
  "general-procurement": "/media/international/category-general-procurement.jpg",
  // Curated covers recovered from the explicit category-media-plan, not product uploads.
  "home-appliances": "/media/international/category-home-appliances.png",
  "office-business": "/media/international/category-office-business.png",
  "fashion-textiles": "/media/international/category-fashion-textiles.png",
  "beauty-spa-salon": "/media/international/category-beauty-spa-salon.png",
  "retail-store-setup": "/media/international/category-retail-store-setup.png",
};

export const IE_PRESENTATION_MEDIA: Record<string, string> = Object.fromEntries(
  ["sesame-seeds", "cashew", "ginger", "hibiscus", "shea", "soybean", "cocoa"].map(slug => [
    slug, `/media/ie/commodities/${slug}/hero/ie-${slug}-hero-01.webp`,
  ]),
);

/** Only explicitly matched historical filenames can substitute gallery artwork. */
export const IE_PRESENTATION_GALLERY = [
  ["sesame-seeds", "whole"], ["sesame-seeds", "sacks"], ["sesame-seeds", "application"],
  ["cashew", "whole"], ["cashew", "close-up"], ["cashew", "bulk"],
  ["ginger", "whole"], ["ginger", "close-up"], ["ginger", "bulk"],
  ["hibiscus", "whole"], ["cocoa", "whole"], ["cocoa", "sacks"],
].map(([slug, role]) => `/media/ie/commodities/${slug}/${role}/ie-${slug}-${role}-01.webp`);

export function canonicalIeMedia(src: string | null | undefined, slug?: string): string | undefined {
  if (slug && IE_PRESENTATION_MEDIA[slug]) return IE_PRESENTATION_MEDIA[slug];
  const filename = src?.split(/[?#]/)[0]?.split("/").pop()?.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  return [...Object.values(IE_PRESENTATION_MEDIA), ...IE_PRESENTATION_GALLERY]
    .find(path => path.split("/").pop()?.replace(/\.webp$/, "") === filename);
}

export function presentationSource(src: string | null | undefined, fallback?: string | null): string | undefined {
  // Relative legacy media URLs encode a dependency on the API instance's disk.
  if ((!src || /\/api\/v1\/public\/catalog-media\//.test(src)) && fallback) return fallback;
  return resolveMediaUrl(src) || fallback || undefined;
}
