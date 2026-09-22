export const PROCUREMENT_SERVICE_VISUALS: Readonly<Record<string, { src: string; alt: string }>> = {
  "custom-product-sourcing": {
    src: "/catalogue/service-visuals/custom-product-sourcing.svg",
    alt: "Custom Product Sourcing service illustration",
  },
  "bulk-and-institutional-procurement": {
    src: "/catalogue/service-visuals/bulk-and-institutional-procurement.svg",
    alt: "Bulk and Institutional Procurement service illustration",
  },
  "oem-and-private-label-sourcing": {
    src: "/catalogue/service-visuals/oem-and-private-label-sourcing.svg",
    alt: "OEM and Private-Label Sourcing service illustration",
  },
  "project-based-procurement": {
    src: "/catalogue/service-visuals/project-based-procurement.svg",
    alt: "Project-Based Procurement service illustration",
  },
  "tender-and-boq-bom-procurement": {
    src: "/catalogue/service-visuals/tender-and-boq-bom-procurement.svg",
    alt: "Tender and BOQ/BOM Procurement service illustration",
  },
  "replacement-parts-and-components-sourcing": {
    src: "/catalogue/service-visuals/replacement-parts-and-components-sourcing.svg",
    alt: "Replacement Parts and Components Sourcing service illustration",
  },
  "international-supplier-sourcing": {
    src: "/catalogue/service-visuals/international-supplier-sourcing.svg",
    alt: "International Supplier Sourcing service illustration",
  },
  "supplier-verification-and-product-matching": {
    src: "/catalogue/service-visuals/supplier-verification-and-product-matching.svg",
    alt: "Supplier Verification and Product Matching service illustration",
  },
  "multi-vendor-procurement-consolidation": {
    src: "/catalogue/service-visuals/multi-vendor-procurement-consolidation.svg",
    alt: "Multi-Vendor Procurement Consolidation service illustration",
  },
  "special-specification-hard-to-find-procurement": {
    src: "/catalogue/service-visuals/special-specification-hard-to-find-procurement.svg",
    alt: "Special Specification and Hard-to-Find Procurement service illustration",
  },
};

export function procurementServiceVisual(slug: string) {
  return PROCUREMENT_SERVICE_VISUALS[slug] ?? null;
}
