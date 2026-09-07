import {
  CompanyOverviewSection,
  GroupSection,
  NewsletterSection,
  PlatformStatisticsSection,
  SisterBusinessDiscoverySection,
  SupplierNetworkSection,
  type CompanyOverviewSectionProps,
  type GroupSectionProps,
  type NewsletterSectionProps,
  type PlatformStatisticsSectionProps,
  type SisterBusinessDiscoveryProps,
  type SupplierNetworkSectionProps,
} from "./OverviewNetworkStatsNewsletter.js";
import {
  FeaturedProductsSection,
  ProductCategoriesSection,
  ServicesSection,
  type FeaturedProductsSectionProps,
  type ProductCategoriesSectionProps,
  type ServicesSectionProps,
} from "./TrustServicesCatalog.js";
import {
  CtaSection,
  FaqSection,
  IndustriesSection,
  ProcurementWorkflowSection,
  TestimonialsSection,
  WhyChooseUsSection,
  type CtaSectionProps,
  type FaqSectionProps,
  type IndustriesSectionProps,
  type ProcurementWorkflowSectionProps,
  type TestimonialsSectionProps,
  type WhyChooseUsSectionProps,
} from "./WorkflowIndustriesSocial.js";

export type HomepageBelowFoldProps = {
  companyOverview: CompanyOverviewSectionProps;
  services: ServicesSectionProps;
  /** Optional: omit when the published catalogue is empty so categories lead discovery. */
  featuredProducts?: FeaturedProductsSectionProps | undefined;
  industries: IndustriesSectionProps;
  workflow: ProcurementWorkflowSectionProps;
  platformStatistics: PlatformStatisticsSectionProps;
  whyChooseUs: WhyChooseUsSectionProps;
  testimonials: TestimonialsSectionProps;
  faq: FaqSectionProps;
  newsletter: NewsletterSectionProps;
  cta: CtaSectionProps;
  /**
   * Sister-company portal entry, after International intro (company overview),
   * before deeper International product/services content.
   */
  sisterBusinessDiscovery?: SisterBusinessDiscoveryProps | undefined;
  group?: GroupSectionProps | undefined;
  productCategories?: ProductCategoriesSectionProps | undefined;
  supplierNetwork?: SupplierNetworkSectionProps | undefined;
};

/**
 * Below-fold homepage: Almahbub International first.
 * Hero + Trust (eager) → Company overview → Integrated Export discovery →
 * Services → Product categories → Featured products (when published) → …
 */
export function HomepageBelowFold({
  companyOverview,
  services,
  featuredProducts,
  industries,
  workflow,
  platformStatistics,
  whyChooseUs,
  testimonials,
  faq,
  newsletter,
  cta,
  sisterBusinessDiscovery,
  group,
  productCategories,
  supplierNetwork,
}: HomepageBelowFoldProps) {
  return (
    <>
      <CompanyOverviewSection {...companyOverview} />
      {sisterBusinessDiscovery ? (
        <SisterBusinessDiscoverySection {...sisterBusinessDiscovery} />
      ) : null}
      <ServicesSection {...services} />
      {productCategories ? <ProductCategoriesSection {...productCategories} /> : null}
      {featuredProducts ? <FeaturedProductsSection {...featuredProducts} /> : null}
      <IndustriesSection {...industries} />
      {supplierNetwork ? <SupplierNetworkSection {...supplierNetwork} /> : null}
      <ProcurementWorkflowSection {...workflow} />
      <PlatformStatisticsSection {...platformStatistics} />
      <WhyChooseUsSection {...whyChooseUs} />
      <TestimonialsSection {...testimonials} />
      <FaqSection {...faq} />
      {group ? <GroupSection {...group} /> : null}
      <NewsletterSection {...newsletter} />
      <CtaSection {...cta} />
    </>
  );
}

export default HomepageBelowFold;
