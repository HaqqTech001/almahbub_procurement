import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { WEDDING_MEDIA_STORAGE_ID } from "@hamd/constants";

import { createApp } from "../../../app.js";
import { parseEnvironment } from "../../../config/env.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

function mockDatabase(): DatabaseClient {
  return {
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
    product: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    productCategory: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    integratedExportCommodity: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  } as unknown as DatabaseClient;
}

describe("public catalog media", () => {
  it.each(["waiting.mp3", "clip.mp4"])(
    "serves byte ranges and HEAD for %s",
    async (filename) => {
      const uploadRoot = join(tmpdir(), `hamd-media-range-${randomUUID()}`);
      const directory = join(
        uploadRoot,
        "public",
        "catalog",
        WEDDING_MEDIA_STORAGE_ID,
      );
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, filename), "0123456789");
      const app = createApp(
        parseEnvironment({
          NODE_ENV: "test",
          LOG_LEVEL: "silent",
          UPLOAD_ROOT: uploadRoot,
        }),
        { database: mockDatabase() },
      );
      const url = `/api/v1/public/catalog-media/${WEDDING_MEDIA_STORAGE_ID}/${filename}`;
      for (const range of ["bytes=2-5", "bytes=100-"]) {
        const head = await request(app).head(url).set("Range", range);
        expect(head.status).toBe(200);
        expect(head.headers["content-length"]).toBe("10");
        expect(head.headers["content-range"]).toBeUndefined();
      }
      const precondition = await request(app).get(url).set("If-Match", '"different"');
      expect(precondition.status).toBe(412);
      expect(precondition.headers["cache-control"]).toBe("no-store");
      for (const [range, expected, contentRange] of [
        ["bytes=2-5", "2345", "bytes 2-5/10"],
        ["bytes=7-", "789", "bytes 7-9/10"],
        ["bytes=-3", "789", "bytes 7-9/10"],
        ["bytes=8-100", "89", "bytes 8-9/10"],
      ] as const) {
        const result = await request(app)
          .get(url)
          .set("Range", range)
          .buffer(true)
          .parse((res, callback) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => callback(null, Buffer.concat(chunks)));
          })
          .expect(206);
        expect(result.body.toString()).toBe(expected);
        expect(result.headers["content-range"]).toBe(contentRange);
        expect(result.headers["content-length"]).toBe(String(expected.length));
        expect(result.headers["accept-ranges"]).toBe("bytes");
      }
      const unsatisfiable = await request(app)
        .get(url)
        .set("Range", "bytes=20-")
        .expect(416);
      expect(unsatisfiable.headers["content-range"]).toBe("bytes */10");
      const full = await request(app).get(url).expect(200);
      expect(full.headers["content-length"]).toBe("10");
      await request(app).get(url).set("Range", "bytes=invalid").expect(200);
      await request(app).get(url).set("Range", "bytes=0-1,8-9").expect(200);
      await request(app)
        .get(url)
        .set("Range", "bytes=0-1")
        .set("If-Range", '"stale"')
        .expect(200);
      const head = await request(app).head(url).expect(200);
      expect(head.headers["content-length"]).toBe("10");
      expect(head.text).toBeUndefined();
    },
  );

  it("serves a catalog image and rejects path escape / invalid ids", async () => {
    const uploadRoot = join(tmpdir(), `hamd-catalog-media-${randomUUID()}`);
    const productId = "0190c8a0-1000-7000-8000-00000000c0de";
    await mkdir(join(uploadRoot, "public", "catalog", productId), {
      recursive: true,
    });
    await writeFile(
      join(uploadRoot, "public", "catalog", productId, "hero.webp"),
      Buffer.from("RIFF....WEBP", "utf8"),
    );

    const database = mockDatabase();
    vi.mocked(database.product.findFirst).mockResolvedValue({
      id: productId,
    } as never);

    const app = createApp(
      parseEnvironment({
        NODE_ENV: "test",
        API_HOST: "127.0.0.1",
        API_PORT: "4000",
        LOG_LEVEL: "silent",
        CORS_ORIGINS: "http://localhost:5173",
        JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
        UPLOAD_ROOT: uploadRoot,
      }),
      { database },
    );

    const ok = await request(app)
      .get(`/api/v1/public/catalog-media/${productId}/hero.webp`)
      .expect(200);
    expect(ok.headers["content-type"]).toMatch(/image\/webp/);

    await request(app)
      .get(`/api/v1/public/catalog-media/${productId}/../secret.txt`)
      .expect(404);

    await request(app)
      .get("/api/v1/public/catalog-media/not-a-uuid/hero.webp")
      .expect(404);

    await request(app)
      .get(`/api/v1/public/catalog-media/${productId}/missing.webp`)
      .expect(404);
  });

  it("serves media for existing entities of any status, including categories", async () => {
    const uploadRoot = join(tmpdir(), `hamd-catalog-video-${randomUUID()}`);
    const productId = "0190c8a0-1000-7000-8000-00000000c0df";
    const categoryId = "0190c8a0-1000-7000-8000-00000000c0e0";
    await mkdir(join(uploadRoot, "public", "catalog", productId), {
      recursive: true,
    });
    await mkdir(join(uploadRoot, "public", "catalog", categoryId), {
      recursive: true,
    });
    await writeFile(
      join(uploadRoot, "public", "catalog", productId, "clip.mp4"),
      Buffer.from("ftypisom", "utf8"),
    );
    await writeFile(
      join(uploadRoot, "public", "catalog", categoryId, "hero.webp"),
      Buffer.from("RIFF....WEBP", "utf8"),
    );

    const database = mockDatabase();
    const app = createApp(
      parseEnvironment({
        NODE_ENV: "test",
        API_HOST: "127.0.0.1",
        API_PORT: "4000",
        LOG_LEVEL: "silent",
        CORS_ORIGINS: "http://localhost:5173",
        JWT_ACCESS_SECRET: "test-secret-that-is-at-least-32-characters-long",
        UPLOAD_ROOT: uploadRoot,
      }),
      { database },
    );

    vi.mocked(database.product.findFirst).mockResolvedValue(null);
    await request(app)
      .get(`/api/v1/public/catalog-media/${productId}/clip.mp4`)
      .expect(404);

    vi.mocked(database.product.findFirst).mockResolvedValue({
      id: productId,
    } as never);
    const ok = await request(app)
      .get(`/api/v1/public/catalog-media/${productId}/clip.mp4`)
      .expect(200);
    expect(ok.headers["content-type"]).toMatch(/video\/mp4/);
    expect(ok.headers["accept-ranges"]).toBe("bytes");

    vi.mocked(database.product.findFirst).mockResolvedValue(null);
    vi.mocked(database.productCategory.findFirst).mockResolvedValue({
      id: categoryId,
    } as never);
    const categoryOk = await request(app)
      .get(`/api/v1/public/catalog-media/${categoryId}/hero.webp`)
      .expect(200);
    expect(categoryOk.headers["content-type"]).toMatch(/image\/webp/);
  });
});
