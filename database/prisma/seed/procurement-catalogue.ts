/**
 * Structured procurable-product catalogue for development and staging seeds.
 * These are sourcing types, not confirmed warehouse stock.
 */

export const PROCUREMENT_CATALOGUE_SOURCING_NOTE =
  "Available for procurement. Provide brand, model, capacity, voltage, quantity, and destination on the request. This listing does not confirm warehouse stock.";

export type CatalogueCategorySeed = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type CatalogueProductSeed = {
  id: string;
  variantId: string;
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  unit: string;
  typicalSpecs: string[];
};

function hexId(prefix: string, n: number): string {
  return `${prefix}-1000-7000-8000-${n.toString(16).padStart(12, "0")}`;
}

function kebab(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Keep V1 category UUIDs stable. */
export const PROCUREMENT_CATALOGUE_CATEGORIES: readonly CatalogueCategorySeed[] = [
  {
    id: "0190c8a0-1000-7000-8000-000000000001",
    name: "Electronics and gadgets",
    slug: "iphones-gadgets",
    description: "Phones, computers, networking, and accessories available for procurement.",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000002",
    name: "Medical and healthcare equipment",
    slug: "medical-equipments",
    description: "Non-clinical procurement types for clinics, labs, and facilities. No efficacy claims.",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000003",
    name: "Home, garden and facilities",
    slug: "home-garden-wares",
    description: "Furniture, lighting, tools, garden, and cleaning equipment for sourcing.",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000004",
    name: "Machinery and industrial",
    slug: "machineries",
    description: "Generators, pumps, workshop, fabrication, and processing equipment.",
  },
  {
    id: "0190c8a0-1000-7000-8000-000000000005",
    name: "General procurement",
    slug: "general-procurement",
    description: "Cross-category items and custom sourcing briefs.",
  },
  {
    id: hexId("0190c8c0", 1),
    name: "Home appliances",
    slug: "home-appliances",
    description: "Refrigeration, laundry, climate, kitchen, and entertainment appliances.",
  },
  {
    id: hexId("0190c8c0", 2),
    name: "Office and business",
    slug: "office-business",
    description: "Workplace furniture, POS, print, power, and security systems.",
  },
  {
    id: hexId("0190c8c0", 3),
    name: "Fashion and textiles",
    slug: "fashion-textiles",
    description: "Fabrics, apparel, footwear, bags, and uniforms for procurement.",
  },
  {
    id: hexId("0190c8c0", 4),
    name: "Beauty, spa and salon",
    slug: "beauty-spa-salon",
    description: "Salon furniture, hair equipment, spa setup, and sterilisation equipment.",
  },
  {
    id: hexId("0190c8c0", 5),
    name: "Retail and store setup",
    slug: "retail-store-setup",
    description: "Shelving, display, counters, signage, and retail refrigeration.",
  },
];

const GROUPS: ReadonlyArray<{ slug: string; unit: string; specs: string[]; names: readonly string[] }> = [
  {
    slug: "iphones-gadgets",
    unit: "unit",
    specs: ["screen size", "storage", "connectivity", "quantity"],
    names: [
      "Smartphone",
      "Tablet computer",
      "Notebook laptop",
      "Desktop workstation",
      "Computer monitor",
      "Office printer",
      "Network switch",
      "Wireless access point",
      "Power bank",
      "External storage drive",
      "USB flash storage",
      "Wireless mouse and keyboard set",
      "Webcam",
      "Bluetooth headset",
      "Phone protective case (generic)",
    ],
  },
  {
    slug: "home-appliances",
    unit: "unit",
    specs: ["capacity", "voltage", "finish", "quantity"],
    names: [
      "Household refrigerator",
      "Commercial chest freezer",
      "Upright freezer",
      "Front-load washing machine",
      "Split air conditioner",
      "LED television",
      "Microwave oven",
      "Electric cooker",
      "Water dispenser",
      "Standing fan",
      "Blender",
      "Electric kettle",
      "Vacuum cleaner",
      "Iron and ironing station",
    ],
  },
  {
    slug: "home-garden-wares",
    unit: "unit",
    specs: ["dimensions", "material", "quantity"],
    names: [
      "Office visitor chair",
      "Dining table set",
      "Wardrobe",
      "LED ceiling light",
      "Garden hose and fittings",
      "Lawn mower",
      "Pressure washer",
      "Industrial mop bucket",
      "Waste bin set",
      "Curtain track and fittings",
      "Mattress",
      "Bookshelf",
      "Outdoor seating set",
    ],
  },
  {
    slug: "office-business",
    unit: "unit",
    specs: ["capacity", "voltage", "finish", "quantity"],
    names: [
      "Executive desk",
      "Ergonomic office chair",
      "Filing cabinet",
      "Conference table",
      "Point of sale terminal",
      "Barcode scanner",
      "Receipt printer",
      "UPS power backup",
      "CCTV camera set",
      "Access control panel",
      "Photocopier",
      "Paper shredder",
      "Whiteboard",
      "Visitor sofa set",
    ],
  },
  {
    slug: "fashion-textiles",
    unit: "lot",
    specs: ["fabric type", "gsm", "colour", "quantity"],
    names: [
      "Cotton fabric roll",
      "Polyester fabric roll",
      "Corporate uniform set",
      "Workwear coverall",
      "Safety footwear",
      "Leather bag (generic)",
      "School uniform fabric",
      "Hospital linen set",
      "Towel bale",
      "Window curtain fabric",
      "Sportswear kit",
      "Hijab and modest wear lot",
    ],
  },
  {
    slug: "beauty-spa-salon",
    unit: "unit",
    specs: ["voltage", "finish", "quantity"],
    names: [
      "Hydraulic salon chair",
      "Hair dryer station",
      "Sterilisation cabinet",
      "Manicure table",
      "Spa treatment bed",
      "Shampoo basin unit",
      "Salon trolley",
      "LED magnifying lamp",
      "Towel warmer",
      "Reception desk for salon",
    ],
  },
  {
    slug: "medical-equipments",
    unit: "unit",
    specs: ["voltage", "capacity", "quantity"],
    names: [
      "Hospital bed (manual)",
      "Examination couch",
      "Patient wheelchair",
      "Instrument trolley",
      "Autoclave (benchtop)",
      "Medical refrigerator",
      "Pulse oximeter (handheld)",
      "Digital thermometer lot",
      "First aid cabinet",
      "Laboratory stool",
      "IV stand",
      "Screen divider",
    ],
  },
  {
    slug: "machineries",
    unit: "unit",
    specs: ["capacity", "voltage", "fuel type", "quantity"],
    names: [
      "Diesel generator",
      "Water pump",
      "Welding machine",
      "Air compressor",
      "Angle grinder",
      "Pillar drill",
      "Fabrication workbench",
      "Agricultural tiller",
      "Grain mill",
      "Packaging sealer",
      "Forklift (to source)",
      "Concrete mixer",
    ],
  },
  {
    slug: "retail-store-setup",
    unit: "unit",
    specs: ["dimensions", "finish", "quantity"],
    names: [
      "Gondola shelving bay",
      "Wall display rack",
      "Checkout counter",
      "Retail refrigerator",
      "Display freezer",
      "Price gun lot",
      "Store lighting kit",
      "Mannequin (generic)",
      "Queue barrier set",
      "Outdoor signage board",
      "Pegboard display",
    ],
  },
  {
    slug: "general-procurement",
    unit: "lot",
    specs: ["specification", "quantity", "destination"],
    names: [
      "Custom industrial sourcing brief",
      "Bulk stationery pack",
      "Safety PPE kit",
      "Cleaning chemical set (non-hazard labelled)",
      "Hotel amenity kit",
      "Event seating lot",
      "Solar floodlight",
      "Inverter and battery set",
      "Water tank",
      "Fire extinguisher set",
      "Padlock and hardware lot",
      "Packaging carton lot",
    ],
  },
];

function buildProducts(): CatalogueProductSeed[] {
  const products: CatalogueProductSeed[] = [];
  let index = 1;
  const slugs = new Set<string>();
  const titlesByCategory = new Map<string, Set<string>>();
  for (const group of GROUPS) {
    const titles = titlesByCategory.get(group.slug) ?? new Set<string>();
    for (const name of group.names) {
      if (titles.has(name)) {
        throw new Error(`Duplicate title "${name}" in ${group.slug}`);
      }
      titles.add(name);
      const slug = kebab(`${group.slug}-${name}`);
      if (slugs.has(slug)) {
        throw new Error(`Duplicate slug ${slug}`);
      }
      slugs.add(slug);
      products.push({
        id: hexId("0190c8d0", index),
        variantId: hexId("0190c8e0", index),
        categorySlug: group.slug,
        name,
        slug,
        description: PROCUREMENT_CATALOGUE_SOURCING_NOTE,
        unit: group.unit,
        typicalSpecs: [...group.specs],
      });
      index += 1;
    }
    titlesByCategory.set(group.slug, titles);
  }
  return products;
}

export const PROCUREMENT_CATALOGUE_PRODUCTS = buildProducts();

export function assertProcurementCatalogueQuality(): void {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const categorySlugs = new Set(PROCUREMENT_CATALOGUE_CATEGORIES.map((row) => row.slug));
  for (const product of PROCUREMENT_CATALOGUE_PRODUCTS) {
    if (ids.has(product.id) || ids.has(product.variantId)) {
      throw new Error("Catalogue IDs must be unique.");
    }
    ids.add(product.id);
    ids.add(product.variantId);
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug ${product.slug}`);
    slugs.add(product.slug);
    if (!categorySlugs.has(product.categorySlug)) {
      throw new Error(`Unknown category ${product.categorySlug}`);
    }
    if (/in stock/i.test(product.description) || /warranty/i.test(product.description)) {
      throw new Error("Catalogue copy must not invent stock or warranty.");
    }
  }
  if (PROCUREMENT_CATALOGUE_PRODUCTS.length < 100) {
    throw new Error("Catalogue must contain at least 100 products.");
  }
}
