/**
 * Import curated exact-product catalogue media.
 *
 * Safety:
 * - dry-run by default
 * - only imports entries explicitly marked "approved_for_import"
 * - refuses to overwrite an existing primary ProductImage
 * - downloads and validates the binary before storage
 *
 * Usage:
 *   pnpm catalogue:media-import
 *   pnpm catalogue:media-import -- --slug=apple-ipad-air-m4-series
 *   pnpm catalogue:media-import -- --execute
 *
 * Legacy alias remains: pnpm media:import-curated-electronics
 */
import "../load-env.js";

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "../modules/catalog/infrastructure/catalog-media-policy.js";
import { createCatalogMediaStore } from "../modules/catalog/infrastructure/catalog-media-store.js";
import { mediaWriteData } from "../shared/database/database-client.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
const CURATED_DIR = join(ROOT, "docs", "catalogue");
const USER_AGENT = "AlmahbubCuratedMedia/1.0";

async function loadCuratedEntries(): Promise<CuratedEntry[]> {
  const files = (await readdir(CURATED_DIR))
    .filter((name) => /^curated-.*-media\.json$/i.test(name))
    .sort();
  const entries: CuratedEntry[] = [];
  const seen = new Set<string>();
  for (const name of files) {
    const parsed = JSON.parse(
      await readFile(join(CURATED_DIR, name), "utf8"),
    ) as { entries?: CuratedEntry[] };
    for (const entry of Array.isArray(parsed.entries) ? parsed.entries : []) {
      if (seen.has(entry.slug)) {
        throw new Error(`Duplicate curated media slug ${entry.slug} across manifests.`);
      }
      seen.add(entry.slug);
      entries.push(entry);
    }
  }
  return entries;
}

type CuratedEntry = {
  catalogueId: string;
  slug: string;
  productName: string;
  status: string;
  source: string;
  sourcePageUrl: string;
  imageUrl: string | null;
  altText: string;
  identityEvidence: string;
  credit?: string;
  license?: string;
  licenseUrl?: string;
  changes?: string;
};

function value(argv: string[], name: string): string | undefined {
  const item = argv.find((arg) => arg.startsWith(`${name}=`));
  return item?.slice(name.length + 1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function download(url: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/*,*/*",
          Referer: new URL(url).origin,
        },
        redirect: "follow",
        signal: AbortSignal.timeout(45000),
      });
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`Download failed (${response.status}) for ${url}`);
      }
      if (!response.ok) {
        throw new Error(`Download failed (${response.status}) for ${url}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      await sleep(750 * 2 ** attempt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error(`Download failed for ${url}`);
}

function extensionForMime(mime: string): ".jpg" | ".png" | ".webp" | ".gif" {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const execute = argv.includes("--execute");
  const slug = value(argv, "--slug");

  const allEntries = await loadCuratedEntries();
  const selected = allEntries.filter((entry) => !slug || entry.slug === slug);

  if (slug && selected.length !== 1) {
    throw new Error(`No curated media entry found for slug ${slug}.`);
  }

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required.");

  if (execute && environment.CATALOG_MEDIA_DRIVER === "local") {
    throw new Error(
      "Refusing curated production media import with CATALOG_MEDIA_DRIVER=local. Configure Supabase or S3 catalogue storage first.",
    );
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
    supabaseServiceRoleKey: environment.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucket: environment.CATALOG_MEDIA_SUPABASE_BUCKET,
  });

  const report: Array<Record<string, unknown>> = [];

  try {
    for (const entry of selected) {
      const product = await database.product.findFirst({
        where: {
          catalogueId: entry.catalogueId,
          slug: entry.slug,
          sourceManifestVersion: "2.0-starter",
        },
        select: {
          id: true,
          name: true,
          slug: true,
          catalogueId: true,
          images: {
            select: {
              id: true,
              url: true,
              isPrimary: true,
              position: true,
            },
          },
        },
      });

      if (!product) {
        report.push({
          slug: entry.slug,
          status: "blocked",
          reason: "Manifest-owned product not found in database.",
        });
        continue;
      }

      if (product.images.some((image) => image.isPrimary || image.position === 0)) {
        report.push({
          slug: entry.slug,
          status: "kept_existing",
          reason: "Product already has a primary image.",
        });
        continue;
      }

      if (!entry.imageUrl) {
        report.push({
          slug: entry.slug,
          status: "blocked",
          reason: "No stable direct image asset URL has been curated yet.",
          sourcePageUrl: entry.sourcePageUrl,
        });
        continue;
      }

      if (entry.status !== "approved_for_import") {
        report.push({
          slug: entry.slug,
          status: "rights_review_required",
          reason: "Exact product image found, but reuse approval has not been recorded.",
          sourcePageUrl: entry.sourcePageUrl,
          imageUrl: entry.imageUrl,
          identityEvidence: entry.identityEvidence,
        });
        continue;
      }

      if (!execute) {
        report.push({
          slug: entry.slug,
          status: "ready",
          reason: "Approved curated exact-product image is ready for import.",
          sourcePageUrl: entry.sourcePageUrl,
          imageUrl: entry.imageUrl,
        });
        continue;
      }

      try {
        const bytes = await download(entry.imageUrl);
        const mime = sniffCatalogMediaMime(bytes) ?? "";
        const filename = `${entry.slug}-primary${extensionForMime(mime)}`;
        const issues = validateCatalogMediaUpload({
          filename,
          mimeType: mime,
          sizeBytes: bytes.length,
          kind: "image",
          bytes,
        });
        if (!mime || issues.length) {
          throw new Error(issues.join(", ") || "Unsupported image format.");
        }

        let stored: Awaited<ReturnType<typeof store.put>> | null = null;
        let storeError: unknown;
        for (let attempt = 0; attempt < 4; attempt += 1) {
          try {
            stored = await store.put({
              productId: product.id,
              originalFilename: filename,
              bytes,
            });
            break;
          } catch (error) {
            storeError = error;
            if (attempt === 3) break;
            await sleep(1000 * 2 ** attempt);
          }
        }
        if (!stored) {
          throw storeError instanceof Error
            ? storeError
            : new Error("Catalogue media storage upload failed after retries.");
        }

        await database.productImage.create({
          data: mediaWriteData({
            productId: product.id,
            url: stored.publicUrl,
            altText: entry.altText,
            caption: [
              entry.credit ? `Photo/render: ${entry.credit}.` : null,
              entry.license ? `License: ${entry.license}.` : null,
              entry.licenseUrl ? `License: ${entry.licenseUrl}` : null,
              entry.sourcePageUrl ? `Source: ${entry.sourcePageUrl}` : null,
              entry.changes ? entry.changes : null,
            ]
              .filter(Boolean)
              .join(" "),
            storageKey: stored.filename,
            mimeType: mime,
            fileSize: bytes.length,
            position: 0,
            isPrimary: true,
          }),
          select: { id: true },
        });

        await database.product.update({
          where: { id: product.id },
          data: { mediaStatus: "ACQUIRED_NEEDS_EDITORIAL_REVIEW" },
          select: { id: true },
        });

        report.push({
          slug: entry.slug,
          status: "imported",
          sourcePageUrl: entry.sourcePageUrl,
          storedUrl: stored.publicUrl,
        });
      } catch (error) {
        report.push({
          slug: entry.slug,
          status: "failed",
          reason: error instanceof Error ? error.message : "Import failed.",
        });
      }
    }

    console.log(JSON.stringify({
      mode: execute ? "execute" : "dry-run",
      selected: selected.length,
      report,
    }, null, 2));
  } finally {
    await database.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
