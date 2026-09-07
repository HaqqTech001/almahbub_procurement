/**
 * Acquire licensed PRIMARY images for catalogue products that lack one.
 * Keeps existing ProductImage rows (including the 20-pilot set).
 * Downloads binaries into CatalogMediaStore — never hotlinks.
 *
 * Usage:
 *   npx tsx src/scripts/acquire-product-primary-media.ts
 *   npx tsx src/scripts/acquire-product-primary-media.ts --execute
 */
import "../load-env.js";

import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import {
  buildProductCoreTypeIndex,
  classifyProductPrimaryMatch,
} from "../modules/catalog/application/product-primary-media-match.js";
import { isBlockedTestBedProduct } from "../modules/catalog/application/catalog-media-importer.js";
import {
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "../modules/catalog/infrastructure/catalog-media-policy.js";
import { createCatalogMediaStore } from "../modules/catalog/infrastructure/catalog-media-store.js";
import { mediaWriteData } from "../shared/database/database-client.js";

const USER_AGENT =
  "AlmahbubProductMedia/1.0 (catalogue primary-image acquisition; licensed Wikimedia/Openverse only)";
const MIN_EDGE = 400;
const REPORT_NAME = "product-media-provenance.json";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  categorySlug: string | null;
  hasPrimary: boolean;
  hasAnyImage: boolean;
};

type ResolvedSource = {
  source: "wikimedia" | "openverse";
  downloadUrl: string;
  sourceUrl: string;
  photographer: string;
  license: string;
  licenseUrl: string;
  title: string;
  width: number;
  height: number;
};

type ReportRow = {
  productSlug: string;
  productName: string;
  categorySlug: string | null;
  coreType: string;
  status: "kept_existing" | "imported" | "needs_review" | "failed";
  reason: string;
  mediaUrl?: string;
  httpStatus?: number;
  contentType?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  photographer?: string;
};

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function jpegSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1]!;
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    offset += 2 + length;
  }
  return null;
}

function pngSize(bytes: Buffer): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
    return null;
  }
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function imageSize(bytes: Buffer): { width: number; height: number } | null {
  return jpegSize(bytes) ?? pngSize(bytes);
}

function extensionForMime(mime: string): ".jpg" | ".png" | ".webp" | ".gif" {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  return ".jpg";
}

function licenseAllowed(license: string): boolean {
  const value = license.toLowerCase();
  return (
    value.includes("cc0") ||
    value.includes("public domain") ||
    value.includes("pd") ||
    value.includes("cc by") ||
    value.includes("cc-by") ||
    value.includes("attribution") ||
    value.includes("cc by-sa") ||
    value.includes("cc-by-sa")
  );
}

function titleLooksUseful(title: string, coreType: string): boolean {
  const hay = title.toLowerCase().replace(/[_-]+/g, " ");
  if (
    hay.includes(".svg") ||
    hay.includes("icon") ||
    hay.includes("logo") ||
    hay.includes("flag of") ||
    hay.includes("coat of arms") ||
    hay.includes("map of") ||
    hay.includes("diagram")
  ) {
    return false;
  }
  const tokens = coreType
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2 && !["and", "the", "for"].includes(token));
  if (tokens.length === 0) return false;
  const objectNoun = tokens[tokens.length - 1]!;
  return hay.includes(objectNoun);
}

async function fetchJson(url: URL | string, timeoutMs = 12000): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function download(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    throw new Error(`Download ${response.status} ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function resolveWikimedia(coreType: string): Promise<ResolvedSource | null> {
  const search = new URL("https://commons.wikimedia.org/w/api.php");
  search.searchParams.set("action", "query");
  search.searchParams.set("list", "search");
  search.searchParams.set("srnamespace", "6");
  search.searchParams.set("srsearch", `${coreType} filetype:bitmap`);
  search.searchParams.set("srlimit", "8");
  search.searchParams.set("format", "json");
  search.searchParams.set("origin", "*");
  const searchJson = (await fetchJson(search)) as {
    query?: { search?: Array<{ title: string }> };
  } | null;
  if (!searchJson) return null;
  const titles = (searchJson.query?.search ?? [])
    .map((row) => row.title)
    .filter((title) => titleLooksUseful(title, coreType));
  if (titles.length === 0) return null;

  const info = new URL("https://commons.wikimedia.org/w/api.php");
  info.searchParams.set("action", "query");
  info.searchParams.set("titles", titles.slice(0, 5).join("|"));
  info.searchParams.set("prop", "imageinfo");
  info.searchParams.set("iiprop", "url|extmetadata|size|mime");
  info.searchParams.set("format", "json");
  info.searchParams.set("origin", "*");
  const infoJson = (await fetchJson(info)) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          imageinfo?: Array<{
            url?: string;
            descriptionurl?: string;
            width?: number;
            height?: number;
            mime?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  } | null;
  if (!infoJson) return null;
  for (const page of Object.values(infoJson.query?.pages ?? {})) {
    const image = page.imageinfo?.[0];
    if (!image?.url || !image.width || !image.height) continue;
    if (image.width < MIN_EDGE || image.height < MIN_EDGE) continue;
    const mime = String(image.mime ?? "");
    if (!mime.startsWith("image/") || mime.includes("svg")) continue;
    const meta = image.extmetadata ?? {};
    const license = stripHtml(
      String(meta.LicenseShortName?.value ?? meta.License?.value ?? ""),
    );
    if (license && !licenseAllowed(license)) continue;
    return {
      source: "wikimedia",
      downloadUrl: image.url,
      sourceUrl:
        image.descriptionurl ??
        `https://commons.wikimedia.org/wiki/${encodeURIComponent((page.title ?? "").replace(/ /g, "_"))}`,
      photographer:
        stripHtml(String(meta.Artist?.value ?? "")) || "Wikimedia Commons contributor",
      license: license || "See Wikimedia Commons file page",
      licenseUrl:
        stripHtml(String(meta.LicenseUrl?.value ?? "")) ||
        "https://commons.wikimedia.org/wiki/Commons:Licensing",
      title: page.title ?? coreType,
      width: image.width,
      height: image.height,
    };
  }
  return null;
}

async function resolveOpenverse(coreType: string): Promise<ResolvedSource | null> {
  const api = new URL("https://api.openverse.org/v1/images/");
  api.searchParams.set("q", coreType);
  api.searchParams.set("license", "cc0,by,by-sa");
  api.searchParams.set("page_size", "8");
  const json = (await fetchJson(api)) as {
    results?: Array<{
      title?: string;
      url?: string;
      thumbnail?: string;
      foreign_landing_url?: string;
      creator?: string;
      license?: string;
      license_url?: string;
      width?: number;
      height?: number;
    }>;
  } | null;
  if (!json) return null;
  for (const row of json.results ?? []) {
    const title = String(row.title ?? "");
    if (!titleLooksUseful(title, coreType) && !titleLooksUseful(String(row.url ?? ""), coreType)) {
      continue;
    }
    const width = Number(row.width ?? 0);
    const height = Number(row.height ?? 0);
    if (width && height && (width < MIN_EDGE || height < MIN_EDGE)) continue;
    const downloadUrl = row.url ?? row.thumbnail;
    if (!downloadUrl) continue;
    const license = String(row.license ?? "cc0");
    if (!licenseAllowed(license)) continue;
    return {
      source: "openverse",
      downloadUrl,
      sourceUrl: row.foreign_landing_url ?? downloadUrl,
      photographer: row.creator || "Openverse contributor",
      license,
      licenseUrl: row.license_url || "https://creativecommons.org/licenses/",
      title,
      width: width || MIN_EDGE,
      height: height || MIN_EDGE,
    };
  }
  return null;
}

const GENERIC_NOUNS = new Set([
  "lot",
  "set",
  "kit",
  "bag",
  "system",
  "unit",
  "case",
  "station",
  "panel",
  "supply",
  "backup",
  "display",
  "machine",
  "press",
  "bundle",
  "brief",
]);

async function resolveSource(coreType: string): Promise<ResolvedSource | null> {
  const wiki = await resolveWikimedia(coreType);
  if (wiki) return wiki;
  const words = coreType.split(/\s+/);
  const noun = words[words.length - 1] ?? "";
  if (words.length > 1 && noun.length > 3 && !GENERIC_NOUNS.has(noun)) {
    await sleep(60);
    const wikiNoun = await resolveWikimedia(noun);
    if (wikiNoun) return wikiNoun;
  }
  await sleep(80);
  return resolveOpenverse(coreType);
}

async function verifyMediaUrl(
  origin: string,
  path: string,
): Promise<{ status: number; contentType: string }> {
  const response = await fetch(`${origin}${path}`, { method: "GET" });
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
  };
}

async function main(): Promise<void> {
  const execute = hasFlag(process.argv.slice(2), "--execute");
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

  const products = (await database.product.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      category: { select: { slug: true } },
      images: { select: { id: true, isPrimary: true, url: true, position: true } },
    },
    orderBy: { slug: "asc" },
  })) as Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    category: { slug: string } | null;
    images: Array<{ id: string; isPrimary: boolean; url: string; position: number }>;
  }>;

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    categorySlug: product.category?.slug ?? null,
    hasPrimary: product.images.some((image) => image.isPrimary),
    hasAnyImage: product.images.length > 0,
  }));

  const beforePrimary = rows.filter((row) => row.hasPrimary).length;
  const coreIndex = buildProductCoreTypeIndex(rows.map((row) => row.name));
  const report: ReportRow[] = [];
  const sourceCache = new Map<string, { source: ResolvedSource; bytes: Buffer; mime: string }>();
  const failedCores = new Set<string>();

  let imported = 0;
  let needsReview = 0;
  let failed = 0;

  try {
    const missing = rows.filter(
      (row) =>
        !row.hasPrimary &&
        !row.hasAnyImage &&
        row.status === "published" &&
        !isBlockedTestBedProduct(row.slug),
    );
    const byCore = new Map<string, ProductRow[]>();
    for (const product of missing) {
      const match = classifyProductPrimaryMatch(product.name, coreIndex);
      if (match.kind === "needs_review") {
        needsReview += 1;
        report.push({
          productSlug: product.slug,
          productName: product.name,
          categorySlug: product.categorySlug,
          coreType: match.coreType,
          status: "needs_review",
          reason: match.reason,
        });
        continue;
      }
      const list = byCore.get(match.coreType) ?? [];
      list.push(product);
      byCore.set(match.coreType, list);
    }

    const coreEntries = [...byCore.entries()];
    console.log(JSON.stringify({ phase: "resolve-cores", cores: coreEntries.length, missing: missing.length }));
    for (const [coreType, group] of coreEntries) {
      let cached = sourceCache.get(coreType);
      if (!cached && !failedCores.has(coreType)) {
        try {
          const resolved = await resolveSource(coreType);
          await sleep(60);
          console.log(JSON.stringify({ coreType, products: group.length, resolved: Boolean(resolved) }));
          if (!resolved) {
            failedCores.add(coreType);
          } else {
            const bytes = await download(resolved.downloadUrl);
            const mime = sniffCatalogMediaMime(bytes);
            const size = imageSize(bytes);
            if (!mime || !size || size.width < MIN_EDGE || size.height < MIN_EDGE) {
              failedCores.add(coreType);
            } else {
              const issues = validateCatalogMediaUpload({
                filename: `primary${extensionForMime(mime)}`,
                mimeType: mime,
                sizeBytes: bytes.length,
                kind: "image",
                bytes,
              });
              if (issues.length > 0) {
                failedCores.add(coreType);
              } else {
                cached = { source: resolved, bytes, mime };
                sourceCache.set(coreType, cached);
              }
            }
          }
        } catch {
          failedCores.add(coreType);
        }
      }

      if (!cached) {
        for (const product of group) {
          needsReview += 1;
          report.push({
            productSlug: product.slug,
            productName: product.name,
            categorySlug: product.categorySlug,
            coreType,
            status: "needs_review",
            reason: "No licensed Wikimedia/Openverse still matched this core type with usable dimensions.",
          });
        }
        continue;
      }

      for (const product of group) {
        if (!execute) {
          report.push({
            productSlug: product.slug,
            productName: product.name,
            categorySlug: product.categorySlug,
            coreType,
            status: "needs_review",
            reason: "Dry-run: licensed source resolved; pass --execute to store and map.",
            source: cached.source.source,
            sourceUrl: cached.source.sourceUrl,
            license: cached.source.license,
            licenseUrl: cached.source.licenseUrl,
            photographer: cached.source.photographer,
          });
          continue;
        }

        try {
          const existing = await database.productImage.findFirst({
            where: { productId: product.id },
            select: { id: true },
          });
          if (existing) {
            report.push({
              productSlug: product.slug,
              productName: product.name,
              categorySlug: product.categorySlug,
              coreType,
              status: "kept_existing",
              reason: "Product already has a media row; not duplicated.",
            });
            continue;
          }

          const stored = await store.put({
            productId: product.id,
            originalFilename: `${product.slug}-primary${extensionForMime(cached.mime)}`,
            bytes: cached.bytes,
          });

          await database.productImage.create({
            data: mediaWriteData({
              productId: product.id,
              url: stored.publicUrl,
              altText: `Representative licensed photograph of a ${coreType} for catalogue illustration. Not a photograph of warehouse stock.`,
              caption:
                "Primary catalogue view illustrating the procurement type. Licensed still — not Almahbub inventory.",
              storageKey: stored.filename,
              mimeType: cached.mime,
              fileSize: cached.bytes.length,
              position: 0,
              isPrimary: true,
            }),
            select: { id: true },
          });

          imported += 1;
          report.push({
            productSlug: product.slug,
            productName: product.name,
            categorySlug: product.categorySlug,
            coreType,
            status: "imported",
            reason: "Downloaded licensed still and created primary ProductImage.",
            mediaUrl: stored.publicUrl,
            source: cached.source.source,
            sourceUrl: cached.source.sourceUrl,
            license: cached.source.license,
            licenseUrl: cached.source.licenseUrl,
            photographer: cached.source.photographer,
          });
        } catch (error) {
          failed += 1;
          report.push({
            productSlug: product.slug,
            productName: product.name,
            categorySlug: product.categorySlug,
            coreType,
            status: "failed",
            reason: error instanceof Error ? error.message : "Import failed.",
          });
        }
      }
    }

    for (const product of rows.filter((row) => row.hasPrimary)) {
      report.push({
        productSlug: product.slug,
        productName: product.name,
        categorySlug: product.categorySlug,
        coreType: coreIndex.get(product.name) ?? "",
        status: "kept_existing",
        reason: "Existing primary/media row kept.",
      });
    }

    for (const row of report) {
      if (row.status !== "imported" || !row.mediaUrl) continue;
      const check = await verifyMediaUrl("http://127.0.0.1:4000", row.mediaUrl);
      row.httpStatus = check.status;
      row.contentType = check.contentType;
    }

    const afterPrimary = beforePrimary + imported;
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
    const reportPath = join(root, "docs", REPORT_NAME);
    const payload = {
      schema: "product-primary-media-provenance",
      generatedAt: new Date().toISOString(),
      secrets: false,
      mode: execute ? "execute" : "dry-run",
      products: rows.length,
      withPrimaryBefore: beforePrimary,
      newPrimaryImagesImported: imported,
      withPrimaryAfter: execute ? afterPrimary : beforePrimary,
      needsReview: needsReview,
      failed,
      sameOriginCatalogMedia: true,
      note: "Existing 20-pilot and other ProductImage rows were not duplicated. Uncertain matches stay needs_review.",
      rows: report.sort((a, b) => a.productSlug.localeCompare(b.productSlug)),
    };
    await writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(
      JSON.stringify(
        {
          mode: payload.mode,
          reportPath: "docs/product-media-provenance.json",
          withPrimaryBefore: payload.withPrimaryBefore,
          newPrimaryImagesImported: payload.newPrimaryImagesImported,
          withPrimaryAfter: payload.withPrimaryAfter,
          needsReview: payload.needsReview,
          failed: payload.failed,
        },
        null,
        2,
      ),
    );
  } finally {
    await database.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
