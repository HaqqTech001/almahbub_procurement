import { SITE, absoluteUrl, type PageSeo } from "../content/site.js";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  let element = document.head.querySelector(
    `link[rel="${rel}"]${extra?.hreflang ? `[hreflang="${extra.hreflang}"]` : ""}`,
  );
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      element.setAttribute(k, v);
    }
  }
}

/** Production SEO manager - title, description, OG, Twitter, robots, canonical. */
export function applyPageSeo(seo: PageSeo): void {
  const brandName =
    seo.path === "/" || seo.path === "/about"
      ? "Almahbub"
      : seo.path.startsWith("/businesses/almahbub-integrated-export")
        ? "Almahbub Integrated Export"
        : SITE.name;
  const title = seo.title.includes(brandName)
    ? seo.title
    : `${seo.title} | ${brandName}`;
  const url = absoluteUrl(seo.path);
  const image = absoluteUrl(seo.ogImage ?? SITE.defaultOgImage);
  const robots = seo.noIndex ? "noindex, nofollow" : "index, follow";

  document.title = title;
  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "robots", robots);
  upsertMeta("name", "theme-color", "#0B1F3A");

  upsertMeta("property", "og:site_name", brandName);
  upsertMeta("property", "og:locale", SITE.locale);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:type", seo.type ?? "website");
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:image", image);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", image);
  if (SITE.twitterHandle) {
    upsertMeta("name", "twitter:site", SITE.twitterHandle);
  }

  upsertLink("canonical", url);
}

export function applyJsonLd(
  data: Record<string, unknown>,
  id = "hamd-jsonld",
): void {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
