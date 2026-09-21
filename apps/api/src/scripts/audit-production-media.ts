import "../load-env.js";
import { createDatabaseClient, Prisma } from "@hamd/database";
import { parseEnvironment } from "../config/env.js";
import { withCategoryMedia } from "../shared/database/database-client.js";

type MediaClass =
  | "missing"
  | "local_ephemeral"
  | "absolute_http"
  | "data_or_blob"
  | "other_relative";

type MediaHealth = {
  classification: MediaClass;
  reachable?: boolean;
  status?: number;
};

function classify(url: string | null | undefined): MediaClass {
  const value = url?.trim();
  if (!value) return "missing";
  if (/^(data:|blob:)/i.test(value)) return "data_or_blob";
  if (/^https?:\/\//i.test(value)) return "absolute_http";
  if (
    value.startsWith("/api/v1/public/catalog-media/") ||
    value.startsWith("api/v1/public/catalog-media/") ||
    value.startsWith("/uploads/") ||
    value.startsWith("uploads/")
  ) {
    return "local_ephemeral";
  }
  return "other_relative";
}

async function verifyAbsolute(url: string): Promise<Pick<MediaHealth, "reachable" | "status">> {
  try {
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    // Some object stores/CDNs do not implement HEAD consistently.
    if (response.status === 405 || response.status === 501) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
        signal: AbortSignal.timeout(8_000),
      });
    }
    return {
      reachable: response.ok || response.status === 206,
      status: response.status,
    };
  } catch {
    return { reachable: false };
  }
}

async function inspectUrl(
  url: string | null | undefined,
  verify: boolean,
): Promise<MediaHealth> {
  const classification = classify(url);
  if (!verify || classification !== "absolute_http" || !url) {
    return { classification };
  }
  return { classification, ...(await verifyAbsolute(url)) };
}

function ieHeroSrc(value: Prisma.JsonValue | null): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const src = (value as Record<string, unknown>).src;
  return typeof src === "string" && src.trim() ? src.trim() : null;
}

function summarize<T extends { media: MediaHealth }>(rows: T[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const key =
      row.media.classification === "absolute_http" && row.media.reachable === false
        ? "absolute_http_unreachable"
        : row.media.classification;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const verify = process.argv.includes("--verify");
const env = parseEnvironment(process.env);

if (!env.DATABASE_URL) {
  console.error(JSON.stringify({ error: "DATABASE_URL is not configured." }));
  process.exit(1);
}

const db = createDatabaseClient(env.DATABASE_URL);

try {
  const [categoryRows, commodityRows, productRows] = await Promise.all([
    db.productCategory.findMany({
      orderBy: { name: "asc" },
    }),
    db.integratedExportCommodity.findMany({
      where: { archivedAt: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        published: true,
        heroMedia: true,
      },
    }),
    db.product.findMany({
      where: { status: "published" },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        images: {
          orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          take: 1,
          select: {
            url: true,
            storageKey: true,
            mimeType: true,
            fileSize: true,
            isPrimary: true,
            position: true,
          },
        },
      },
    }),
  ]);

  const categories = await Promise.all(
    categoryRows.map(async (raw) => {
      const row = withCategoryMedia(raw);
      return {
        id: raw.id,
        slug: raw.slug,
        name: raw.name,
        status: raw.status,
        imageUrl: row.imageUrl,
        imageStorageKey: row.imageStorageKey ?? null,
        imageMimeType: row.imageMimeType ?? null,
        imageBytes: row.imageBytes ?? null,
        media: await inspectUrl(row.imageUrl, verify),
      };
    }),
  );

  const commodities = await Promise.all(
    commodityRows.map(async (row) => {
      const src = ieHeroSrc(row.heroMedia);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        published: row.published,
        heroSrc: src,
        media: await inspectUrl(src, verify),
      };
    }),
  );

  const products = await Promise.all(
    productRows.map(async (row) => {
      const primary = row.images[0] ?? null;
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        imageUrl: primary?.url ?? null,
        storageKey: primary?.storageKey ?? null,
        mimeType: primary?.mimeType ?? null,
        fileSize: primary?.fileSize ?? null,
        isPrimary: primary?.isPrimary ?? false,
        position: primary?.position ?? null,
        media: await inspectUrl(primary?.url ?? null, verify),
      };
    }),
  );

  const brokenProducts = products.filter(
    (row) =>
      row.media.classification === "missing" ||
      row.media.classification === "local_ephemeral" ||
      row.media.reachable === false,
  );

  const report = {
    mode: verify ? "read_only_with_http_verification" : "read_only",
    databaseHost: new URL(env.DATABASE_URL).hostname,
    storage: {
      driver: env.CATALOG_MEDIA_DRIVER,
      supabaseConfigured: Boolean(
        env.CATALOG_MEDIA_SUPABASE_URL &&
          env.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
      ),
      s3Configured: Boolean(
        env.CATALOG_MEDIA_S3_BUCKET &&
          env.AWS_REGION &&
          env.AWS_ACCESS_KEY_ID &&
          env.AWS_SECRET_ACCESS_KEY,
      ),
    },
    totals: {
      categories: categories.length,
      commodities: commodities.length,
      publishedCommodities: commodities.filter((row) => row.published).length,
      publishedProducts: products.length,
      brokenOrUnsafePrimaryProductMedia: brokenProducts.length,
    },
    summary: {
      categories: summarize(categories),
      commodities: summarize(commodities),
      productPrimaryMedia: summarize(products),
    },
    categories,
    commodities,
    brokenProducts,
  };

  console.log(JSON.stringify(report, null, 2));

  const hasProductionMediaRisk =
    categories.some((row) =>
      ["missing", "local_ephemeral"].includes(row.media.classification),
    ) ||
    commodities.some(
      (row) =>
        row.published &&
        ["missing", "local_ephemeral"].includes(row.media.classification),
    ) ||
    brokenProducts.length > 0;

  if (hasProductionMediaRisk) process.exitCode = 2;
} catch (error) {
  console.error(
    JSON.stringify(
      {
        error: "CATALOG_MEDIA_AUDIT_FAILED",
        code:
          error && typeof error === "object" && "code" in error
            ? String(error.code)
            : undefined,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
