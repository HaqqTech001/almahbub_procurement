import "../load-env.js";

import { access, readFile, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { basename, join, resolve } from "node:path";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  categoryWriteData,
  mediaWriteData,
} from "../shared/database/database-client.js";
import { createCatalogMediaStore } from "../modules/catalog/infrastructure/catalog-media-store.js";

const INTERNATIONAL_SLUGS = [
  "iphones-gadgets",
  "medical-equipments",
  "home-garden-wares",
  "machineries",
  "general-procurement",
  "home-appliances",
  "office-business",
  "fashion-textiles",
  "beauty-spa-salon",
  "retail-store-setup",
] as const;

const IE_SLUGS = [
  "sesame-seeds",
  "cashew",
  "ginger",
  "hibiscus",
  "shea",
  "soybean",
  "cocoa",
] as const;

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function readable(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function isLocalEphemeral(url: string | null | undefined): boolean {
  const value = url?.trim() ?? "";
  return (
    value.startsWith("/api/v1/public/catalog-media/") ||
    value.startsWith("api/v1/public/catalog-media/") ||
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  );
}

async function main(): Promise<void> {
  const execute = hasFlag("--execute");
  const rehydrateProducts = hasFlag("--rehydrate-local-products");
  const env = parseEnvironment(process.env);

  if (!env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (execute && env.CATALOG_MEDIA_DRIVER === "local") {
    throw new Error(
      "Refusing execute with CATALOG_MEDIA_DRIVER=local. Configure supabase or s3 first.",
    );
  }

  const db = createDatabaseClient(env.DATABASE_URL);
  const store = createCatalogMediaStore({
    uploadRoot: env.UPLOAD_ROOT,
    driver: env.CATALOG_MEDIA_DRIVER,
    nodeEnv: execute ? "production" : env.NODE_ENV,
    s3Bucket: env.CATALOG_MEDIA_S3_BUCKET,
    s3Region: env.AWS_REGION,
    s3AccessKeyId: env.AWS_ACCESS_KEY_ID,
    s3SecretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3PublicBaseUrl: env.CATALOG_MEDIA_S3_PUBLIC_BASE_URL,
    supabaseUrl: env.CATALOG_MEDIA_SUPABASE_URL,
    supabaseServiceRoleKey: env.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucket: env.CATALOG_MEDIA_SUPABASE_BUCKET,
  });

  const webPublic = resolve(process.cwd(), "../web/public");
  const categoryResults: Array<Record<string, unknown>> = [];
  const commodityResults: Array<Record<string, unknown>> = [];
  const productResults: Array<Record<string, unknown>> = [];

  try {
    for (const slug of INTERNATIONAL_SLUGS) {
      const category = await db.productCategory.findFirst({
        where: { slug },
      });
      const source = join(
        webPublic,
        "media",
        "presentation",
        "v2",
        "international",
        `${slug}.webp`,
      );
      const sourceExists = await readable(source);
      if (!category) {
        categoryResults.push({ slug, status: "category_missing" });
        continue;
      }
      if (!sourceExists) {
        categoryResults.push({ slug, status: "source_missing", source });
        continue;
      }
      if (!execute) {
        categoryResults.push({
          slug,
          status: "ready",
          categoryId: category.id,
          source,
        });
        continue;
      }

      const bytes = await readFile(source);
      const stored = await store.put({
        productId: category.id,
        originalFilename: basename(source),
        bytes,
      });
      await db.productCategory.update({
        where: { id: category.id },
        data: categoryWriteData({
          imageUrl: stored.publicUrl,
          imageStorageKey: stored.filename,
          imageMimeType: "image/webp",
          imageBytes: bytes.length,
          imageAlt: category.name,
        }),
      });
      categoryResults.push({
        slug,
        status: "repaired",
        imageUrl: stored.publicUrl,
      });
    }

    for (const slug of IE_SLUGS) {
      const commodity = await db.integratedExportCommodity.findFirst({
        where: { slug, archivedAt: null },
      });
      const source = join(
        webPublic,
        "media",
        "presentation",
        "v2",
        "ie",
        `${slug}.webp`,
      );
      const sourceExists = await readable(source);
      if (!commodity) {
        commodityResults.push({ slug, status: "commodity_missing" });
        continue;
      }
      if (!sourceExists) {
        commodityResults.push({ slug, status: "source_missing", source });
        continue;
      }
      if (!execute) {
        commodityResults.push({
          slug,
          status: "ready",
          commodityId: commodity.id,
          source,
        });
        continue;
      }

      const bytes = await readFile(source);
      const stored = await store.put({
        productId: commodity.id,
        originalFilename: basename(source),
        bytes,
      });
      await db.integratedExportCommodity.update({
        where: { id: commodity.id },
        data: {
          heroMedia: {
            src: stored.publicUrl,
            alt: commodity.name,
          },
        },
      });
      commodityResults.push({
        slug,
        status: "repaired",
        heroSrc: stored.publicUrl,
      });
    }

    if (rehydrateProducts) {
      const products = await db.product.findMany({
        where: { status: "published" },
        select: {
          id: true,
          slug: true,
          images: {
            orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
            take: 1,
            select: {
              id: true,
              url: true,
              storageKey: true,
            },
          },
        },
      });

      for (const product of products) {
        const image = product.images[0];
        if (!image || !isLocalEphemeral(image.url) || !image.storageKey) continue;
        const source = resolve(
          process.cwd(),
          env.UPLOAD_ROOT,
          "public",
          "catalog",
          product.id,
          image.storageKey,
        );
        if (!(await readable(source))) {
          productResults.push({
            slug: product.slug,
            status: "local_source_missing",
            source,
          });
          continue;
        }
        if (!execute) {
          productResults.push({
            slug: product.slug,
            status: "ready",
            source,
          });
          continue;
        }
        const bytes = await readFile(source);
        const info = await stat(source);
        const stored = await store.put({
          productId: product.id,
          originalFilename: basename(source),
          bytes,
        });
        await db.productImage.update({
          where: { id: image.id },
          data: mediaWriteData({
            url: stored.publicUrl,
            storageKey: stored.filename,
            fileSize: info.size,
          }),
        });
        productResults.push({
          slug: product.slug,
          status: "repaired",
          imageUrl: stored.publicUrl,
        });
      }
    }

    console.log(
      JSON.stringify(
        {
          mode: execute ? "execute" : "dry-run",
          storageDriver: env.CATALOG_MEDIA_DRIVER,
          categories: categoryResults,
          commodities: commodityResults,
          products: rehydrateProducts ? productResults : "skipped",
          note: execute
            ? "Durable media repair completed."
            : "Dry run only. No database rows or storage objects were changed.",
        },
        null,
        2,
      ),
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
