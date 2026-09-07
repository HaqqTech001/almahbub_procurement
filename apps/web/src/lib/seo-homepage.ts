import type { HomepageSeo } from "@hamd/ui/homepage";
import { getHomepageHeadHints } from "@hamd/ui/homepage";
import { applyPageSeo } from "./seo.js";
import { SITE } from "../content/site.js";

/** Homepage-specific SEO bridge to the shared SEO manager. */
export function applyDocumentSeo(seo: HomepageSeo): void {
  const head = getHomepageHeadHints(seo);
  applyPageSeo({
    title: head.title,
    description: head.description,
    path: "/",
    ogImage: SITE.defaultOgImage,
  });
}
