/**
 * Acquire licensed PRIMARY images for catalogue products that lack one.
 * Keeps existing ProductImage rows (including the 20-pilot set).
 * Downloads binaries into CatalogMediaStore — never hotlinks.
 *
 * Usage:
 *   pnpm media:acquire --limit=100
 *   pnpm media:acquire --limit=100 --after=product-slug --category=valves
 *   pnpm media:acquire --limit=100 --execute
 */
import "../load-env.js";

import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createDatabaseClient } from "@hamd/database";

import { parseEnvironment } from "../config/env.js";
import { classifyProductPrimaryMatch } from "../modules/catalog/application/product-primary-media-match.js";
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
  confidenceScore?: number;
  searchQuery?: string;
};

type ReportRow = {
  productSlug: string;
  productName: string;
  categorySlug: string | null;
  coreType: string;
  status: "kept_existing" | "imported" | "resolved_candidate" | "needs_review" | "failed" | "duplicate_rejected";
  reason: string;
  mediaUrl?: string;
  httpStatus?: number;
  contentType?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  photographer?: string;
  candidateTitle?: string;
  searchQuery?: string;
  confidenceScore?: number;
  rejectionReason?: string;
  candidateDescription?: string;
  matchedRequiredAnchors?: string[];
  matchedSupportingAnchors?: string[];
  matchedForbiddenTerms?: string[];
  searchQueries?: string[];
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
  for (let attempt = 0; attempt <= 3; attempt += 1) try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "");
      await sleep(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10000) : 500 * 2 ** attempt);
      continue;
    }
    if (!response.ok) return null;
    return response.json();
  } catch {
    if (attempt === 3) return null;
    await sleep(300 * 2 ** attempt);
  }
  return null;
}

function candidateConfidence(title: string, coreType: string, categorySlug: string | null): number {
  const hay = title.toLowerCase().replace(/[_-]+/g, " ");
  const tokens = coreType.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const overlap = tokens.filter((t) => hay.includes(t)).length;
  let score = tokens.length ? (overlap / tokens.length) * 70 : 0;
  const context = `${categorySlug ?? ""} ${coreType}`.toLowerCase();
  const contradictions = [
    ["cabinet", /president|government|minister|political|cabinet meeting|administration/],
    ["steamer", /food|cooking|ship|locomotive|historical vessel|kitchen/],
    ["tablet", /medicine|pill|food|butter|stone tablet/],
  ] as const;
  for (const [noun, pattern] of contradictions) if (context.includes(noun) && pattern.test(hay)) score -= 100;
  if (/people|person|portrait|model|wearing|fashion/.test(hay) && /fabric|lace|textile|uniform|shoe|bag/.test(context)) score -= 45;
  if (/product|equipment|device|object|furniture|machine|cabinet|unit/.test(hay)) score += 15;
  return Math.round(score);
}

function semanticEvidence(productName: string, candidateTitle: string, categorySlug: string | null) {
  const product = `${productName} ${categorySlug ?? ""}`.toLowerCase();
  const hay = candidateTitle.toLowerCase().replace(/[_-]+/g, " ");
  const rules: Array<{ test: RegExp; required: RegExp[]; supporting: RegExp[]; forbidden: RegExp[] }> = [
    { test: /trolley|cart/, required: [/salon|beauty|hairdresser|hairdressing|stylist|cosmetic/], supporting: [/trolley|cart|mobile cart/], forbidden: [/railway|train|tram|transport|station trolley/] },
    { test: /manicure table|manicure desk|nail table/, required: [/manicure|nail|beauty salon/], supporting: [/table|desk|workstation/], forbidden: [/table rock|horseshoe|dining|geographic/] },
    { test: /styling chair|salon chair/, required: [/salon|barber|styling|hairdresser/], supporting: [/chair|seat/], forbidden: [/antique|louis|dining|office|historical/] },
    { test: /facial steamer/, required: [/facial|face|skincare|esthetician|beauty/], supporting: [/steamer|steam/], forbidden: [/cooking|food|kitchen|ship|locomotive|historical vessel/] },
    { test: /hair steamer/, required: [/hair|salon|hairdressing/], supporting: [/steamer|steam/], forbidden: [/food|cooking|kitchen|historical vessel/] },
    { test: /wax heater/, required: [/waxing|depilatory|hair removal|beauty|salon|wax pot/], supporting: [/wax/, /heater|warmer/], forbidden: [/sealing wax|candle wax|stamp|craft|envelope/] },
    { test: /nail lamp/, required: [/nail|manicure|gel polish/], supporting: [/uv|led|lamp/], forbidden: [/mining|miner|industrial lamp|desk lamp/] },
    { test: /cabinet/, required: [/beauty|salon|cosmetic|storage|furniture/], supporting: [/cabinet|cupboard|storage unit/], forbidden: [/government|president|minister|administration|political|cabinet meeting/] },
    { test: /mirror station/, required: [/salon|barber|vanity|hairdresser/], supporting: [/mirror/, /station|workstation|unit/], forbidden: [/railway|transport|electrical/] },
    { test: /shampoo station/, required: [/shampoo|backwash|hair wash/], supporting: [/salon|basin|chair|station/], forbidden: [] },
  ];
  const rule = rules.find((item) => item.test.test(product));
  const matchedRequiredAnchors = rule?.required.filter((r) => r.test(hay)).map(String) ?? [];
  const matchedSupportingAnchors = rule?.supporting.filter((r) => r.test(hay)).map(String) ?? [];
  const matchedForbiddenTerms = rule?.forbidden.filter((r) => r.test(hay)).map(String) ?? [];
  const requiredOk = !rule || matchedRequiredAnchors.length > 0;
  const supportingOk = !rule || matchedSupportingAnchors.length > 0;
  return { safe: requiredOk && supportingOk && matchedForbiddenTerms.length === 0, matchedRequiredAnchors, matchedSupportingAnchors, matchedForbiddenTerms };
}

async function download(url: string): Promise<Buffer> {
  for (let attempt = 0; attempt <= 3; attempt += 1) {
    const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(20000),
    });
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "");
      await sleep(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10000) : 500 * 2 ** attempt);
      continue;
    }
    if (!response.ok) throw new Error(`Download ${response.status} ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error(`Download rate limited after retries: ${url}`);
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

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const execute = hasFlag(argv, "--execute");
  const value = (name: string): string | undefined => {
    const item = argv.find((arg) => arg.startsWith(`${name}=`));
    return item?.slice(name.length + 1);
  };
  const rawLimit = value("--limit");
  const limit = rawLimit === undefined ? 100 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit <= 0) throw new Error("--limit must be a positive integer.");
  const after = value("--after");
  const category = value("--category");
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
    where: { status: "published" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      category: { select: { slug: true } },
      images: { select: { id: true, url: true, position: true, isPrimary: true } },
    },
    orderBy: { slug: "asc" },
  })) as Array<{
    id: string;
    slug: string;
    name: string;
    status: string;
    category: { slug: string } | null;
    images: Array<{ id: string; url: string; position: number; isPrimary: boolean }>;
  }>;

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    categorySlug: product.category?.slug ?? null,
    hasPrimary: product.images.some((image) => (image.isPrimary || image.position === 0) && image.url.trim().length > 0),
  }));

  const alreadyCovered = rows.filter((row) => row.hasPrimary).length;
  const report: ReportRow[] = [];
  let imported = 0;
  let needsReview = 0;
  let failed = 0;
  let duplicateRejected = 0;

  try {
    const candidates = rows.filter((row) => !row.hasPrimary && !isBlockedTestBedProduct(row.slug) && (!after || row.slug > after) && (!category || row.categorySlug === category)).slice(0, limit);
    const seenHashes = new Set<string>();
    let lastProcessedSlug: string | null = null;
    for (const product of candidates) {
      lastProcessedSlug = product.slug;
      const match = classifyProductPrimaryMatch(product.name);
      const coreType = match.coreType;
      if (match.kind === "needs_review") {
        needsReview += 1;
        report.push({ productSlug: product.slug, productName: product.name, categorySlug: product.categorySlug, coreType, status: "needs_review", reason: match.reason });
        continue;
      }
      let resolved: ResolvedSource | null = null;
      let bytes: Buffer | null = null;
      let mime = "";
      try {
        resolved = await resolveSource(coreType);
        if (!resolved) throw new Error("No licensed Wikimedia/Openverse match.");
        const confidenceScore = candidateConfidence(resolved.title, coreType, product.categorySlug);
        const evidence = semanticEvidence(product.name, resolved.title, product.categorySlug);
        if (confidenceScore < 45 || !evidence.safe) {
          needsReview += 1;
          report.push({ productSlug: product.slug, productName: product.name, categorySlug: product.categorySlug, coreType, status: "needs_review", reason: "Candidate failed fail-closed semantic validation.", candidateTitle: resolved.title, candidateDescription: "", searchQueries: [resolved.searchQuery ?? coreType], searchQuery: resolved.searchQuery ?? "", matchedRequiredAnchors: evidence.matchedRequiredAnchors, matchedSupportingAnchors: evidence.matchedSupportingAnchors, matchedForbiddenTerms: evidence.matchedForbiddenTerms, confidenceScore, rejectionReason: "Required domain anchors missing or forbidden meaning detected.", source: resolved.source, sourceUrl: resolved.sourceUrl });
          continue;
        }
        bytes = await download(resolved.downloadUrl);
        mime = sniffCatalogMediaMime(bytes) ?? "";
        const size = imageSize(bytes);
        const issues = !mime || !size || size.width < MIN_EDGE || size.height < MIN_EDGE ? ["invalid image dimensions or format"] : validateCatalogMediaUpload({ filename: `primary${extensionForMime(mime)}`, mimeType: mime, sizeBytes: bytes.length, kind: "image", bytes });
        if (issues.length) throw new Error(issues.join(", "));
        const hash = createHash("sha256").update(bytes).digest("hex");
        if (seenHashes.has(hash)) { duplicateRejected += 1; report.push({ productSlug: product.slug, productName: product.name, categorySlug: product.categorySlug, coreType, status: "duplicate_rejected", reason: "Downloaded binary duplicates another unrelated product; no shared variant was confirmed.", source: resolved.source, sourceUrl: resolved.sourceUrl, license: resolved.license, licenseUrl: resolved.licenseUrl, photographer: resolved.photographer }); continue; }
        seenHashes.add(hash);
      } catch (error) {
        failed += 1;
        report.push({ productSlug: product.slug, productName: product.name, categorySlug: product.categorySlug, coreType, status: "failed", reason: error instanceof Error ? error.message : "Source acquisition failed." });
        continue;
      }
      if (!execute) {
        needsReview += 1;
        const evidence = semanticEvidence(product.name, resolved.title, product.categorySlug);
        report.push({ productSlug: product.slug, productName: product.name, categorySlug: product.categorySlug, coreType, status: "resolved_candidate", reason: "Dry-run: high-confidence candidate resolved; pass --execute to store and map.", source: resolved.source, sourceUrl: resolved.sourceUrl, license: resolved.license, licenseUrl: resolved.licenseUrl, photographer: resolved.photographer, candidateTitle: resolved.title, candidateDescription: "", searchQueries: [resolved.searchQuery ?? coreType], searchQuery: resolved.searchQuery ?? "", matchedRequiredAnchors: evidence.matchedRequiredAnchors, matchedSupportingAnchors: evidence.matchedSupportingAnchors, matchedForbiddenTerms: evidence.matchedForbiddenTerms, confidenceScore: candidateConfidence(resolved.title, coreType, product.categorySlug) });
        continue;
      }
        try {
          const existing = await database.productImage.findFirst({
            where: { productId: product.id, OR: [{ isPrimary: true }, { position: 0 }] },
            select: { id: true, url: true },
          });
          if (existing?.url.trim()) {
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
            originalFilename: `${product.slug}-primary${extensionForMime(mime)}`,
            bytes,
          });

          await database.productImage.create({
            data: mediaWriteData({
              productId: product.id,
              url: stored.publicUrl,
              altText: `Representative licensed photograph of a ${coreType} for catalogue illustration. Not a photograph of warehouse stock.`,
              caption:
                "Primary catalogue view illustrating the procurement type. Licensed still — not Almahbub inventory.",
              storageKey: stored.filename,
              mimeType: mime,
              fileSize: bytes.length,
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
            source: resolved.source,
            sourceUrl: resolved.sourceUrl,
            license: resolved.license,
            licenseUrl: resolved.licenseUrl,
            photographer: resolved.photographer,
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
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
    const reportPath = join(root, "docs", REPORT_NAME);
    const payload = {
      schema: "product-primary-media-provenance",
      generatedAt: new Date().toISOString(),
      secrets: false,
      mode: execute ? "execute" : "dry-run",
      products: rows.length,
      selected: candidates.length,
      alreadyCovered,
      newPrimaryImagesImported: imported,
      withPrimaryAfter: execute ? alreadyCovered + imported : alreadyCovered,
      needsReview,
      failed,
      duplicateRejected,
      lastProcessedSlug,
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
          selected: payload.selected,
          alreadyCovered: payload.alreadyCovered,
          imported: payload.newPrimaryImagesImported,
          needsReview: payload.needsReview,
          failed: payload.failed,
          duplicateRejected: payload.duplicateRejected,
          lastProcessedSlug: payload.lastProcessedSlug,
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
