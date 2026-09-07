/**
 * Public visual assets registry.
 *
 * kind:
 * - actual: genuine Almahbub-owned photography
 * - representative: licensed stock/open imagery used for illustration only  - 
 *   never claim as Almahbub facilities, staff, farms, or product lots
 * - illustrative: project SVG / brand artwork (not photography)
 */

export type MediaAssetKind = "actual" | "representative" | "illustrative";

/** Staging authenticity (IE-IMAGE-02). Stock is never `official`. */
export type MediaAuthenticity = "official" | "representative" | "contextual";

export type MediaAsset = {
  id: string;
  src: string;
  alt: string;
  kind: MediaAssetKind;
  /** Human-readable subject for audits. */
  subject: string;
  source?: string;
  license?: string;
  licenseUrl?: string;
  authenticity?: MediaAuthenticity;
  downloadDate?: string;
  usedOn: readonly string[];
};

/**
 * Newly sourced Unsplash assets for IE-4 process visuals.
 * Unsplash License - free commercial use; not Almahbub-owned photography.
 * @see https://unsplash.com/license
 */
export const IE_PROCESS_MEDIA = {
  heroPort: {
    id: "ie-process-hero-port",
    src: "/media/ie/process-hero-port.jpg",
    alt: "Representative photo of a busy shipping port with cranes and containers",
    kind: "representative" as const,
    subject: "Port logistics / export context (hero)",
    source: "Unsplash - Jason Leung (@ninjason), photo Ru635lrpsOA",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: [
      "/businesses/almahbub-integrated-export/process",
      "/businesses/almahbub-integrated-export/quality",
      "/businesses/almahbub-integrated-export/markets",
      "/businesses/almahbub-integrated-export/about",
    ] as const,
  },
  sourcingBeans: {
    id: "ie-process-sourcing-beans",
    src: "/media/ie/process-sourcing-beans.jpg",
    alt: "Representative photo of unroasted coffee beans in a burlap sack",
    kind: "representative" as const,
    subject: "Agricultural commodity texture (sourcing stage)",
    source: "Unsplash - photo lEJDGl8nLhM",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: [
      "/businesses/almahbub-integrated-export/process",
      "/businesses/almahbub-integrated-export/quality",
      "/businesses/almahbub-integrated-export/about",
    ] as const,
  },
  qualityBeans: {
    id: "ie-process-quality-beans",
    src: "/media/ie/process-quality-beans.jpg",
    alt: "Representative photo of coffee beans in a sack",
    kind: "representative" as const,
    subject: "Commodity detail (quality alignment stage)",
    source: "Unsplash - Nadia Valko (@nadiavalko), photo 7QlJ79Cj43w",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: [
      "/businesses/almahbub-integrated-export/process",
      "/businesses/almahbub-integrated-export/quality",
    ] as const,
  },
  documentation: {
    id: "ie-process-documentation",
    src: "/media/ie/process-documentation.jpg",
    alt: "Representative photo of two people reviewing documents at a table",
    kind: "representative" as const,
    subject: "Enquiry / documentation discussion",
    source: "Unsplash - photo MhqUBTxQ3Hw",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: [
      "/businesses/almahbub-integrated-export/process",
      "/businesses/almahbub-integrated-export/quality",
    ] as const,
  },
  logisticsShip: {
    id: "ie-process-logistics-ship",
    src: "/media/ie/process-logistics-ship.jpg",
    alt: "Representative aerial photo of a container ship at a port",
    kind: "representative" as const,
    subject: "Export logistics planning",
    source: "Unsplash - photo w8VfTO3TGs8",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: [
      "/businesses/almahbub-integrated-export/process",
      "/",
    ] as const,
  },
} as const satisfies Record<string, MediaAsset>;

/**
 * Representative imagery for Almahbub International V1 public categories.
 * Unsplash License - not Almahbub facilities, staff, inventory, or owned lots.
 * Mapped by category slug only; does not invent product SKUs.
 * @see https://unsplash.com/license
 */
export const INTERNATIONAL_CATEGORY_MEDIA = {
  "iphones-gadgets": {
    id: "intl-category-iphones-gadgets",
    src: "/media/international/category-iphones-gadgets.jpg",
    alt: "Representative photo of a modern smartphone",
    kind: "representative" as const,
    subject: "Consumer electronics / gadgets category illustration",
    source: "Unsplash - photo-1511707171634-5f897ff02aa9",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: ["/", "/products"] as const,
  },
  "medical-equipments": {
    id: "intl-category-medical-equipments",
    src: "/media/international/category-medical-equipments.jpg",
    alt: "Representative photo of a stethoscope on a clinical surface",
    kind: "representative" as const,
    subject: "Medical equipment category illustration",
    source: "Unsplash - photo-1585435557343-3b092031a831",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: ["/", "/products"] as const,
  },
  "home-garden-wares": {
    id: "intl-category-home-garden-wares",
    src: "/media/international/category-home-garden-wares.jpg",
    alt: "Representative photo of garden plants and greenery",
    kind: "representative" as const,
    subject: "Home and garden wares category illustration",
    source: "Unsplash - photo-1416879595882-3373a0480b5b",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: ["/", "/products"] as const,
  },
  machineries: {
    id: "intl-category-machineries",
    src: "/media/international/category-machineries.jpg",
    alt: "Representative photo of industrial machinery",
    kind: "representative" as const,
    subject: "Machineries category illustration",
    source: "Unsplash - photo-1565043666747-69f6646db940",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: ["/", "/products"] as const,
  },
  "general-procurement": {
    id: "intl-category-general-procurement",
    src: "/media/international/category-general-procurement.jpg",
    alt: "Representative photo of a warehouse aisle with stacked goods",
    kind: "representative" as const,
    subject: "General procurement / logistics category illustration",
    source: "Unsplash - photo-1586528116311-ad8dd3c8310d",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    usedOn: ["/", "/products"] as const,
  },
} as const satisfies Record<string, MediaAsset>;

/**
 * IE-IMAGE-02 portal shared media (representative/contextual Unsplash).
 * Not commodity catalogue assets. Never Almahbub-owned facilities.
 */
export const IE_PORTAL_MEDIA = {
  homeHero: {
    id: "IE-PORTAL-HOME-HERO-001",
    src: "/media/ie/portal/hero/ie-portal-home-hero-01.webp",
    alt: "Representative imagery illustrating agro commodity export trade",
    kind: "representative" as const,
    authenticity: "representative" as const,
    subject: "IE homepage hero - spice/commodity assortment",
    source: "Unsplash - Chad Montano, photo-1596040033229-a9821ebd058d",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export"] as const,
  },
  homeHeroAlt: {
    id: "IE-PORTAL-HOME-HERO-002",
    src: "/media/ie/portal/hero/ie-portal-home-hero-02.webp",
    alt: "Representative photo of export logistics at a shipping port",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE homepage hero alternate - port containers",
    source: "Unsplash - chuttersnap, photo-1578575437130-527eed3abbec",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export"] as const,
  },
  capabilityCommodities: {
    id: "IE-PORTAL-CAP-COMMODITIES-001",
    src: "/media/ie/portal/capabilities/ie-portal-capability-commodities-01.webp",
    alt: "Representative assortment of agro commodities for illustration",
    kind: "representative" as const,
    authenticity: "representative" as const,
    subject: "IE capability - commodities",
    source: "Unsplash - licensed stock (see docs/ie-image-02-provenance.json)",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export"] as const,
  },
  capabilityBulk: {
    id: "IE-PORTAL-CAP-BULK-001",
    src: "/media/ie/portal/capabilities/ie-portal-capability-bulk-01.webp",
    alt: "Representative photo of bulk commodity packaging in sacks",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE capability - bulk sacks",
    source: "Unsplash - Nathan Dumlao, photo-1586201375761-83865001e31c",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export"] as const,
  },
  capabilityExport: {
    id: "IE-PORTAL-CAP-EXPORT-001",
    src: "/media/ie/portal/capabilities/ie-portal-capability-export-01.webp",
    alt: "Representative photo of international export logistics",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE capability - export ship",
    source: "Unsplash - Louis Reed, photo-1494412574643-ff11b0a5c1c3",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export"] as const,
  },
  processEnquiry: {
    id: "IE-PORTAL-PROCESS-ENQUIRY-001",
    src: "/media/ie/portal/process/ie-portal-process-enquiry-01.webp",
    alt: "Representative photo of a business discussion over documents",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE process - enquiry discussion",
    source: "Unsplash - Scott Graham, photo-1454165804606-c3d57bc86b40",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export/process"] as const,
  },
  qualityDetail: {
    id: "IE-PORTAL-QUALITY-001",
    src: "/media/ie/portal/quality/ie-portal-quality-detail-01.webp",
    alt: "Representative close-up of agro commodity appearance for quality context",
    kind: "representative" as const,
    authenticity: "representative" as const,
    subject: "IE quality - commodity detail",
    source: "Unsplash - Mockup Graphics, photo-1464226184884-fa280b87c399",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export/quality"] as const,
  },
  marketsReach: {
    id: "IE-PORTAL-MARKETS-001",
    src: "/media/ie/portal/markets/ie-portal-markets-reach-01.webp",
    alt: "Representative imagery suggesting international trade logistics",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE markets - trade logistics",
    source: "Unsplash - licensed stock (see docs/ie-image-02-provenance.json)",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export/markets"] as const,
  },
  about: {
    id: "IE-PORTAL-ABOUT-001",
    src: "/media/ie/portal/about/ie-portal-about-01.webp",
    alt: "Representative imagery for Integrated Export business context",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE about - business discussion",
    source: "Unsplash - LinkedIn Sales Solutions, photo-1521737711867-e3b97375f902",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: ["/businesses/almahbub-integrated-export/about"] as const,
  },
  contact: {
    id: "IE-PORTAL-CONTACT-001",
    src: "/media/ie/portal/contact/ie-portal-contact-01.webp",
    alt: "Representative photo suggesting a professional export enquiry discussion",
    kind: "representative" as const,
    authenticity: "contextual" as const,
    subject: "IE contact - correspondence desk",
    source: "Unsplash - Scott Graham, photo-1450101499163-c8848c66ca85",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
    downloadDate: "2026-08-17",
    usedOn: [
      "/businesses/almahbub-integrated-export/contact",
      "/businesses/almahbub-integrated-export/request",
    ] as const,
  },
} as const satisfies Record<string, MediaAsset>;

import {
  INTERNATIONAL_CATEGORY_STAGED_MEDIA,
  listInternationalStagedMedia,
} from "./international-category-staged-media.js";

export {
  INTERNATIONAL_CATEGORY_STAGED_MEDIA,
  listInternationalStagedMedia,
};

/**
 * Legacy slug folder that must never be created (`sesame` vs `sesame-seeds`).
 */
export const IE_DEFERRED_COMMODITY_SLUGS = ["sesame"] as const;

/**
 * Staged representative media folders may exist on disk without being published.
 * Publication is owned by the IE CMS/API workflow, not by the presence of files.
 */
export const IE_STAGED_COMMODITY_MEDIA_SLUGS = [
  "sesame-seeds",
  "cashew",
  "ginger",
  "hibiscus",
  "shea",
  "soybean",
  "cocoa",
] as const;

export function getInternationalCategoryMedia(
  slug: string,
): MediaAsset | undefined {
  return INTERNATIONAL_CATEGORY_MEDIA[
    slug as keyof typeof INTERNATIONAL_CATEGORY_MEDIA
  ];
}

/** Public paths for acquired International extras (canonical files only). */
export function getInternationalCategoryExtraMedia(
  slug: string,
): readonly string[] {
  return listInternationalStagedMedia(slug).map((asset) => asset.src);
}

/** Caption shown near representative photography. */
export const REPRESENTATIVE_MEDIA_CAPTION = "";
