import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FaqItem } from "./WorkflowIndustriesSocial.js";
import type { HomepageBelowFoldProps } from "./HomepageBelowFold.js";

/** Prefetch the below-fold homepage chunk during idle time. */
export function prefetchHomepageBelowFold(): Promise<unknown> {
  return import("./HomepageBelowFold.js");
}

export type HomepageHeadLink = {
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

export type HomepageHeadConfig = {
  /** Document title for SEO */
  title?: string;
  description?: string;
  canonicalUrl?: string;
  /** Hero photographic LCP - only when using image/hybrid modes */
  heroImageSrc?: string;
  heroImageType?: string;
  /** Preconnect origins (CDN, API) */
  preconnect?: readonly string[];
  /** Prefetch next-route hints (e.g. /request) */
  prefetchRoutes?: readonly string[];
  /** Optional self-hosted font files - always pair with font-display: swap */
  fontFiles?: readonly { href: string; type?: string }[];
};

/**
 * Build production <head> hints for the public Homepage.
 * Hosts should render these in document head (Next Metadata API, remix Meta, etc.).
 */
export function getHomepageHeadHints(config: HomepageHeadConfig = {}): {
  title: string;
  description: string;
  canonicalUrl?: string;
  links: HomepageHeadLink[];
  meta: { name?: string; property?: string; content: string }[];
} {
  const title =
    config.title ??
    "Almahbub International | Global Procurement Partner";
  const description =
    config.description ??
    "Procure globally with a Nigerian partner accountable for every next step. Request, clarify, source, quote, approve, and deliver.";

  const links: HomepageHeadLink[] = [];

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

  for (const route of config.prefetchRoutes ?? ["/request", "/services", "/catalog"]) {
    links.push({ rel: "prefetch", href: route });
  }

  const meta: { name?: string; property?: string; content: string }[] = [
    { name: "description", content: description },
    { name: "robots", content: "index,follow" },
    { name: "theme-color", content: "#155aaf" },
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
    { property: "og:locale", content: "en_NG" },
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

export type HomepageFaqJsonLdProps = {
  items: readonly FaqItem[];
  pageUrl?: string;
};

/** FAQPage JSON-LD for SEO - only emit when answers are factual. */
export function buildHomepageFaqJsonLd({
  items,
  pageUrl,
}: HomepageFaqJsonLdProps): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(pageUrl ? { url: pageUrl } : {}),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function HomepageFaqJsonLd(props: HomepageFaqJsonLdProps) {
  const data = buildHomepageFaqJsonLd(props);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const LazyBelowFold = lazy(() => import("./HomepageBelowFold.js"));

export type DeferredBelowFoldProps = {
  children?: ReactNode;
  belowFoldProps?: HomepageBelowFoldProps;
  rootMargin?: string;
  prefetchOnIdle?: boolean;
  /** Skip intersection wait and load immediately (still async chunk). */
  eager?: boolean;
  fallback?: ReactNode;
  className?: string;
};

function DefaultFallback() {
  return (
    <div className="hamd-homepage__lazy-fallback" role="status" aria-live="polite">
      Loading section…
    </div>
  );
}

/**
 * Defers below-fold JS until near viewport (or idle prefetch).
 * Improves TBT / LCP by keeping the initial bundle focused on Header + Hero + Trust.
 */
export function DeferredBelowFold({
  children,
  belowFoldProps,
  rootMargin = "400px 0px",
  prefetchOnIdle = true,
  eager = false,
  fallback,
  className,
}: DeferredBelowFoldProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);

  useEffect(() => {
    if (shouldLoad) return;

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    /** Safety net when IntersectionObserver is delayed (content-visibility / short viewports). */
    const safetyId = setTimeout(() => setShouldLoad(true), 2800);

    if (prefetchOnIdle && typeof window !== "undefined") {
      const run = () => prefetchHomepageBelowFold();
      const ric = (
        window as Window & {
          requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
          cancelIdleCallback?: (id: number) => void;
        }
      ).requestIdleCallback;
      if (typeof ric === "function") {
        idleId = ric(run, { timeout: 2500 });
      } else {
        timeoutId = setTimeout(run, 1200);
      }
    }

    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return () => {
        clearTimeout(safetyId);
        if (idleId !== undefined) {
          (
            window as Window & { cancelIdleCallback?: (id: number) => void }
          ).cancelIdleCallback?.(idleId);
        }
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(safetyId);
      if (idleId !== undefined) {
        (
          window as Window & { cancelIdleCallback?: (id: number) => void }
        ).cancelIdleCallback?.(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [prefetchOnIdle, rootMargin, shouldLoad]);

  return (
    <div className={className} data-testid="deferred-below-fold">
      <div ref={sentinelRef} className="hamd-homepage__defer-sentinel" aria-hidden="true" />
      {shouldLoad ? (
        <Suspense fallback={fallback ?? <DefaultFallback />}>
          {children ??
            (belowFoldProps ? <LazyBelowFold {...belowFoldProps} /> : null)}
        </Suspense>
      ) : (
        <div className="hamd-homepage__defer-spacer" aria-hidden="true" />
      )}
    </div>
  );
}

/** Cache-Control recommendations for host CDN / reverse proxy. */
export const homepageCacheRecommendations = {
  html: "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
  staticAssets: "public, max-age=31536000, immutable",
  images: "public, max-age=86400, stale-while-revalidate=604800",
  fonts: "public, max-age=31536000, immutable",
  cssJsHashed: "public, max-age=31536000, immutable",
  api: "private, no-store",
} as const;
