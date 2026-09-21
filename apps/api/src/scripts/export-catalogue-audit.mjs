// Catalogue-only snapshot. Database enforces read-only mode; no bootstrap/imports.
import { config } from "dotenv";
import { createRequire } from "node:module";
import { URL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import console from "node:console";

config({ path: "apps/api/.env", quiet: true });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
// Use the database package's existing pg dependency, not the API startup pool.
// This avoids Prisma interactive-transaction startup/idle-pool failures.
const require = createRequire(new URL("../../../../database/package.json", import.meta.url));
const { Client } = require("pg");
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, query_timeout: 20000,
  application_name: "v2_catalogue_read_only_audit",
  options: "-c default_transaction_read_only=on -c statement_timeout=20000",
});
db.on("error", () => { /* Query/connect catch prints sanitized diagnostics only. */ });
try {
  await db.connect();
  await db.query("BEGIN READ ONLY");
  const { rows: products } = await db.query(`
    SELECT p.id, p.name, p.slug, p.status, p.description,
      p.brand_id AS "brandId", p.manufacturer_id AS "manufacturerId",
      CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('name', c.name, 'slug', c.slug) END AS category,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', i.id, 'url', i.url, 'position', i.position) ORDER BY i.position, i.id)
        FROM public.product_images i WHERE i.product_id = p.id), '[]'::jsonb) AS images,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('name', v.name, 'specifications', v.specifications) ORDER BY v.id)
        FROM public.product_variants v WHERE v.product_id = p.id), '[]'::jsonb) AS variants
    FROM public.products p LEFT JOIN public.product_categories c ON c.id = p.category_id ORDER BY p.id
  `);
  await db.query("ROLLBACK");
  await mkdir("database/audits", { recursive: true });
  await writeFile("database/audits/catalogue-snapshot.local.json", JSON.stringify({ capturedAt: new Date().toISOString(), products }, null, 2));
  console.log(`Read-only catalogue snapshot: ${products.length} products. No database changes.`);
} catch (error) {
  const diagnostic = String(error.message ?? "") + String(error.cause?.message ?? "");
  const tags = ["timeout", "certificate", "connect", "permission", "password", "tenant", "ENOTFOUND", "ECONNREFUSED", "transaction", "read.only", "does not exist"].filter(tag => new RegExp(tag, "i").test(diagnostic));
  console.error("Catalogue snapshot failed:", error.code || error.name, error.cause?.code ?? "", tags.join(", "));
  process.exitCode = 1;
} finally {
  await db.end();
}
