import "../load-env.js";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import { isDisallowedFashionCatalogueProduct } from "../modules/catalog/application/catalogue-merchandising-policy.js";

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main(): Promise<void> {
  const execute = hasFlag("--execute");
  const env = parseEnvironment(process.env);
  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    const products = await db.product.findMany({
      where: {
        category: { slug: "fashion-textiles" },
        status: { not: "archived" },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        category: { select: { slug: true } },
      },
      orderBy: { slug: "asc" },
    });

    const candidates = products.filter((product) =>
      isDisallowedFashionCatalogueProduct({
        categorySlug: product.category?.slug,
        slug: product.slug,
        name: product.name,
      }),
    );

    const rows: Array<Record<string, unknown>> = [];

    for (const product of candidates) {
      if (!execute) {
        rows.push({
          slug: product.slug,
          name: product.name,
          previousStatus: product.status,
          status: "would_archive",
        });
        continue;
      }

      await db.product.update({
        where: { id: product.id },
        data: { status: "archived" },
      });

      rows.push({
        slug: product.slug,
        name: product.name,
        previousStatus: product.status,
        status: "archived",
      });
    }

    console.log(
      JSON.stringify(
        {
          mode: execute ? "execute" : "dry-run",
          category: "fashion-textiles",
          matched: candidates.length,
          archived: execute ? candidates.length : 0,
          rows,
          note:
            "Fashion & Accessories is retained. Only textile/fabric and uniform/scrub products are targeted.",
        },
        null,
        2,
      ),
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Fashion catalogue cleanup failed.",
  );
  process.exitCode = 1;
});
