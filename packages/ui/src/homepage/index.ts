export { Homepage, buildHomepageBelowFoldProps, getHomepageHeadHints, type HomepageProps, type HomepageSeo } from "./Homepage.js";
export { HomepageBelowFold, type HomepageBelowFoldProps } from "./HomepageBelowFold.js";
export {
  DeferredBelowFold,
  HomepageFaqJsonLd,
  buildHomepageFaqJsonLd,
  prefetchHomepageBelowFold,
  homepageCacheRecommendations,
  type HomepageHeadConfig,
  type HomepageHeadLink,
  type DeferredBelowFoldProps,
} from "./HomepagePerformance.js";

export {
  TrustSection,
  ServicesSection,
  ServiceLinks,
  ProductCategoriesSection,
  FeaturedProductsSection,
  type TrustSectionProps,
  type TrustIndicator,
  type TrustPartner,
  type TrustStat,
  type ServicesSectionProps,
  type ServicesItem,
  type ProductCategoriesSectionProps,
  type ProductCategoryItem,
  type FeaturedProductsSectionProps,
  type FeaturedProductItem,
  type FeaturedProductCategory,
} from "./TrustServicesCatalog.js";

export {
  ProcurementWorkflowSection,
  IndustriesSection,
  TestimonialsSection,
  FaqSection,
  CtaSection,
  WhyChooseUsSection,
  type ProcurementWorkflowSectionProps,
  type WorkflowStep,
  type IndustriesSectionProps,
  type IndustryItem,
  type TestimonialsSectionProps,
  type TestimonialItem,
  type FaqSectionProps,
  type FaqItem,
  type CtaSectionProps,
  type WhyChooseUsSectionProps,
  type WhyChooseReason,
} from "./WorkflowIndustriesSocial.js";

export {
  InteractiveProcurementTimeline,
  defaultProcurementTimelineSteps,
  type InteractiveProcurementTimelineProps,
  type ProcurementTimelineStep,
  type TimelineStepStatus,
} from "./InteractiveProcurementTimeline.js";

export {
  CompanyOverviewSection,
  SupplierNetworkSection,
  PlatformStatisticsSection,
  NewsletterSection,
  GroupSection,
  SisterBusinessDiscoverySection,
  type CompanyOverviewSectionProps,
  type SupplierNetworkSectionProps,
  type PlatformStatisticsSectionProps,
  type NewsletterSectionProps,
  type GroupSectionProps,
  type GroupBusinessItem,
  type SisterBusinessDiscoveryProps,
} from "./OverviewNetworkStatsNewsletter.js";

export { homepageFixtures } from "./fixtures.js";
export {
  HomepageHero,
  type HomepageHeroProps,
  type HeroStatistic,
  type HeroTrustIndicator,
  type HeroVisualMode,
} from "./HomepageHero.js";
export {
  HeroVisualSystem,
  defaultHeroVisualCards,
  type HeroVisualSystemProps,
  type HeroVisualCard,
} from "./HeroVisualSystem.js";
