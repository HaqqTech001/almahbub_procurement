/**
 * Upload approved category images through the same catalog media store
 * used by POST /api/v1/ops/categories/:id/image/upload.
 */
import "../load-env.js";

import { readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "../modules/catalog/infrastructure/catalog-media-policy.js";
import { createCatalogMediaStore } from "../modules/catalog/infrastructure/catalog-media-store.js";
import { categoryWriteData, mediaWriteData, withCategoryMedia } from "../shared/database/database-client.js";

type CategoryPlanRow = {
  categorySlug: string;
  categoryName: string;
  filename: string;
  altText: string;
};

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const mediaRoot = argValue(argv, "--media-root");
  const planPath = argValue(argv, "--plan");
  const execute = argv.includes("--execute");
  if (!mediaRoot || !planPath) {
    throw new Error("Required: --media-root <dir> --plan <category-media-plan.json>");
  }

  const plan = JSON.parse(await readFile(planPath, "utf8")) as CategoryPlanRow[];
  if (!Array.isArray(plan) || plan.length !== 10) {
    throw new Error("Category media plan must contain exactly 10 rows.");
  }

  const environment = parseEnvironment(process.env);
  if (!environment.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
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
    for (const row of plan) {
      const absolute = await resolveCategoryImageFile(mediaRoot, row.filename);
      const originalFilename = basename(absolute);
      const info = await stat(absolute);
      const bytes = await readFile(absolute);
      const mime = sniffCatalogMediaMime(bytes);
      const issues = validateCatalogMediaUpload({
        filename: originalFilename,
        mimeType: mime ?? "application/octet-stream",
        sizeBytes: info.size,
        kind: "image",
        bytes,
      });
      const category = withCategoryMedia(
        await database.productCategory.findFirst(
          mediaWriteData({
            where: { slug: row.categorySlug },
            select: {
              id: true,
              name: true,
              slug: true,
              imageUrl: true,
              imageStorageKey: true,
            },
          }),
        ),
      );
      if (!category) {
        report.push({
          slug: row.categorySlug,
          status: "FAILED",
          reason: "Category slug not found.",
        });
        continue;
      }
      if (issues.length > 0) {
        report.push({
          slug: row.categorySlug,
          status: "REJECTED",
          reason: issues[0]!.message,
        });
        continue;
      }
      if (!execute) {
        report.push({
          slug: row.categorySlug,
          status: "ELIGIBLE",
          filename: originalFilename,
          bytes: info.size,
          mime,
          categoryId: category.id,
        });
        continue;
      }
      if (category.imageStorageKey) {
        await store.remove({
          productId: category.id,
          filename: category.imageStorageKey,
        });
      }
      const stored = await store.put({
        productId: category.id,
        originalFilename,
        bytes,
      });
      await database.productCategory.update({
        where: { id: category.id },
        data: categoryWriteData({
          imageUrl: stored.publicUrl,
          imageAlt: row.altText,
          imageStorageKey: stored.filename,
          imageMimeType: mime,
          imageBytes: info.size,
        }),
      });
      const saved = withCategoryMedia(
        await database.productCategory.findUniqueOrThrow({
          where: { id: category.id },
        }),
      );
      report.push({
        slug: row.categorySlug,
        status: "IMPORTED",
        categoryId: category.id,
        imageUrl: saved.imageUrl,
        imageStorageKey: saved.imageStorageKey,
        imageMimeType: saved.imageMimeType,
        imageBytes: saved.imageBytes,
      });
    }
  } finally {
    await database.$disconnect();
  }

  console.log(
    JSON.stringify(
      {
        mode: execute ? "execute" : "dry-run",
        imported: report.filter((row) => row.status === "IMPORTED").length,
        eligible: report.filter((row) => row.status === "ELIGIBLE").length,
        failed: report.filter((row) => row.status === "FAILED" || row.status === "REJECTED")
          .length,
        rows: report,
      },
      null,
      2,
    ),
  );
}

function argValue(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  if (index < 0) return null;
  return argv[index + 1] ?? null;
}

async function resolveCategoryImageFile(
  mediaRoot: string,
  filename: string,
): Promise<string> {
  const candidates = [
    filename,
    filename.replace(/\.webp$/i, ".png"),
    filename.replace(/\.png$/i, ".webp"),
  ];
  for (const name of candidates) {
    const absolute = join(mediaRoot, name);
    try {
      await stat(absolute);
      return absolute;
    } catch {
      /* try next */
    }
  }
  throw new Error(`Category image file is missing: ${filename}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
