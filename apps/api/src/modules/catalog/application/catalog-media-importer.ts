/**
 * Catalogue media import planner + executor helpers.
 *
 * Dry-run classifies every asset (never silent-skips).
 * Execute uploads + creates ProductImage / ProductVideo rows only when an
 * approved mapping resolves to a real product. Test-bed Phase 6 products are
 * blocked unless explicitly allowed for automated tests.
 */

import { basename, extname } from "node:path";

import {
  catalogMediaKindFromMime,
  validateCatalogMediaUpload,
  type CatalogMediaKind,
} from "../infrastructure/catalog-media-policy.js";
import type { CatalogMediaStore } from "../infrastructure/catalog-media-store.js";

export type CatalogMediaImportStatus =
  | "IMPORTED"
  | "UNMATCHED"
  | "REJECTED"
  | "FAILED"
  | "ELIGIBLE";

export type CatalogMediaMappingRow = {
  filename: string;
  sourcePath?: string | null;
  productId?: string | null;
  productSlug?: string | null;
  kind?: CatalogMediaKind | null;
  position?: number | null;
  altText?: string | null;
  title?: string | null;
  caption?: string | null;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
};

export type CatalogMediaImportAsset = {
  absolutePath: string;
  relativePath: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  bytes?: Buffer;
};

export type CatalogMediaImportResultRow = {
  filename: string;
  relativePath: string;
  status: CatalogMediaImportStatus;
  reason: string;
  productId?: string;
  mediaId?: string;
};

export type CatalogMediaImportReport = {
  imported: number;
  unmatched: number;
  rejected: number;
  failed: number;
  eligible: number;
  rows: CatalogMediaImportResultRow[];
};

export type CatalogMediaImportProduct = {
  id: string;
  slug: string;
  status: string;
};

export type CatalogMediaImportDeps = {
  resolveProduct: (input: {
    productId?: string | null;
    productSlug?: string | null;
  }) => Promise<CatalogMediaImportProduct | null>;
  store: CatalogMediaStore;
  createImage: (input: {
    productId: string;
    url: string;
    altText?: string | null;
    caption?: string | null;
    storageKey?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    position?: number | null;
    isPrimary?: boolean | null;
  }) => Promise<{ id: string }>;
  createVideo: (input: {
    productId: string;
    url: string;
    title?: string | null;
    caption?: string | null;
    position?: number | null;
  }) => Promise<{ id: string }>;
  allowTestBedProducts?: boolean;
};

const IMAGE_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

const VIDEO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
};

const BLOCKED_SLUG_PREFIXES = ["phase6a-test-bed-", "phase6b-media-"] as const;

export function mimeFromAssetFilename(filename: string): string | null {
  const ext = extname(filename).toLowerCase();
  return IMAGE_MIME[ext] ?? VIDEO_MIME[ext] ?? null;
}

export function shouldIgnoreDuplicateVideoPath(
  relativePath: string,
  knownVideoBasenames: Set<string>,
): boolean {
  const normalized = relativePath.replace(/\\/g, "/").toLowerCase();
  const isImageFolderAsset =
    normalized.startsWith("images/") || normalized.includes("/images/");
  if (!isImageFolderAsset) return false;
  if (extname(normalized) !== ".mp4") return false;
  return knownVideoBasenames.has(basename(normalized).toLowerCase());
}

export function isBlockedTestBedProduct(slug: string): boolean {
  const normalized = slug.toLowerCase();
  return BLOCKED_SLUG_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function duplicateCatalogMediaPositions(
  rows: CatalogMediaMappingRow[],
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const row of rows) {
    const productIdentity = row.productId?.trim() || row.productSlug?.trim();
    if (!productIdentity || row.position == null) continue;
    const kind = row.kind ?? "image";
    const key = `${productIdentity}|${kind}|${row.position}`;
    if (seen.has(key)) duplicates.add(key);
    else seen.add(key);
  }

  return [...duplicates].sort();
}

export function classifyCatalogMediaAsset(input: {
  asset: CatalogMediaImportAsset;
  mappingByFilename: Map<string, CatalogMediaMappingRow>;
  knownVideoBasenames: Set<string>;
}): CatalogMediaImportResultRow {
  const { asset, mappingByFilename, knownVideoBasenames } = input;
  if (
    shouldIgnoreDuplicateVideoPath(asset.relativePath, knownVideoBasenames)
  ) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "REJECTED",
      reason: "Duplicate MP4 under images/; use videos/ copy only.",
    };
  }

  const mime = asset.mimeType || mimeFromAssetFilename(asset.filename);
  if (!mime) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "REJECTED",
      reason: "Unsupported file type.",
    };
  }

  const kind = catalogMediaKindFromMime(mime);
  if (!kind) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "REJECTED",
      reason: "MIME type is not an approved catalogue image or video.",
    };
  }

  const issues = validateCatalogMediaUpload({
    filename: asset.filename,
    mimeType: mime,
    sizeBytes: asset.sizeBytes,
    kind,
  });
  if (issues.length > 0) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "REJECTED",
      reason: issues[0]!.message,
    };
  }

  const mapped =
    mappingByFilename.get(asset.filename) ??
    mappingByFilename.get(basename(asset.relativePath));
  if (!mapped) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "UNMATCHED",
      reason: "UNMATCHED — manual confirmation required.",
    };
  }

  const productId = mapped.productId?.trim() || null;
  const productSlug = mapped.productSlug?.trim() || null;
  if (!productId && !productSlug) {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "UNMATCHED",
      reason: "Mapping row has no productId or productSlug.",
    };
  }

  if (mapped.confidence === "LOW") {
    return {
      filename: asset.filename,
      relativePath: asset.relativePath,
      status: "UNMATCHED",
      reason: "LOW confidence mapping — manual confirmation required.",
    };
  }

  return {
    filename: asset.filename,
    relativePath: asset.relativePath,
    status: "ELIGIBLE",
    reason: "Approved mapping present; ready for execute upload.",
    ...(productId ? { productId } : {}),
  };
}

export function summarizeCatalogMediaImport(
  rows: CatalogMediaImportResultRow[],
): CatalogMediaImportReport {
  const report: CatalogMediaImportReport = {
    imported: 0,
    unmatched: 0,
    rejected: 0,
    failed: 0,
    eligible: 0,
    rows,
  };
  for (const row of rows) {
    if (row.status === "IMPORTED") report.imported += 1;
    else if (row.status === "UNMATCHED") report.unmatched += 1;
    else if (row.status === "REJECTED") report.rejected += 1;
    else if (row.status === "ELIGIBLE") report.eligible += 1;
    else report.failed += 1;
  }
  return report;
}

export function parseCatalogMediaMappingJson(
  raw: unknown,
): CatalogMediaMappingRow[] {
  if (!Array.isArray(raw)) {
    throw new Error("Mapping file must be a JSON array of mapping rows.");
  }
  return raw.map((row, index) => {
    if (!row || typeof row !== "object") {
      throw new Error(`Mapping row ${index} is invalid.`);
    }
    const record = row as Record<string, unknown>;
    const filename = String(record.filename ?? "").trim();
    if (!filename) {
      throw new Error(`Mapping row ${index} is missing filename.`);
    }
    const confidence =
      record.confidence === "HIGH" ||
      record.confidence === "MEDIUM" ||
      record.confidence === "LOW"
        ? record.confidence
        : undefined;
    const mapped: CatalogMediaMappingRow = {
      filename,
      sourcePath:
        record.sourcePath == null ? null : String(record.sourcePath).trim(),
      productId:
        record.productId == null ? null : String(record.productId).trim(),
      productSlug:
        record.productSlug == null ? null : String(record.productSlug).trim(),
      kind:
        record.kind === "image" || record.kind === "video"
          ? record.kind
          : null,
      position: typeof record.position === "number" ? record.position : null,
      altText: record.altText == null ? null : String(record.altText),
      title: record.title == null ? null : String(record.title),
      caption: record.caption == null ? null : String(record.caption),
    };
    if (confidence) {
      mapped.confidence = confidence;
    }
    return mapped;
  });
}

export async function executeCatalogMediaImport(input: {
  assets: CatalogMediaImportAsset[];
  mappingByFilename: Map<string, CatalogMediaMappingRow>;
  knownVideoBasenames: Set<string>;
  deps: CatalogMediaImportDeps;
}): Promise<CatalogMediaImportReport> {
  const rows: CatalogMediaImportResultRow[] = [];

  for (const asset of input.assets) {
    const classified = classifyCatalogMediaAsset({
      asset,
      mappingByFilename: input.mappingByFilename,
      knownVideoBasenames: input.knownVideoBasenames,
    });
    if (classified.status !== "ELIGIBLE") {
      rows.push(classified);
      continue;
    }

    const mapped =
      input.mappingByFilename.get(asset.filename) ??
      input.mappingByFilename.get(basename(asset.relativePath));
    if (!mapped) {
      rows.push({
        ...classified,
        status: "FAILED",
        reason: "Eligible row lost mapping during execute.",
      });
      continue;
    }

    try {
      const product = await input.deps.resolveProduct({
        ...(mapped.productId ? { productId: mapped.productId } : {}),
        ...(mapped.productSlug ? { productSlug: mapped.productSlug } : {}),
      });
      if (!product) {
        rows.push({
          filename: asset.filename,
          relativePath: asset.relativePath,
          status: "FAILED",
          reason: "Mapped product was not found.",
        });
        continue;
      }
      if (
        isBlockedTestBedProduct(product.slug) &&
        !input.deps.allowTestBedProducts
      ) {
        rows.push({
          filename: asset.filename,
          relativePath: asset.relativePath,
          status: "REJECTED",
          reason:
            "Refusing to attach media to Phase 6 test-bed products without allowTestBedProducts.",
          productId: product.id,
        });
        continue;
      }

      const mime = asset.mimeType || mimeFromAssetFilename(asset.filename);
      if (!mime) {
        rows.push({
          filename: asset.filename,
          relativePath: asset.relativePath,
          status: "REJECTED",
          reason: "Unsupported file type.",
        });
        continue;
      }
      const kind =
        mapped.kind ?? catalogMediaKindFromMime(mime) ?? null;
      if (!kind) {
        rows.push({
          filename: asset.filename,
          relativePath: asset.relativePath,
          status: "REJECTED",
          reason: "Unable to determine media kind.",
        });
        continue;
      }
      if (!asset.bytes) {
        rows.push({
          filename: asset.filename,
          relativePath: asset.relativePath,
          status: "FAILED",
          reason: "Asset bytes were not loaded for upload.",
        });
        continue;
      }

      const stored = await input.deps.store.put({
        productId: product.id,
        originalFilename: asset.filename,
        bytes: asset.bytes,
      });

      const media =
        kind === "image"
          ? await input.deps.createImage({
              productId: product.id,
              url: stored.publicUrl,
              altText: mapped.altText ?? null,
              caption: mapped.caption ?? null,
              storageKey: stored.filename,
              mimeType: mime,
              fileSize: asset.sizeBytes,
              position: mapped.position ?? null,
              isPrimary: mapped.position === 0,
            })
          : await input.deps.createVideo({
              productId: product.id,
              url: stored.publicUrl,
              title: mapped.title ?? null,
              caption: mapped.caption ?? null,
              position: mapped.position ?? null,
            });

      rows.push({
        filename: asset.filename,
        relativePath: asset.relativePath,
        status: "IMPORTED",
        reason: "Uploaded and catalogue media record created.",
        productId: product.id,
        mediaId: media.id,
      });
    } catch (error) {
      rows.push({
        filename: asset.filename,
        relativePath: asset.relativePath,
        status: "FAILED",
        reason: error instanceof Error ? error.message : "Import failed.",
      });
    }
  }

  return summarizeCatalogMediaImport(rows);
}
