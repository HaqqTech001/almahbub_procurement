import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import pg from "pg";

type Queryable = {
  query: (
    sql: string,
    params?: readonly unknown[],
  ) => Promise<{ rowCount?: number | null }>;
};

/**
 * Publication is owned by the Ops CMS / API workflow.
 * There are currently no owner-verified Integrated Export commodities to
 * publish from seed. This function never activates catalogue rows.
 */
export async function publishIeOwnerApprovedCommodities(
  _client: Queryable,
): Promise<{ updated: string[] }> {
  return { updated: [] };
}

/** Development/reset helper: keep IE commodities unpublished. */
export async function unpublishAllIeCommodities(
  client: Queryable,
): Promise<{ unpublished: number }> {
  const result = await client.query(
    `UPDATE integrated_export_commodities
        SET published = false,
            updated_at = now()
      WHERE published = true
        AND archived_at IS NULL`,
  );
  return { unpublished: result.rowCount ?? 0 };
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
    throw new Error("MIGRATION_DATABASE_URL is required to inspect IE commodities.");
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await publishIeOwnerApprovedCommodities(client);
    await client.query("COMMIT");
    console.log(
      result.updated.length === 0
        ? "IE seed publish skipped: no owner-verified commodities for publication."
        : `IE commodities published. updated=${result.updated.join(",")}`,
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
