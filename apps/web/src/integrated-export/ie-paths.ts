/**
 * Integrated Export route namespace and navigation (IE-1 foundation).
 * No invented commodities or contact details beyond verified Group links.
 */

export const IE_BASE_PATH = "/businesses/almahbub-integrated-export" as const;

export const IE_PATHS = {
  home: IE_BASE_PATH,
  commodities: `${IE_BASE_PATH}/commodities`,
  commodity: (slug: string) => `${IE_BASE_PATH}/commodities/${encodeURIComponent(slug)}`,
  process: `${IE_BASE_PATH}/process`,
  quality: `${IE_BASE_PATH}/quality`,
  markets: `${IE_BASE_PATH}/markets`,
  about: `${IE_BASE_PATH}/about`,
  contact: `${IE_BASE_PATH}/contact`,
  request: `${IE_BASE_PATH}/request`,
} as const;

export type IeNavItem = {
  id: string;
  label: string;
  href: string;
  /** Match nested routes (e.g. commodity detail under Commodities). */
  matchPrefix?: boolean;
};

/** Desktop primary navigation - keep lean. */
export const IE_PRIMARY_NAV: readonly IeNavItem[] = [
  { id: "home", label: "Home", href: IE_PATHS.home },
  {
    id: "commodities",
    label: "Commodities",
    href: IE_PATHS.commodities,
    matchPrefix: true,
  },
  { id: "process", label: "Our Process", href: IE_PATHS.process },
  { id: "quality", label: "Quality & Compliance", href: IE_PATHS.quality },
  { id: "markets", label: "Global Markets", href: IE_PATHS.markets },
  { id: "about", label: "About", href: IE_PATHS.about },
  { id: "contact", label: "Contact", href: IE_PATHS.contact },
] as const;

export const IE_CTA = {
  label: "Request a Quote",
  href: IE_PATHS.request,
} as const;

/** Authenticated procurement create URL, preserving a published commodity slug. */
export function ieProcurementCreatePath(commoditySlug?: string): string {
  const params = new URLSearchParams();
  const slug = commoditySlug?.trim();
  if (slug) params.set("ieCommodity", slug);
  else params.set("lob", "integrated_export");
  const query = params.toString();
  return query ? `/app/requests/new?${query}` : "/app/requests/new";
}

/**
 * Public IE stays informational. Quote/procurement actions send anonymous
 * visitors through login with a safe internal return URL.
 */
export function ieQuoteActionHref(options: {
  commoditySlug?: string;
  authenticated: boolean;
}): string {
  const next = ieProcurementCreatePath(options.commoditySlug);
  if (options.authenticated) return next;
  return `/login?returnTo=${encodeURIComponent(next)}`;
}

/**
 * Legacy single-page hash → multi-page path.
 * Used by SpaLinkInterceptor and on-load hash redirect.
 */
export const IE_HASH_REDIRECTS: Readonly<Record<string, string>> = {
  "portal-home": IE_PATHS.home,
  commodities: IE_PATHS.commodities,
  "bulk-supply": IE_PATHS.commodities,
  export: IE_PATHS.process,
  about: IE_PATHS.about,
  contact: IE_PATHS.contact,
};

export function resolveIeHashPath(hash: string): string | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return null;
  return IE_HASH_REDIRECTS[id] ?? null;
}

export function isIePathActive(
  pathname: string,
  item: IeNavItem,
): boolean {
  if (item.id === "home") {
    return pathname === IE_PATHS.home || pathname === `${IE_PATHS.home}/`;
  }
  if (item.matchPrefix) {
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`)
    );
  }
  return pathname === item.href;
}
