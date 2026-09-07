/** Production-shaped fixtures for demos and tests - not placeholder lorem. */
export const homepageFixtures = {
  hero: {
    brandName: "Almahbub International",
    groupAffiliation: "Part of Almahbub Group",
    groupHref: "/group",
    groupExploreLabel: "Explore our businesses",
    headline: "Global procurement. Local accountability.",
    supportingText:
      "We source, clarify, quote, and deliver for buyers who need a partner that owns every next step.",
    primaryCta: { href: "/contact", label: "Request Procurement" },
    secondaryCta: { href: "/services", label: "Explore Services" },
    searchLabel: "Start a request",
    searchPlaceholder: "Product, destination, or shipment reference",
    searchAction: "/products",
    trustIndicators: [
      { id: "process", label: "Managed end-to-end process" },
      { id: "rooted", label: "Nigeria-rooted partner" },
      { id: "verify", label: "Quotes & tracking you can verify" },
    ],
    statistics: [],
    scrollTargetId: "trust",
    visualPlaceholderLabel: "Professional procurement visual",
  },
  trust: {
    eyebrow: "Trusted companies",
    title: "Partners that keep delivery accountable",
    description:
      "Almahbub International pairs Nigerian operational ownership with documented sourcing, quoting, and delivery.",
    indicators: [
      {
        id: "process",
        label: "Managed end-to-end process",
        detail: "Request, clarify, source, quote, approve, deliver - with a named next owner.",
      },
      {
        id: "rooted",
        label: "Nigeria-rooted partner",
        detail: "Local accountability for cross-border buying decisions.",
      },
      {
        id: "verify",
        label: "Quotes and tracking you can verify",
        detail: "Commercial and shipment states wait for confirmed records.",
      },
    ],
  },
  companyOverview: {
    title: "A Nigerian partner for global procurement",
    description: "Almahbub International exists to make cross-border buying accountable.",
    body: [
      "We help buyers request, clarify, source, quote, approve, and deliver - with a named owner for every next step.",
      "Almahbub International gives operational clarity without turning procurement into consumer checkout.",
    ],
    primaryCta: { href: "/about", label: "About Almahbub" },
    secondaryCta: { href: "/contact", label: "Request Procurement" },
    imageAlt: "Procurement operations and accountable delivery",
  },
  group: {
    title: "Almahbub Group",
    description: "Two distinct businesses. One broader group.",
    body: "Almahbub Group brings together distinct businesses operating across procurement, supply, and international trade. Each company is separately registered and keeps its own focus.",
    overviewCta: { href: "/group", label: "Explore Almahbub Group" },
    businesses: [
      {
        id: "almahbub-international",
        name: "Almahbub International",
        href: "/businesses/almahbub-international",
        focus: "Procurement · Importation · Sourcing · Supply · Logistics",
        summary:
          "The operating company behind this platform. Buyers request procurement; Almahbub International clarifies, sources, quotes, and delivers with named ownership.",
        capabilities: [
          "Procurement",
          "Importation",
          "Product sourcing",
          "Supply",
          "Logistics",
        ],
        ctaHref: "/contact",
        ctaLabel: "Request Procurement",
        mark: "AI",
        logoSrc: "/almahbub.svg",
        mediaLabel: "Almahbub International procurement operations (approved imagery forthcoming)",
      },
      {
        id: "almahbub-integrated-export",
        name: "Almahbub Integrated Export Ltd.",
        href: "/businesses/almahbub-integrated-export",
        focus: "Agro Commodities · Bulk Supply · Export",
        summary:
          "A separately registered business focused on agro commodities, bulk supply, and export. It is not a department of Almahbub International.",
        capabilities: ["Agro commodities", "Bulk supply", "Export"],
        ctaHref: "/contact",
        ctaLabel: "Make an Enquiry",
        mark: "AIE",
        mediaLabel:
          "Almahbub Integrated Export Ltd. - agro commodities & export (approved imagery forthcoming)",
        note: "Business capability profile. No transactional export checkout is offered on this website.",
      },
    ],
  },
  services: {
    title: "Capabilities beyond product browsing",
    description: "Four service lines that turn discovery into accountable delivery.",
    services: [
      {
        id: "global-procurement",
        title: "Global Procurement",
        description: "Structured sourcing for complex cross-border requirements.",
        href: "/services",
      },
      {
        id: "import-export",
        title: "Import & Export",
        description: "Documentation-aware trade execution with clear ownership.",
        href: "/services",
      },
      {
        id: "logistics",
        title: "Logistics",
        description: "Shipment planning with honest ETA ranges and exception handling.",
        href: "/services",
      },
      {
        id: "warehousing",
        title: "Warehousing",
        description: "Storage and handling aligned to your delivery plan.",
        href: "/services",
      },
    ],
    primaryCta: { href: "/services", label: "View all services" },
  },
  categories: {
    title: "Start discovery by category",
    description: "Evidence-led catalog entry - not consumer checkout.",
    categories: [
      {
        id: "industrial",
        name: "Industrial components",
        description: "Spec-driven parts with MOQ and lead-time context.",
        href: "/products",
      },
      {
        id: "electrical",
        name: "Electrical equipment",
        description: "Certified equipment for project and plant buyers.",
        href: "/products",
      },
    ],
    viewAllHref: "/products",
  },
  products: {
    title: "Featured sourcing capability",
    description: "Commercial context first - request with product identity preserved.",
    enableSearch: true,
    categories: [
      { id: "industrial", name: "Industrial" },
      { id: "electrical", name: "Electrical" },
    ],
    products: [
      {
        id: "industrial-components",
        slug: "industrial-components",
        name: "Industrial components",
        href: "/product/industrial-components",
        manufacturer: "Multi-source industrial supply",
        country: "Multi-corridor sourcing",
        moq: "MOQ confirmed per RFQ",
        leadTime: "Lead time confirmed on record",
        availability: "available_to_source",
        requestHref: "/contact?product=industrial-components",
        categoryName: "Industrial",
      },
    ],
    catalogHref: "/products",
  },
  whyChooseUs: {
    title: "Why buyers choose Almahbub",
    description:
      "Managed procurement with named ownership - not marketplace browsing or checkout theater.",
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
          "Quotations and shipment milestones wait for confirmed documents - not chat theater.",
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
          "MOQ and lead-time context before commitment - formal pricing only in quotations.",
      },
    ],
    primaryCta: { href: "/contact", label: "Request Procurement" },
  },
  supplierNetwork: {
    title: "A global supplier network with accountable partners",
    description:
      "Verified logistics, inspection, and supply relationships - named roles, not marquee endorsements.",
    partners: [
      {
        id: "logistics-a",
        name: "Corridor Logistics Partner",
        relationship: "Approved logistics partner",
        href: "/services",
      },
      {
        id: "inspect-b",
        name: "Quality Inspection Partner",
        relationship: "Inspection support partner",
      },
      {
        id: "freight-c",
        name: "Freight Coordination Partner",
        relationship: "Freight coordination support",
      },
    ],
    viewAllHref: "/services",
    viewAllLabel: "View supplier network",
  },
  workflow: {
    title: "A transparent procurement journey",
    description:
      "See where you are, what happens next, and how long each stage typically takes - from discovery through delivery.",
    primaryCta: { href: "/contact", label: "Request Procurement" },
    defaultStepId: "request",
  },
  platformStatistics: {
    title: "Platform statistics you can source",
    description: "Qualified metrics only - each figure carries a methodology reference.",
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
    methodologyHref: "/about#methodology",
    methodologyLabel: "How we measure",
  },
  industries: {
    title: "Industries we support",
    description: "Sector-specific challenges with accountable outcomes.",
    industries: [
      {
        id: "energy",
        name: "Energy",
        challenge: "Long-lead equipment with compliance documentation.",
        outcome: "Structured RFQs with certification evidence on the record.",
        href: "/industries/energy",
      },
      {
        id: "manufacturing",
        name: "Manufacturing",
        challenge: "Repeat MOQ buying across multiple SKUs.",
        outcome: "Saved lists and request templates for recurring procurement.",
        href: "/industries",
      },
    ],
  },
  testimonials: {
    title: "What buyers report",
    description: "Consented client voices with role and organization attribution.",
    testimonials: [
      {
        id: "t1",
        quote:
          "We always knew the next owner on our request. Quotes arrived with the evidence we needed to approve.",
        name: "",
        role: "",
        organization: "Industrial buyer (Nigeria)",
        caseHref: "/about",
      },
      {
        id: "t2",
        quote: "Tracking stayed honest. When there was a delay, the exception and owner were clear.",
        name: "James K.",
        role: "Operations Manager",
        organization: "Regional distributor",
      },
    ],
  },
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
          "Many requests receive quotation activity within 2–5 business days, depending on complexity and documentation completeness.",
      },
    ],
    primaryCta: { href: "/contact", label: "Request Procurement" },
    secondaryCta: { href: "/contact", label: "Contact specialist" },
  },
  newsletter: {
    title: "Stay informed without the noise",
    description: "Occasional procurement insights. Request Procurement remains the primary path.",
    helpText: "Occasional updates on sourcing, logistics, and accountable delivery.",
    privacyHref: "/privacy",
  },
  cta: {
    title: "Ready to start a qualified request?",
    description: "Tell us what you need. We clarify, source, quote, and deliver with accountable next steps.",
    primaryCta: { href: "/contact", label: "Request Procurement" },
    secondaryCta: { href: "/contact", label: "Contact specialist" },
    reassurance: "No checkout. No invented stock. Your request becomes a governed record.",
  },
} as const;
