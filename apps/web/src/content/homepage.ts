/**
 * Production Homepage content - Version 2 design foundation.
 * Host-owned copy extracted from V1 business intent, rebuilt for V2 IA.
 */
import type { HomepageProps } from "@hamd/ui/homepage";
import {
  HOMEPAGE_INDUSTRY_IDS,
  INDUSTRY_RECORDS,
  toIndustryNavItem,
} from "./industries.js";

const siteUrl = (
  typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL
    ? String(import.meta.env.VITE_SITE_URL)
    : "https://almahbubinternational.com"
).replace(/\/$/, "");

const media = {
  overview: "/media/ie/process-logistics-ship.jpg",
  industrial: "/media/category-industrial.svg",
  electrical: "/media/category-electrical.svg",
  construction: "/media/category-construction.svg",
  healthcare: "/media/category-healthcare.svg",
  productIndustrial: "/media/product-industrial.svg",
  productElectrical: "/media/product-electrical.svg",
  productCustom: "/media/product-custom.svg",
  partnerLogistics: "/media/partner-logistics.svg",
  partnerInspection: "/media/partner-inspection.svg",
  partnerFreight: "/media/partner-freight.svg",
} as const;

export const homepageSeo: NonNullable<HomepageProps["seo"]> = {
  title: "Almahbub | Multi-Commerce Import & Export",
  description:
    "Almahbub International sources devices, machinery and general items. Almahbub Integrated Export supplies agricultural commodities to international buyers.",
  canonicalUrl: `${siteUrl}/`,
  organizationName: "Almahbub",
  organizationUrl: siteUrl,
  contactEmail: "almahbubinternational@gmail.com",
  includeJsonLd: true,
  includeFaqJsonLd: false,
};

/** 1. Hero - dual CTA, enterprise typography, professional visual system. */
export const homepageHero: NonNullable<HomepageProps["hero"]> = {
  brandName: "Almahbub International",
  groupAffiliation: "Part of Almahbub Group",
  groupHref: "/",
  groupExploreLabel: "Explore our businesses",
  headline: "Commerce Across Borders. Sourcing What Businesses Need. Supplying What the World Needs.",
  supportingText:
    "From phones, gadgets and office devices to appliances, machinery, fashion and Nigerian agricultural produce, Almahbub International connects businesses with sourcing and supply opportunities across China, the USA, UK, UAE, Korea and other global markets.",
  primaryCta: { href: "/app/requests/new", label: "Start a procurement request" },
  secondaryCta: { href: "/services", label: "Explore Services" },
  searchLabel: "Search products and capabilities",
  searchPlaceholder: "Product, category, or destination",
  searchAction: "/products",
  animateCounters: false,
  statistics: [],
  trustIndicators: [
    { id: "process", label: "Managed end-to-end process" },
    { id: "rooted", label: "Nigeria-rooted partner" },
    { id: "verify", label: "Quotes & tracking you can verify" },
  ],
  scrollTargetId: "trust",
  visualMode: "layered",
};

/** 2. Trusted Companies - corridor partners with accountable roles. */
export const homepageTrust: NonNullable<HomepageProps["trust"]> = {
  eyebrow: "Your procurement partner",
  title: "Support from sourcing to delivery",
  description:
    "A Nigeria-based team to coordinate suppliers, quotations, and delivery.",
  indicators: [
    {
      id: "process",
      label: "Managed end-to-end process",
      detail:
        "A team to guide your request through sourcing and delivery.",
    },
    {
      id: "rooted",
      label: "Nigeria-rooted partner",
      detail: "Local accountability for cross-border buying decisions.",
    },
    {
      id: "verify",
      label: "Quotes and tracking you can verify",
      detail: "Review quotations and follow confirmed shipment updates.",
    },
  ],
  partners: [],
};

export const homepageBelowFold: NonNullable<HomepageProps["belowFold"]> = {
  /** 3. Company introduction */
  companyOverview: {
    title: "A Nigerian partner for global procurement",
    description:
      "Almahbub International exists to make cross-border buying accountable.",
    body: [
      "We help buyers request, clarify, source, quote, approve, and deliver with a named owner for every next step.",
      "Almahbub International gives operational clarity without turning procurement into consumer checkout. Confirmed records drive status not chat theater.",
    ],
    primaryCta: { href: "/about", label: "About Almahbub" },
    secondaryCta: { href: "/contact", label: "Request Procurement" },
    imageSrc: media.overview,
    imageAlt:
      "Representative aerial photo of a container ship at a port, illustrative of cross-border logistics, not an Almahbub facility",
  },
  /** 4. Core services */
  services: {
    title: "Capabilities beyond product browsing",
    description:
      "Four service lines that turn discovery into accountable delivery.",
    services: [
      {
        id: "global-procurement",
        title: "Global Procurement",
        description:
          "Structured sourcing for complex cross-border requirements with clear commercial ownership.",
        href: "/services/global-procurement",
      },
      {
        id: "import-export",
        title: "Import Coordination",
        description:
          "Documentation-aware trade execution with named owners for each milestone.",
        href: "/services/import-export",
      },
      {
        id: "logistics",
        title: "Logistics",
        description:
          "Shipment planning with honest ETA ranges, exceptions, and tracking you can verify.",
        href: "/services/logistics",
      },
      {
        id: "warehousing",
        title: "Warehousing",
        description:
          "Storage and handling aligned to your delivery plan.",
        href: "/services/warehousing",
      },
    ],
    primaryCta: { href: "/services", label: "View all services" },
  },
  /** 5. Featured products - host injects published catalogue at runtime */
  featuredProducts: {
    title: "Featured sourcing capability",
    description:
      "Published catalogue items you can request. Formal pricing appears in quotations, not as live checkout stock.",
    catalogHref: "/products",
    enableSearch: false,
    searchPlaceholder: "Search the catalogue",
    categories: [],
    products: [],
    emptyTitle: "Can't find what you're looking for?",
    emptyDescription:
      "Almahbub International sources and procures beyond the items currently listed. Tell us what you need and our procurement team can help source it.",
    emptyHref: "/contact",
    emptyLabel: "Request Procurement",
  },
  /** 6. Industries */
  industries: {
    title: "Who we support",
    description:
      "From a first store setup to recurring commercial sourcing and complex organisational procurement, Almahbub helps buyers define what they need, source suitable options, and manage the journey. Examples include corporate equipment, medical and technical kit, retail inventory, boutique and spa setup, office electronics, and home or garden commercial lines. These examples are not a closed list.",
    industries: HOMEPAGE_INDUSTRY_IDS.map((id) => {
      const record = INDUSTRY_RECORDS.find((item) => item.id === id)!;
      return toIndustryNavItem(record);
    }),
  },
  /** 7. Procurement process */
  workflow: {
    title: "A transparent procurement journey",
    description:
      "See where you are, what happens next, and how long each stage typically takes from discovery through delivery.",
    primaryCta: { href: "/contact", label: "Request Procurement" },
    defaultStepId: "request",
  },
  /** 8. Statistics - sourced metrics only */
  platformStatistics: {
    title: "Platform statistics you can source",
    description:
      "Qualified metrics only, each figure carries a methodology reference.",
    methodologyHref: "/about#methodology",
    methodologyLabel: "How we measure",
    stats: [
      {
        id: "corridors",
        value: "12+",
        label: "Active sourcing corridors",
        source: "Internal operations register, 2026",
        sourceHref: "/about#methodology",
      },
      {
        id: "quote-days",
        value: "≤5",
        label: "Business days to typical quote activity",
        source: "Service expectation, not a guarantee",
        sourceHref: "/about#methodology",
      },
      {
        id: "markets",
        value: "30+",
        label: "Destination markets supported",
        source: "Delivery corridor map, 2026",
        sourceHref: "/about#methodology",
      },
      {
        id: "workflow",
        value: "6",
        label: "Governed workflow stages",
        source: "Request → Deliver process model",
        sourceHref: "/about#methodology",
      },
    ],
  },
  /** 9. Why Choose Us */
  whyChooseUs: {
    title: "Why buyers choose Almahbub",
    description:
      "Managed procurement with named ownership, not marketplace browsing or checkout theater.",
    reasons: [
      {
        id: "ownership",
        title: "Named ownership",
        description:
          "Every request has a clear next owner from clarification through delivery.",
      },
      {
        id: "evidence",
        title: "Evidence on the record",
        description:
          "Quotations and shipment milestones wait for confirmed documents, not chat theater.",
      },
      {
        id: "nigeria",
        title: "Nigeria-rooted accountability",
        description:
          "Local operational ownership for cross-border buying into and through Nigeria.",
      },
      {
        id: "honest",
        title: "Honest commercial context",
        description:
          "MOQ and lead-time context before commitment, formal pricing only in quotations.",
      },
    ],
    primaryCta: { href: "/contact", label: "Request Procurement" },
  },
  /** 10. Testimonials */
  testimonials: {
    title: "What Our Customers Say",
    description:
      "Consented buyer comments from completed procurement work. Names are shown only where the buyer agreed to attribution.",
    testimonials: [
      {
        id: "t1",
        quote:
          "We always knew the next owner on our request. Quotes arrived with the evidence we needed to approve.",
        name: "",
        role: "",
        organization: "Industrial buyer, Nigeria",
      },
      {
        id: "t2",
        quote:
          "Tracking stayed honest. When there was a delay, the exception and owner were clear.",
        name: "",
        role: "",
        organization: "Regional distributor",
      },
      {
        id: "t3",
        quote:
          "MOQ and lead-time context showed up before we committed, not after a fake cart total.",
        name: "",
        role: "",
        organization: "Manufacturing buyer",
      },
      {
        id: "t4",
        quote:
          "Clarification sat on the same request record. We did not lose the brief in chat.",
        name: "",
        role: "",
        organization: "Healthcare procurement team",
      },
      {
        id: "t5",
        quote:
          "Shipment updates pointed at the request, not a generic dashboard.",
        name: "",
        role: "",
        organization: "Project buyer",
      },
    ],
  },
  /** 11. FAQ */
  faq: {
    title: "Common procurement questions",
    description: "Clear answers before you contact a specialist.",
    items: [
      {
        id: "q1",
        question: "Do you publish live stock and checkout prices?",
        answer:
          "No. Almahbub provides managed procurement with indicative constraints such as MOQ and lead time. Formal pricing appears in quotations.",
      },
      {
        id: "q2",
        question: "How long does a quotation typically take?",
        answer:
          "Many requests receive quotation activity within 2–5 business days, depending on complexity and documentation completeness. That is a service expectation, not a guarantee.",
      },
      {
        id: "q3",
        question: "Can I track a shipment without an account?",
        answer:
          "Yes. Use Track Shipment with your reference. Confirmed milestones appear when recorded estimates stay clearly labeled.",
      },
      {
        id: "q4",
        question: "What happens after I submit a request?",
        answer:
          "Your request becomes a governed record. A named owner clarifies requirements, sources options, and progresses quotation with evidence on the file.",
      },
      {
        id: "q6",
        question: "Where is the Almahbub International office?",
        answer:
          "The Ilorin office is at Oye's complex, Grace Land junction along Sanrab, Tanke Rd, University Rd, Ilorin 240103, Kwara. Use Contact for the map and visiting details. This is the office location, not a customer delivery address.",
      },
      {
        id: "q7",
        question: "How do I start a procurement request?",
        answer:
          "Create a request from My Requests or Contact. Include the product, quantity, destination, and any specification. A named owner then clarifies and sources options.",
      },
      {
        id: "q8",
        question: "What is Integrated Export?",
        answer:
          "Almahbub Integrated Export Ltd. is a separately registered Group business for agro commodities, bulk supply, and export. It is not part of the Almahbub International product catalogue.",
      },
      {
        id: "q9",
        question: "How are payments handled?",
        answer:
          "Commercial terms appear on the quotation. Payment records follow that quotation once you accept. This website is not a checkout cart.",
      },
      {
        id: "q10",
        question: "Do you deliver to my site?",
        answer:
          "Delivery is planned against the destination on your request. Confirmed shipment milestones appear on the request record when they are recorded.",
      },
    ],
    primaryCta: { href: "/faq", label: "View all FAQs" },
    secondaryCta: { href: "/contact", label: "Contact specialist" },
  },
  newsletter: {
    title: "Stay informed without the noise",
    description:
      "Occasional procurement insights. Request Procurement remains the primary path.",
    helpText:
      "Occasional updates on sourcing, logistics, and accountable delivery.",
    privacyHref: "/privacy",
  },
  /** 12. Contact CTA */
  cta: {
    title: "Ready to start a qualified request?",
    description:
      "Tell us what you need. We clarify, source, quote, and deliver with accountable next steps.",
    primaryCta: { href: "/contact", label: "Request Procurement" },
    secondaryCta: { href: "/contact", label: "Contact specialist" },
    reassurance:
      "No checkout. No invented stock. Your request becomes a governed record.",
  },
};

/** 13. Header + Footer chrome */
export const homepageHeader: NonNullable<HomepageProps["header"]> = {
  brandName: "Almahbub International",
  brandHref: "/",
  brandLogoSrc: "/almahbub.svg",
  brandLogoAlt: "Almahbub International",
  brandAffiliation: "Import & Export",
  brandAffiliationHref: "/",
  /** Conversion CTA lives in hero / section surfaces - not the global navbar. */
  requestCta: null,
  languageOptions: [],
  transparentUntilScroll: true,
  searchAction: "/products",
  searchPlaceholder: "Search products, services, and help",
  /** Simple top-level links - no mega dropdowns on public chrome. */
  megaMenus: [],
  links: [
    { id: "home", label: "Home", href: "/" },
    { id: "global-procurement", label: "Global Procurement", href: "/businesses/almahbub-international" },
    { id: "integrated-export", label: "Nigerian Export", href: "/businesses/almahbub-integrated-export" },
    { id: "products", label: "Products", href: "/products" },
    { id: "about", label: "About", href: "/about" },
    { id: "contact", label: "Contact", href: "/contact" },
  ],
};

export const homepageFooter: NonNullable<HomepageProps["footer"]> = {
  brandName: "Almahbub International",
  brandHref: "/",
  tagline: "Devices, machinery and general items import. Agricultural commodity export.",
  groupName: "Almahbub Group",
  groupHref: "/",
  businessLinks: [
    {
      id: "international",
      label: "Almahbub International",
      href: "/businesses/almahbub-international",
      summary: "Devices, machinery and general items import",
    },
    {
      id: "integrated-export",
      label: "Almahbub Integrated Export Ltd.",
      href: "/businesses/almahbub-integrated-export",
      summary: "Agro commodities for export",
    },
  ],
  companyLinks: [
    { id: "home", label: "Home", href: "/" },
    { id: "about", label: "About", href: "/about" },
    { id: "request", label: "Request Procurement", href: "/contact" },
    { id: "signin", label: "Sign in", href: "/login" },
  ],
  productLinks: [
    { id: "catalog", label: "Product Catalogue", href: "/products" },
    { id: "categories", label: "Categories", href: "/products" },
  ],
  industryLinks: [
    { id: "all-industries", label: "Industries", href: "/industries" },
  ],
  serviceLinks: [
    { id: "all-services", label: "Services", href: "/services" },
  ],
  supportLinks: [
    { id: "contact", label: "Contact", href: "/contact" },
    { id: "faq", label: "FAQ", href: "/faq" },
  ],
  resourceLinks: [],
  legalLinks: [
    { id: "privacy", label: "Privacy Policy", href: "/privacy" },
    { id: "terms", label: "Terms", href: "/terms" },
    { id: "cookies", label: "Cookie Policy", href: "/cookies" },
  ],
  contact: {
    email: "almahbubinternational@gmail.com",
    href: "/contact",
    responseNote: "Typical response within 1 to 2 business days.",
  },
  offices: [
    {
      id: "ilorin",
      city: "Ilorin",
      address:
        "Oye's complex Grace Land junction along Sanrab, Tanke Rd, University Rd, Ilorin 240103, Kwara",
      href: "/contact#ilorin",
    },
  ],
  poweredByLabel: "Powered by HaqqTech",
  newsletterAction: "/newsletter",
  newsletterPrivacyHref: "/privacy",
  organizationUrl: siteUrl,
  includeJsonLd: false,
};
