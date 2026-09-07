/**
 * Legacy extras are original seed products whose slugs are not in the
 * 1,000-row expanded catalogue. Clear generic duplicates are archived
 * (not deleted) so the public catalogue does not show the same concept twice.
 * Distinct extras stay published. Ambiguous extras stay published for owner review.
 */

export const LEGACY_DUPLICATE_ARCHIVE_SLUGS = [
  "beauty-spa-salon-hydraulic-salon-chair",
  "beauty-spa-salon-manicure-table",
  "beauty-spa-salon-salon-trolley",
  "beauty-spa-salon-towel-warmer",
  "fashion-textiles-corporate-uniform-set",
  "fashion-textiles-polyester-fabric-roll",
  "home-appliances-blender",
  "home-appliances-electric-kettle",
  "home-appliances-microwave-oven",
  "home-appliances-standing-fan",
  "home-appliances-upright-freezer",
  "home-appliances-vacuum-cleaner",
  "home-appliances-water-dispenser",
  "home-garden-wares-dining-table-set",
  "home-garden-wares-lawn-mower",
  "home-garden-wares-mattress",
  "home-garden-wares-pressure-washer",
  "home-garden-wares-wardrobe",
  "home-garden-wares-waste-bin-set",
  "iphones-gadgets-desktop-workstation",
  "iphones-gadgets-network-switch",
  "iphones-gadgets-power-bank",
  "iphones-gadgets-tablet-computer",
  "iphones-gadgets-webcam",
  "iphones-gadgets-wireless-access-point",
  "machineries-air-compressor",
  "machineries-concrete-mixer",
  "machineries-water-pump",
  "machineries-welding-machine",
  "medical-equipments-autoclave-benchtop",
  "medical-equipments-hospital-bed-manual",
  "medical-equipments-medical-refrigerator",
  "medical-equipments-patient-wheelchair",
  "medical-equipments-pulse-oximeter-handheld",
  "office-business-barcode-scanner",
  "office-business-filing-cabinet",
  "office-business-photocopier",
  "office-business-point-of-sale-terminal",
  "office-business-receipt-printer",
  "retail-store-setup-checkout-counter",
  "retail-store-setup-display-freezer",
  "retail-store-setup-mannequin-generic",
] as const;

export const LEGACY_AMBIGUOUS_KEEP_SLUGS = [
  "beauty-spa-salon-shampoo-basin-unit",
  "iphones-gadgets-wireless-mouse-and-keyboard-set",
  "office-business-executive-desk",
  "retail-store-setup-gondola-shelving-bay",
  "retail-store-setup-wall-display-rack",
] as const;

type Queryable = {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
};

export async function archiveLegacyDuplicateCatalogueProducts(db: Queryable) {
  await db.query(
    `UPDATE products
     SET status = 'archived',
         updated_at = NOW()
     WHERE slug = ANY($1::citext[])
       AND status <> 'archived'`,
    [[...LEGACY_DUPLICATE_ARCHIVE_SLUGS]],
  );
}
