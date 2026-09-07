/**
 * IE-IMAGE-01 — one-shot generator for acquisition manifests.
 * Run: node scripts/generate-ie-image-manifest.mjs
 *
 * After staging downloadAllowed assets, validate with:
 *   node scripts/validate-ie-image-staging.mjs
 * The validator distinguishes downloadAllowed:true vs deferred (false) packs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docsDir = path.join(root, "docs");

const CANDIDATES = [
  { slug: "sesame", name: "Sesame", categoryHint: "Oilseeds / agro commodity (unconfirmed)" },
  { slug: "cashew", name: "Cashew", categoryHint: "Tree nuts / agro commodity (unconfirmed)" },
  { slug: "ginger", name: "Ginger", categoryHint: "Spices / agro commodity (unconfirmed)" },
  { slug: "hibiscus", name: "Hibiscus", categoryHint: "Botanicals / agro commodity (unconfirmed)" },
  { slug: "shea", name: "Shea", categoryHint: "Oilseeds / agro commodity (unconfirmed)" },
  { slug: "soybean", name: "Soybean", categoryHint: "Oilseeds / pulses (unconfirmed)" },
  { slug: "cocoa", name: "Cocoa", categoryHint: "Cocoa / agro commodity (unconfirmed)" },
];

const ROLES = [
  ...Array.from({ length: 10 }, (_, i) => ({
    role: "hero",
    roleKey: "hero",
    folder: "hero",
    n: i + 1,
    websiteUsage: ["Hero", "Detail page"],
    orientation: "landscape",
    aspect: "16:9",
    minRes: "1920px wide",
    authenticity: "REPRESENTATIVE",
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    role: "product",
    roleKey: "raw",
    folder: "gallery",
    n: i + 1,
    websiteUsage: ["Card", "Gallery", "Detail page"],
    orientation: "landscape",
    aspect: "4:3",
    minRes: "1600px wide",
    authenticity: "PRODUCT",
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    role: "close-up",
    roleKey: "closeup",
    folder: "gallery",
    n: i + 1,
    websiteUsage: ["Gallery", "Detail page"],
    orientation: "square",
    aspect: "1:1",
    minRes: "1400px",
    authenticity: "PRODUCT",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    role: "packaging",
    roleKey: "packaging",
    folder: "packaging",
    n: i + 1,
    websiteUsage: ["Gallery", "Detail page"],
    orientation: "landscape",
    aspect: "4:3",
    minRes: "1600px wide",
    authenticity: "CONTEXTUAL",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    role: "handling",
    roleKey: "handling",
    folder: "context",
    n: i + 1,
    websiteUsage: ["Gallery", "Process section"],
    orientation: "landscape",
    aspect: "16:9",
    minRes: "1600px wide",
    authenticity: "CONTEXTUAL",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    role: "logistics",
    roleKey: "logistics",
    folder: "logistics",
    n: i + 1,
    websiteUsage: ["Gallery", "Process section", "Background"],
    orientation: "landscape",
    aspect: "16:9",
    minRes: "1920px wide",
    authenticity: "CONTEXTUAL",
  })),
  ...Array.from({ length: 5 }, (_, i) => ({
    role: "alternate",
    roleKey: "alt",
    folder: "gallery",
    n: i + 1,
    websiteUsage: ["Card", "Gallery"],
    orientation: "landscape",
    aspect: "4:3",
    minRes: "1600px wide",
    authenticity: "REPRESENTATIVE",
  })),
];

function pad(n) {
  return String(n).padStart(2, "0");
}

function searchBundle(name, role) {
  const base = name.toLowerCase();
  const map = {
    hero: [
      `premium ${base} commercial product photography white background`,
      `${base} commodity premium hero photograph clean composition`,
      `high resolution ${base} agricultural export product photography`,
      `professional ${base} commodity still life commercial`,
    ],
    product: [
      `raw ${base} commodity bulk appearance commercial photography`,
      `premium ${base} product shot agricultural commodity`,
      `clean ${base} agricultural commodity photography no branding`,
      `${base} export quality product photograph`,
    ],
    "close-up": [
      `${base} close up texture detail macro photography`,
      `${base} surface detail high resolution commercial`,
      `macro photograph of ${base} commodity quality appearance`,
      `${base} detail shot commercial food photography`,
    ],
    packaging: [
      `${base} in jute sack bulk packaging commercial photography`,
      `${base} export bags warehouse packaging no brand logos`,
      `bulk ${base} sacks stacked commercial agriculture`,
      `${base} carton bag packaging commodity trade`,
    ],
    handling: [
      `${base} agricultural handling sorting context photography`,
      `workers handling ${base} commodity generic farm context`,
      `${base} drying sorting agricultural process illustration`,
      `sourcing ${base} agro commodity context photography`,
    ],
    logistics: [
      `shipping containers port export logistics commercial photography`,
      `commodity export logistics container ship port cranes`,
      `warehouse pallet export shipping context no company logos`,
      `freight logistics agricultural export photography`,
    ],
    alternate: [
      `${base} alternative angle product photography commercial`,
      `${base} artistic commercial still life composition`,
      `${base} presentation food photography clean background`,
      `${base} commodity gallery composition commercial`,
    ],
  };
  return map[role] || map.product;
}

function descriptionFor(name, role, n) {
  const map = {
    hero: `Premium presentation of ${name} suitable for page hero — clean background, strong focal commodity (variant ${n}).`,
    product: `Clear view of ${name} as a tradeable commodity — identifiable form, natural colour, no branded packaging (variant ${n}).`,
    "close-up": `Close-up / detail of ${name} showing texture and appearance (variant ${n}).`,
    packaging: `Bulk packaging involving ${name} (generic sacks/cartons only — no competitor brands) (variant ${n}).`,
    handling: `Generic agricultural handling/sourcing context for ${name} — not Almahbub staff/facilities (variant ${n}).`,
    logistics: `Export/logistics context usable near ${name} content — not Almahbub-owned facilities (variant ${n}).`,
    alternate: `Alternate composition of ${name} for gallery/card variety (variant ${n}).`,
  };
  return map[role];
}

function avoidFor(role) {
  const common = [
    "Competitor logos or branded packaging",
    "Watermarks",
    "Claims that Almahbub owns farms/factories/warehouses",
    "Low resolution or heavy compression",
    "Obvious AI-fake product packaging",
  ];
  if (role === "logistics" || role === "handling") {
    return [...common, "Identifiable Almahbub staff", "Misrepresenting stock as owned facilities"];
  }
  return common;
}

const ieExisting = [
  {
    path: "apps/web/public/media/ie/process-hero-port.jpg",
    registryId: "ie-process-hero-port",
    registered: true,
  },
  {
    path: "apps/web/public/media/ie/process-sourcing-beans.jpg",
    registryId: "ie-process-sourcing-beans",
    registered: true,
  },
  {
    path: "apps/web/public/media/ie/process-quality-beans.jpg",
    registryId: "ie-process-quality-beans",
    registered: true,
  },
  {
    path: "apps/web/public/media/ie/process-documentation.jpg",
    registryId: "ie-process-documentation",
    registered: true,
  },
  {
    path: "apps/web/public/media/ie/process-logistics-ship.jpg",
    registryId: "ie-process-logistics-ship",
    registered: true,
  },
  {
    path: "apps/web/public/media/ie/process-logistics-port.jpg",
    registryId: null,
    registered: false,
    note: "On disk but not in IE_PROCESS_MEDIA registry",
  },
  {
    path: "apps/web/public/media/ie/process-spec-beans.jpg",
    registryId: null,
    registered: false,
    note: "On disk but not in IE_PROCESS_MEDIA registry",
  },
];

const intlExisting = [
  {
    slug: "iphones-gadgets",
    name: "iPhones & Gadgets",
    path: "apps/web/public/media/international/category-iphones-gadgets.jpg",
    registryId: "intl-category-iphones-gadgets",
  },
  {
    slug: "medical-equipments",
    name: "Medical Equipments",
    path: "apps/web/public/media/international/category-medical-equipments.jpg",
    registryId: "intl-category-medical-equipments",
  },
  {
    slug: "home-garden-wares",
    name: "Home & Garden Wares",
    path: "apps/web/public/media/international/category-home-garden-wares.jpg",
    registryId: "intl-category-home-garden-wares",
  },
  {
    slug: "machineries",
    name: "Machineries",
    path: "apps/web/public/media/international/category-machineries.jpg",
    registryId: "intl-category-machineries",
  },
  {
    slug: "general-procurement",
    name: "General Procurement",
    path: "apps/web/public/media/international/category-general-procurement.jpg",
    registryId: "intl-category-general-procurement",
  },
];

const iePortalShared = [
  {
    id: "IE-PORTAL-HOME-HERO-001",
    role: "hero",
    filename: "ie-portal-home-hero-01.webp",
    folder: "apps/web/public/media/ie/portal/hero/",
    priority: "P0",
    usage: ["Homepage hero"],
    queries: [
      "african agro commodity export commercial photography clean composition",
      "premium agricultural commodities still life commercial hero",
      "bulk agro commodities export trade photography no branding",
      "oilseeds spices nuts assortment commercial food photography",
    ],
    description:
      "Homepage hero for Integrated Export — agro commodity trade atmosphere without inventing a published commodity catalogue.",
    authenticity: "REPRESENTATIVE",
    aspect: "16:9",
    minRes: "1920px wide",
    alt: "Representative imagery illustrating agro commodity export trade",
  },
  {
    id: "IE-PORTAL-HOME-HERO-002",
    role: "hero",
    filename: "ie-portal-home-hero-02.webp",
    folder: "apps/web/public/media/ie/portal/hero/",
    priority: "P1",
    usage: ["Homepage hero alternate"],
    queries: [
      "shipping containers agricultural export port photography",
      "export logistics agro commodities commercial landscape",
      "container terminal export trade photography",
    ],
    description: "Alternate homepage hero emphasizing export coordination context.",
    authenticity: "CONTEXTUAL",
    aspect: "16:9",
    minRes: "1920px wide",
    alt: "Representative photo of export logistics at a shipping port",
  },
  {
    id: "IE-PORTAL-CAP-COMMODITIES-001",
    role: "product",
    filename: "ie-portal-capability-commodities-01.webp",
    folder: "apps/web/public/media/ie/portal/capabilities/",
    priority: "P0",
    usage: ["Homepage capability — Commodities"],
    queries: [
      "mixed agro commodities seeds nuts spices product photography",
      "bulk agricultural commodities commercial still life",
      "raw agro commodities assortment no brand packaging",
    ],
    description: "Capability card for commodities focus — generic agro assortment only.",
    authenticity: "REPRESENTATIVE",
    aspect: "4:3",
    minRes: "1600px wide",
    alt: "Representative assortment of agro commodities for illustration",
  },
  {
    id: "IE-PORTAL-CAP-BULK-001",
    role: "packaging",
    filename: "ie-portal-capability-bulk-01.webp",
    folder: "apps/web/public/media/ie/portal/capabilities/",
    priority: "P0",
    usage: ["Homepage capability — Bulk supply"],
    queries: [
      "bulk jute sacks agricultural commodities warehouse photography",
      "stacked commodity sacks commercial agriculture no logos",
      "bulk agro packaging bags export supply",
    ],
    description: "Capability card for bulk supply — generic sacks/bulk presentation.",
    authenticity: "CONTEXTUAL",
    aspect: "4:3",
    minRes: "1600px wide",
    alt: "Representative photo of bulk commodity packaging in sacks",
  },
  {
    id: "IE-PORTAL-CAP-EXPORT-001",
    role: "logistics",
    filename: "ie-portal-capability-export-01.webp",
    folder: "apps/web/public/media/ie/portal/capabilities/",
    priority: "P0",
    usage: ["Homepage capability — Export"],
    queries: [
      "container ship export logistics aerial photography",
      "freight containers port export commercial",
      "international shipping logistics photography",
    ],
    description: "Capability card for export coordination.",
    authenticity: "CONTEXTUAL",
    aspect: "4:3",
    minRes: "1600px wide",
    alt: "Representative photo of international export logistics",
  },
  {
    id: "IE-PORTAL-PROCESS-ENQUIRY-001",
    role: "handling",
    filename: "ie-portal-process-enquiry-01.webp",
    folder: "apps/web/public/media/ie/portal/process/",
    priority: "P1",
    usage: ["Process page"],
    queries: [
      "business meeting reviewing documents commercial photography",
      "procurement discussion documents table professional",
      "B2B enquiry meeting photography no brand logos",
    ],
    description: "Additional enquiry/discussion visual to reduce documentation-photo reuse.",
    authenticity: "CONTEXTUAL",
    aspect: "16:9",
    minRes: "1600px wide",
    alt: "Representative photo of a business discussion over documents",
  },
  {
    id: "IE-PORTAL-QUALITY-001",
    role: "close-up",
    filename: "ie-portal-quality-detail-01.webp",
    folder: "apps/web/public/media/ie/portal/quality/",
    priority: "P1",
    usage: ["Quality page"],
    queries: [
      "agro commodity quality inspection close up no lab claims",
      "seeds grains quality sorting photography commercial",
      "agricultural product quality appearance photography",
    ],
    description: "Quality page visual focused on appearance — no invented certifications.",
    authenticity: "REPRESENTATIVE",
    aspect: "1:1",
    minRes: "1400px",
    alt: "Representative close-up of agro commodity appearance for quality context",
  },
  {
    id: "IE-PORTAL-MARKETS-001",
    role: "logistics",
    filename: "ie-portal-markets-reach-01.webp",
    folder: "apps/web/public/media/ie/portal/markets/",
    priority: "P1",
    usage: ["Markets page"],
    queries: [
      "global trade shipping logistics commercial photography",
      "world trade logistics containers commercial",
      "international freight network photography",
    ],
    description: "Markets page atmosphere — must not invent countries served.",
    authenticity: "CONTEXTUAL",
    aspect: "16:9",
    minRes: "1920px wide",
    alt: "Representative imagery suggesting international trade logistics",
  },
  {
    id: "IE-PORTAL-ABOUT-001",
    role: "alternate",
    filename: "ie-portal-about-01.webp",
    folder: "apps/web/public/media/ie/portal/about/",
    priority: "P2",
    usage: ["About page"],
    queries: [
      "agro commodity trade business photography professional",
      "export coordination office documents commercial",
      "agricultural trade partnership photography",
    ],
    description: "About page supporting visual — no invented facilities.",
    authenticity: "CONTEXTUAL",
    aspect: "16:9",
    minRes: "1600px wide",
    alt: "Representative imagery for Integrated Export business context",
  },
  {
    id: "IE-PORTAL-CONTACT-001",
    role: "alternate",
    filename: "ie-portal-contact-01.webp",
    folder: "apps/web/public/media/ie/portal/contact/",
    priority: "P2",
    usage: ["Contact / Request pages"],
    queries: [
      "professional business correspondence desk photography",
      "export enquiry desk commercial photography",
      "B2B contact discussion photography clean",
    ],
    description: "Contact/request supporting visual.",
    authenticity: "CONTEXTUAL",
    aspect: "4:3",
    minRes: "1600px wide",
    alt: "Representative photo suggesting a professional export enquiry discussion",
  },
];

const intlGapRoles = [
  { role: "hero", count: 3, roleKey: "hero", folder: "hero" },
  { role: "product", count: 4, roleKey: "product", folder: "gallery" },
  { role: "close-up", count: 3, roleKey: "closeup", folder: "gallery" },
  { role: "alternate", count: 3, roleKey: "alt", folder: "gallery" },
  { role: "context", count: 2, roleKey: "context", folder: "context" },
];

const intlSearch = {
  "iphones-gadgets": {
    hero: [
      "premium smartphone product photography white background commercial",
      "modern smartphone hero shot commercial electronics",
      "flagship phone product photography clean studio",
    ],
    product: [
      "smartphone gadgets flat lay commercial photography",
      "consumer electronics gadgets product photography",
      "mobile phone accessories commercial still life",
    ],
    "close-up": [
      "smartphone camera detail macro commercial",
      "phone screen bezel detail product photography",
      "electronics finish texture close up",
    ],
    alternate: [
      "gadgets lifestyle desk photography no brand logos",
      "smartphone side angle commercial product",
      "electronics category gallery composition",
    ],
    context: [
      "retail electronics display generic no competitor logos",
      "technology procurement business context photography",
    ],
  },
  "medical-equipments": {
    hero: [
      "medical equipment product photography clean clinical",
      "stethoscope medical devices commercial photography",
      "healthcare equipment hero shot white background",
    ],
    product: [
      "hospital medical devices commercial product photography",
      "diagnostic equipment still life no brand logos",
      "clinical instruments product photography",
    ],
    "close-up": [
      "medical device detail macro photography",
      "clinical instrument texture close up",
      "medical equipment quality finish detail",
    ],
    alternate: [
      "medical supplies arrangement commercial photography",
      "healthcare tools flat lay professional",
      "clinical equipment gallery composition",
    ],
    context: [
      "hospital corridor clinical context photography no patients identifiable",
      "healthcare procurement context photography",
    ],
  },
  "home-garden-wares": {
    hero: [
      "home garden wares product photography outdoor greenery",
      "garden tools homewares commercial hero",
      "home and garden category photography clean",
    ],
    product: [
      "garden tools homewares product photography",
      "household garden wares commercial still life",
      "home garden products assortment photography",
    ],
    "close-up": [
      "garden plant leaf texture close up",
      "homeware material detail photography",
      "garden tool finish detail commercial",
    ],
    alternate: [
      "patio garden lifestyle photography commercial",
      "home garden gallery composition",
      "indoor plants homewares photography",
    ],
    context: [
      "garden centre aisle generic no logos",
      "home outdoor living context photography",
    ],
  },
  machineries: {
    hero: [
      "industrial machinery product photography commercial",
      "factory machine equipment hero shot",
      "heavy machinery commercial photography clean",
    ],
    product: [
      "industrial equipment machinery still life",
      "machine tools commercial product photography",
      "industrial machinery category photography",
    ],
    "close-up": [
      "machinery metal detail macro photography",
      "industrial equipment texture close up",
      "machine component detail commercial",
    ],
    alternate: [
      "workshop machinery gallery composition",
      "industrial equipment alternate angle",
      "machineries category commercial photography",
    ],
    context: [
      "factory floor machinery context no company branding",
      "industrial procurement warehouse machinery",
    ],
  },
  "general-procurement": {
    hero: [
      "warehouse logistics procurement commercial photography",
      "stacked goods warehouse aisle hero shot",
      "general procurement supply chain photography",
    ],
    product: [
      "palletized goods warehouse commercial photography",
      "industrial supplies assortment photography",
      "procurement goods stacked commercial",
    ],
    "close-up": [
      "packaging carton detail warehouse photography",
      "pallet wrap texture close up commercial",
      "labelled carton generic no brands close up",
    ],
    alternate: [
      "supply chain warehouse gallery composition",
      "logistics goods alternate angle photography",
      "procurement category commercial still",
    ],
    context: [
      "freight warehouse operations photography",
      "general sourcing logistics context",
    ],
  },
};

function buildCandidateImages(c) {
  return ROLES.map((r) => {
    const queries = searchBundle(c.name, r.role);
    const num = pad(r.n);
    const filename = `ie-${c.slug}-${r.roleKey}-${num}.webp`;
    return {
      id: `IE-${c.slug.toUpperCase()}-${r.roleKey.toUpperCase()}-${num}`,
      domain: "integrated_export",
      status: "needs_owner_confirmation",
      downloadAllowed: false,
      createFolder: false,
      commodity: c.name,
      commoditySlug: c.slug,
      category: c.categoryHint,
      imageRole: r.role,
      description: descriptionFor(c.name, r.role, r.n),
      primarySearchQuery: queries[0],
      alternativeSearchQueries: queries.slice(1),
      visualRequirements: [
        "High resolution and sharp focus",
        "Commercially appropriate",
        `Clearly readable as ${c.name} where role is product/close-up/hero`,
        "Free of watermarks and unrelated company branding",
      ],
      avoid: avoidFor(r.role),
      preferredOrientation: r.orientation,
      preferredAspectRatio: r.aspect,
      recommendedMinResolution: r.minRes,
      websiteUsage: r.websiteUsage,
      suggestedFilename: filename,
      suggestedFolder: `apps/web/public/media/ie/commodities/${c.slug}/${r.folder}/`,
      altText: `Representative photograph of ${c.name} (${r.role})`,
      licenseNote:
        "Retain source URL, creator, license, download date. Prefer Unsplash, Pexels, Wikimedia Commons, or clear open/commercial licenses. Google Images for discovery only.",
      authenticity: r.authenticity,
      priority:
        r.role === "hero" || r.role === "product"
          ? "P0"
          : r.role === "close-up" || r.role === "packaging"
            ? "P1"
            : "P2",
      acceptableSources: [
        "Unsplash",
        "Pexels",
        "Wikimedia Commons",
        "Clear manufacturer-permissioned media",
      ],
    };
  });
}

function buildIntlGaps(cat) {
  const images = [];
  for (const def of intlGapRoles) {
    for (let i = 1; i <= def.count; i++) {
      const queries = intlSearch[cat.slug][def.role] || intlSearch[cat.slug].product;
      const num = pad(i);
      const filename = `intl-${cat.slug}-${def.roleKey}-${num}.webp`;
      images.push({
        id: `INTL-${cat.slug.toUpperCase().replaceAll("-", "_")}-${def.roleKey.toUpperCase()}-${num}`,
        domain: "international",
        status: "acquisition_needed",
        downloadAllowed: true,
        createFolder: true,
        category: cat.name,
        categorySlug: cat.slug,
        imageRole: def.role,
        description: `Additional ${def.role} imagery for International category "${cat.name}" (variant ${i}). Do not invent product SKUs.`,
        primarySearchQuery: queries[0],
        alternativeSearchQueries: queries.slice(1),
        visualRequirements: [
          "High resolution",
          "Suitable for homepage category card and category browsing",
          "No competitor logos",
          "Not presented as Almahbub-owned inventory unless official",
        ],
        avoid: [
          "Competitor branding",
          "Watermarks",
          "Misleading facility ownership claims",
          "Agro commodities (IE domain)",
        ],
        preferredOrientation: def.role === "close-up" ? "square" : "landscape",
        preferredAspectRatio:
          def.role === "close-up" ? "1:1" : def.role === "hero" ? "16:9" : "4:3",
        recommendedMinResolution: def.role === "hero" ? "1920px wide" : "1600px wide",
        websiteUsage:
          def.role === "hero"
            ? ["Homepage category", "Category page"]
            : ["Category page", "Gallery"],
        suggestedFilename: filename,
        suggestedFolder: `apps/web/public/media/international/categories/${cat.slug}/${def.folder}/`,
        altText: `Representative imagery for ${cat.name} (${def.role})`,
        licenseNote:
          "Retain source URL, creator, license, download date. Prefer Unsplash/Pexels/Wikimedia. Google Images discovery only.",
        authenticity: "REPRESENTATIVE",
        priority: def.role === "hero" || def.role === "product" ? "P0" : "P1",
        acceptableSources: ["Unsplash", "Pexels", "Wikimedia Commons"],
      });
    }
  }
  return images;
}

const candidatePlans = CANDIDATES.map((c) => ({
  commodity: c.name,
  slug: c.slug,
  status: "needs_owner_confirmation",
  verifiedInRepo: false,
  sourceOfMention:
    "docs/integrated-export-experience-audit.md (suggested candidates only; IE_COMMODITY_RECORDS is empty)",
  createFolders: false,
  downloadAllowed: false,
  targetImageCount: 50,
  whyFifty:
    "Standard catalogue depth once owner publishes this commodity. Do not download until confirmed.",
  roleDistribution: {
    hero: 10,
    product: 10,
    "close-up": 10,
    packaging: 5,
    handling: 5,
    logistics: 5,
    alternate: 5,
  },
  images: buildCandidateImages(c),
}));

const intlPlans = intlExisting.map((cat) => ({
  category: cat.name,
  slug: cat.slug,
  status: "verified_v1_taxonomy",
  existingCount: 1,
  existingPath: cat.path,
  registryId: cat.registryId,
  whyNotFifty:
    "International V1 categories need strong category illustration depth, not 50 repetitive stock frames. Product SKU photography is separate and must follow published Product records — none invented here. Target +15 complementary assets per category.",
  targetAdditional: 15,
  images: buildIntlGaps(cat),
}));

const portalImages = iePortalShared.map((p) => ({
  id: p.id,
  domain: "integrated_export",
  status: "acquisition_needed",
  downloadAllowed: true,
  createFolder: true,
  commodity: null,
  category: "IE portal shared (non-commodity)",
  imageRole: p.role,
  description: p.description,
  primarySearchQuery: p.queries[0],
  alternativeSearchQueries: p.queries.slice(1),
  visualRequirements: [
    "High resolution",
    "Commercially appropriate",
    "No competitor branding",
    "Must remain labelled representative/contextual",
  ],
  avoid: [
    "Invented commodity catalogue claims",
    "Our farm/warehouse/facility wording",
    "Watermarks",
    "Competitor logos",
  ],
  preferredOrientation: "landscape",
  preferredAspectRatio: p.aspect,
  recommendedMinResolution: p.minRes,
  websiteUsage: p.usage,
  suggestedFilename: p.filename,
  suggestedFolder: p.folder,
  altText: p.alt,
  licenseNote:
    "Retain source URL, creator, license, download date. Prefer Unsplash/Pexels/Wikimedia. Google Images discovery only.",
  authenticity: p.authenticity,
  priority: p.priority,
  acceptableSources: ["Unsplash", "Pexels", "Wikimedia Commons"],
}));

const summary = {
  verifiedIeCommodities: [],
  ieCategoriesStructured: [],
  needsOwnerConfirmationCommodities: CANDIDATES.map((c) => c.name),
  internationalCategories: intlExisting.map((c) => ({ name: c.name, slug: c.slug })),
  counts: {
    ieExistingOnDisk: ieExisting.length,
    ieExistingRegistered: ieExisting.filter((e) => e.registered).length,
    iePortalSharedNeeded: portalImages.length,
    ieCandidateSlotsDeferred: candidatePlans.reduce((n, p) => n + p.images.length, 0),
    internationalExistingCategoryImages: intlExisting.length,
    internationalAdditionalNeeded: intlPlans.reduce((n, p) => n + p.images.length, 0),
    internationalSvgLegacyIllustrative: 11,
  },
  totals: {
    ieImagesNeededNow: portalImages.length,
    ieImagesDeferredUntilOwnerConfirmation: candidatePlans.reduce(
      (n, p) => n + p.images.length,
      0,
    ),
    internationalImagesNeeded: intlPlans.reduce((n, p) => n + p.images.length, 0),
    currentIeRasterImages: ieExisting.length,
    currentInternationalCategoryRasterImages: intlExisting.length,
  },
};

const manifest = {
  schemaVersion: 1,
  phase: "IE-IMAGE-01",
  generatedAt: new Date().toISOString(),
  rules: {
    doNotInventCommodities: true,
    doNotMixInternationalAndIe: true,
    googleImagesDiscoveryOnly: true,
    stockIsNeverOfficialAlmahbubPhotography: true,
  },
  filenameConvention: {
    ieCommodity: "ie-[commodity-slug]-[role]-[nn].webp",
    iePortal: "ie-portal-[section]-[role]-[nn].webp",
    international: "intl-[category-slug]-[role]-[nn].webp",
  },
  folderConvention: {
    iePortal:
      "apps/web/public/media/ie/portal/{hero|capabilities|process|quality|markets|about|contact}/",
    ieCommodity:
      "apps/web/public/media/ie/commodities/[slug]/{hero|gallery|packaging|context|logistics}/",
    international:
      "apps/web/public/media/international/categories/[slug]/{hero|gallery|context}/",
    note: "Do not create commodity folders until owner confirms the commodity list.",
  },
  selectionRules: {
    prefer: [
      "high resolution",
      "sharp",
      "commercially appropriate",
      "no watermarks",
      "no unrelated branding",
      "crop-friendly",
      "clear commodity identity",
    ],
    avoid: [
      "AI-fake packaging",
      "competitor logos",
      "screenshots",
      "unclear provenance",
      "misleading facility photos",
      "claiming Almahbub ownership of farms/factories",
    ],
  },
  licensing: {
    retain: [
      "source URL",
      "creator/photographer",
      "license",
      "download date",
      "attribution requirement if any",
    ],
    preferredSources: [
      "Unsplash",
      "Pexels",
      "Wikimedia Commons",
      "clear open/government licenses",
      "manufacturer media with explicit permission",
    ],
    forbidden: ["Blind Google Images hotlinking/copy without license"],
  },
  summary,
  integratedExport: {
    verifiedCommodities: [],
    existingMedia: ieExisting,
    portalSharedAcquisition: portalImages,
    needsOwnerConfirmation: candidatePlans,
    fiftyImageTargetNote:
      "No verified IE commodities exist in IE_COMMODITY_RECORDS ([]). A 50-image pack per commodity is prepared only under needsOwnerConfirmation and must not be downloaded or foldered until the owner publishes an approved list.",
  },
  international: {
    verifiedCategories: intlExisting,
    gapManifest: intlPlans,
  },
  validationIndex: {
    allowedFilenamesNow: [
      ...portalImages.map((i) => i.suggestedFilename),
      ...intlPlans.flatMap((p) => p.images.map((i) => i.suggestedFilename)),
    ],
    deferredFilenamesUntilOwnerConfirmation: candidatePlans.flatMap((p) =>
      p.images.map((i) => i.suggestedFilename),
    ),
  },
};

fs.mkdirSync(docsDir, { recursive: true });
const jsonPath = path.join(docsDir, "integrated-export-image-acquisition-manifest.json");
fs.writeFileSync(jsonPath, JSON.stringify(manifest, null, 2));
console.log("Wrote", jsonPath);
console.log(JSON.stringify(summary.totals, null, 2));
