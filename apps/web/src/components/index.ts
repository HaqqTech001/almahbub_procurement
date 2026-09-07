/**
 * Public website component barrel - prefer @hamd/ui primitives; host adds
 * foundation-only pieces (forms, breadcrumb, pagination, success).
 */
export {
  Container,
  Section,
  SectionTitle,
  Button,
  ButtonLink,
  Badge,
  Card,
  FeatureCard,
  ServiceCard,
  FaqAccordion,
  SkipLink,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  BackgroundPattern,
  NewsletterCapture,
  OptimizedImage,
  PoweredByAttribution,
} from "@hamd/ui/primitives";

export { Breadcrumb, type BreadcrumbItem } from "./Breadcrumb.js";
export { SuccessState } from "./SuccessState.js";
export { Field, TextInput, TextArea, Select } from "./FormControls.js";
export { SearchBar } from "./SearchBar.js";
export { Pagination } from "./Pagination.js";
export { PageHero } from "./PageHero.js";
export { PageTransition } from "./PageTransition.js";
export { CookieConsentBanner } from "./CookieConsentBanner.js";
export {
  HostAlert,
  HostBackLink,
  HostLoading,
  HostPage,
  HostStatus,
} from "./HostChrome.js";
export {
  Tabs,
  TabPanel,
  Chip,
  Tooltip,
  Drawer,
  Stepper,
  NotificationItem,
  Popover,
  Timeline,
} from "./InteractionKit.js";
export { ContactCta } from "./ContactCta.js";
/** Accordion for FAQ - shared primitive. */
export { FaqAccordion as Accordion } from "@hamd/ui/primitives";
export {
  TestimonialsSection as Testimonials,
  InteractiveProcurementTimeline as ProcurementTimeline,
} from "@hamd/ui/homepage";
export { ProductCard } from "@hamd/ui/catalog";
export { NewsletterCapture as Newsletter } from "@hamd/ui/primitives";
export { ServiceCard as ServiceCards } from "@hamd/ui/primitives";
