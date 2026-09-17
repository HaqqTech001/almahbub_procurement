/** Editorial product families, not a claim that a model is current, authentic or in stock. */
export const PRODUCT_SHOWCASE_GROUPS = [
  { id: "electronics-office", label: "Electronics and office devices", pattern: /iphone|galaxy|smartphone|tablet|ipad|laptop|elitebook|probook|thinkpad|ideapad|latitude|inspiron|desktop|workstation computer|monitor|printer|scanner|photocopier|projector|router|headset|earbuds|headphones|webcam|keyboard|computer mouse|external ssd|power bank|docking/i },
  { id: "ready-to-wear", label: "Ready-to-wear fashion", pattern: /kaftan|senator|agbada|gown|abaya|ready.to.wear|dress|blouse|blazer|suit\b|polo shirt|t-shirt|hoodie|jeans|chinos/i },
  { id: "footwear", label: "Sneakers and footwear", pattern: /sneaker|loafer|leather shoe|formal shoe|\bheels?\b|\bboots?\b|\bslides?\b|sandal|slipper|footwear|safety shoe/i },
  { id: "bags-accessories", label: "Bags and accessories", pattern: /handbag|shoulder bag|tote bag|crossbody|backpack(?! (brush|vacuum|sprayer))|travel.*bag|duffel|briefcase|belt\b|watch|sunglasses|wallet/i },
  { id: "home-kitchen", label: "Home, kitchen and appliances", pattern: /freezer|refrigerator|washing machine|washer.dryer|dishwasher|cooking range|cooker|oven|microwave|blender|stand mixer|air fryer|water dispenser|air conditioner|vacuum cleaner|cookware|kitchen|sofa|dining table/i },
  { id: "industrial-parts", label: "Industrial machinery and spare parts", pattern: /bearing|coupling|shaft|pulley|sprocket|chain|valve|flange|gasket|hydraulic hose|pump|motor|generator|compressor|filter|machining|workshop tool|industrial tool|welding|milling|lathe|drill press|grinding machine/i },
] as const;

export function isDeferredShowcaseProduct(name: string): boolean {
  return /\bpos\b|point.of.sale|fabric|textile roll|cash drawer|consumables bundle|stationery bundle|custom.*bundle/i.test(name);
}

const groupCategories: Record<string, readonly string[]> = {
  "electronics-office": ["iphones-gadgets", "office-business", "retail-store-setup"],
  "ready-to-wear": ["fashion-textiles"], "footwear": ["fashion-textiles"],
  "bags-accessories": ["fashion-textiles", "iphones-gadgets"],
  "home-kitchen": ["home-appliances", "home-garden-wares", "retail-store-setup"],
  "industrial-parts": ["machineries"],
};
export function productShowcaseGroup(name: string, categorySlug?: string): string | null {
  if (isDeferredShowcaseProduct(name)) return null;
  if (/infusion|syringe|patient|medical|clinical|blood.storage/i.test(name)) return null;
  return PRODUCT_SHOWCASE_GROUPS.find(group => group.pattern.test(name) && (!categorySlug || groupCategories[group.id]?.includes(categorySlug)))?.id ?? null;
}

export function productMediaRoute(name: string): "current_product_research" | "generation_ready" {
  return /\biphone|\bipad|\bapple|\bsamsung|\bgalaxy|\bhp\b|\blenovo|\bdell|\basus|\bacer|\bsony|\bnike|\badidas|new balance|\bgucci|\brolex|\bomega|\bprada|louis vuitton|\bchanel|\bdior|\bbalenciaga|\bherm[eè]s/i.test(name)
    ? "current_product_research" : "generation_ready";
}

type Media = { url: string; position: number };
/** Preserve admin primary positions. Deduplicate and drop unsafe/empty URLs. */
export function orderedProductImages<T extends Media>(images: readonly T[]): T[] {
  const seen = new Set<string>();
  return [...images].sort((a, b) => a.position - b.position).filter(image => {
    const url = image.url.trim();
    if (!url || !/^(https?:\/\/|\/(?!\/))/i.test(url) || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

export type ProductPriorityCandidate = { slug: string; name: string; categorySlug?: string; category?: { slug: string } | null; images?: readonly Media[] };
const highlightFamilies = [
  /iphone|galaxy|smartphone|ipad|tablet/i, /kaftan|senator|agbada|gown|abaya|ready.to.wear/i,
  /sneaker|loafer|formal.*shoe|heel/i, /laptop|elitebook|thinkpad|latitude/i,
  /freezer|refrigerator|washing machine|dishwasher/i, /handbag|crossbody|backpack|briefcase|watch/i,
  /desktop|monitor/i, /bearing|coupling|shaft|pulley|sprocket|valve|motor|pump/i,
  /printer|scanner|photocopier|projector/i, /cooker|oven|microwave|blender|mixer|air fryer/i,
  /generator|compressor|industrial tool|workshop tool/i,
];
function highlightRank(name: string): number {
  const rank = highlightFamilies.findIndex(pattern => pattern.test(name));
  return rank < 0 ? highlightFamilies.length : rank;
}
function priorityBand(row: ProductPriorityCandidate): number {
  if (isDeferredShowcaseProduct(row.name)) return 9;
  const preferred = Boolean(productShowcaseGroup(row.name, row.categorySlug ?? row.category?.slug));
  const media = orderedProductImages(row.images ?? []);
  const persistent = media.some(image => !image.url.includes("/api/v1/public/catalog-media/"));
  return preferred ? (persistent ? 0 : media.length ? 1 : 2) : (persistent ? 3 : 4);
}

/** Shared by public/buyer/admin lists. Apply to filtered identities BEFORE pagination. */
export function compareProductPriority(a: ProductPriorityCandidate, b: ProductPriorityCandidate): number {
  return priorityBand(a) - priorityBand(b) || highlightRank(a.name) - highlightRank(b.name) || a.name.localeCompare(b.name, "en") || a.slug.localeCompare(b.slug, "en");
}
