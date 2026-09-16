import { describe, expect, it, vi, afterEach } from "vitest";
import { createApp } from "../../../app.js";
import { parseEnvironment } from "../../../config/env.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import type { CatalogMediaStore } from "../../catalog/infrastructure/catalog-media-store.js";
import type * as CommodityModule from "../application/ie-commodity-service.js";

const captured = vi.hoisted(() => ({ store: undefined as CatalogMediaStore | undefined }));
vi.mock("../application/ie-commodity-service.js", async importOriginal => {
  const original = await importOriginal<typeof CommodityModule>();
  return { ...original, IeCommodityService: class extends original.IeCommodityService {
    constructor(database: DatabaseClient, store: CatalogMediaStore) {
      super(database, store);
      captured.store = store;
    }
  } };
});
afterEach(() => vi.unstubAllGlobals());

describe("Integrated Export production storage wiring", () => {
  it.each(["supabase", "s3"] as const)("uses configured %s writes and returns its public read URL", async driver => {
    const upload = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", upload);
    createApp(parseEnvironment({ NODE_ENV: "test", LOG_LEVEL: "silent", CATALOG_MEDIA_DRIVER: driver,
      CATALOG_MEDIA_SUPABASE_URL: "https://storage.example.test", CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      CATALOG_MEDIA_S3_BUCKET: "catalog", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "test-access", AWS_SECRET_ACCESS_KEY: "test-secret",
    }), { database: {} as DatabaseClient });
    expect(captured.store).toBeDefined();
    const stored = await captured.store!.put({ productId: "0190c8a0-1000-7000-8000-00000000e001", originalFilename: "sesame.png", bytes: Buffer.from("test") });
    expect(upload).toHaveBeenCalledOnce();
    expect(stored.publicUrl).toMatch(driver === "supabase" ? /^https:\/\/storage.example.test\/storage\/v1\/object\/public\// : /^https:\/\/catalog.s3.eu-west-1.amazonaws.com\//);
    expect(stored.publicUrl).not.toContain("/api/v1/public/catalog-media/");
  });
});
