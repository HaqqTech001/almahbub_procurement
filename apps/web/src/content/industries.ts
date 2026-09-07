/**
 * Structured industry content. Slugs are derived internally; operators never type them.
 * Examples use “including” / “such as” so they are not read as closed catalogues.
 */

export type IndustryRecord = {
  id: string;
  name: string;
  summary: string;
  description: string;
  howWeHelp: string;
  examples: readonly string[];
  relatedCategoryHints: readonly string[];
  challenge: string;
  outcome: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const INDUSTRY_RECORDS: readonly IndustryRecord[] = [
  {
    id: "organisational",
    name: "Large and organisational needs",
    summary:
      "Corporate procurement, machinery, medical or technical equipment, and high-volume sourcing.",
    description:
      "Almahbub supports organisations that need a named owner for complex buying, from specification through quotation and delivery coordination.",
    howWeHelp:
      "We help buying teams turn a brief into a governed request, keep clarification on the record, and return quotations with evidence rather than informal marketplace listings.",
    examples: [
      "corporate equipment programmes",
      "machinery and plant items",
      "medical and technical kit",
      "high-volume replenishment",
    ],
    relatedCategoryHints: ["medical", "industrial", "machinery", "equipment"],
    challenge:
      "Corporate procurement, machinery, medical or technical equipment, and high-volume sourcing.",
    outcome: "Named owners, structured requests, and quotations kept on the governed record.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-industrial.svg",
    imageAlt: "Industrial procurement illustration",
  },
  {
    id: "growing",
    name: "Growing businesses",
    summary:
      "Retail inventory, boutique or spa setup, office equipment, electronics, and recurring stock.",
    description:
      "Growing operators often need a repeatable path from catalogue context to a request, without treating the website as a shop checkout.",
    howWeHelp:
      "Almahbub keeps line items, quantities, and destination constraints on one request so replenishment can be compared against previous quotations.",
    examples: [
      "retail inventory",
      "boutique and spa setup",
      "office electronics",
      "recurring stock",
    ],
    relatedCategoryHints: ["electronics", "office", "retail", "home"],
    challenge:
      "Retail inventory, boutique or spa setup, office equipment, electronics, and recurring stock.",
    outcome:
      "Repeatable request templates and catalogue-backed line items for faster replenishment.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-electrical.svg",
    imageAlt: "Business equipment illustration",
  },
  {
    id: "project-setup",
    name: "Small business and project setup",
    summary: "Store launch, initial inventory, appliances, and one-off product sourcing.",
    description:
      "Project buyers typically need a clear specification, a quotation, and a delivery owner rather than live stock theatre.",
    howWeHelp:
      "We help you describe what you need, attach photos or files, and follow the same procurement journey used for larger programmes.",
    examples: [
      "store launch inventory",
      "appliances",
      "one-off product sourcing",
      "fit-out items",
    ],
    relatedCategoryHints: ["home", "garden", "appliance", "construction"],
    challenge: "Store launch, initial inventory, appliances, and one-off product sourcing.",
    outcome:
      "A clear request path from specification to quotation without treating the website as a shop checkout.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-construction.svg",
    imageAlt: "Project setup illustration",
  },
  {
    id: "healthcare",
    name: "Healthcare and technical",
    summary: "Specification-led equipment buying with documentation on the file.",
    description:
      "Healthcare and technical buying depends on specification, documentation, and honest lead-time context. Almahbub does not publish live clinic stock.",
    howWeHelp:
      "Requests can carry model, quantity, destination, and supporting files so quotations stay evidence-led.",
    examples: [
      "clinical equipment",
      "diagnostic devices",
      "technical instruments",
      "supporting consumables discussed on the brief",
    ],
    relatedCategoryHints: ["medical", "health", "diagnostic"],
    challenge: "Specification-led equipment buying with documentation on the file.",
    outcome: "Evidence attached to quotations rather than informal marketplace listings.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-healthcare.svg",
    imageAlt: "Healthcare procurement illustration",
  },
  {
    id: "energy",
    name: "Energy",
    summary: "Long-lead equipment with compliance documentation kept on the record.",
    description:
      "Energy-related buying often involves long lead times and documentation. Almahbub supports the request and quotation record; we do not claim to operate generation assets.",
    howWeHelp:
      "Share the specification, destination, and any compliance documents you already hold. Sourcing and quotation remain enquiry-led.",
    examples: [
      "long-lead equipment",
      "supporting electrical items",
      "documentation requested with the brief",
    ],
    relatedCategoryHints: ["electrical", "industrial", "energy"],
    challenge: "Long-lead equipment with compliance documentation.",
    outcome: "Structured requests with certification evidence on the record.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-electrical.svg",
    imageAlt: "Energy equipment illustration",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    summary: "Repeat MOQ buying across multiple SKUs, including spare and production items.",
    description:
      "Manufacturers often replenish several SKUs with MOQ and lead-time constraints. Almahbub keeps those constraints visible before a quotation, not as a fake cart total.",
    howWeHelp:
      "Use the catalogue for identity, then submit a request that can be repeated on the next cycle.",
    examples: [
      "production inputs",
      "spares",
      "packaging discussed on the brief",
      "recurring SKUs",
    ],
    relatedCategoryHints: ["industrial", "manufacturing", "packaging"],
    challenge: "Repeat MOQ buying across multiple SKUs.",
    outcome: "Saved lists and request templates for recurring procurement.",
    ctaLabel: "Request Procurement",
    ctaHref: "/app/requests/new",
    imageSrc: "/media/category-industrial.svg",
    imageAlt: "Manufacturing procurement illustration",
  },
] as const;

export function industrySlug(industry: Pick<IndustryRecord, "id" | "name">): string {
  return industry.id || slugify(industry.name);
}

export function getIndustryBySlug(slug: string): IndustryRecord | undefined {
  const needle = slug.trim().toLowerCase();
  return INDUSTRY_RECORDS.find((item) => industrySlug(item) === needle);
}

export const HOMEPAGE_INDUSTRY_IDS = [
  "organisational",
  "growing",
  "project-setup",
  "healthcare",
] as const;

export function toIndustryNavItem(industry: IndustryRecord) {
  const slug = industrySlug(industry);
  return {
    id: industry.id,
    name: industry.name,
    challenge: industry.challenge,
    outcome: industry.outcome,
    href: `/industries/${slug}`,
  };
}
