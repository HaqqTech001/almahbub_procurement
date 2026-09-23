import { OWNER_INTEGRATED_EXPORT_LOGO } from "./owner-integrated-export-logo.js";

/**
 * Almahbub Group information architecture.
 * Two separately registered businesses. No invented legal claims.
 *
 * Integrated Export portal brand tokens are configurable so an official
 * identity can replace the provisional agro/export palette later.
 */
export const GROUP = {
  name: "Almahbub Group",
  endorsement: "Part of Almahbub Group",
  tagline: "Two distinct businesses. One broader supply and trade ecosystem.",
  description:
    "Almahbub Group brings together distinct businesses across procurement, supply, and international trade. Each company is separately registered and keeps its own focus.",
  operatingNote:
    "This website is operated by Almahbub International, the procurement platform for buyers who need accountable cross-border sourcing.",
  href: "/",
  /** Subtle hero / secondary discovery into the group overview. */
  exploreLabel: "Explore our businesses",
  switcherLabel: "Your businesses",
} as const;

/**
 * Integrated Export visual system.
 * Official logo supplied by the owner for the V2 launch.
 * Colour tokens remain complementary to the approved mark.
 */
export const INTEGRATED_EXPORT_BRAND = {
  slug: "almahbub-integrated-export",
  wordmark: "Almahbub Integrated Export Ltd.",
  wordmarkShort: "Integrated Export",
  /** Compact fallback for text-only UI where the full logo cannot fit. */
  provisionalMark: "IE",
  /** Owner-approved official Integrated Export logo supplied for the V2 launch. */
  logoSrc: OWNER_INTEGRATED_EXPORT_LOGO,
  logoAlt: "Almahbub Integrated Export Ltd. logo",
  endorsement: "Part of Almahbub Group",
  /**
   * CSS custom properties applied under [data-business="almahbub-integrated-export"].
   * Deep green + warm earth - distinct from International blue, brand-compatible.
   */
  cssVars: {
    light: {
      "--aie-accent": "#1f6b45",
      "--aie-accent-hover": "#185637",
      "--aie-accent-muted": "#e8f3ec",
      "--aie-accent-border": "#9bc4ab",
      "--aie-warm": "#9a6b3f",
      "--aie-on-accent": "#ffffff",
    },
    dark: {
      "--aie-accent": "#5ec48a",
      "--aie-accent-hover": "#7dd3a2",
      "--aie-accent-muted": "#163526",
      "--aie-accent-border": "#2f6b4c",
      "--aie-warm": "#d4a574",
      "--aie-on-accent": "#0b1a12",
    },
  },
} as const;

/**
 * Homepage business-relationship transition - not a department callout.
 * Placed after International company overview; below the hero.
 */
export const INTEGRATED_EXPORT_DISCOVERY = {
  id: "integrated-export-discovery",
  groupEyebrow: "Part of Almahbub Group",
  groupTagline: "Two businesses. One broader supply and trade ecosystem.",
  currentLabel: "Current website",
  currentName: "Almahbub International",
  currentHref: "/businesses/almahbub-international",
  currentLogoSrc: "/almahbub.svg",
  exploreLabel: "Explore our other business",
  eyebrow: "Interested in agro and export?",
  title: "Explore Almahbub Integrated Export Ltd.",
  description:
    "A dedicated business focused on agro commodities, bulk supply and export. Separately registered within Almahbub Group, and not part of the Almahbub International catalogue.",
  focusShort: "Agro commodities, bulk supply, export",
  href: "/businesses/almahbub-integrated-export",
  ctaLabel: "Explore Integrated Export",
  logoSrc: INTEGRATED_EXPORT_BRAND.logoSrc,
  mediaLabel: undefined,
  tone: "export" as const,
} as const;

/** Multi-page portal (IE-1). Hash destinations redirect to real routes. */
export const INTEGRATED_EXPORT_PORTAL = {
  path: "/businesses/almahbub-integrated-export",
  nav: [
    { id: "home", label: "Home", href: "/businesses/almahbub-integrated-export" },
    {
      id: "commodities",
      label: "Commodities",
      href: "/businesses/almahbub-integrated-export/commodities",
    },
    {
      id: "process",
      label: "Our Process",
      href: "/businesses/almahbub-integrated-export/process",
    },
    {
      id: "quality",
      label: "Quality & Compliance",
      href: "/businesses/almahbub-integrated-export/quality",
    },
    {
      id: "markets",
      label: "Global Markets",
      href: "/businesses/almahbub-integrated-export/markets",
    },
    {
      id: "about",
      label: "About",
      href: "/businesses/almahbub-integrated-export/about",
    },
    {
      id: "contact",
      label: "Contact",
      href: "/businesses/almahbub-integrated-export/contact",
    },
  ],
  hero: {
    eyebrow: "Part of Almahbub Group",
    title: "Almahbub Integrated Export Ltd.",
    description:
      "A distinct Almahbub Group business focused on agro commodities, bulk supply, and export for buyers and partners who need a clear, accountable trade counterpart.",
    primaryCta: {
      href: "/businesses/almahbub-integrated-export/commodities",
      label: "Explore Commodities",
    },
    secondaryCta: {
      href: "/businesses/almahbub-integrated-export/request",
      label: "Request a Quote",
    },
  },
  commodities: {
    id: "commodities",
    title: "Agro Commodities",
    description:
      "Browse agricultural commodities. Grades, packaging and availability are confirmed in your quotation.",
    points: [
      "Enquiry-led commodity discussions",
      "Clear separation from International retail/procurement catalogue",
      "Named ownership on next steps",
    ],
    mediaLabel: "Commodities capability - approved imagery forthcoming",
  },
  bulkSupply: {
    id: "bulk-supply",
    title: "Bulk Supply",
    description:
      "Support for volume-oriented supply conversations where specifications, timing, and logistics must be clarified before commitment.",
    points: [
      "Bulk quantity and specification clarification",
      "Coordination with export logistics planning",
      "No self-serve checkout on this website",
    ],
    mediaLabel: "Bulk supply capability - approved imagery forthcoming",
  },
  export: {
    id: "export",
    title: "Export",
    description:
      "Export-oriented engagement for cross-border agro trade. Documentation and commercial terms are handled through structured enquiry - not as an online marketplace.",
    points: [
      "Export enquiry routing",
      "Trade documentation discussed case by case",
      "Distinct from Almahbub International procurement workflows",
    ],
    mediaLabel: "Export capability - approved imagery forthcoming",
  },
  about: {
    id: "about",
    title: "About this business",
    body: [
      "Almahbub Integrated Export Ltd. is a separately registered company within Almahbub Group.",
      "It is not a department of Almahbub International. Its agro commodities, bulk supply, and export focus is presented here as a dedicated business portal within the same platform.",
    ],
  },
  contact: {
    id: "contact",
    title: "Enquire with Integrated Export",
    description:
      "Tell us what you need. We will route your enquiry to the appropriate Almahbub Integrated Export team. This is not a transactional checkout.",
    cta: {
      href: "/businesses/almahbub-integrated-export/request",
      label: "Request a Quote",
    },
    note: "Portal foundation - detailed commodity catalogues and structured export quotation forms are being prepared. Specific grades and commercial terms remain enquiry-led.",
  },
  footerNote: "Almahbub Integrated Export Ltd. Part of Almahbub Group",
  /**
   * IE-2 homepage - copy derived only from verified Group/IE content above.
   * No invented volumes, certifications, countries, commodities, or facilities.
   */
  home: {
    heroLead: "Agro commodities, bulk supply, and export",
    honestyNote:
      "This portal is the dedicated Almahbub Integrated Export Ltd. experience. Detailed commodity pages and structured quotation tools are being prepared. Specific grades and commercial terms are confirmed through enquiry, not as self-serve checkout.",
    trustStrip: [
      "Agro commodities",
      "Bulk supply",
      "Export",
      "Enquiry-led",
      "Part of Almahbub Group",
    ],
    intro: {
      title: "A dedicated business for agro commodity trade",
      afterEnquiryTitle: "What happens after an enquiry",
      afterEnquiry:
        "Tell us what you need. We route your enquiry to the appropriate Almahbub Integrated Export team and confirm next steps through structured follow-up. This is not an online marketplace checkout.",
    },
    commoditiesPreview: {
      title: "Explore Our Commodities",
      emptyTitle: "No commodities published yet",
      emptyDescription:
        "Contact our export team to discuss current availability, grades and packaging.",
    },
    process: {
      title: "From enquiry to export coordination",
      description:
        "A clear buyer journey for agro-export enquiries. Stages below reflect how engagement is framed on this portal. Commercial terms remain enquiry-led.",
      steps: [
        {
          title: "Buyer enquiry",
          description:
            "Share the commodity requirement and destination needs through Request a Quote or Contact.",
        },
        {
          title: "Requirement & specification",
          description:
            "Clarify quantity, specification, timing, and logistics expectations before commitment.",
        },
        {
          title: "Sourcing & coordination",
          description:
            "Coordinate agro commodity supply discussions with named ownership on next steps.",
        },
        {
          title: "Quality & specification alignment",
          description:
            "Align requirements to buyer specifications and applicable regulations for the shipment - without publishing unverified certifications.",
        },
        {
          title: "Documentation & export preparation",
          description:
            "Discuss trade documentation and export preparation case by case through structured enquiry.",
        },
        {
          title: "Logistics planning",
          description:
            "Coordinate export logistics planning once specifications and commercial terms are clear.",
        },
      ],
    },
    quality: {
      title: "Quality guided by specification",
      description:
        "Share the grade, specification, packaging, and destination you need. The export team reviews the requirement and prepares the appropriate sourcing and supply response.",
      themes: [
        "Buyer specification alignment",
        "Destination requirements",
        "Packaging discussed per enquiry",
        "Documentation case by case",
      ],
    },
    markets: {
      title: "Connecting supply with buyer demand",
      description:
        "Tell us the commodity, specification, quantity, packaging, and destination so we can match supply to your requirement.",
    },
    finalCta: {
      title: "Have a sourcing requirement?",
      description:
        "Tell us what you need and our export team can help you discuss the right commodity, specification, and destination requirements through structured follow-up.",
    },
  },
  /**
   * IE-4 process page - stages reused from home.process (verified wording).
   * No invented facilities, certifications, or shipment guarantees.
   */
  processPage: {
    heroTitle: "From enquiry to export coordination",
    heroLead:
      "A clear buyer journey for agro-export enquiries. Commercial terms remain enquiry-led - this is not an online marketplace checkout.",
    introTitle: "How engagement is framed",
    intro: [
      "Almahbub Integrated Export Ltd. focuses on agro commodities, bulk supply, and export for buyers who need a clear, accountable trade counterpart.",
      "The stages below reflect how enquiries are coordinated on this portal. Specific grades, documentation, and logistics details are confirmed case by case.",
    ],
    timelineTitle: "The buyer journey",
    timelineNote:
      "Stages describe coordination and discussion - not a claim that Almahbub owns every facility or personally performs every physical step.",
    qualityTitle: "Quality and documentation stay linked to your specification",
    qualityBody:
      "Quality and compliance guidance focuses on buyer specifications and destination requirements. This website does not publish unverified certifications or laboratory claims.",
    expectationsTitle: "What buyers can expect",
    expectations: [
      "Named ownership on next steps after you submit an enquiry",
      "Specification, timing, and logistics clarified before commitment",
      "Trade documentation discussed case by case",
      "No self-serve checkout, invented stock levels, or published prices on this website",
    ],
  },
  /**
   * IE-5 quality page - derived from home.quality, processPage, commodities, export.
   * No invented certifications, laboratories, facilities, or country approvals.
   */
  qualityPage: {
    heroTitle: "Quality guided by specification",
    heroLead:
      "Quality and compliance guidance for Integrated Export buyers focuses on buyer specifications and destination requirements. This website does not publish unverified certifications or laboratory claims.",
    introTitle: "Requirements depend on the enquiry",
    intro: [
      "What is needed can vary with the commodity, specification, packaging, destination, and applicable requirements for the shipment.",
      "We align the discussion to what you need - without publishing invented certificates, facility claims, or laboratory guarantees on this website.",
    ],
    approachTitle: "How quality relates to your requirement",
    approachNote:
      "This is a coordination framework. It does not claim that Almahbub owns every facility or personally performs every physical quality operation.",
    approachSteps: [
      {
        title: "Understand the requirement",
        description:
          "Share the commodity need, destination, and any specification priorities through Request a Quote or Contact.",
      },
      {
        title: "Align specifications",
        description:
          "Clarify grade, quantity, packaging, timing, and delivery expectations before commitment.",
      },
      {
        title: "Coordinate quality requirements",
        description:
          "Align quality discussion to the buyer specification and applicable requirements for the shipment.",
      },
      {
        title: "Prepare relevant documentation",
        description:
          "Discuss trade documentation case by case - not as a fixed checklist of guaranteed certificates.",
      },
      {
        title: "Export preparation",
        description:
          "Connect documentation and preparation to export coordination once commercial terms are clear.",
      },
    ],
    specificationTitle: "Specification alignment",
    specificationLead:
      "Buyers can communicate the details that matter for their enquiry. Formal commercial terms remain enquiry-led.",
    specificationTopics: [
      "Commodity",
      "Grade / specification",
      "Quantity",
      "Packaging",
      "Destination",
      "Delivery requirements",
    ],
    coordinationTitle: "Quality & specification alignment",
    coordinationBody:
      "Requirements are aligned according to the commodity and the buyer’s needs. We do not invent moisture, purity, grade tables, or laboratory results on this website.",
    documentationTitle: "Documentation",
    documentationBody:
      "Export documentation can depend on the commodity, destination, buyer requirements, and applicable regulations. Documentation needs are confirmed through structured follow-up - not presented as guaranteed deliverables on this page.",
    destinationTitle: "Destination requirements",
    destinationBody:
      "Documentation and preparation requirements may vary according to the commodity, destination, and applicable regulations. This portal does not invent countries served or publish a compliance map.",
    commodityTitle: "Commodity-specific quality notes",
    commodityEmptyTitle: "No published commodities yet",
    commodityEmptyBody:
      "When owner-approved commodity records are published, quality notes that belong to a specific commodity can appear with that record. Until then, we do not invent commodity names or quality claims here.",
    buyerTitle: "Help us understand your requirement",
    buyerLead:
      "When you request a quote, it helps to share what you already know. This is informational guidance only - the request page remains the enquiry path.",
    buyerTopics: [
      "Commodity",
      "Specification",
      "Quantity",
      "Packaging",
      "Destination",
      "Delivery requirement",
    ],
    processLinkLabel: "See how the export process works",
  },
  /**
   * IE-6 markets page - derived from home.markets, export, processPage, qualityPage.
   * No invented countries, continents-as-coverage, volumes, flags, or client logos.
   */
  marketsPage: {
    heroTitle: "Connecting supply with buyer demand",
    heroLead:
      "Market availability depends on commodity specifications, buyer requirements, and destination regulations. This portal does not invent countries served, shipment volumes, or regional statistics.",
    reachTitle: "International orientation, enquiry-led coverage",
    reach: [
      "Almahbub Integrated Export Ltd. engages buyers on agro commodities, bulk supply, and export with destination requirements discussed through structured follow-up.",
      "International reach here means coordinating to your commodity need and destination context - not a published list of markets already served.",
    ],
    coordinationTitle: "Market coordination",
    coordinationLead:
      "Export requirements can vary according to the commodity, buyer specification, destination, packaging, documentation, and applicable requirements for the shipment.",
    coordinationThemes: [
      "Commodity",
      "Buyer specification",
      "Destination",
      "Packaging",
      "Documentation",
      "Applicable requirements",
    ],
    qualityLinkLabel: "Quality & specification alignment",
    destinationTitle: "Buyer destination requirements",
    destinationLead:
      "Requirements can vary according to destination and commodity. Formal terms remain enquiry-led.",
    destinationSteps: [
      {
        title: "Destination",
        description: "Share where the shipment is intended so applicable requirements can be discussed.",
      },
      {
        title: "Requirements",
        description: "Clarify buyer and destination needs without assuming a fixed regulation checklist.",
      },
      {
        title: "Specification",
        description: "Align grade, quantity, packaging, and delivery expectations before commitment.",
      },
      {
        title: "Documentation",
        description: "Discuss trade documentation case by case - not as guaranteed certificates on this page.",
      },
      {
        title: "Preparation",
        description: "Connect documentation and preparation to export coordination once commercial terms are clear.",
      },
    ],
    dataTitle: "Market information",
    dataEmptyTitle: "Market information is being updated",
    dataEmptyBody:
      "Verified destination markets are not yet published on this portal. For current sourcing requirements, contact our export desk or request a quote.",
    processTitle: "Every destination can have different requirements",
    processBody:
      "Destination context feeds the buyer requirement, specification, quality & specification alignment, documentation, and export preparation - without claiming Almahbub owns every facility or performs every physical step.",
    processLinkLabel: "See how the export process works",
    processFlowLegend:
      "Market / Destination → Buyer requirement → Specification → Quality alignment → Documentation → Export preparation",
  },
  /**
   * IE-7 about page - derived from about, ALMAHBUB_INTEGRATED_EXPORT, GROUP, home, process, quality.
   * No invented history, statistics, facilities, certifications, testimonials, or awards.
   */
  aboutPage: {
    heroTitle: "A dedicated business for agro commodity trade",
    heroLead:
      "Almahbub Integrated Export Ltd. is a distinct Almahbub Group business focused on agro commodities, bulk supply, and export for buyers who need a clear, accountable trade counterpart.",
    whoTitle: "Who we are",
    who: [
      "Almahbub Integrated Export Ltd. is a separately registered company within Almahbub Group.",
      "It is not a department of Almahbub International. Its agro commodities, bulk supply, and export focus is presented here as a dedicated business portal within the same platform.",
      "Its offerings are not listed in the Almahbub International product catalogue on this website. Enquiries are routed to the appropriate team.",
    ],
    focusTitle: "Integrated Export focus",
    focusLead:
      "Capability areas below describe how buyer conversations are framed on this portal. They are not claims that Almahbub owns every facility or personally performs every physical step.",
    focusAreas: [
      {
        title: "Commodity sourcing",
        description:
          "Coordinate agro commodity supply discussions with named ownership on next steps.",
      },
      {
        title: "Buyer requirements",
        description:
          "Share the commodity requirement and destination needs through Request a Quote or Contact.",
      },
      {
        title: "Specification alignment",
        description:
          "Clarify quantity, specification, timing, and logistics expectations before commitment.",
      },
      {
        title: "Quality coordination",
        description:
          "Align requirements to buyer specifications and applicable regulations for the shipment - without publishing unverified certifications.",
      },
      {
        title: "Documentation",
        description:
          "Discuss trade documentation case by case through structured enquiry.",
      },
      {
        title: "Export preparation",
        description:
          "Connect documentation and preparation to export coordination once commercial terms are clear.",
      },
      {
        title: "Logistics planning",
        description:
          "Coordinate export logistics planning once specifications and commercial terms are clear.",
      },
    ],
    groupTitle: "Part of Almahbub Group",
    groupLead:
      "Almahbub Group brings together distinct businesses across procurement, supply, and international trade. Each company is separately registered and keeps its own focus.",
    groupNote:
      "Two distinct businesses. One broader supply and trade ecosystem.",
    groupRootLabel: "Almahbub Group",
    groupInternationalLabel: "Almahbub International",
    groupIeLabel: "Almahbub Integrated Export Ltd.",
    groupExploreLabel: "Explore Almahbub Group",
    groupInternationalCta: "Explore Almahbub International",
    howTitle: "How we work",
    howLead:
      "A concise view of enquiry coordination. Commercial terms remain enquiry-led - this is not an online marketplace checkout.",
    howSteps: [
      {
        title: "Understand",
        description:
          "Share the commodity need, destination, and any specification priorities.",
      },
      {
        title: "Align",
        description:
          "Clarify grade, quantity, packaging, timing, and delivery expectations before commitment.",
      },
      {
        title: "Coordinate",
        description:
          "Align quality discussion and sourcing next steps to the buyer specification.",
      },
      {
        title: "Prepare",
        description:
          "Discuss documentation and export preparation case by case through structured follow-up.",
      },
    ],
    howLinkLabel: "Explore Our Process",
    buyerTitle: "Buyer-centered approach",
    buyerLead:
      "Requirements can vary according to the commodity, specification, packaging, quantity, destination, and applicable requirements for the shipment.",
    buyerTopics: [
      "Commodity",
      "Specification",
      "Packaging",
      "Quantity",
      "Destination",
      "Applicable requirements",
    ],
    buyerLinkLabel: "Quality & specification alignment",
    coordinateTitle: "What we help coordinate",
    coordinateLead:
      "After you submit an enquiry, we route it to the appropriate Almahbub Integrated Export team and confirm next steps through structured follow-up - not an online marketplace checkout.",
    coordinatePoints: [
      "Named ownership on next steps after you submit an enquiry",
      "Specification, timing, and logistics clarified before commitment",
      "Trade documentation discussed case by case",
      "No self-serve checkout, invented stock levels, or published prices on this website",
    ],
  },
  /**
   * IE-8 contact + request UX - frontend contract only.
   * Uses verified SITE.contactEmail. No invented channels, SLAs, or submission APIs.
   */
  contactPage: {
    heroTitle: "Let's discuss your export requirement",
    heroLead:
      "Tell us enough for the export desk to understand your commodity need, destination context, and specification priorities. Commercial terms remain enquiry-led.",
    introTitle: "Export desk introduction",
    intro: [
      "Enquiries are routed to the appropriate Almahbub Integrated Export team. This is not a transactional checkout.",
      "Specific grades, packaging, and commercial terms are confirmed through structured follow-up - not published as stock or pricing on this website.",
    ],
    optionsTitle: "Contact options",
    emailLabel: "Group contact email",
    emailNote:
      "This is the verified Group contact channel used by this portal today. It is shared with Almahbub International operations on this platform - not a separate invented export@ address.",
    internationalNote: "For Almahbub International procurement enquiries, use the International contact experience.",
    includeTitle: "What to include in your enquiry",
    includeItems: [
      "Commodity or requirement description",
      "Approximate quantity and unit (if known)",
      "Destination context",
      "Packaging or specification priorities",
      "Your company name and a business email",
    ],
    noPhoneNote:
      "We do not publish unverified phone numbers or WhatsApp accounts on this portal. Prefer email or the structured enquiry form.",
  },
  requestPage: {
    heroTitle: "Request a Quote",
    heroLead:
      "Share your requirement so the export desk can discuss commodity, specification, and destination needs. This is an enquiry - not an order or purchase checkout.",
    guidanceTitle: "Information guidance",
    guidance:
      "Required fields help us reach you and understand the commodity need. Optional fields improve the discussion when you already know them. Supporting documents can be discussed with the export desk.",
    nextTitle: "What happens next",
    nextNote:
      "The steps below explain how follow-up is framed. They are not automated tracking events on this website.",
    nextSteps: [
      {
        title: "Requirement received",
        description: "Your enquiry reaches the Integrated Export team through the contact channel you use.",
      },
      {
        title: "Requirement reviewed",
        description: "The team reviews commodity, destination, and specification context you provided.",
      },
      {
        title: "Specification / sourcing discussion",
        description: "Clarification continues case by case before commercial commitment.",
      },
      {
        title: "Quotation / next-step discussion",
        description: "Next commercial steps are discussed through structured follow-up - not self-serve checkout.",
      },
    ],
    submitLabel: "Submit Enquiry",
    signedOutTitle: "Sign in to submit this enquiry",
    signedOutBody:
      "Integrated Export enquiries are stored as procurement requests with line of business Integrated Export. Sign in to submit through the portal. Email remains available as a contact channel, not as a stored request.",
    signedOutLoginLabel: "Sign in to submit",
    submittedTitle: "Enquiry submitted to the export desk",
    submittedBody:
      "Your requirement is stored as an Integrated Export procurement request. Track status, quotations, and documents from My requests.",
    submittedCtaLabel: "Open my request",
    interimTitle: "Email the verified Group contact",
    interimBody:
      "If you cannot sign in yet, you can still send these details by email. That does not create a tracked procurement request.",
    interimMailtoLabel: "Open email with your enquiry",
    contactAltTitle: "Prefer to speak with us directly?",
    contactAltBody: "Use the Integrated Export contact page for the verified Group contact channel.",
    requestingLabel: "Requesting",
    attachmentNote: "Supporting documents can be discussed with the export desk.",
  },
} as const;

export type GroupBusiness = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  /** Compact provisional mark for UI chips - not an official logo claim. */
  mark: string;
  focus: string;
  focusShort: string;
  summary: string;
  description: readonly string[];
  capabilities: readonly string[];
  href: string;
  cta: { href: string; label: string };
  /** Intentional layout placeholder - not claimed photography. */
  mediaLabel: string;
  note?: string;
};

export const ALMAHBUB_INTERNATIONAL: GroupBusiness = {
  id: "almahbub-international",
  slug: "almahbub-international",
  name: "Almahbub International",
  legalName: "Almahbub International",
  mark: "AI",
  focus: "Procurement, importation, product sourcing, supply, and logistics",
  focusShort: "Procurement, importation, sourcing, supply, logistics",
  summary:
    "The operating company behind this platform. Buyers request procurement; Almahbub International clarifies, sources, quotes, and delivers with named ownership.",
  description: [
    "Almahbub International is a Nigerian partner for cross-border buying. It is not a marketplace and not a checkout store.",
    "The published product catalogue and the request-led procurement workflow on this website belong to Almahbub International.",
  ],
  capabilities: [
    "Procurement",
    "Importation",
    "Sourcing",
    "Supply",
    "Logistics",
  ],
  href: "/businesses/almahbub-international",
  cta: { href: "/contact", label: "Request Procurement" },
  mediaLabel: "Almahbub International procurement and supply (approved imagery forthcoming)",
};

export const ALMAHBUB_INTEGRATED_EXPORT: GroupBusiness = {
  id: "almahbub-integrated-export",
  slug: "almahbub-integrated-export",
  name: "Almahbub Integrated Export Ltd.",
  legalName: "Almahbub Integrated Export Ltd.",
  mark: INTEGRATED_EXPORT_BRAND.provisionalMark,
  focus: "Agro commodities, bulk supply, and export",
  focusShort: "Agro commodities, bulk supply, export",
  summary:
    "A separately registered business focused on agro commodities, bulk supply, and export. It is not a department of Almahbub International.",
  description: [
    "Almahbub Integrated Export Ltd. is a distinct company within Almahbub Group, focused on agro commodities, bulk supply, and export.",
    "Its offerings are not listed in the Almahbub International product catalogue on this website. Enquiries are routed to the appropriate team.",
  ],
  capabilities: ["Agro commodities", "Bulk supply", "Export"],
  href: INTEGRATED_EXPORT_PORTAL.path,
  cta: {
    href: "/businesses/almahbub-integrated-export/request",
    label: "Request a Quote",
  },
  mediaLabel:
    "Almahbub Integrated Export Ltd. agro commodities and export (approved imagery forthcoming)",
  note: "Dedicated business portal. No transactional export checkout is offered on this website.",
};

export const GROUP_BUSINESSES: readonly GroupBusiness[] = [
  ALMAHBUB_INTERNATIONAL,
  ALMAHBUB_INTEGRATED_EXPORT,
];

export function getGroupBusiness(slug: string): GroupBusiness | undefined {
  return GROUP_BUSINESSES.find((business) => business.slug === slug);
}

export function isIntegratedExportSlug(slug: string): boolean {
  return slug === ALMAHBUB_INTEGRATED_EXPORT.slug;
}
