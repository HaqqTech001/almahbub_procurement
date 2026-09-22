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
 *   pnpm media:import-curated-electronics
 *   pnpm media:import-curated-electronics -- --slug=apple-ipad-air-m4-series
 *   pnpm media:import-curated-electronics -- --execute
 */
import "../load-env.js";

import { readFile } from "node:fs/promises";
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
const CURATED_PATH = join(ROOT, "docs", "catalogue", "curated-electronics-media.json");
const USER_AGENT = "AlmahbubCuratedMedia/1.0";

type CuratedEntry = {
  catalogueId: string;
  slug: string;
  productName: string;
  status: "ready_for_rights_review" | "approved_for_import" | "pending_direct_asset_url";
  source: string;
  sourcePageUrl: string;
  imageUrl: string | null;
  altText: string;
  identityEvidence: string;
};

function value(argv: string[], name: string): string | undefined {
  const item = argv.find((arg) => arg.startsWith(`${name}=`));
  return item?.slice(name.length + 1);
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/*,*/*",
      Referer: new URL(url).origin,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
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

  const parsed = JSON.parse(await readFile(CURATED_PATH, "utf8")) as {
    entries?: CuratedEntry[];
  };
  const allEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const selected = allEntries.filter((entry) => !slug || entry.slug === slug);

  if (slug && selected.length !== 1) {
    throw new Error(`No curated media entry found for slug ${slug}.`);
  }

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required.");

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

        const stored = await store.put({
          productId: product.id,
          originalFilename: filename,
          bytes,
        });

        await database.productImage.create({
          data: mediaWriteData({
            productId: product.id,
            url: stored.publicUrl,
            altText: entry.altText,
            caption: `Official product media source: ${entry.sourcePageUrl}`,
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
