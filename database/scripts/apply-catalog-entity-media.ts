/**
 * Apply catalog entity media columns when Prisma migrate cannot reach the pooler
 * but the API already can. Idempotent.
 */
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "../index.js";

loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const statements = [
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "description" TEXT`,
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_url" TEXT`,
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_alt" TEXT`,
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_storage_key" TEXT`,
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_mime_type" TEXT`,
  `ALTER TABLE "product_categories" ADD COLUMN IF NOT EXISTS "image_bytes" INTEGER`,
  `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "storage_key" TEXT`,
  `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "mime_type" TEXT`,
  `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "file_size" INTEGER`,
  `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "caption" TEXT`,
  `ALTER TABLE "product_images" ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN NOT NULL DEFAULT false`,
];

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required.");

  const database = createDatabaseClient(url);
  try {
    const before = await database.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'product_categories'
        AND column_name IN ('description', 'image_url')
      ORDER BY 1
    `;
    console.info("product_categories columns before:", before.map((row) => row.column_name));

    for (const sql of statements) {
      await database.$executeRawUnsafe(sql);
    }

    const after = await database.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'product_categories'
        AND column_name IN ('description', 'image_url', 'image_alt')
      ORDER BY 1
    `;
    console.info("product_categories columns after:", after.map((row) => row.column_name));
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
