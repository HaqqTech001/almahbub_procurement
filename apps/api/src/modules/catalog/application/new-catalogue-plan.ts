export type PlanCategory = {
  id: string;
  slug: string;
  name: string;
  status: string;
};
export type ExistingIdentity = {
  id: string;
  name: string;
  slug: string;
  brand?: { name: string } | null;
};
export type Proposal = {
  proposedName: string;
  categorySlug: string;
  productFamily: string;
  group: string;
  context: string;
  priorityTier: "P1_SHOWCASE" | "P2_CORE" | "P3_EXPANSION";
  brand?: string | null;
  model?: string | null;
};
export type ValidationStatus =
  | "APPROVED_FOR_DRAFT"
  | "CURRENT_PRODUCT_RESEARCH"
  | "MANUAL_REVIEW"
  | "REJECT_DUPLICATE"
  | "REJECT_WEAK_IDENTITY"
  | "REJECT_CATEGORY_MISMATCH";
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function normalizedIdentity(value: string): string {
  return value
    .toLowerCase()
    .replace(
      /\b(premium|professional|modern|advanced|generic|high.volume|black|white|blue|red)\b/g,
      " ",
    )
    .replace(/\bsneakers?\b/g, "shoe")
    .replace(/\btrainers?\b/g, "shoe")
    .replace(/\bmultifunction\s+printer\b/g, "multifunction printer")
    .replace(/\bwomens?\b/g, "women")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .sort()
    .join(" ");
}
const knownBrands =
  /\b(apple|samsung|hp|lenovo|dell|gucci|bottega(?: veneta)?|nike|adidas|bosch|lg|sony|haier|hisense|midea|panasonic|philips|toshiba|asus|acer|microsoft|huawei|xiaomi|tecno|infinix|oppo|vivo|canon|epson|brother|puma|reebok|new balance|louis vuitton|prada|chanel|balenciaga)\b/i;
const compatible =
  /\b(avr|alternator component|maintenance kit|gasket set|starter motor|fuel pump|engine|filter|infusion|oxygen concentrator|ultrasound|patient monitor|autoclave|blood pressure|ups system)\b/i;
const groupIdentity: Record<string, RegExp> = {
  mobile:
    /phone|ipad|tablet|e-reader|watch|earbuds|headphones|power bank|charging stand|speaker|hotspot/i,
  office:
    /laptop|computer|monitor|printer|scanner|photocopier|projector|laminator|binding machine|shredder|camera|webcam|router|switch|access point|ups|docking|ssd|storage|speakerphone|display/i,
  appliances:
    /washing|freezer|refrigerator|dishwasher|air conditioner|dryer|oven|cooker|fryer|kettle|blender|mixer|dispenser|iron|vacuum|hood|espresso|food processor|ice maker|purifier|dehumidifier/i,
  clothing:
    /kaftan|senator|agbada|suit|abaya|shirt|casual set|dress|gown|two-piece|cardigan|trousers|jacket|coat/i,
  footwear: /sneaker|loafer|shoe|boot|flat|sandal|slipper/i,
  bags: /bag|briefcase|backpack|belt|wallet|passport holder|luggage|card holder/i,
  machinery:
    /pump|compressor|generator|motor|gearbox|welding|drill|grinder|lathe|milling|bandsaw|packaging|filling|sealing|pallet|hoist|press|conveyor/i,
  spares:
    /bearing|belt|chain|sprocket|pulley|coupling|shaft|seal|valve|flange|elbow|tee|reducer|gasket|hose|fitting|pump|cylinder|regulator|motor|filter|avr|alternator|switch|maintenance kit/i,
  medical:
    /examination|hospital|wheelchair|laboratory|patient|blood pressure|infusion|medical|oxygen|autoclave|ultrasound/i,
  salon: /salon|manicure|shampoo|facial|wax|nail|beauty|hair|towel|barber/i,
};
export function categoryFitsPhysicalIdentity(
  name: string,
  categorySlug: string,
): boolean {
  const groups: Record<string, string[]> = {
    "iphones-gadgets": ["mobile"],
    "office-business": ["office"],
    "home-appliances": ["appliances"],
    "fashion-textiles": ["clothing", "footwear", "bags"],
    machineries: ["machinery", "spares"],
    "medical-equipments": ["medical"],
    "beauty-spa-salon": ["salon"],
  };
  const expected = groups[categorySlug];
  return (
    !expected || expected.some((group) => groupIdentity[group]!.test(name))
  );
}
export function validateProposals(
  proposals: Proposal[],
  categories: PlanCategory[],
  existing: ExistingIdentity[],
  allowedCategories: Record<string, string[]>,
) {
  const seen = [...existing];
  return proposals.map((proposal) => {
    const name = proposal.proposedName.trim();
    const category = categories.find(
      (item) =>
        item.slug === proposal.categorySlug && item.status === "published",
    );
    const brand =
      proposal.brand?.trim() ||
      name.match(knownBrands)?.[0] ||
      (/\b(iphone|ipad)\b/i.test(name)
        ? "Apple"
        : /\bgalaxy\b/i.test(name)
          ? "Samsung"
          : null);
    const model = proposal.model?.trim() || null;
    const exact = Boolean(
      brand || model || /\b[A-Za-z]+[- ]?\d+[A-Za-z\d-]*\b/.test(name),
    );
    const slug = `${proposal.categorySlug}-${slugify(name)}`;
    const key = normalizedIdentity(name);
    const duplicate = seen.find(
      (row) =>
        row.slug === slug ||
        normalizedIdentity(row.name) === key ||
        (model &&
          brand &&
          normalizedIdentity(row.brand?.name || "") ===
            normalizedIdentity(brand) &&
          row.name.toLowerCase().includes(model.toLowerCase())),
    );
    const near =
      !duplicate &&
      seen.find((row) => {
        const a = new Set(key.split(" "));
        const b = new Set(normalizedIdentity(row.name).split(" "));
        const shared = [...a].filter((token) => b.has(token)).length;
        return shared >= 2 && shared / new Set([...a, ...b]).size >= 0.8;
      });
    let status: ValidationStatus = "APPROVED_FOR_DRAFT";
    let reason =
      "Distinct physical family in an existing category; eligible for draft review only.";
    if (
      !name ||
      /\b(bundle|fabric roll|product|advanced machine|heavy product|generic appliance|assorted)\b/i.test(
        name,
      ) ||
      name.includes("\u2014")
    ) {
      status = "REJECT_WEAK_IDENTITY";
      reason = "Weak, filler or malformed product identity.";
    } else if (
      !category ||
      !allowedCategories[proposal.group]?.includes(proposal.categorySlug) ||
      !groupIdentity[proposal.group]?.test(name)
    ) {
      status = "REJECT_CATEGORY_MISMATCH";
      reason =
        "Category does not match the physical identity and proposal group, or is not published.";
    } else if (duplicate) {
      status = "REJECT_DUPLICATE";
      reason = `Existing or earlier proposed identity: ${duplicate.slug}. Review the existing record instead of creating another.`;
    } else if (exact) {
      status = "CURRENT_PRODUCT_RESEARCH";
      reason =
        "Verify brand, exact model, official source, release status, checkedAt and media rights before approval.";
    } else if (
      near ||
      compatible.test(name) ||
      !proposal.productFamily.trim() ||
      !proposal.context.trim()
    ) {
      status = "MANUAL_REVIEW";
      reason = near
        ? `Possible semantic overlap with ${near.slug}; human review required.`
        : "Compatibility, intended use or identity requires specialist review before representative media.";
    }
    if (
      status !== "REJECT_WEAK_IDENTITY" &&
      status !== "REJECT_CATEGORY_MISMATCH" &&
      status !== "REJECT_DUPLICATE"
    )
      seen.push({
        id: slug,
        slug,
        name,
        brand: brand ? { name: brand } : null,
      });
    const strategy = exact
      ? "current_product_research"
      : status === "MANUAL_REVIEW" ||
          status === "REJECT_CATEGORY_MISMATCH" ||
          status === "REJECT_WEAK_IDENTITY"
        ? "manual_review"
        : "generated_generic";
    return {
      proposedName: name,
      proposedSlug: slug,
      categoryId: category?.id ?? null,
      category: category?.name ?? null,
      categorySlug: proposal.categorySlug,
      productFamily: proposal.productFamily,
      group: proposal.group,
      brand,
      model,
      priorityTier: proposal.priorityTier,
      mediaStrategy: strategy,
      validationStatus: status,
      duplicateRisk: duplicate
        ? "confirmed_identity_collision"
        : near
          ? "possible_semantic_overlap"
          : "none_detected",
      duplicateOf: duplicate?.slug || (near ? near.slug : null),
      shortDescription: `${name} for ${proposal.context}.`,
      fullDescription: `${name} is a proposed sourcing family for ${proposal.context}. Final specifications and suitability require confirmation against the buyer's requirement.`,
      whyItBelongs: `Supports ${proposal.context} within the existing ${category?.name ?? proposal.categorySlug} category.`,
      researchRequired: exact,
      publicationStatus: "draft",
      notes: [
        reason,
        "Planning record only. No product, stock, certification, compatibility or current-model claim is approved by this plan.",
      ],
    };
  });
}
