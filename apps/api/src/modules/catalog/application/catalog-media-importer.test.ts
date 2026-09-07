import { describe, expect, it, vi } from "vitest";

import {
  classifyCatalogMediaAsset,
  duplicateCatalogMediaPositions,
  executeCatalogMediaImport,
  isBlockedTestBedProduct,
  parseCatalogMediaMappingJson,
  shouldIgnoreDuplicateVideoPath,
  summarizeCatalogMediaImport,
} from "./catalog-media-importer.js";

describe("catalog media importer", () => {
  it("marks WhatsApp assets without mapping as UNMATCHED", () => {
    const row = classifyCatalogMediaAsset({
      asset: {
        absolutePath: "/media/images/IMG-20260806-WA0006.jpg",
        relativePath: "images/IMG-20260806-WA0006.jpg",
        filename: "IMG-20260806-WA0006.jpg",
        sizeBytes: 1200,
        mimeType: "image/jpeg",
      },
      mappingByFilename: new Map(),
      knownVideoBasenames: new Set(),
    });
    expect(row.status).toBe("UNMATCHED");
    expect(row.reason).toMatch(/manual confirmation/i);
  });

  it("rejects duplicate MP4s under images/ when videos/ has the same basename", () => {
    expect(
      shouldIgnoreDuplicateVideoPath(
        "images/VID-20260103-WA0008.mp4",
        new Set(["vid-20260103-wa0008.mp4"]),
      ),
    ).toBe(true);

    const row = classifyCatalogMediaAsset({
      asset: {
        absolutePath: "/media/images/VID-20260103-WA0008.mp4",
        relativePath: "images/VID-20260103-WA0008.mp4",
        filename: "VID-20260103-WA0008.mp4",
        sizeBytes: 2048,
        mimeType: "video/mp4",
      },
      mappingByFilename: new Map(),
      knownVideoBasenames: new Set(["vid-20260103-wa0008.mp4"]),
    });
    expect(row.status).toBe("REJECTED");
  });

  it("rejects unsupported MIME and oversized files", () => {
    const exe = classifyCatalogMediaAsset({
      asset: {
        absolutePath: "/media/images/payload.exe",
        relativePath: "images/payload.exe",
        filename: "payload.exe",
        sizeBytes: 10,
        mimeType: "application/octet-stream",
      },
      mappingByFilename: new Map(),
      knownVideoBasenames: new Set(),
    });
    expect(exe.status).toBe("REJECTED");

    const huge = classifyCatalogMediaAsset({
      asset: {
        absolutePath: "/media/videos/clip.mp4",
        relativePath: "videos/clip.mp4",
        filename: "clip.mp4",
        sizeBytes: 90 * 1024 * 1024,
        mimeType: "video/mp4",
      },
      mappingByFilename: new Map([
        [
          "clip.mp4",
          {
            filename: "clip.mp4",
            productSlug: "real-product",
            confidence: "HIGH",
          },
        ],
      ]),
      knownVideoBasenames: new Set(["clip.mp4"]),
    });
    expect(huge.status).toBe("REJECTED");
  });

  it("marks high-confidence mapped assets as ELIGIBLE in dry-run", () => {
    const row = classifyCatalogMediaAsset({
      asset: {
        absolutePath: "/media/images/hero.jpg",
        relativePath: "images/hero.jpg",
        filename: "hero.jpg",
        sizeBytes: 2048,
        mimeType: "image/jpeg",
      },
      mappingByFilename: new Map([
        [
          "hero.jpg",
          {
            filename: "hero.jpg",
            productId: "0190c8a0-1000-7000-8000-00000000c0de",
            confidence: "HIGH",
          },
        ],
      ]),
      knownVideoBasenames: new Set(),
    });
    expect(row.status).toBe("ELIGIBLE");
  });

  it("blocks Phase 6 test-bed product slugs", () => {
    expect(isBlockedTestBedProduct("phase6a-test-bed-123")).toBe(true);
    expect(isBlockedTestBedProduct("phase6b-media-123")).toBe(true);
    expect(isBlockedTestBedProduct("q-jiko-stove")).toBe(false);
  });

  it("execute uploads eligible assets and refuses blocked test beds", async () => {
    const put = vi.fn().mockResolvedValue({
      filename: "stored.jpg",
      publicUrl: "/api/v1/public/catalog-media/p1/stored.jpg",
    });
    const createImage = vi.fn().mockResolvedValue({ id: "img-1" });
    const createVideo = vi.fn().mockResolvedValue({ id: "vid-1" });

    const report = await executeCatalogMediaImport({
      assets: [
        {
          absolutePath: "/media/images/hero.jpg",
          relativePath: "images/hero.jpg",
          filename: "hero.jpg",
          sizeBytes: 100,
          mimeType: "image/jpeg",
          bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
        },
        {
          absolutePath: "/media/images/blocked.jpg",
          relativePath: "images/blocked.jpg",
          filename: "blocked.jpg",
          sizeBytes: 100,
          mimeType: "image/jpeg",
          bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
        },
      ],
      mappingByFilename: new Map([
        [
          "hero.jpg",
          {
            filename: "hero.jpg",
            productSlug: "real-sku",
            confidence: "HIGH",
          },
        ],
        [
          "blocked.jpg",
          {
            filename: "blocked.jpg",
            productSlug: "phase6a-test-bed-1",
            confidence: "HIGH",
          },
        ],
      ]),
      knownVideoBasenames: new Set(),
      deps: {
        store: { put, remove: vi.fn() },
        resolveProduct: async ({ productSlug }) => {
          if (productSlug === "real-sku") {
            return { id: "p1", slug: "real-sku", status: "draft" };
          }
          return {
            id: "p2",
            slug: "phase6a-test-bed-1",
            status: "archived",
          };
        },
        createImage,
        createVideo,
      },
    });

    expect(report.imported).toBe(1);
    expect(report.rejected).toBe(1);
    expect(put).toHaveBeenCalledTimes(1);
    expect(createImage).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: "stored.jpg",
        mimeType: "image/jpeg",
        fileSize: 100,
        isPrimary: true,
      }),
    );
    expect(summarizeCatalogMediaImport(report.rows).imported).toBe(1);
  });

  it("parses mapping JSON arrays", () => {
    const rows = parseCatalogMediaMappingJson([
      {
        filename: "a.jpg",
        sourcePath: "sku-a/a.jpg",
        productSlug: "sku-a",
        confidence: "HIGH",
      },
    ]);
    expect(rows[0]?.filename).toBe("a.jpg");
    expect(rows[0]?.productSlug).toBe("sku-a");
    expect(rows[0]?.sourcePath).toBe("sku-a/a.jpg");
    expect(
      duplicateCatalogMediaPositions([
        { filename: "a.webp", productSlug: "phone", kind: "image", position: 0 },
        { filename: "b.webp", productSlug: "phone", kind: "image", position: 0 },
      ]),
    ).toEqual(["phone:image:0"]);
  });
});
