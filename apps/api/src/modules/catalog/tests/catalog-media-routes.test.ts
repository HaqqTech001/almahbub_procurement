import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import request from "supertest";
import { describe, expect, it, vi } from "vitest";

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
