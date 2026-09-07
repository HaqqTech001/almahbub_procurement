/**
 * Catalogue media importer CLI.
 *
 * Default: dry-run classification (writes a report; no uploads).
 * Execute requires:
 *   --mapping <approved.json>
 *   --execute
 *
 * Do not run --execute against almahbub-product-media until real products and
 * an owner-approved mapping exist. This architecture sprint stops before that.
 */

import "../load-env.js";

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, relative } from "node:path";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import { mediaWriteData } from "../shared/database/database-client.js";
import {
  classifyCatalogMediaAsset,
  duplicateCatalogMediaPositions,
  executeCatalogMediaImport,
  mimeFromAssetFilename,
  parseCatalogMediaMappingJson,
  summarizeCatalogMediaImport,
  type CatalogMediaImportAsset,
  type CatalogMediaImportResultRow,
  type CatalogMediaMappingRow,
} from "../modules/catalog/application/catalog-media-importer.js";
import { createCatalogMediaStore } from "../modules/catalog/infrastructure/catalog-media-store.js";

function argValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  return argv[index + 1] ?? null;
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

async function resolveMappedFiles(
  mediaRoot: string,
  rows: CatalogMediaMappingRow[],
): Promise<string[]> {
  const { access } = await import("node:fs/promises");
  const { constants } = await import("node:fs");
  const out: string[] = [];
  for (const row of rows) {
    const relative = (row.sourcePath || row.filename).replace(/\\/g, "/");
    const absolute = join(mediaRoot, relative);
    try {
      await access(absolute, constants.R_OK);
    } catch {
      throw new Error(`Mapped source file is missing: ${relative}`);
    }
    out.push(absolute);
  }
  return out;
}

async function walkFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (entry.isFile()) out.push(absolute);
    }
  }
  await walk(root);
  return out;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const mediaRoot = argValue(argv, "--media-root");
  const mappingPath = argValue(argv, "--mapping");
  const reportPath =
    argValue(argv, "--report") ??
    join(process.cwd(), "catalog-media-import-report.json");
  const execute = hasFlag(argv, "--execute");
  const allowTestBeds = hasFlag(argv, "--allow-test-beds");

  if (!mediaRoot) {
    throw new Error(
      "Required: --media-root <path>. Dry-run only unless --mapping and --execute are also set.",
    );
  }

  if (execute && !mappingPath) {
    throw new Error(
      "Refusing --execute without --mapping. Approved product mapping is required.",
    );
  }

  let mappingRows: CatalogMediaMappingRow[] = [];
  if (mappingPath) {
    const raw = JSON.parse(await readFile(mappingPath, "utf8")) as unknown;
    mappingRows = parseCatalogMediaMappingJson(raw);
    const duplicates = duplicateCatalogMediaPositions(mappingRows);
    if (duplicates.length > 0) {
      throw new Error(
        `Duplicate product/kind/position in mapping: ${duplicates.join(", ")}`,
      );
    }
  }
  const mappingByFilename = new Map<string, CatalogMediaMappingRow>();
  for (const row of mappingRows) {
    mappingByFilename.set(row.filename, row);
    if (row.sourcePath) {
      mappingByFilename.set(row.sourcePath.replace(/\\/g, "/"), row);
    }
  }

  const files = mappingRows.length
    ? await resolveMappedFiles(mediaRoot, mappingRows)
    : await walkFiles(mediaRoot);
  const assets: CatalogMediaImportAsset[] = [];
  for (const absolutePath of files) {
    const info = await stat(absolutePath);
    const filename = basename(absolutePath);
    const mime = mimeFromAssetFilename(filename);
    if (!mime) continue;
    assets.push({
      absolutePath,
      relativePath: relative(mediaRoot, absolutePath),
      filename,
      sizeBytes: info.size,
      mimeType: mime,
    });
  }

  const knownVideoBasenames = new Set(
    assets
      .filter((asset) => {
        const path = asset.relativePath.replace(/\\/g, "/").toLowerCase();
        return (
          path.includes("/videos/") &&
          asset.filename.toLowerCase().endsWith(".mp4")
        );
      })
      .map((asset) => asset.filename.toLowerCase()),
  );

  let reportRows: CatalogMediaImportResultRow[];

  if (execute) {
    const environment = parseEnvironment(process.env);
    if (!environment.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for --execute.");
    }
    const database = createDatabaseClient(environment.DATABASE_URL);
    const store = createCatalogMediaStore({
      uploadRoot: environment.UPLOAD_ROOT,
      driver: environment.CATALOG_MEDIA_DRIVER,
      nodeEnv: environment.NODE_ENV,
      s3Bucket: environment.CATALOG_MEDIA_S3_BUCKET,
      s3Region: environment.AWS_REGION,
      s3AccessKeyId: environment.AWS_ACCESS_KEY_ID,
      s3SecretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
      s3PublicBaseUrl: environment.CATALOG_MEDIA_S3_PUBLIC_BASE_URL,
      supabaseUrl: environment.CATALOG_MEDIA_SUPABASE_URL,
      supabaseServiceRoleKey:
        environment.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
      supabaseBucket: environment.CATALOG_MEDIA_SUPABASE_BUCKET,
    });

    const loaded = await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        bytes: await readFile(asset.absolutePath),
      })),
    );

    try {
      const report = await executeCatalogMediaImport({
        assets: loaded,
        mappingByFilename,
        knownVideoBasenames,
        deps: {
          allowTestBedProducts: allowTestBeds,
          store,
          resolveProduct: async ({ productId, productSlug }) => {
            if (productId) {
              return database.product.findFirst({
                where: { id: productId },
                select: { id: true, slug: true, status: true },
              });
            }
            if (productSlug) {
              return database.product.findFirst({
                where: { slug: productSlug },
                select: { id: true, slug: true, status: true },
              });
            }
            return null;
          },
          createImage: async (input) => {
            const aggregate = await database.productImage.aggregate({
              where: { productId: input.productId },
              _max: { position: true },
            });
            const position =
              input.position ?? (aggregate._max.position ?? -1) + 1;
            if (position === 0) {
              await database.productImage.updateMany(
                mediaWriteData({
                  where: { productId: input.productId, isPrimary: true },
                  data: { isPrimary: false },
                }),
              );
            }
            return database.productImage.create({
              data: mediaWriteData({
                productId: input.productId,
                url: input.url,
                altText: input.altText ?? null,
                caption: input.caption ?? null,
                storageKey: input.storageKey ?? null,
                mimeType: input.mimeType ?? null,
                fileSize: input.fileSize ?? null,
                position,
                isPrimary: input.isPrimary ?? position === 0,
              }),
              select: { id: true },
            });
          },
          createVideo: async (input) => {
            const aggregate = await database.productVideo.aggregate({
              where: { productId: input.productId },
              _max: { position: true },
            });
            const position =
              input.position ?? (aggregate._max.position ?? -1) + 1;
            return database.productVideo.create({
              data: {
                productId: input.productId,
                url: input.url,
                title: input.title ?? null,
                caption: input.caption ?? null,
                position,
              },
              select: { id: true },
            });
          },
        },
      });
      reportRows = report.rows;
    } finally {
      await database.$disconnect();
    }
  } else {
    const loaded = await Promise.all(
      assets.map(async (asset) => ({
        ...asset,
        bytes: await readFile(asset.absolutePath),
      })),
    );
    reportRows = loaded.map((asset) =>
      classifyCatalogMediaAsset({
        asset,
        mappingByFilename,
        knownVideoBasenames,
      }),
    );
    if (mappingRows.length > 0 && process.env.DATABASE_URL) {
      const environment = parseEnvironment(process.env);
      if (environment.DATABASE_URL) {
        const database = createDatabaseClient(environment.DATABASE_URL);
        try {
          for (const row of reportRows) {
            if (row.status !== "ELIGIBLE") continue;
            const mapped =
              mappingByFilename.get(row.filename) ??
              mappingByFilename.get(row.relativePath.replace(/\\/g, "/"));
            const slug = mapped?.productSlug?.trim();
            if (!slug) continue;
            const product = await database.product.findFirst({
              where: { slug },
              select: { id: true },
            });
            if (!product) {
              row.status = "FAILED";
              row.reason = `Product slug not found: ${slug}`;
            } else {
              row.productId = product.id;
            }
          }
        } finally {
          await database.$disconnect();
        }
      }
    }
  }

  const report = summarizeCatalogMediaImport(reportRows);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        mediaRoot,
        mappingPath: mappingPath ?? null,
        reportPath,
        imported: report.imported,
        unmatched: report.unmatched,
        rejected: report.rejected,
        failed: report.failed,
        eligible: report.eligible,
        note: execute
          ? "Execute completed. Review report before publishing products."
          : "Real Almahbub media import NOT RUN — awaiting product records + approved mapping.",
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
