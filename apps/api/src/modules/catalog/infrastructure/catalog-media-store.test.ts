import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { AppError } from "../../../lib/app-error.js";
import {
  createCatalogMediaStore,
  LocalDiskCatalogMediaStore,
} from "./catalog-media-store.js";

describe("catalog media store", () => {
  it("writes and removes local catalog files under the product directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "hamd-catalog-store-"));
    const store = new LocalDiskCatalogMediaStore(root);
    const productId = "0190c8a0-1000-7000-8000-00000000c0de";
    const stored = await store.put({
      productId,
      originalFilename: "hero.png",
      bytes: Buffer.from("png-bytes"),
    });
    expect(stored.publicUrl).toMatch(
      new RegExp(`^/api/v1/public/catalog-media/${productId}/.+-hero\\.png$`),
    );
    const onDisk = await readFile(
      join(root, "public", "catalog", productId, stored.filename),
    );
    expect(onDisk.toString()).toBe("png-bytes");
    await store.remove({ productId, filename: stored.filename });
  });

  it("fails closed when an object-storage driver is selected without credentials", () => {
    expect(() =>
      createCatalogMediaStore({ uploadRoot: "uploads", driver: "s3" }),
    ).toThrow(AppError);
    expect(() =>
      createCatalogMediaStore({ uploadRoot: "uploads", driver: "supabase" }),
    ).toThrow(AppError);
  });

  it("rejects local disk in production instead of silently falling back", () => {
    expect(() =>
      createCatalogMediaStore({
        uploadRoot: "uploads",
        driver: "local",
        nodeEnv: "production",
      }),
    ).toThrow(/not allowed in production/);
  });

  it("instantiates s3 and supabase stores when credentials are present", () => {
    expect(() =>
      createCatalogMediaStore({
        uploadRoot: "uploads",
        driver: "s3",
        nodeEnv: "production",
        s3Bucket: "almahbub-catalog-public",
        s3Region: "eu-west-1",
        s3AccessKeyId: "AKIAEXAMPLE",
        s3SecretAccessKey: "secret",
      }),
    ).not.toThrow();
    expect(() =>
      createCatalogMediaStore({
        uploadRoot: "uploads",
        driver: "supabase",
        nodeEnv: "production",
        supabaseUrl: "https://example.supabase.co",
        supabaseServiceRoleKey: "service-role",
        supabaseBucket: "catalog-public",
      }),
    ).not.toThrow();
  });
});

