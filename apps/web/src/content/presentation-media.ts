import { resolveMediaUrl } from "../lib/media-url.js";
import { CANONICAL_PRESENTATION } from "./canonical-presentation.js";

/** Artwork only: never publishes a category/commodity or replaces API catalogue data. */
export const INTERNATIONAL_PRESENTATION_MEDIA: Record<string, string> = Object.fromEntries(
  CANONICAL_PRESENTATION.filter(row => row.business === "International").map(row => [row.slug, row.src]),
);

export const IE_PRESENTATION_MEDIA: Record<string, string> = Object.fromEntries(
  CANONICAL_PRESENTATION.filter(row => row.business === "IE").map(row => [row.slug, row.src]),
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
  const legacyHero = Object.keys(IE_PRESENTATION_MEDIA).find(key => filename === `ie-${key}-hero-01`);
  if (legacyHero) return IE_PRESENTATION_MEDIA[legacyHero];
  return [...Object.values(IE_PRESENTATION_MEDIA), ...IE_PRESENTATION_GALLERY]
    .find(path => path.split("/").pop()?.replace(/\.webp$/, "") === filename);
}

export function presentationSource(src: string | null | undefined, fallback?: string | null): string | undefined {
  // Canonical artwork is authoritative even when a stale API image returns 200.
  // Unmapped runtime media continues to respect administrator-selected sources.
  return fallback || resolveMediaUrl(src) || undefined;
}
