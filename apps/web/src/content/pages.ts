import type { PageSeo } from "./site.js";
import { SITE } from "./site.js";
import { homepageBelowFold } from "./homepage.js";

/** Content adapters swap for API responses later without changing page components. */

export const aboutContent = {
  seo: {
    title: "About Almahbub International",
    description:
      "A Nigerian partner for global procurement, accountable sourcing, quoting, and delivery ownership.",
    path: "/about",
  } satisfies PageSeo,
  hero: {
    eyebrow: "Company",
    title: "A Nigerian partner for cross-border buying",
    description:
      "Buyers work with Almahbub when they need a local owner for sourcing, quoting, and delivery, not another marketplace listing.",
  },
  body: homepageBelowFold.companyOverview!.body,
};

export const servicesContent = {
  seo: {
    title: "Services",
    description:
      "International sourcing, import coordination, logistics and warehousing.",
    path: "/services",
  } satisfies PageSeo,
  hero: {
    eyebrow: "Services",
    title: "Sourcing and import support",
    description:
      "Get support with supplier sourcing, import documentation, shipping and storage.",
  },
  services: homepageBelowFold.services!.services,
};

export const productsContent = {
  seo: {
    title: "Products",
    description:
      "Explore Almahbub International product categories and published catalogue items, then request procurement. Formal pricing appears in quotations.",
    path: "/products",
  } satisfies PageSeo,
  hero: {
    eyebrow: "Products",
    title: "Products",
    description: "Browse products available for procurement.",
  },
};

export type ProductRecord = {
  slug: string;
  name: string;
  summary: string;
  manufacturer: string;
  country: string;
  moq: string;
  leadTime: string;
  availability: string;
  category: string;
  imageSrc: string;
};

export const productCatalog: readonly ProductRecord[] = [
  {
    slug: "industrial-components",
    name: "Industrial components",
    summary:
      "Spec-driven industrial parts with MOQ and lead-time context confirmed on the record.",
    manufacturer: "Multi-source industrial supply",
    country: "Multi-corridor sourcing",
    moq: "MOQ confirmed per RFQ",
    leadTime: "Lead time confirmed on record",
    availability: "Available to source",
    category: "Industrial",
    imageSrc: "/media/product-industrial.svg",
  },
  {
    slug: "electrical-equipment",
    name: "Electrical equipment",
    summary:
      "Certified equipment corridors for project and plant buyers quotation-led commercial terms.",
    manufacturer: "Certified equipment corridors",
    country: "Certified supply corridors",
    moq: "Project and plant quantities",
    leadTime: "Indicative until quoted",
    availability: "Available to source",
    category: "Electrical",
    imageSrc: "/media/product-electrical.svg",
  },
  {
    slug: "custom-requirement",
    name: "Custom requirement",
    summary:
      "Specification-led sourcing when your brief does not map to a standard category.",
    manufacturer: "Specification-led sourcing",
    country: "Specify destination & constraints",
    moq: "Defined with your brief",
    leadTime: "Scoped after clarification",
    availability: "Request-led sourcing",
    category: "Custom",
    imageSrc: "/media/product-custom.svg",
  },
];

export function getProductBySlug(slug: string): ProductRecord | undefined {
  return productCatalog.find((item) => item.slug === slug);
}

export const industriesContent = {
  seo: {
    title: "Industries",
    description:
      "From first store setup to organisational procurement, including machinery, medical and technical equipment, retail inventory, boutique and spa setup, electronics, and commercial home or garden lines.",
    path: "/industries",
  } satisfies PageSeo,
  hero: {
    eyebrow: "Industries",
    title: "Who we support",
    description: homepageBelowFold.industries!.description!,
  },
  industries: homepageBelowFold.industries!.industries,
};

export const faqContent = {
  seo: {
    title: "FAQ",
    description:
      "Clear answers on stock, quotations, tracking, and how Almahbub International works.",
    path: "/faq",
  } satisfies PageSeo,
  hero: {
    eyebrow: "FAQ",
    title: "Common procurement questions",
    description: homepageBelowFold.faq!.description!,
  },
  items: homepageBelowFold.faq!.items,
};

export const contactContent = {
  seo: {
    title: "Contact",
    description:
      "Contact Almahbub International procurement specialists. Phone, WhatsApp, email, office map, and social channels.",
    path: "/contact",
  } satisfies PageSeo,
  hero: {
    eyebrow: "Contact",
    title: "Talk to a procurement specialist",
    description:
      "Need help importing from China, USA, Korea, Malaysia, Japan, or Thailand? Reach our team by form, phone, WhatsApp, or visit the Ilorin office.",
  },
  email: SITE.contactEmail,
  legacyEmail: SITE.contactEmail,
  responseNote: "Typical response within 1 to 2 business days. For urgent matters, call or WhatsApp us directly.",
  phones: [
    { label: "+234 807 445 4081", href: "tel:+2348074454081" },
    { label: "+234 703 354 6666", href: "tel:+2347033546666" },
  ],
  wechat: "Mujahid768832",
  office: {
    id: "ilorin",
    title: "Ilorin office",
    lines: [
      "Oye's complex",
      "Grace Land junction along Sanrab, Tanke Rd, University Rd",
      "Ilorin 240103, Kwara",
    ],
    address:
      "Oye's complex Grace Land junction along Sanrab, Tanke Rd, University Rd, Ilorin 240103, Kwara",
  },
  whatsapp: {
    number: "2348074454081",
    message: "Hello Almahbub International, I need assistance with my inquiry.",
  },
  social: [
    {
      id: "facebook",
      label: "Facebook",
      href: "https://web.facebook.com/almahbubIMport/?_rdc=1&_rdr#",
    },
    {
      id: "tiktok",
      label: "TikTok",
      href: "https://www.tiktok.com/@almahbubinternational",
    },
    {
      id: "instagram",
      label: "Instagram",
      href: "https://www.instagram.com/almahbubinternational",
    },
  ],
  inquiryTypes: [
    { value: "faq", label: "FAQ question" },
    { value: "sales", label: "Sales / procurement" },
    { value: "support", label: "Technical support" },
    { value: "partnership", label: "Partnership" },
    { value: "feedback", label: "Feedback" },
    { value: "complaint", label: "Complaint" },
  ],
} as const;

export const legalPages = {
  privacy: {
    seo: {
      title: "Privacy Policy",
      description: "How Almahbub International handles personal data on Almahbub International.",
      path: "/privacy",
    } satisfies PageSeo,
    title: "Privacy Policy",
    updated: "2026-08-01",
    sections: [
      {
        heading: "Who we are",
        body: `Almahbub International operates Almahbub International. Contact ${SITE.contactEmail} for privacy requests.`,
      },
      {
        heading: "Data we process",
        body: "Account, request, commercial, and shipment records required to deliver managed procurement. Marketing email only with consent.",
      },
      {
        heading: "Your rights",
        body: "You may request access, correction, or deletion subject to legal retention for governed commercial records.",
      },
    ],
  },
  terms: {
    seo: {
      title: "Terms of Service",
      description: "Terms governing use of the Almahbub International public website and Almahbub International.",
      path: "/terms",
    } satisfies PageSeo,
    title: "Terms of Service",
    updated: "2026-08-01",
    sections: [
      {
        heading: "Managed service",
        body: "Almahbub International is managed procurement software not an open marketplace. Quotations and contracts govern commercial commitments.",
      },
      {
        heading: "Acceptable use",
        body: "Do not misuse the site, attempt unauthorized access, or submit fraudulent requests.",
      },
      {
        heading: "Liability",
        body: "Indicative lead times and corridor statistics are service expectations, not guarantees, unless stated in a signed quotation.",
      },
    ],
  },
  cookies: {
    seo: {
      title: "Cookie Policy",
      description: "Essential and optional cookies used on the Almahbub International public website.",
      path: "/cookies",
    } satisfies PageSeo,
    title: "Cookie Policy",
    updated: "2026-08-01",
    sections: [
      {
        heading: "Essential cookies",
        body: "Required for theme preference, session security, and cookie consent storage.",
      },
      {
        heading: "Analytics cookies",
        body: "Load only after you accept. Used to improve site performance and content never to invent procurement guarantees.",
      },
      {
        heading: "Manage preferences",
        body: "Use the cookie banner or clear site data in your browser. Essential cookies cannot be disabled while using the site.",
      },
    ],
  },
} as const;
