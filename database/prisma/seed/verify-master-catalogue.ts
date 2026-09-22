import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import {
  buildSeedVariantRows,
} from "./seed-master-catalogue.js";
import { validateMasterManifest } from "./map-master-catalogue.js";

type ManifestEntry = {
  catalogueId: string;
  slug: string;
  name: string;
  category: string;
  entryType: string;
  availabilityStatus: string;
  manufacturer?: string | null;
  variants: Array<Record<string, unknown> & { name: string }>;
};

type Manifest = {
  catalogueVersion: string;
  categories: string[];
  entries: ManifestEntry[];
};

type MasterProductRow = {
  id: string;
  catalogueId: string;
  slug: string;
  name: string;
  status: string;
  entryType: string;
  availabilityStatus: string;
  categorySlug: string | null;
  manufacturerName: string | null;
};

type VariantRow = {
  catalogueId: string;
  sku: string;
  name: string;
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MANIFEST_PATH = join(ROOT, "docs", "catalogue", "master-catalogue.json");

const CATEGORY_SLUGS: Record<string, string> = {
  "Electronics / Mobile / Digital Technology": "iphones-gadgets",
  "Medical / Healthcare / Laboratory Equipment": "medical-equipments",
  "Home / Garden / Facility Supplies": "home-garden-wares",
  "Industrial Machinery / Tools / Processing Equipment": "machineries",
  "General Procurement / Custom Sourcing": "general-procurement",
  "Home Appliances / Living Equipment": "home-appliances",
  "Office / Business / Commercial Technology": "office-business",
  "Fashion, Footwear, Bags & Lifestyle Accessories": "fashion-textiles",
  "Beauty / Salon / Spa Equipment": "beauty-spa-salon",
  "Retail / Store Setup / Merchandising Equipment": "retail-store-setup",
};

function loadEnvironment(): void {
  if (process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL) return;
  const apiEnv = join(ROOT, "apps", "api", ".env");
  if (existsSync(apiEnv) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(apiEnv);
  }
}

function manifest(): Manifest {
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const validation = validateMasterManifest(raw);
  if (!validation.manifest || validation.errors.length) {
    throw new Error(
      `Master catalogue validation failed:\n${validation.errors.join("\n")}`,
    );
  }
  return validation.manifest as Manifest;
}

function counts(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((result, value) => {
    result[value] = (result[value] ?? 0) + 1;
    return result;
  }, {});
}

function sameCounts(
  actual: Record<string, number>,
  expected: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(actual), ...Object.keys(expected)]);
  return [...keys].every((key) => (actual[key] ?? 0) === (expected[key] ?? 0));
}

async function main(): Promise<void> {
  const source = manifest();
  loadEnvironment();
  const connectionString =
    process.env.DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or MIGRATION_DATABASE_URL is required.");
  }

  const ids = source.entries.map((entry) => entry.catalogueId);
  const pool = new pg.Pool({ connectionString });

  try {
    const productsResult = await pool.query<MasterProductRow>(
      `select
         p.id::text as id,
         p.catalogue_id as "catalogueId",
         p.slug::text as slug,
         p.name,
         p.status::text as status,
         p.entry_type::text as "entryType",
         p.availability_status::text as "availabilityStatus",
         pc.slug::text as "categorySlug",
         m.legal_name as "manufacturerName"
       from products p
       left join product_categories pc on pc.id = p.category_id
       left join manufacturers m on m.id = p.manufacturer_id
       where p.catalogue_id = any($1::text[])
       order by p.catalogue_id`,
      [ids],
    );

    const variantsResult = await pool.query<VariantRow>(
      `select
         p.catalogue_id as "catalogueId",
         v.sku,
         v.name
       from product_variants v
       join products p on p.id = v.product_id
       where p.catalogue_id = any($1::text[])
       order by p.catalogue_id, v.sku`,
      [ids],
    );

    const [imagesResult, requestRefsResult, quotationRefsResult, approvalsResult] =
      await Promise.all([
        pool.query<{ count: number }>(
          `select count(*)::int as count
           from product_images i
           join products p on p.id = i.product_id
           where p.catalogue_id = any($1::text[])`,
          [ids],
        ),
        pool.query<{ count: number }>(
          `select count(*)::int as count
           from procurement_request_items r
           join product_variants v on v.id = r.product_variant_id
           join products p on p.id = v.product_id
           where p.catalogue_id = any($1::text[])`,
          [ids],
        ),
        pool.query<{ count: number }>(
          `select count(*)::int as count
           from quotation_items q
           join product_variants v on v.id = q.product_variant_id
           join products p on p.id = v.product_id
           where p.catalogue_id = any($1::text[])`,
          [ids],
        ),
        pool.query<{ count: number }>(
          `select count(*)::int as count
           from product_variants v
           join products p on p.id = v.product_id
           where p.catalogue_id = any($1::text[])
             and v.specifications->>'publicationStatus' = 'PUBLIC_APPROVED'`,
          [ids],
        ),
      ]);

    const products = productsResult.rows;
    const byCatalogueId = new Map(products.map((row) => [row.catalogueId, row]));
    const variantsByCatalogueId = new Map<string, VariantRow[]>();
    for (const variant of variantsResult.rows) {
      variantsByCatalogueId.set(variant.catalogueId, [
        ...(variantsByCatalogueId.get(variant.catalogueId) ?? []),
        variant,
      ]);
    }

    const failures: string[] = [];
    const expectedTypeCounts = counts(source.entries.map((entry) => entry.entryType));
    const actualTypeCounts = counts(products.map((row) => row.entryType));
    const expectedAvailabilityCounts = counts(
      source.entries.map((entry) => entry.availabilityStatus),
    );
    const actualAvailabilityCounts = counts(
      products.map((row) => row.availabilityStatus),
    );

    if (products.length !== source.entries.length) {
      failures.push(
        `Expected ${source.entries.length} master products; found ${products.length}.`,
      );
    }

    for (const entry of source.entries) {
      const row = byCatalogueId.get(entry.catalogueId);
      if (!row) {
        failures.push(`Missing catalogueId ${entry.catalogueId} (${entry.name}).`);
        continue;
      }
      if (row.slug !== entry.slug) {
        failures.push(
          `${entry.catalogueId}: slug mismatch (${row.slug} != ${entry.slug}).`,
        );
      }
      if (row.name !== entry.name) {
        failures.push(
          `${entry.catalogueId}: name mismatch (${row.name} != ${entry.name}).`,
        );
      }
      if (row.status !== "draft") {
        failures.push(
          `${entry.catalogueId}: expected draft lifecycle, found ${row.status}.`,
        );
      }
      if (row.entryType !== entry.entryType) {
        failures.push(
          `${entry.catalogueId}: entry type mismatch (${row.entryType} != ${entry.entryType}).`,
        );
      }
      if (row.availabilityStatus !== entry.availabilityStatus) {
        failures.push(
          `${entry.catalogueId}: availability mismatch (${row.availabilityStatus} != ${entry.availabilityStatus}).`,
        );
      }
      const expectedCategory = CATEGORY_SLUGS[entry.category];
      if (row.categorySlug !== expectedCategory) {
        failures.push(
          `${entry.catalogueId}: category mismatch (${row.categorySlug} != ${expectedCategory}).`,
        );
      }

      const expectedVariants = buildSeedVariantRows(entry as never);
      const actualVariants = variantsByCatalogueId.get(entry.catalogueId) ?? [];
      const actualBySku = new Map(actualVariants.map((variant) => [variant.sku, variant]));
      if (actualVariants.length !== expectedVariants.length) {
        failures.push(
          `${entry.catalogueId}: expected ${expectedVariants.length} variants, found ${actualVariants.length}.`,
        );
      }
      for (const expected of expectedVariants) {
        const actual = actualBySku.get(expected.sku);
        if (!actual) {
          failures.push(`${entry.catalogueId}: missing variant SKU ${expected.sku}.`);
        } else if (actual.name !== expected.name) {
          failures.push(
            `${entry.catalogueId}: variant ${expected.sku} name mismatch (${actual.name} != ${expected.name}).`,
          );
        }
      }
    }

    if (!sameCounts(actualTypeCounts, expectedTypeCounts)) {
      failures.push(
        `Entry type counts mismatch: actual=${JSON.stringify(actualTypeCounts)} expected=${JSON.stringify(expectedTypeCounts)}.`,
      );
    }
    if (!sameCounts(actualAvailabilityCounts, expectedAvailabilityCounts)) {
      failures.push(
        `Availability counts mismatch: actual=${JSON.stringify(actualAvailabilityCounts)} expected=${JSON.stringify(expectedAvailabilityCounts)}.`,
      );
    }

    const expectedCategoryCounts = Object.fromEntries(
      source.categories.map((category) => [
        CATEGORY_SLUGS[category]!,
        source.entries.filter((entry) => entry.category === category).length,
      ]),
    );
    const actualCategoryCounts = counts(
      products.map((row) => row.categorySlug ?? "(missing)"),
    );
    if (!sameCounts(actualCategoryCounts, expectedCategoryCounts)) {
      failures.push(
        `Category counts mismatch: actual=${JSON.stringify(actualCategoryCounts)} expected=${JSON.stringify(expectedCategoryCounts)}.`,
      );
    }

    const expectedVariantCount = source.entries.reduce(
      (total, entry) => total + buildSeedVariantRows(entry as never).length,
      0,
    );
    if (variantsResult.rows.length !== expectedVariantCount) {
      failures.push(
        `Expected ${expectedVariantCount} master variants; found ${variantsResult.rows.length}.`,
      );
    }

    const expectedManufacturers = new Set(
      source.entries
        .map((entry) => entry.manufacturer?.trim())
        .filter((value): value is string => Boolean(value)),
    );
    const actualManufacturers = new Set(
      products
        .map((row) => row.manufacturerName?.trim())
        .filter((value): value is string => Boolean(value)),
    );
    if (actualManufacturers.size !== expectedManufacturers.size) {
      failures.push(
        `Expected ${expectedManufacturers.size} distinct assigned manufacturers; found ${actualManufacturers.size}.`,
      );
    }

    const imageCount = imagesResult.rows[0]?.count ?? 0;
    const requestRefs = requestRefsResult.rows[0]?.count ?? 0;
    const quotationRefs = quotationRefsResult.rows[0]?.count ?? 0;
    const publicationApprovals = approvalsResult.rows[0]?.count ?? 0;

    if (imageCount !== 0) failures.push(`Expected 0 master images before media stage; found ${imageCount}.`);
    if (requestRefs !== 0) failures.push(`Expected 0 request references; found ${requestRefs}.`);
    if (quotationRefs !== 0) failures.push(`Expected 0 quotation references; found ${quotationRefs}.`);
    if (publicationApprovals !== 0) failures.push(`Expected 0 publication approvals; found ${publicationApprovals}.`);

    const report = {
      manifestVersion: source.catalogueVersion,
      result: failures.length ? "FAIL" : "PASS",
      products: products.length,
      variants: variantsResult.rows.length,
      entryTypes: actualTypeCounts,
      availability: actualAvailabilityCounts,
      categories: actualCategoryCounts,
      distinctManufacturers: actualManufacturers.size,
      images: imageCount,
      requestReferences: requestRefs,
      quotationReferences: quotationRefs,
      publicationApprovals,
      failures,
    };

    console.log("MASTER CATALOGUE DATABASE VERIFICATION\n");
    console.log(JSON.stringify(report, null, 2));

    if (failures.length) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

const direct =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (direct) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
