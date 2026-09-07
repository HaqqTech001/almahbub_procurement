/**
 * Read-only close-out probe: catalog tables/columns vs Prisma expectations.
 */
import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";

async function main(): Promise<void> {
  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const database = createDatabaseClient(environment.DATABASE_URL);
  const tables = await database.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'products',
        'product_images',
        'brands',
        'manufacturers',
        'product_categories',
        'announcements'
      )
    ORDER BY 1
  `;
  const productColumns = await database.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'products'
    ORDER BY 1
  `;
  const productStatus = await database.$queryRaw<
    Array<{ status: string; count: number }>
  >`
    SELECT status::text AS status, COUNT(id)::int AS count
    FROM products
    GROUP BY status
    ORDER BY 1
  `;

  console.info(
    JSON.stringify(
      {
        tables: tables.map((row) => row.table_name),
        productColumns: productColumns.map((row) => row.column_name),
        productStatus,
        uploadRoot: environment.UPLOAD_ROOT,
        credentialsPresent: {
          HAMD_OPS_E2E_EMAIL: Boolean(process.env.HAMD_OPS_E2E_EMAIL?.trim()),
          HAMD_OPS_E2E_PASSWORD: Boolean(
            process.env.HAMD_OPS_E2E_PASSWORD?.trim(),
          ),
          OPS_GRANT_EMAIL: Boolean(process.env.OPS_GRANT_EMAIL?.trim()),
        },
      },
      null,
      2,
    ),
  );
  await database.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
