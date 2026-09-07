/** Enterprise performance contracts - Lighthouse >95 / a11y·BP·SEO 100. */

/** Host CDN / reverse-proxy Cache-Control recommendations. */
export const platformCacheRecommendations = {
  html: "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
  staticAssets: "public, max-age=31536000, immutable",
  images: "public, max-age=86400, stale-while-revalidate=604800",
  fonts: "public, max-age=31536000, immutable",
  cssJsHashed: "public, max-age=31536000, immutable",
  openApi: "public, max-age=300, stale-while-revalidate=3600",
  apiPrivate: "private, no-store",
  apiPublicRead: "private, max-age=0, must-revalidate",
} as const;

/**
 * Initial JS budgets for public marketing surfaces (gzip, mobile mid-tier).
 * Host CI should fail when measured transfer exceeds these soft caps.
 */
export const lighthouseBundleBudgets = {
  /** First-load JS for homepage (header + hero + trust). */
  homepageInitialJsKb: 170,
  /** Deferred below-fold homepage chunk. */
  homepageBelowFoldJsKb: 120,
  /** Auth shell without Framer. */
  authShellJsKb: 90,
  /** Client dashboard overview chunk (before deferred widgets). */
  clientDashboardCoreJsKb: 140,
  /** Deferred dashboard widgets chunk. */
  clientDashboardDeferredJsKb: 100,
  /** Total unused JS warning threshold. */
  unusedJsWarnKb: 40,
} as const;

export const fontLoadingPolicy = {
  /** Never block first paint on webfonts for public surfaces. */
  display: "swap" as const,
  /** Prefer system stack; self-host only with preload + woff2. */
  criticalStack:
    '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
  /** Do not load Google Fonts / Adobe Fonts on the homepage critical path. */
  disallowThirdPartyOnCriticalPath: true,
} as const;

export type ResponsiveImageCandidate = {
  src: string;
  width: number;
  type?: "image/avif" | "image/webp" | "image/jpeg" | "image/png" | string;
};

/** Build a `srcSet` string from width candidates (smallest → largest). */
export function buildSrcSet(
  candidates: readonly ResponsiveImageCandidate[],
): string {
  return [...candidates]
    .sort((a, b) => a.width - b.width)
    .map((c) => `${c.src} ${c.width}w`)
    .join(", ");
}

/** Prefer AVIF → WebP → original for a CDN-transformed URL base. */
export function preferModernImageFormats(
  baseUrl: string,
  widths: readonly number[] = [480, 768, 1280],
): {
  avifSrcSet: string;
  webpSrcSet: string;
  fallbackSrc: string;
  sizes: string;
} {
  const clean = baseUrl.split("?")[0] ?? baseUrl;
  const avif = widths.map((w) => ({
    src: `${clean}?fm=avif&w=${w}`,
    width: w,
    type: "image/avif" as const,
  }));
  const webp = widths.map((w) => ({
    src: `${clean}?fm=webp&w=${w}`,
    width: w,
    type: "image/webp" as const,
  }));
  return {
    avifSrcSet: buildSrcSet(avif),
    webpSrcSet: buildSrcSet(webp),
    fallbackSrc: `${clean}?fm=jpg&w=${widths[widths.length - 1] ?? 1280}`,
    sizes: "(max-width: 768px) 100vw, 50vw",
  };
}

export type PublicPageHeadConfig = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  themeColor?: string;
  locale?: string;
  heroImageSrc?: string;
  heroImageType?: string;
  preconnect?: readonly string[];
  prefetchRoutes?: readonly string[];
  fontFiles?: readonly { href: string; type?: string }[];
};

export type PublicPageHeadLink = {
  rel:
    | "preload"
    | "prefetch"
    | "preconnect"
    | "dns-prefetch"
    | "modulepreload"
    | "canonical";
  href: string;
  as?: "image" | "style" | "script" | "font" | "fetch";
  type?: string;
  crossOrigin?: "anonymous" | "use-credentials";
  media?: string;
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Shared public-page head hints for Lighthouse SEO + Best Practices 100.
 * Hosts map into Next Metadata / document head.
 */
export function getPublicPageHeadHints(config: PublicPageHeadConfig = {}): {
  title: string;
  description: string;
  canonicalUrl?: string;
  links: PublicPageHeadLink[];
  meta: { name?: string; property?: string; content: string; httpEquiv?: string }[];
} {
  const title =
    config.title ??
    "Almahbub International | Global Procurement Partner";
  const description =
    config.description ??
    "Procure globally with a Nigerian partner accountable for every next step.";
  const themeColor = config.themeColor ?? "#155aaf";
  const links: PublicPageHeadLink[] = [];

  for (const origin of config.preconnect ?? []) {
    links.push({ rel: "preconnect", href: origin, crossOrigin: "anonymous" });
    links.push({ rel: "dns-prefetch", href: origin });
  }

  if (config.heroImageSrc) {
    links.push({
      rel: "preload",
      href: config.heroImageSrc,
      as: "image",
      fetchPriority: "high",
      ...(config.heroImageType ? { type: config.heroImageType } : {}),
    });
  }

  for (const font of config.fontFiles ?? []) {
    links.push({
      rel: "preload",
      href: font.href,
      as: "font",
      type: font.type ?? "font/woff2",
      crossOrigin: "anonymous",
    });
  }

  for (const route of config.prefetchRoutes ?? []) {
    links.push({ rel: "prefetch", href: route });
  }

  const meta: {
    name?: string;
    property?: string;
    content: string;
    httpEquiv?: string;
  }[] = [
    { name: "description", content: description },
    { name: "robots", content: "index,follow" },
    { name: "theme-color", content: themeColor },
    { name: "color-scheme", content: "light" },
    { name: "format-detection", content: "telephone=no" },
    { name: "referrer", content: "strict-origin-when-cross-origin" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Almahbub International" },
    { property: "og:locale", content: config.locale ?? "en_NG" },
  ];

  if (config.canonicalUrl) {
    links.push({ rel: "canonical", href: config.canonicalUrl });
    meta.push({ property: "og:url", content: config.canonicalUrl });
  }
  if (config.heroImageSrc) {
    meta.push({ property: "og:image", content: config.heroImageSrc });
    meta.push({ name: "twitter:image", content: config.heroImageSrc });
  }

  return {
    title,
    description,
    links,
    meta,
    ...(config.canonicalUrl ? { canonicalUrl: config.canonicalUrl } : {}),
  };
}
