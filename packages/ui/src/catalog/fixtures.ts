import { emptyCatalogFilters, type CatalogProduct } from "./types.js";
import type { ProductCatalogProps } from "./ProductCatalog.js";

const products: CatalogProduct[] = [
  {
    id: "p1",
    name: "Ball valve DN50 PN16",
    slug: "ball-valve-dn50",
    href: "/catalog/products/ball-valve-dn50",
    requestHref: "/request?product=ball-valve-dn50",
    manufacturer: "FlowTech GmbH",
    manufacturerId: "m1",
    brand: "FlowTech",
    brandId: "b1",
    supplier: "Managed sourcing",
    country: "Germany",
    moq: "24 units",
    leadTime: "14–21 days (indicative)",
    availability: "available_to_source",
    categoryId: "c-valves",
    categoryName: "Industrial valves",
    certifications: ["ISO 9001", "PED"],
  },
  {
    id: "p2",
    name: "HVAC compressor 5.5 kW",
    slug: "hvac-compressor-5-5kw",
    href: "/catalog/products/hvac-compressor-5-5kw",
    requestHref: "/request?product=hvac-compressor-5-5kw",
    manufacturer: "CoolAir Inc.",
    manufacturerId: "m2",
    brand: "CoolAir",
    brandId: "b2",
    country: "USA",
    moq: "2 units",
    leadTime: "28–35 days (indicative)",
    availability: "lead_time_constrained",
    categoryId: "c-hvac",
    categoryName: "HVAC",
    certifications: ["UL", "CE"],
  },
  {
    id: "p3",
    name: "Lab reagent kit - Grade A",
    slug: "lab-reagent-kit-a",
    href: "/catalog/products/lab-reagent-kit-a",
    requestHref: "/request?product=lab-reagent-kit-a",
    manufacturer: "BioPure Labs",
    manufacturerId: "m3",
    brand: "BioPure",
    brandId: "b3",
    country: "Netherlands",
    moq: "10 kits",
    leadTime: "7–10 days (indicative)",
    availability: "limited",
    categoryId: "c-lab",
    categoryName: "Laboratory",
    certifications: ["ISO 13485"],
  },
  {
    id: "p4",
    name: "Stainless fitting elbow 2\"",
    slug: "ss-elbow-2",
    href: "/catalog/products/ss-elbow-2",
    requestHref: "/request?product=ss-elbow-2",
    manufacturer: "PipeWorks",
    manufacturerId: "m4",
    brand: "PipeWorks",
    brandId: "b4",
    country: "Italy",
    moq: "100 units",
    leadTime: "10–14 days (indicative)",
    availability: "available_to_source",
    categoryId: "c-fittings",
    categoryName: "Fittings",
  },
];

/** Storybook / test fixture - API-shaped presentational data. */
export const catalogFixture: Omit<
  ProductCatalogProps,
  | "filters"
  | "onFiltersChange"
  | "sort"
  | "onSortChange"
  | "view"
  | "onViewChange"
  | "onPageChange"
  | "onLoadMore"
> & {
  filters: ReturnType<typeof emptyCatalogFilters>;
} = {
  categories: [
    {
      id: "c-valves",
      name: "Industrial valves",
      slug: "industrial-valves",
      productCount: 42,
      children: [
        { id: "c-ball", name: "Ball valves", slug: "ball-valves", productCount: 18 },
        { id: "c-gate", name: "Gate valves", slug: "gate-valves", productCount: 12 },
      ],
    },
    {
      id: "c-hvac",
      name: "HVAC",
      slug: "hvac",
      productCount: 27,
    },
    {
      id: "c-lab",
      name: "Laboratory",
      slug: "laboratory",
      productCount: 15,
    },
    {
      id: "c-fittings",
      name: "Fittings",
      slug: "fittings",
      productCount: 61,
    },
  ],
  products,
  manufacturers: [
    { id: "m1", label: "FlowTech GmbH", count: 12 },
    { id: "m2", label: "CoolAir Inc.", count: 8 },
    { id: "m3", label: "BioPure Labs", count: 5 },
    { id: "m4", label: "PipeWorks", count: 20 },
  ],
  brands: [
    { id: "b1", label: "FlowTech", count: 12 },
    { id: "b2", label: "CoolAir", count: 8 },
    { id: "b3", label: "BioPure", count: 5 },
    { id: "b4", label: "PipeWorks", count: 20 },
  ],
  suppliers: [
    { id: "s1", label: "Managed sourcing", count: 40 },
    { id: "s2", label: "EU Direct", count: 14 },
  ],
  countries: [
    { id: "Germany", label: "Germany", count: 12 },
    { id: "USA", label: "USA", count: 8 },
    { id: "Netherlands", label: "Netherlands", count: 5 },
    { id: "Italy", label: "Italy", count: 20 },
  ],
  availabilityOptions: [
    { id: "available_to_source", label: "Available to source", count: 30 },
    { id: "limited", label: "Limited", count: 6 },
    { id: "lead_time_constrained", label: "Lead-time constrained", count: 8 },
  ],
  filters: emptyCatalogFilters(),
  pagination: { page: 1, pageSize: 20, total: 4, hasMore: false },
  recommendations: [
    {
      ...products[0]!,
      id: "rec1",
      reason: "Similar to items in your recent requests",
    },
  ],
  recentlyViewed: [products[2]!],
  relatedProducts: [products[3]!],
};

export { products as catalogFixtureProducts };
