import "../load-env.js";
import { writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import {
  auditCatalogue,
  type AuditProduct,
} from "../modules/catalog/application/catalogue-audit.js";
import {
  inspectProductMedia,
  withConcurrency,
} from "../modules/catalog/infrastructure/product-media-health.js";
import { catalogueStage } from "../modules/catalog/application/catalogue-stage.js";
const root = fileURLToPath(new URL("../../../..", import.meta.url));
async function main() {
  const env = parseEnvironment(process.env);
  console.log(
    JSON.stringify({
      databaseConfigured: Boolean(env.DATABASE_URL),
      databaseHost: env.DATABASE_URL
        ? new URL(env.DATABASE_URL).hostname
        : null,
      connectionStatus: "connecting",
    }),
  );
  if (!env.DATABASE_URL) throw new Error("Database is not configured.");
  const db = createDatabaseClient(env.DATABASE_URL);
  try {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await catalogueStage(
          `connect.SELECT_1.attempt_${attempt}`,
          () => db.$queryRaw`SELECT 1`,
        );
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
    console.log("Database connected");
    const total = await catalogueStage("product.count.initial", () =>
      db.product.count(),
    );
    if (!total)
      throw new Error(
        "Audit aborted: zero products; previous report retained.",
      );
    console.log(`Products discovered: ${total}`);
    const all: AuditProduct[] = [];
    let cursor: string | undefined;
    for (let page = 1; ; page++) {
      console.log(`Auditing batch ${page}/${Math.ceil(total / 100)}`);
      const rows = await catalogueStage(`product.findMany.batch_${page}`, () =>
        db.product.findMany({
          orderBy: { slug: "asc" },
          take: 100,
          ...(cursor ? { cursor: { slug: cursor }, skip: 1 } : {}),
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            description: true,
            brandId: true,
            manufacturerId: true,
            category: { select: { name: true, slug: true } },
            variants: { select: { name: true, specifications: true } },
            images: { select: { id: true, url: true, position: true } },
          },
        }),
      );
      all.push(...rows);
      if (rows.length < 100) break;
      cursor = rows.at(-1)!.slug;
    }
    const finalCount = await catalogueStage("product.count.final", () =>
      db.product.count(),
    );
    if (all.length !== total || finalCount !== total)
      throw new Error(
        "Catalogue changed during audit; previous report retained. Rerun when stable.",
      );
    const sources = [
      ...new Set(
        all.flatMap((product) => product.images.map((image) => image.url)),
      ),
    ];
    const values = await catalogueStage("media.health.bounded", () =>
      withConcurrency(sources, (source) =>
        inspectProductMedia(source, env.UPLOAD_ROOT),
      ),
    );
    const result = auditCatalogue(
      all,
      new Map(sources.map((source, index) => [source, values[index]!])),
    );
    const target = join(root, "docs/product-catalogue-audit.json");
    await writeFile(
      `${target}.tmp`,
      JSON.stringify(
        { generatedAt: new Date().toISOString(), ...result },
        null,
        2,
      ),
    );
    await rename(`${target}.tmp`, target);
    console.log("Audit complete");
    console.log(JSON.stringify(result.summary, null, 2));
  } finally {
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Catalogue audit failed; previous report retained.",
  );
  process.exitCode = 1;
});
