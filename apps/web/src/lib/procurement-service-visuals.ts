type ServiceVisual = { src: string; alt: string };

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function serviceSvg(title: string, subtitle: string, icon: string): string {
  const safeTitle = escapeXml(title);
  const safeSubtitle = escapeXml(subtitle);
  const safeIcon = escapeXml(icon);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 620" role="img" aria-label="${safeTitle}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#102033"/>
        <stop offset="1" stop-color="#182b42"/>
      </linearGradient>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f0cd68"/>
        <stop offset="1" stop-color="#b58a2a"/>
      </linearGradient>
    </defs>
    <rect width="900" height="620" rx="34" fill="url(#bg)"/>
    <rect x="28" y="28" width="844" height="564" rx="26" fill="none" stroke="#27415f" stroke-width="3"/>
    <circle cx="450" cy="235" r="112" fill="#0c1726" stroke="url(#gold)" stroke-width="5"/>
    <text x="450" y="260" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="88" font-weight="700" fill="#f0cd68">${safeIcon}</text>
    <text x="450" y="420" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="30" font-weight="700" fill="#ffffff">${safeTitle}</text>
    <text x="450" y="468" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="20" fill="#c7d2e3">${safeSubtitle}</text>
    <rect x="305" y="515" width="290" height="7" rx="4" fill="url(#gold)"/>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const PROCUREMENT_SERVICE_VISUALS: Readonly<Record<string, ServiceVisual>> = {
  "custom-product-sourcing": {
    src: serviceSvg("Custom Product Sourcing", "Specification-led international sourcing", "⌕"),
    alt: "Custom Product Sourcing service illustration",
  },
  "bulk-and-institutional-procurement": {
    src: serviceSvg("Bulk & Institutional Procurement", "Large-volume organisational procurement", "▦"),
    alt: "Bulk and Institutional Procurement service illustration",
  },
  "oem-and-private-label-sourcing": {
    src: serviceSvg("OEM & Private-Label Sourcing", "Manufacturing, branding and private-label supply", "⚙"),
    alt: "OEM and Private-Label Sourcing service illustration",
  },
  "project-based-procurement": {
    src: serviceSvg("Project-Based Procurement", "Coordinated sourcing for defined projects", "☑"),
    alt: "Project-Based Procurement service illustration",
  },
  "tender-and-boq-bom-procurement": {
    src: serviceSvg("Tender & BOQ/BOM Procurement", "Tender, bill-of-quantities and bill-of-material sourcing", "≣"),
    alt: "Tender and BOQ/BOM Procurement service illustration",
  },
  "replacement-parts-and-components-sourcing": {
    src: serviceSvg("Replacement Parts & Components", "Compatible and manufacturer-specified components", "⚙"),
    alt: "Replacement Parts and Components Sourcing service illustration",
  },
  "international-supplier-sourcing": {
    src: serviceSvg("International Supplier Sourcing", "Supplier discovery across global markets", "◎"),
    alt: "International Supplier Sourcing service illustration",
  },
  "supplier-verification-and-product-matching": {
    src: serviceSvg("Supplier Verification & Matching", "Supplier checks and product specification matching", "✓"),
    alt: "Supplier Verification and Product Matching service illustration",
  },
  "multi-vendor-procurement-consolidation": {
    src: serviceSvg("Multi-Vendor Consolidation", "Combine multiple supplier orders into one workflow", "⇄"),
    alt: "Multi-Vendor Procurement Consolidation service illustration",
  },
  "special-specification-hard-to-find-procurement": {
    src: serviceSvg("Special Specification Procurement", "Hard-to-find and non-standard sourcing", "✦"),
    alt: "Special Specification and Hard-to-Find Procurement service illustration",
  },
};

export function procurementServiceVisual(slug: string) {
  return PROCUREMENT_SERVICE_VISUALS[slug] ?? null;
}
