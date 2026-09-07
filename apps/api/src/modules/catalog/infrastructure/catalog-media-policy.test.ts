import { describe, expect, it } from "vitest";

import {
  catalogMediaKindFromMime,
  catalogImageUploadPolicy,
  catalogVideoUploadPolicy,
  sniffCatalogMediaMime,
  validateCatalogMediaUpload,
} from "./catalog-media-policy.js";

describe("catalog media upload policy", () => {
  it("accepts approved image and video uploads", () => {
    expect(
      validateCatalogMediaUpload({
        filename: "hero.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        kind: "image",
      }),
    ).toEqual([]);
    expect(
      validateCatalogMediaUpload({
        filename: "clip.mp4",
        mimeType: "video/mp4",
        sizeBytes: 1024 * 1024,
        kind: "video",
      }),
    ).toEqual([]);
  });

  it("rejects executables, path traversal, wrong MIME, and oversized files", () => {
    expect(
      validateCatalogMediaUpload({
        filename: "../evil.exe",
        mimeType: "application/octet-stream",
        sizeBytes: 10,
        kind: "image",
      }).map((issue) => issue.code),
    ).toEqual(expect.arrayContaining(["UPLOAD_MIME", "UPLOAD_FILENAME"]));

    expect(
      validateCatalogMediaUpload({
        filename: "clip.mp4",
        mimeType: "video/webm",
        sizeBytes: 10,
        kind: "video",
      })[0]?.code,
    ).toBe("UPLOAD_MIME");

    expect(
      validateCatalogMediaUpload({
        filename: "big.mp4",
        mimeType: "video/mp4",
        sizeBytes: catalogVideoUploadPolicy.maxBytes + 1,
        kind: "video",
      })[0]?.code,
    ).toBe("UPLOAD_SIZE");

    expect(
      validateCatalogMediaUpload({
        filename: "big.jpg",
        mimeType: "image/jpeg",
        sizeBytes: catalogImageUploadPolicy.maxBytes + 1,
        kind: "image",
      })[0]?.code,
    ).toBe("UPLOAD_SIZE");
  });

  it("sniffs JPEG, PNG, GIF, WebP and MP4 signatures", () => {
    expect(sniffCatalogMediaMime(Buffer.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(
      sniffCatalogMediaMime(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe("image/png");
    expect(sniffCatalogMediaMime(Buffer.from("GIF89a"))).toBe("image/gif");
    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0);
    webp.write("WEBP", 8);
    expect(sniffCatalogMediaMime(webp)).toBe("image/webp");
    const mp4 = Buffer.alloc(12);
    mp4.write("ftyp", 4);
    expect(sniffCatalogMediaMime(mp4)).toBe("video/mp4");
    expect(sniffCatalogMediaMime(Buffer.from("not-media"))).toBeNull();
  });

  it("detects media kind from MIME", () => {
    expect(catalogMediaKindFromMime("image/png")).toBe("image");
    expect(catalogMediaKindFromMime("video/mp4")).toBe("video");
    expect(catalogMediaKindFromMime("application/pdf")).toBeNull();
  });
});
