import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Homepage } from "@hamd/ui/homepage";
import type { CatalogProduct } from "@hamd/ui/catalog";
import "../styles/catalog-public.js";
import { useTheme } from "../app/providers/ThemeProvider.js";
import {
  homepageBelowFold,
  homepageFooter,
  homepageHero,
  homepageSeo,
  homepageTrust,
} from "../content/homepage.js";
import { usePublicHeaderProps } from "../lib/use-public-header-props.js";
import {
  loadHomepageProducts,
  type HomepageProductCategory,
} from "../lib/homepage-products.js";
import type { ProductCategoryItem } from "@hamd/ui/homepage";
import {
  newsletterSuccessMessage,
  subscribeNewsletter,
} from "../lib/newsletter.js";
import { applyDocumentSeo } from "../lib/seo-homepage.js";
import {
  GROUP,
  GROUP_BUSINESSES,
  ALMAHBUB_INTERNATIONAL,
  ALMAHBUB_INTEGRATED_EXPORT,
  INTEGRATED_EXPORT_BRAND,
  INTEGRATED_EXPORT_DISCOVERY,
} from "../content/group.js";

/**
 * Production Homepage - RC4.2 / RC9 / RC-POLISH-06
 * Global wedding invitation mounts once at App level, not inside this page.
 */
export function HomePage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<HomepageProductCategory[]>([]);
  const [categoryItems, setCategoryItems] = useState<ProductCategoryItem[]>([]);
  const [productsReady, setProductsReady] = useState(false);
  const [catalogSource, setCatalogSource] = useState<"api" | "empty" | "error" | null>(null);

  const header = usePublicHeaderProps({
    theme,
    onThemeChange: setTheme,
    transparentUntilScroll: false,
  });

  useEffect(() => {
    applyDocumentSeo(homepageSeo);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadHomepageProducts().then((result) => {
      if (cancelled) return;
      setProducts(result.products);
      setCategories(result.categories);
      setCategoryItems(result.categoryItems);
      setCatalogSource(result.source);
      setProductsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onNewsletterSubmit = useCallback(async (email: string) => {
    await subscribeNewsletter(email);
  }, []);

  const onQuickQuote = useCallback(
    (product: CatalogProduct) => {
      navigate(product.requestHref);
    },
    [navigate],
  );

  const onHeroSearch = useCallback(
    (query: string) => {
      navigate(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
    },
    [navigate],
  );

  const featuredCategories = useMemo(
    () => categories.map((item) => ({ id: item.id, name: item.name, href: item.href })),
    [categories],
  );

  const belowFold = useMemo(
    () => ({
      ...homepageBelowFold,
      ...(catalogSource !== "error" && productsReady && products.length > 0
        ? {
            featuredProducts: {
              ...homepageBelowFold.featuredProducts!,
              eyebrow: "Published products",
              title: "Real products you can request",
              description:
                "A selection of published catalogue items. Formal pricing appears in quotations, not as live checkout stock.",
              products,
              categories: featuredCategories,
              enableSearch: false,
              catalogHref: "/products",
              onQuickQuote,
            },
          }
        : { featuredProducts: undefined }),
      productCategories:
        categoryItems.length > 0
          ? {
              eyebrow: "Product categories",
              title: "What can we source for you?",
              description:
                "Explore Almahbub International procurement categories. Browse published items, or request sourcing when the exact product is not listed yet.",
              categories: categoryItems,
              viewAllHref: "/products",
            }
          : undefined,
      sisterBusinessDiscovery: {
        id: INTEGRATED_EXPORT_DISCOVERY.id,
        eyebrow: INTEGRATED_EXPORT_DISCOVERY.eyebrow,
        title: INTEGRATED_EXPORT_DISCOVERY.title,
        description: INTEGRATED_EXPORT_DISCOVERY.description,
        focus: INTEGRATED_EXPORT_DISCOVERY.focusShort,
        href: INTEGRATED_EXPORT_DISCOVERY.href,
        ctaLabel: INTEGRATED_EXPORT_DISCOVERY.ctaLabel,
        logoSrc: INTEGRATED_EXPORT_BRAND.logoSrc,
        capabilities: [...ALMAHBUB_INTEGRATED_EXPORT.capabilities],
        mediaLabel: INTEGRATED_EXPORT_DISCOVERY.mediaLabel,
        mark: ALMAHBUB_INTEGRATED_EXPORT.mark,
        groupHref: GROUP.href,
        groupLabel: GROUP.endorsement,
        groupEyebrow: INTEGRATED_EXPORT_DISCOVERY.groupEyebrow,
        groupTagline: INTEGRATED_EXPORT_DISCOVERY.groupTagline,
        currentLabel: INTEGRATED_EXPORT_DISCOVERY.currentLabel,
        currentName: INTEGRATED_EXPORT_DISCOVERY.currentName,
        currentHref: INTEGRATED_EXPORT_DISCOVERY.currentHref,
        currentFocus: ALMAHBUB_INTERNATIONAL.focusShort,
        currentSummary: ALMAHBUB_INTERNATIONAL.summary,
        currentDescription: ALMAHBUB_INTERNATIONAL.description[0],
        currentCapabilities: [...ALMAHBUB_INTERNATIONAL.capabilities],
        currentLogoSrc: INTEGRATED_EXPORT_DISCOVERY.currentLogoSrc,
        currentMediaLabel: ALMAHBUB_INTERNATIONAL.mediaLabel,
        currentCta: ALMAHBUB_INTERNATIONAL.cta,
        exploreLabel: INTEGRATED_EXPORT_DISCOVERY.exploreLabel,
        tone: INTEGRATED_EXPORT_DISCOVERY.tone,
      },
      group: {
        eyebrow: GROUP.endorsement,
        title: GROUP.name,
        description: GROUP.tagline,
        body: GROUP.description,
        structureHref: GROUP.href,
        overviewCta: { href: GROUP.href, label: `Explore ${GROUP.name}` },
        businesses: GROUP_BUSINESSES.map((business) => ({
          id: business.id,
          name: business.name,
          href: business.href,
          focus: business.focusShort,
          summary: business.summary,
          capabilities: [...business.capabilities],
          ctaHref: business.cta.href,
          ctaLabel: business.cta.label,
          mark: business.mark,
          mediaLabel: business.mediaLabel,
          ...(business.id === ALMAHBUB_INTERNATIONAL.id
            ? { logoSrc: "/almahbub.svg" }
            : business.id === ALMAHBUB_INTEGRATED_EXPORT.id
              ? { logoSrc: INTEGRATED_EXPORT_BRAND.logoSrc }
            : {}),
        })),
      },
    }),
    [
      catalogSource,
      categoryItems,
      featuredCategories,
      onQuickQuote,
      products,
      productsReady,
    ],
  );

  return (
    <>
    <Homepage
      seo={homepageSeo}
      hero={{ ...homepageHero, onSearchSubmit: onHeroSearch }}
      trust={homepageTrust}
      belowFold={belowFold}
      header={header}
      footer={{
        ...homepageFooter,
        onNewsletterSubmit,
        newsletterSuccessMessage,
      }}
      eagerBelowFold={import.meta.env.MODE === "test"}
    />
    </>
  );
}
