/** Site-wide constants - CMS/API can replace content modules later without route changes. */
export const SITE = {
  name: "Almahbub International",
  product: "Almahbub International",
  tagline: "Global procurement. Local accountability.",
  url: (
    typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL
      ? String(import.meta.env.VITE_SITE_URL)
      : "https://almahbubinternational.com"
  ).replace(/\/$/, ""),
  contactEmail: "almahbubinternational@gmail.com",
  defaultOgImage: "/og-default.svg",
  locale: "en_US",
  twitterHandle: "@almahbub",
} as const;

export type PageSeo = {
  title: string;
  description: string;
  path: string;
  ogImage?: string | undefined;
  noIndex?: boolean | undefined;
  type?: "website" | "article" | undefined;
};

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.url}${normalized}`;
}
