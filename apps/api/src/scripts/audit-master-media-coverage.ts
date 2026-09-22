import "../load-env.js";

import { access, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
const MASTER_PATH = join(ROOT, "docs", "catalogue", "master-catalogue.json");
const CURATED_DIR = join(ROOT, "docs", "catalogue");

type MasterEntry = {
  catalogueId: string;
  slug: string;
  name: string;
  category: string;
  entryType:
    | "STANDARD_PRODUCT"
    | "PRODUCT_FAMILY"
    | "PROCUREMENT_SERVICE"
    | "CONFIGURABLE_PRODUCT";
};

type CuratedEntry = {
  slug: string;
  status?: string;
};

async function main(): Promise<void> {
  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required.");

  const master = JSON.parse(await readFile(MASTER_PATH, "utf8")) as {
    entries?: MasterEntry[];
  };
  const entries = Array.isArray(master.entries) ? master.entries : [];
  if (entries.length !== 100) {
    throw new Error(`Expected 100 master entries, found ${entries.length}.`);
  }

  const curated: CuratedEntry[] = [];
  const curatedFiles = (await readdir(CURATED_DIR))
    .filter((name) => /^curated-.*-media\.json$/i.test(name))
    .sort();
  const seenCuratedSlugs = new Set<string>();
  for (const name of curatedFiles) {
    const parsed = JSON.parse(
      await readFile(join(CURATED_DIR, name), "utf8"),
    ) as { entries?: CuratedEntry[] };
    for (const entry of Array.isArray(parsed.entries) ? parsed.entries : []) {
      if (seenCuratedSlugs.has(entry.slug)) {
        throw new Error(`Duplicate curated media slug ${entry.slug} across manifests.`);
      }
      seenCuratedSlugs.add(entry.slug);
      curated.push(entry);
    }
  }
  const curatedBySlug = new Map(curated.map((entry) => [entry.slug, entry]));

  const database = createDatabaseClient(environment.DATABASE_URL);
  try {
    const products = await database.product.findMany({
      where: {
        catalogueId: { not: null },
        sourceManifestVersion: "2.0-starter",
      },
      select: {
        catalogueId: true,
        slug: true,
        images: {
          select: {
            url: true,
            isPrimary: true,
            position: true,
          },
        },
      },
    });

    const productByCatalogueId = new Map(
      products
        .filter((product): product is typeof product & { catalogueId: string } =>
          Boolean(product.catalogueId),
        )
        .map((product) => [product.catalogueId, product]),
    );

    const serviceVisualSlugs = new Set<string>();
    await Promise.all(
      entries
        .filter((entry) => entry.entryType === "PROCUREMENT_SERVICE")
        .map(async (entry) => {
          try {
            await access(
              join(
                ROOT,
                "apps",
                "web",
                "public",
                "catalogue",
                "service-visuals",
                `${entry.slug}.svg`,
              ),
            );
            serviceVisualSlugs.add(entry.slug);
          } catch {
            /* missing service visual remains visible in the audit */
          }
        }),
    );

    const rows = entries.map((entry) => {
      const product = productByCatalogueId.get(entry.catalogueId);
      const covered = Boolean(
        product?.images.some(
          (image) =>
            (image.isPrimary || image.position === 0) &&
            image.url.trim().length > 0,
        ),
      ) || serviceVisualSlugs.has(entry.slug);
      const curatedEntry = curatedBySlug.get(entry.slug);

      let status:
        | "covered"
        | "ready_to_import"
        | "needs_family_media"
        | "needs_service_visual"
        | "needs_exact_source";

      if (covered) status = "covered";
      else if (curatedEntry?.status === "approved_for_import")
        status = "ready_to_import";
      else if (entry.entryType === "PROCUREMENT_SERVICE")
        status = "needs_service_visual";
      else if (entry.entryType === "PRODUCT_FAMILY")
        status = "needs_family_media";
      else status = "needs_exact_source";

      return {
        catalogueId: entry.catalogueId,
        slug: entry.slug,
        name: entry.name,
        category: entry.category,
        entryType: entry.entryType,
        status,
      };
    });

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] ?? 0) + 1;
      return acc;
    }, {});

    console.log(
      JSON.stringify(
        {
          total: rows.length,
          counts,
          rows,
        },
        null,
        2,
      ),
    );
  } finally {
    await database.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
