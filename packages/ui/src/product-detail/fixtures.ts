import { catalogFixtureProducts } from "../catalog/fixtures.js";
import type { ProductDetailModel } from "./types.js";

const [valve, compressor, reagent, fitting] = catalogFixtureProducts;

/** Storybook / test fixture for B2B product detail. */
export const productDetailFixture: ProductDetailModel = {
  id: "p1",
  name: "Ball valve DN50 PN16",
  slug: "ball-valve-dn50",
  sku: "FT-BV-50-PN16",
  model: "BV-50-SS",
  brand: "FlowTech",
  categoryName: "Industrial valves",
  description:
    "Stainless ball valve for industrial process lines. Specification-led sourcing reference - request a quotation to confirm supplier terms.",
  breadcrumbs: [
    { label: "Catalog", href: "/catalog" },
    { label: "Industrial valves", href: "/catalog/industrial-valves" },
    { label: "Ball valve DN50 PN16" },
  ],
  manufacturer: "FlowTech GmbH",
  manufacturerHref: "/catalog?manufacturer=m1",
  supplier: "Managed sourcing",
  country: "Germany",
  moq: "24 units",
  leadTime: "14–21 days (indicative)",
  availability: "available_to_source",
  requestHref: "/request?product=ball-valve-dn50",
  catalogHref: "/catalog",
  images: [
    {
      id: "img1",
      src: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1200&q=80",
      alt: "Ball valve DN50 stainless body - front view",
      thumbSrc:
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&q=60",
    },
    {
      id: "img2",
      src: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&q=80",
      alt: "Ball valve DN50 - side profile",
      thumbSrc:
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=200&q=60",
    },
    {
      id: "img3",
      src: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=1200&q=80",
      alt: "Industrial valve packaging reference",
      thumbSrc:
        "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=200&q=60",
    },
  ],
  specifications: [
    { id: "s1", group: "Dimensions", label: "Nominal size", value: "DN50" },
    { id: "s2", group: "Dimensions", label: "Pressure rating", value: "PN16" },
    {
      id: "s3",
      group: "Materials",
      label: "Body",
      value: "Stainless steel 316",
    },
    { id: "s4", group: "Materials", label: "Seat", value: "PTFE" },
    {
      id: "s5",
      group: "Performance",
      label: "Temperature range",
      value: "-20 to 180",
      unit: "°C",
    },
    {
      id: "s6",
      group: "Performance",
      label: "Connection",
      value: "Flanged",
    },
  ],
  downloads: [
    {
      id: "d1",
      title: "Technical datasheet",
      href: "/downloads/bv-50-datasheet.pdf",
      mimeType: "PDF",
      sizeLabel: "420 KB",
    },
    {
      id: "d2",
      title: "Dimensional drawing",
      href: "/downloads/bv-50-drawing.pdf",
      mimeType: "PDF",
      sizeLabel: "180 KB",
    },
  ],
  certificates: [
    {
      id: "c1",
      name: "PED Module H",
      issuer: "TÜV",
      href: "/certificates/ped-h.pdf",
      validThrough: "2027-12-31",
    },
    {
      id: "c2",
      name: "ISO 9001",
      issuer: "FlowTech GmbH",
    },
  ],
  related: [fitting!, compressor!].filter(Boolean),
  recommended: [
    {
      ...valve!,
      id: "rec-alt",
      name: "Ball valve DN50 PN25",
      reason: "Higher pressure rating alternate",
      href: "/catalog/products/ball-valve-dn50-pn25",
      requestHref: "/request?product=ball-valve-dn50-pn25",
    },
  ],
  frequentlyBoughtTogether: [fitting!, reagent!].filter(Boolean),
};
