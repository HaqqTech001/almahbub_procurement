import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { validateMasterManifest } from "./map-master-catalogue.js";
import { buildVerifiedManifestDescription } from "./master-catalogue-content.js";

type EntryType =
  | "STANDARD_PRODUCT"
  | "PRODUCT_FAMILY"
  | "PROCUREMENT_SERVICE"
  | "CONFIGURABLE_PRODUCT";

type ManifestVariant = Record<string, unknown> & { name: string };
type ManifestEntry = {
  catalogueId: string;
  ordinal: number;
  slug: string;
  name: string;
  category: string;
  entryType: EntryType;
  manufacturer?: string | null;
  variants: ManifestVariant[];
  summary: string;
  keySpecs: Record<string, unknown>;
  availabilityStatus: "ON_REQUEST" | "COMING_SOON" | "PRE_ORDER" | "OUT_OF_STOCK";
  releaseDate?: string | null;
  manufacturerUrl?: string | null;
  verificationStatus: string;
  heroImagePolicy: string;
  mediaStatus: string;
  notes?: string | null;
};
type Manifest = {
  catalogueVersion: string;
  categories: string[];
  entries: ManifestEntry[];
};

export function classifySeedProductOwnership(input: {
  catalogueId: string;
  ownedProductId?: string | null;
  slugCollisionProductId?: string | null;
}):
  | { action: "create" }
  | { action: "update_owned"; productId: string }
  | { action: "block_legacy_collision"; productId: string } {
  if (input.ownedProductId) {
    return { action: "update_owned", productId: input.ownedProductId };
  }
  if (input.slugCollisionProductId) {
    return {
      action: "block_legacy_collision",
      productId: input.slugCollisionProductId,
    };
  }
  return { action: "create" };
}

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MANIFEST_PATH = join(ROOT, "docs", "catalogue", "master-catalogue.json");

const CATEGORY_MAP: Record<string, { slug: string; description: string }> = {
  "Electronics / Mobile / Digital Technology": {
    slug: "iphones-gadgets",
    description: "Phones, computers, tablets, digital technology and related equipment available for procurement.",
  },
  "Medical / Healthcare / Laboratory Equipment": {
    slug: "medical-equipments",
    description: "Healthcare, clinical, diagnostic and laboratory equipment available for procurement subject to applicable requirements.",
  },
  "Home / Garden / Facility Supplies": {
    slug: "home-garden-wares",
    description: "Home, garden, cleaning and facility equipment available for procurement.",
  },
  "Industrial Machinery / Tools / Processing Equipment": {
    slug: "machineries",
    description: "Industrial machinery, processing equipment, material handling and professional tools.",
  },
  "General Procurement / Custom Sourcing": {
    slug: "general-procurement",
    description: "Custom sourcing, institutional procurement and specialist procurement services.",
  },
  "Home Appliances / Living Equipment": {
    slug: "home-appliances",
    description: "Home appliances and living equipment available for procurement.",
  },
  "Office / Business / Commercial Technology": {
    slug: "office-business",
    description: "Office, business, conferencing, networking, power and commercial technology.",
  },
  "Fashion, Footwear, Bags & Lifestyle Accessories": {
    slug: "fashion-textiles",
    description: "Fashion, footwear, bags, luggage, eyewear, watches and lifestyle accessories. Textiles and uniforms are excluded.",
  },
  "Beauty / Salon / Spa Equipment": {
    slug: "beauty-spa-salon",
    description: "Professional beauty, barbering, salon and spa equipment.",
  },
  "Retail / Store Setup / Merchandising Equipment": {
    slug: "retail-store-setup",
    description: "Retail checkout, payment, scanning, pricing, security, shelving and merchandising equipment.",
  },
};

function loadEnvironment(): void {
  if (process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL) return;
  const envPath = join(ROOT, "apps", "api", ".env");
  if (existsSync(envPath) && typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
}

function parseManifest(): Manifest {
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const validation = validateMasterManifest(raw);
  if (!validation.manifest || validation.errors.length) {
    throw new Error(`Master catalogue validation failed:\n${validation.errors.join("\n")}`);
  }
  return validation.manifest as Manifest;
}

export function buildSeedVariantRows(entry: ManifestEntry): Array<{ sku: string; name: string; specifications: Record<string, unknown> }> {
  if (entry.entryType === "PRODUCT_FAMILY") {
    return entry.variants.map((variant, index) => ({
      sku: `${entry.catalogueId}-V${String(index + 1).padStart(2, "0")}`,
      name: variant.name,
      specifications: Object.fromEntries(
        Object.entries(variant).filter(([key]) => key !== "name"),
      ),
    }));
  }
  if (entry.entryType === "CONFIGURABLE_PRODUCT") {
    return [{
      sku: `${entry.catalogueId}-CONFIG`,
      name: "Configured to request",
      specifications: { configurationMode: "customer_specification" },
    }];
  }
  if (entry.entryType === "PROCUREMENT_SERVICE") {
    return [{
      sku: `${entry.catalogueId}-SERVICE`,
      name: "Sourcing request",
      specifications: { service: true },
    }];
  }
  return [{
    sku: `${entry.catalogueId}-DEFAULT`,
    name: "Standard sourcing",
    specifications: {},
  }];
}

async function categoryIds(client: pg.PoolClient, manifest: Manifest): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  for (const categoryName of manifest.categories) {
    const mapped = CATEGORY_MAP[categoryName];
    if (!mapped) throw new Error(`No stable category mapping for: ${categoryName}`);
    const found = await client.query<{ id: string }>(
      `select id from product_categories where slug = $1 limit 1`,
      [mapped.slug],
    );
    if (!found.rows[0]) {
      throw new Error(
        `Expected existing category slug "${mapped.slug}" for "${categoryName}". Run the established base catalogue seed first; this seed does not invent a parallel category tree.`,
      );
    }
    result.set(categoryName, found.rows[0].id);
  }
  return result;
}

async function manufacturerId(
  client: pg.PoolClient,
  name: string | null | undefined,
  execute: boolean,
): Promise<string | null> {
  if (!name) return null;
  const found = await client.query<{ id: string }>(
    `select id from manufacturers where lower(legal_name) = lower($1) order by created_at asc limit 1`,
    [name],
  );
  if (found.rows[0]) return found.rows[0].id;
  if (!execute) return null;
  const id = randomUUID();
  await client.query(
    `insert into manufacturers (id, legal_name, country_code, created_at, updated_at)
     values ($1, $2, null, now(), now())`,
    [id, name],
  );
  return id;
}

async function assertMasterCatalogueSchemaReady(
  client: pg.PoolClient,
): Promise<void> {
  const result = await client.query<{ catalogue_id: string | null }>(
    `select column_name as catalogue_id
     from information_schema.columns
     where table_schema = current_schema()
       and table_name = 'products'
       and column_name = 'catalogue_id'
     limit 1`,
  );

  if (!result.rows[0]?.catalogue_id) {
    throw new Error(
      [
        "MASTER_CATALOGUE_MIGRATION_REQUIRED",
        "The database does not yet contain products.catalogue_id.",
        "Apply the additive master-catalogue migration before running this seed:",
        "  pnpm db:migrate",
        "Then regenerate Prisma and rerun the dry-run:",
        "  pnpm db:generate",
        "  pnpm catalogue:seed-master",
        "No catalogue rows were modified.",
      ].join("\n"),
    );
  }
}

async function main(): Promise<void> {
  const execute = process.argv.includes("--execute");
  const manifest = parseManifest();
  loadEnvironment();
  const connectionString = process.env.DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or MIGRATION_DATABASE_URL is required.");

  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  let createCount = 0;
  let updateCount = 0;
  let variantCount = 0;
  let manufacturerCreates = 0;
  const legacySlugCollisions: Array<{
    catalogueId: string;
    slug: string;
    existingProductId: string;
  }> = [];

  try {
    await client.query("BEGIN");
    await assertMasterCatalogueSchemaReady(client);
    const categories = await categoryIds(client, manifest);

    for (const entry of manifest.entries) {
      const category = CATEGORY_MAP[entry.category];
      const categoryId = categories.get(entry.category);
      if (!category || !categoryId) throw new Error(`Category mapping missing for ${entry.category}`);

      const existingManufacturer = entry.manufacturer
        ? await client.query<{ id: string }>(
            `select id from manufacturers where lower(legal_name) = lower($1) order by created_at asc limit 1`,
            [entry.manufacturer],
          )
        : { rows: [] as Array<{ id: string }> };
      if (entry.manufacturer && !existingManufacturer.rows[0]) manufacturerCreates += 1;

      const mId = await manufacturerId(client, entry.manufacturer, execute);
      const existing = await client.query<{ id: string; catalogue_id: string | null }>(
        `select id, catalogue_id from products
         where catalogue_id = $1
         limit 1`,
        [entry.catalogueId],
      );
      const slugCollision = existing.rows[0]
        ? null
        : (
            await client.query<{ id: string; catalogue_id: string | null }>(
              `select id, catalogue_id from products
               where lower(slug) = lower($1)
               limit 1`,
              [entry.slug],
            )
          ).rows[0] ?? null;

      const ownership = classifySeedProductOwnership({
        catalogueId: entry.catalogueId,
        ownedProductId: existing.rows[0]?.id ?? null,
        slugCollisionProductId: slugCollision?.id ?? null,
      });

      if (ownership.action === "block_legacy_collision") {
        legacySlugCollisions.push({
          catalogueId: entry.catalogueId,
          slug: entry.slug,
          existingProductId: ownership.productId,
        });
        if (execute) {
          throw new Error(
            `Legacy slug collision for ${entry.catalogueId} (${entry.slug}) with product ${ownership.productId}. Resolve explicitly; automatic legacy adoption is prohibited.`,
          );
        }
        continue;
      }

      if (ownership.action === "update_owned") updateCount += 1;
      else createCount += 1;

      if (!execute) {
        variantCount += buildSeedVariantRows(entry).length;
        continue;
      }

      await client.query(
        `update product_categories
         set name = $1, description = $2, updated_at = now()
         where id = $3`,
        [entry.category, category.description, categoryId],
      );

      const productId = existing.rows[0]?.id ?? randomUUID();
      const verifiedDescription = buildVerifiedManifestDescription(entry);
      if (existing.rows[0]) {
        await client.query(
          `update products set
             catalogue_id = $1,
             category_id = $2,
             manufacturer_id = $3,
             name = $4,
             summary = $5,
             key_specifications = $6::jsonb,
             entry_type = $7::"CatalogueEntryType",
             availability_status = $8::"ProductAvailabilityStatus",
             manufacturer_url = $9,
             verification_status = $10,
             media_status = case
               when catalogue_id is null then $11
               else coalesce(media_status, $11)
             end,
             hero_image_policy = $12,
             source_manifest_version = $13,
             release_date = $14::date,
             catalogue_notes = $15,
             description = case
               when source_manifest_version is null then coalesce(description, $16)
               else $16
             end,
             status = case
               when catalogue_id is null then 'draft'::"ProductStatus"
               else status
             end,
             updated_at = now()
           where id = $17`,
          [
            entry.catalogueId,
            categoryId,
            mId,
            entry.name,
            entry.summary,
            JSON.stringify(entry.keySpecs ?? {}),
            entry.entryType,
            entry.availabilityStatus,
            entry.manufacturerUrl ?? null,
            entry.verificationStatus,
            entry.mediaStatus,
            entry.heroImagePolicy,
            manifest.catalogueVersion,
            entry.releaseDate ?? null,
            entry.notes ?? null,
            verifiedDescription,
            productId,
          ],
        );
      } else {
        await client.query(
          `insert into products (
             id, category_id, manufacturer_id, catalogue_id, name, slug,
             description, summary, key_specifications, entry_type,
             availability_status, manufacturer_url, verification_status,
             media_status, hero_image_policy, source_manifest_version,
             release_date, catalogue_notes, status, created_at, updated_at
           ) values (
             $1, $2, $3, $4, $5, $6,
             $7, $8, $9::jsonb, $10::"CatalogueEntryType",
             $11::"ProductAvailabilityStatus", $12, $13,
             $14, $15, $16,
             $17::date, $18, 'draft', now(), now()
           )`,
          [
            productId,
            categoryId,
            mId,
            entry.catalogueId,
            entry.name,
            entry.slug,
            verifiedDescription,
            entry.summary,
            JSON.stringify(entry.keySpecs ?? {}),
            entry.entryType,
            entry.availabilityStatus,
            entry.manufacturerUrl ?? null,
            entry.verificationStatus,
            entry.mediaStatus,
            entry.heroImagePolicy,
            manifest.catalogueVersion,
            entry.releaseDate ?? null,
            entry.notes ?? null,
          ],
        );
      }

      for (const variant of buildSeedVariantRows(entry)) {
        variantCount += 1;
        const existingVariant = await client.query<{ id: string }>(
          `select id from product_variants where sku = $1 limit 1`,
          [variant.sku],
        );
        if (existingVariant.rows[0]) {
          await client.query(
            `update product_variants
             set product_id = $1, name = $2, specifications = $3::jsonb, updated_at = now()
             where id = $4`,
            [productId, variant.name, JSON.stringify(variant.specifications), existingVariant.rows[0].id],
          );
        } else {
          await client.query(
            `insert into product_variants
             (id, product_id, sku, name, specifications, created_at, updated_at)
             values ($1, $2, $3, $4, $5::jsonb, now(), now())`,
            [randomUUID(), productId, variant.sku, variant.name, JSON.stringify(variant.specifications)],
          );
        }
      }
    }

    if (execute) await client.query("COMMIT");
    else await client.query("ROLLBACK");

    console.log(
      [
        "MASTER CATALOGUE SEED",
        "",
        `Mode:                       ${execute ? "EXECUTE" : "DRY_RUN"}`,
        `Manifest version:           ${manifest.catalogueVersion}`,
        `Manifest entries:           ${manifest.entries.length}`,
        `Products to create:         ${createCount}`,
        `Products to update/adopt:   ${updateCount}`,
        `Variant rows ensured:       ${variantCount}`,
        `Manufacturers to create:    ${manufacturerCreates}`,
        `Legacy slug collisions:      ${legacySlugCollisions.length}`,
        ...(legacySlugCollisions.length
          ? legacySlugCollisions.map(
              (item) =>
                `  - ${item.catalogueId} ${item.slug} -> ${item.existingProductId}`,
            )
          : []),
        "",
        execute
          ? "Manifest-created products start DRAFT; existing manifest-owned lifecycle states are preserved. No images, publication reviews, request items, quotations, or unowned legacy product rows were modified."
          : "DATABASE MUTATIONS: 0 (dry-run rollback)",
        "",
        "Pass --execute only after the additive migration is applied and this plan has been reviewed.",
      ].join("\n"),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const direct =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (direct) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
