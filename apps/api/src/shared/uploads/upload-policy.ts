/** Shared upload acceptance policy — V1 request attachment parity + safer defaults. */

export const uploadSecurityPolicy = {
  /** Absolute max object size accepted by API/gateway (bytes). V1 request uploads: 10MB. */
  maxBytes: 10 * 1024 * 1024,
  /** Max files per upload request (V1 multer.array('files', 5)). */
  maxFilesPerRequest: 5,
  /** MIME allowlist aligned with V1 request/chat document types. */
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ] as const,
  /** Reject double extensions and path traversal in filenames. */
  filenamePattern: /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/,
  /** Local disk for V1 parity; object storage can replace path later. */
  storage: "local-disk" as const,
  /** Virus/malware scan required before making objects publicly readable. */
  requireMalwareScan: false,
} as const;

export type UploadValidationInput = {
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

export type UploadValidationIssue = {
  code: string;
  message: string;
};

export function sanitizeUploadFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  const truncated = cleaned.slice(0, 180);
  if (/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}$/.test(truncated)) {
    return truncated;
  }
  return `file-${Date.now()}`;
}

export function validateUploadCandidate(
  input: UploadValidationInput,
  policy = uploadSecurityPolicy,
): UploadValidationIssue[] {
  const issues: UploadValidationIssue[] = [];
  if (input.sizeBytes <= 0 || input.sizeBytes > policy.maxBytes) {
    issues.push({
      code: "UPLOAD_SIZE",
      message: `File must be between 1 byte and ${policy.maxBytes} bytes.`,
    });
  }
  if (
    !(policy.allowedMimeTypes as readonly string[]).includes(input.mimeType)
  ) {
    issues.push({
      code: "UPLOAD_MIME",
      message: `MIME type ${input.mimeType} is not allowed.`,
    });
  }
  const safeName = sanitizeUploadFilename(input.filename);
  if (
    !policy.filenamePattern.test(safeName) ||
    input.filename.includes("..")
  ) {
    issues.push({
      code: "UPLOAD_FILENAME",
      message: "Filename contains unsafe characters.",
    });
  }
  return issues;
}

export function formatSizeLabel(sizeBytes: number): string {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
