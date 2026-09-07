/**
 * Catalogue media upload rules - separate from procurement document policy.
 * Images stay near the shared 10MB cap; videos allow a larger MP4 budget.
 *
 * Do not use this policy as a green light for bulk AI product generation.
 * Prefer owner-supplied, supplier-approved, or licensed photography.
 */

import {
  sanitizeUploadFilename,
  type UploadValidationIssue,
} from "../../../shared/uploads/upload-policy.js";

export const CATALOG_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export const CATALOG_VIDEO_MIME_TYPES = ["video/mp4"] as const;

export const catalogImageUploadPolicy = {
  maxBytes: 10 * 1024 * 1024,
  allowedMimeTypes: CATALOG_IMAGE_MIME_TYPES,
} as const;

/** Primary production format: MP4/H.264. Cap keeps Ops uploads practical. */
export const catalogVideoUploadPolicy = {
  maxBytes: 80 * 1024 * 1024,
  allowedMimeTypes: CATALOG_VIDEO_MIME_TYPES,
} as const;

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mp4"]);

export type CatalogMediaKind = "image" | "video";

export function sniffCatalogMediaMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp") {
    return "video/mp4";
  }
  return null;
}

export function catalogMediaKindFromMime(mimeType: string): CatalogMediaKind | null {
  if ((CATALOG_IMAGE_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "image";
  }
  if ((CATALOG_VIDEO_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return "video";
  }
  return null;
}

export function validateCatalogMediaUpload(input: {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  kind: CatalogMediaKind;
  bytes?: Buffer;
}): UploadValidationIssue[] {
  const issues: UploadValidationIssue[] = [];
  const policy =
    input.kind === "image" ? catalogImageUploadPolicy : catalogVideoUploadPolicy;
  const extensions = input.kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
  const safeName = sanitizeUploadFilename(input.filename);
  const ext = safeName.slice(safeName.lastIndexOf(".")).toLowerCase();
  const sniffed = input.bytes ? sniffCatalogMediaMime(input.bytes) : null;
  if (input.bytes && !sniffed) {
    issues.push({
      code: "UPLOAD_MIME",
      message:
        input.kind === "image"
          ? "Only JPEG, PNG, GIF, or WebP images can be used in the gallery."
          : "Only MP4 video is accepted for catalogue videos.",
    });
  } else if (sniffed && sniffed !== input.mimeType) {
    issues.push({
      code: "UPLOAD_MIME",
      message: "The file contents do not match the declared media type.",
    });
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > policy.maxBytes) {
    issues.push({
      code: "UPLOAD_SIZE",
      message: `File must be between 1 byte and ${policy.maxBytes} bytes.`,
    });
  }
  if (!(policy.allowedMimeTypes as readonly string[]).includes(input.mimeType)) {
    issues.push({
      code: "UPLOAD_MIME",
      message:
        input.kind === "image"
          ? "Only JPEG, PNG, GIF, or WebP images can be used in the gallery."
          : "Only MP4 video is accepted for catalogue videos.",
    });
  }
  if (!extensions.has(ext) || input.filename.includes("..")) {
    issues.push({
      code: "UPLOAD_FILENAME",
      message: "Filename contains an unsupported or unsafe extension.",
    });
  }
  return issues;
}
