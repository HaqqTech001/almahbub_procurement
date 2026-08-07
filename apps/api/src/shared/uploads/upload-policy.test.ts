import { describe, expect, it } from "vitest";

import {
  sanitizeUploadFilename,
  uploadSecurityPolicy,
  validateUploadCandidate,
} from "./upload-policy.js";

describe("uploadSecurityPolicy (V1 create-request parity)", () => {
  it("allows 10MB and five files with V1 MIME types", () => {
    expect(uploadSecurityPolicy.maxBytes).toBe(10 * 1024 * 1024);
    expect(uploadSecurityPolicy.maxFilesPerRequest).toBe(5);
    expect(uploadSecurityPolicy.allowedMimeTypes).toEqual(
      expect.arrayContaining([
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]),
    );
  });

  it("rejects oversized and disallowed MIME types", () => {
    expect(
      validateUploadCandidate({
        filename: "spec.pdf",
        mimeType: "application/pdf",
        sizeBytes: uploadSecurityPolicy.maxBytes + 1,
      }),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "UPLOAD_SIZE" })]),
    );
    expect(
      validateUploadCandidate({
        filename: "payload.exe",
        mimeType: "application/octet-stream",
        sizeBytes: 1024,
      }),
    ).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "UPLOAD_MIME" })]),
    );
  });

  it("sanitizes unsafe filenames", () => {
    expect(sanitizeUploadFilename("../../evil name.pdf")).toBe("evil_name.pdf");
  });
});
