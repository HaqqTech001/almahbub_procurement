import { type ReactNode } from "react";
import {
  GlobalFooter,
  GlobalHeader,
  FooterSeoJsonLd,
  type GlobalFooterProps,
  type GlobalHeaderProps,
} from "../navigation/index.js";
import { cx } from "../utils/cx.js";
import { HomepageHero, type HomepageHeroProps } from "./HomepageHero.js";
import { homepageFixtures } from "./fixtures.js";
import type { HomepageBelowFoldProps } from "./HomepageBelowFold.js";
import { TrustSection, type TrustSectionProps, type FeaturedProductsSectionProps } from "./TrustServicesCatalog.js";
import {
  DeferredBelowFold,
  HomepageFaqJsonLd,
  getHomepageHeadHints,
  type HomepageHeadConfig,
} from "./HomepagePerformance.js";

export type HomepageSeo = HomepageHeadConfig & {
  organizationName?: string;
  organizationUrl?: string;
  contactEmail?: string;
  includeJsonLd?: boolean;
  includeFaqJsonLd?: boolean;
};

export type HomepageProps = {
  className?: string;
  header?: GlobalHeaderProps;
  hero?: HomepageHeroProps;
  trust?: TrustSectionProps;
  belowFold?: Partial<HomepageBelowFoldProps>;
  footer?: GlobalFooterProps;
  seo?: HomepageSeo;
  /**
   * Inject a precomposed below-fold tree (tests/SSR).
   * When omitted, sections 4–15 load via deferred React.lazy + idle prefetch.
   */
  belowFoldSlot?: ReactNode;
  /**
   * Load below-fold immediately (still code-split via lazy; skips intersection wait).
   */
  eagerBelowFold?: boolean;
};

export function buildHomepageBelowFoldProps(
  override?: Partial<HomepageBelowFoldProps>,
): HomepageBelowFoldProps {
  const f = homepageFixtures;
  const featuredOverride = override?.featuredProducts;
  return {
    companyOverview: { ...f.companyOverview, ...override?.companyOverview },
    services: {
      title: f.services.title,
      description: f.services.description,
      services: [...f.services.services],
      primaryCta: f.services.primaryCta,
      ...override?.services,
    },
    ...(featuredOverride
      ? {
          featuredProducts: {
            ...({
              title: f.products.title,
              description: f.products.description,
              catalogHref: f.products.catalogHref,
              categories: f.products.categories ? [...f.products.categories] : [],
              enableSearch: f.products.enableSearch ?? true,
              products: [...f.products.products],
            } satisfies FeaturedProductsSectionProps),
            ...featuredOverride,
          },
        }
      : override && "featuredProducts" in override
        ? {}
        : {
            featuredProducts: {
              title: f.products.title,
              description: f.products.description,
              products: [...f.products.products],
              catalogHref: f.products.catalogHref,
              categories: f.products.categories ? [...f.products.categories] : [],
              enableSearch: f.products.enableSearch ?? true,
            },
          }),
    industries: {
      title: f.industries.title,
      description: f.industries.description,
      industries: [...f.industries.industries],
      ...override?.industries,
    },
    workflow: {
      title: f.workflow.title,
      description: f.workflow.description,
      primaryCta: f.workflow.primaryCta,
      defaultStepId: f.workflow.defaultStepId,
      ...override?.workflow,
    },
    platformStatistics: {
      title: f.platformStatistics.title,
      description: f.platformStatistics.description,
      stats: [...(override?.platformStatistics?.stats ?? f.platformStatistics.stats)],
      methodologyHref: f.platformStatistics.methodologyHref,
      methodologyLabel: f.platformStatistics.methodologyLabel,
      ...override?.platformStatistics,
    },
    whyChooseUs: {
      title: f.whyChooseUs.title,
      description: f.whyChooseUs.description,
      reasons: [...(override?.whyChooseUs?.reasons ?? f.whyChooseUs.reasons)],
      primaryCta: f.whyChooseUs.primaryCta,
      ...override?.whyChooseUs,
    },
    testimonials: {
      title: f.testimonials.title,
      description: f.testimonials.description,
      testimonials: [...f.testimonials.testimonials],
      ...override?.testimonials,
    },
    faq: {
      title: f.faq.title,
      description: f.faq.description,
      items: [...f.faq.items],
      primaryCta: f.faq.primaryCta,
      secondaryCta: f.faq.secondaryCta,
      ...override?.faq,
    },
    newsletter: { ...f.newsletter, ...override?.newsletter },
    cta: { ...f.cta, ...override?.cta },
    ...(override?.sisterBusinessDiscovery
      ? { sisterBusinessDiscovery: override.sisterBusinessDiscovery }
      : {}),
    group: override?.group ?? {
      title: f.group.title,
      description: f.group.description,
      body: f.group.body,
      businesses: [...f.group.businesses],
    },
    ...(override?.productCategories
      ? { productCategories: override.productCategories }
      : {}),
    ...(override?.supplierNetwork
      ? { supplierNetwork: override.supplierNetwork }
      : {}),
  };
}

export { getHomepageHeadHints };

/**
 * Production Homepage - performance-optimized composition.
 * Eager: Header, Hero (SVG LCP), Trust.
 * Deferred + code-split: sections 4–15. Footer stays in shell for crawlability.
 */
export function Homepage({
  className,
  header,
  hero,
  trust,
  belowFold,
  footer,
  seo,
  belowFoldSlot,
  eagerBelowFold = false,
}: HomepageProps) {
  const f = homepageFixtures;
  const heroProps: HomepageHeroProps = {
    ...f.hero,
    animateCounters: false,
    ...hero,
  };
  const trustProps: TrustSectionProps = {
    title: f.trust.title,
    description: f.trust.description,
    indicators: [...f.trust.indicators],
    ...trust,
  };
  const belowProps = buildHomepageBelowFoldProps(belowFold);
  const head = getHomepageHeadHints(seo ?? {});

  return (
    <div
      className={cx("hamd-homepage", className)}
      data-testid="homepage"
      data-seo-title={head.title}
      data-seo-description={head.description}
    >
      {seo?.includeJsonLd === false ? null : (
        <FooterSeoJsonLd
          organizationName={seo?.organizationName ?? "Almahbub International"}
          url={seo?.organizationUrl ?? seo?.canonicalUrl ?? "https://almahbubinternational.com"}
          {...(seo?.contactEmail
            ? { contactEmail: seo.contactEmail }
            : { contactEmail: "almahbubinternational@gmail.com" })}
        />
      )}

      {seo?.includeFaqJsonLd === false ? null : (
        <HomepageFaqJsonLd
          items={[...belowProps.faq.items]}
          {...(seo?.canonicalUrl ? { pageUrl: seo.canonicalUrl } : {})}
        />
      )}

      <GlobalHeader {...header} transparentUntilScroll={header?.transparentUntilScroll ?? true} />

      <main id="main-content" className="hamd-homepage__main">
        <HomepageHero {...heroProps} />
        <TrustSection {...trustProps} />

        <div className="hamd-homepage__below-fold">
          {belowFoldSlot ?? (
            <DeferredBelowFold
              belowFoldProps={belowProps}
              eager={eagerBelowFold}
              prefetchOnIdle
            />
          )}
        </div>
      </main>

      <GlobalFooter {...footer} />
    </div>
  );
}
