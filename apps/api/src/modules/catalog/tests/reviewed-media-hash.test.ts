import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { inspectReviewedMediaHash } from "../infrastructure/reviewed-media-hash.js";

describe("reviewed binary fingerprint", () => {
  it("hashes complete local image bytes and notices replacement at the same URL", async () => {
    const root = await mkdtemp(join(tmpdir(), "catalogue-review-test-"));
    const id = "0190c8a0-1000-7000-8000-000000000001";
    const directory = join(root, "public/catalog", id);
    const url = `/api/v1/public/catalog-media/${id}/image.png`;
    const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    try {
      await mkdir(directory, { recursive: true });
      const first = Buffer.concat([header, Buffer.alloc(256, 1)]);
      await writeFile(join(directory, "image.png"), first);
      expect(await inspectReviewedMediaHash(url, root)).toBe(
        createHash("sha256").update(first).digest("hex"),
      );
      const replacement = Buffer.concat([header, Buffer.alloc(256, 2)]);
      await writeFile(join(directory, "image.png"), replacement);
      expect(await inspectReviewedMediaHash(url, root)).not.toBe(
        createHash("sha256").update(first).digest("hex"),
      );
      await writeFile(join(directory, "image.png"), "not an image");
      expect(await inspectReviewedMediaHash(url, root)).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it("fails closed on unsupported schemes, embedded credentials and missing media", async () => {
    expect(await inspectReviewedMediaHash("file:///etc/passwd")).toBeNull();
    expect(
      await inspectReviewedMediaHash(
        "https://user:password@example.test/image.png",
      ),
    ).toBeNull();
    expect(
      await inspectReviewedMediaHash(
        "/api/v1/public/catalog-media/invalid/../secret",
      ),
    ).toBeNull();
  });
});
