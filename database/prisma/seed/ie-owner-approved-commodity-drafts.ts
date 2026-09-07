import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

export type IeOwnerApprovedCommodityDraft = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

type DraftManifest = {
  published: boolean;
  approvedForPublication: boolean;
  commodities: IeOwnerApprovedCommodityDraft[];
};

const manifestPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "ie-owner-approved-commodity-drafts.json",
);

export const IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST = JSON.parse(
  readFileSync(manifestPath, "utf8"),
) as DraftManifest;

export const IE_OWNER_APPROVED_COMMODITY_DRAFTS =
  IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST.commodities;

type Queryable = {
  query: (
    sql: string,
    params?: readonly unknown[],
  ) => Promise<{ rowCount?: number | null }>;
};

/**
 * Insert owner-approved IE commodity drafts. Never publishes.
 * Existing rows (matched by slug) are left unchanged so Ops edits are preserved.
 */
export async function upsertIeOwnerApprovedCommodityDrafts(
  client: Queryable,
): Promise<{ inserted: string[]; skipped: string[] }> {
  const inserted: string[] = [];
  const skipped: string[] = [];

  if (IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST.published) {
    throw new Error("Owner-approved IE drafts must not seed as published.");
  }
  if (IE_OWNER_APPROVED_COMMODITY_DRAFT_MANIFEST.approvedForPublication) {
    throw new Error("Publication is a second owner gate — seed drafts only.");
  }

  for (const row of IE_OWNER_APPROVED_COMMODITY_DRAFTS) {
    const result = await client.query(
      `INSERT INTO integrated_export_commodities (
         id, slug, name, published, sort_order, created_at, updated_at
       ) VALUES ($1, $2, $3, false, $4, now(), now())
       ON CONFLICT (slug) DO NOTHING`,
      [row.id, row.slug, row.name, row.sortOrder],
    );

    if (result.rowCount && result.rowCount > 0) {
      inserted.push(row.slug);
    } else {
      skipped.push(row.slug);
    }
  }

  return { inserted, skipped };
}

async function seedStandalone(): Promise<void> {
  const envPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.env",
  );
  if (
    !process.env.MIGRATION_DATABASE_URL &&
    !process.env.DATABASE_URL &&
    existsSync(envPath) &&
    typeof process.loadEnvFile === "function"
  ) {
    process.loadEnvFile(envPath);
  }

  const databaseUrl =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("MIGRATION_DATABASE_URL is required to seed IE commodity drafts.");
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await upsertIeOwnerApprovedCommodityDrafts(client);
    await client.query("COMMIT");
    console.log(
      `IE commodity drafts seeded. inserted=${result.inserted.join(",") || "(none)"} skipped=${result.skipped.join(",") || "(none)"}`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const invokedDirectly = Boolean(
  process.argv[1] &&
    import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href,
);

if (invokedDirectly) {
  void seedStandalone();
}
