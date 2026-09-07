import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(new URL("../database/package.json", import.meta.url));
const pg = require("pg");

const PILOTS = new Set([
  "iphones-gadgets-smartphone",
  "iphones-gadgets-business-laptop",
  "medical-equipments-bedside-patient-monitor",
  "medical-equipments-binocular-microscope",
  "home-garden-wares-electric-pressure-washer",
  "home-garden-wares-metal-storage-cabinet",
  "machineries-silent-diesel-generator",
  "machineries-mig-welding-machine",
  "general-procurement-industrial-personal-protective-equipment-kit",
  "general-procurement-industrial-packaging-materials-lot",
  "home-appliances-commercial-chest-freezer",
  "home-appliances-split-air-conditioner",
  "office-business-ergonomic-office-chair",
  "office-business-touchscreen-point-of-sale-terminal",
  "fashion-textiles-cotton-fabric-roll",
  "fashion-textiles-office-corporate-uniform-set",
  "beauty-spa-salon-hydraulic-salon-styling-chair",
  "beauty-spa-salon-complete-shampoo-station",
  "retail-store-setup-double-sided-gondola-shelving",
  "retail-store-setup-upright-refrigerated-display-case",
]);

const env = await readFile(new URL("../database/.env", import.meta.url), "utf8");
const dbUrl = env
  .split(/\r?\n/)
  .find((line) => line.startsWith("DATABASE_URL="))
  ?.slice("DATABASE_URL=".length)
  .replace(/^"|"$/g, "");
const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
const primaries = await client.query(`
  select p.slug, p.name, i.url, i.mime_type
  from products p
  join product_images i on i.product_id = p.id
  where i.is_primary = true
  order by p.slug
`);
await client.end();

const reportPath = new URL("../docs/product-media-provenance.json", import.meta.url);
const report = JSON.parse(await readFile(reportPath, "utf8"));
const bySlug = new Map(report.rows.map((row) => [row.productSlug, row]));

let imported = 0;
let keptPilots = 0;
for (const row of primaries.rows) {
  const current = bySlug.get(row.slug) ?? {
    productSlug: row.slug,
    productName: row.name,
    categorySlug: null,
    coreType: "",
    status: "imported",
    reason: "Primary ProductImage present.",
  };
  if (PILOTS.has(row.slug)) {
    keptPilots += 1;
    current.status = "kept_existing";
    current.reason = "Pilot primary kept; media row not duplicated.";
  } else {
    imported += 1;
    current.status = "imported";
    current.reason = "Downloaded licensed still and created primary ProductImage.";
  }
  current.mediaUrl = row.url;
  bySlug.set(row.slug, current);
}

const rows = [...bySlug.values()].sort((a, b) => a.productSlug.localeCompare(b.productSlug));
const needsReview = rows.filter((row) => row.status === "needs_review").length;
const failed = rows.filter((row) => row.status === "failed").length;

const sample = primaries.rows.slice(0, 8).concat(
  primaries.rows.filter((row) => PILOTS.has(row.slug)).slice(0, 4),
);
const verified = [];
for (const row of sample) {
  const response = await fetch(`http://127.0.0.1:4000${row.url}`);
  verified.push({
    slug: row.slug,
    httpStatus: response.status,
    contentType: response.headers.get("content-type"),
    imageOk: response.ok && String(response.headers.get("content-type") ?? "").startsWith("image/"),
  });
}

const commodity = await fetch(
  "http://127.0.0.1:4000/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e001/ie-sesame-seeds-hero-01.jpg",
);

report.generatedAt = new Date().toISOString();
report.withPrimaryBefore = 20;
report.newPrimaryImagesImported = imported;
report.withPrimaryAfter = primaries.rows.length;
report.needsReview = needsReview;
report.failed = failed;
report.pilotsKept = keptPilots;
report.sampleHttp = verified;
report.commodityMediaHttp = {
  src: "/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000e001/ie-sesame-seeds-hero-01.jpg",
  httpStatus: commodity.status,
  contentType: commodity.headers.get("content-type"),
};
report.note =
  "Session kept the 20 pilot ProductImage mappings. New primaries were downloaded into CatalogMediaStore (same-origin /api/v1/public/catalog-media). Uncertain matches remain needs_review. No secrets.";
report.rows = rows;

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      withPrimaryBefore: report.withPrimaryBefore,
      newPrimaryImagesImported: report.newPrimaryImagesImported,
      withPrimaryAfter: report.withPrimaryAfter,
      needsReview: report.needsReview,
      failed: report.failed,
      pilotsKept: report.pilotsKept,
      sampleHttp: report.sampleHttp,
      commodityMediaHttp: report.commodityMediaHttp,
    },
    null,
    2,
  ),
);
