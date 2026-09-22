import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { validateMasterManifest } from "./map-master-catalogue.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const MANIFEST_PATH = join(ROOT, "docs", "catalogue", "master-catalogue.json");
const EXPECTED_VERSION = "2.0-starter";
const EXPECTED_PRODUCTS = 100;

function loadEnvironment(): void {
  if (process.env.DATABASE_URL || process.env.MIGRATION_DATABASE_URL) return;
  const apiEnv = join(ROOT, "apps", "api", ".env");
  if (existsSync(apiEnv) && typeof process.loadEnvFile === "function") process.loadEnvFile(apiEnv);
}

function parseManifest() {
  const raw = JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as unknown;
  const validation = validateMasterManifest(raw);
  if (!validation.manifest || validation.errors.length) {
    throw new Error(`Master catalogue validation failed:\n${validation.errors.join("\n")}`);
  }
  if (validation.manifest.catalogueVersion !== EXPECTED_VERSION) {
    throw new Error(`Expected manifest version ${EXPECTED_VERSION}; received ${validation.manifest.catalogueVersion}.`);
  }
  if (validation.manifest.entries.length !== EXPECTED_PRODUCTS) {
    throw new Error(`Expected ${EXPECTED_PRODUCTS} manifest entries; received ${validation.manifest.entries.length}.`);
  }
  return validation.manifest;
}

async function main(): Promise<void> {
  const execute = process.argv.includes("--execute");
  const manifest = parseManifest();
  loadEnvironment();
  const connectionString = process.env.DATABASE_URL ?? process.env.MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL or MIGRATION_DATABASE_URL is required.");

  const ids = manifest.entries.map((entry) => entry.catalogueId);
  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const products = await client.query<{
      catalogueId: string;
      status: string;
      sourceManifestVersion: string | null;
      verificationStatus: string | null;
      categoryStatus: string | null;
    }>(
      `select
         p.catalogue_id as "catalogueId",
         p.status::text as status,
         p.source_manifest_version as "sourceManifestVersion",
         p.verification_status as "verificationStatus",
         pc.status::text as "categoryStatus"
       from products p
       left join product_categories pc on pc.id = p.category_id
       where p.catalogue_id = any($1::text[])
       order by p.catalogue_id`,
      [ids],
    );

    const failures: string[] = [];
    if (products.rows.length !== EXPECTED_PRODUCTS) {
      failures.push(`Expected ${EXPECTED_PRODUCTS} master products; found ${products.rows.length}.`);
    }

    const seen = new Set(products.rows.map((row) => row.catalogueId));
    for (const id of ids) {
      if (!seen.has(id)) failures.push(`Missing master product ${id}.`);
    }

    for (const row of products.rows) {
      if (!/^ALM-\d{3}$/.test(row.catalogueId)) failures.push(`${row.catalogueId}: invalid catalogue id.`);
      if (row.sourceManifestVersion !== EXPECTED_VERSION) failures.push(`${row.catalogueId}: unexpected source manifest version.`);
      if (!row.verificationStatus?.startsWith("VERIFIED_")) failures.push(`${row.catalogueId}: not verified.`);
      if (row.categoryStatus !== "published") failures.push(`${row.catalogueId}: parent category is not published.`);
      if (!["draft", "published"].includes(row.status)) failures.push(`${row.catalogueId}: lifecycle is ${row.status}.`);
    }

    if (failures.length) {
      throw new Error(`Master catalogue publish guard failed:\n${failures.join("\n")}`);
    }

    const draftCount = products.rows.filter((row) => row.status === "draft").length;
    const alreadyPublished = products.rows.filter((row) => row.status === "published").length;

    if (execute && draftCount > 0) {
      await client.query(
        `update products
         set status = 'published', updated_at = now()
         where catalogue_id = any($1::text[])
           and status = 'draft'
           and source_manifest_version = $2
           and verification_status like 'VERIFIED_%'`,
        [ids, EXPECTED_VERSION],
      );
      await client.query("COMMIT");
    } else {
      await client.query("ROLLBACK");
    }

    console.log("MASTER CATALOGUE PUBLICATION\n");
    console.log(JSON.stringify({
      mode: execute ? "EXECUTE" : "DRY_RUN",
      manifestVersion: EXPECTED_VERSION,
      masterProducts: products.rows.length,
      draftsToPublish: draftCount,
      alreadyPublished,
      mediaFallbackPolicy: "VERIFIED_MASTER_ONLY",
      databaseMutations: execute ? draftCount : 0,
      result: "PASS",
    }, null, 2));
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
