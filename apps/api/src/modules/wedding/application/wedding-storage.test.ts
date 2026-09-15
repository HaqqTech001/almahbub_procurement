import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WEDDING_CAMPAIGN, WEDDING_MEDIA_STORAGE_ID } from "@hamd/constants";
import { parseEnvironment } from "../../../config/env.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
import {
  WeddingCampaignService,
  resetWeddingCampaignForTests,
  markWeddingWaitingTracksUnhydratedForTests,
} from "./wedding-campaign-service.js";

const ops = { permissionKeys: new Set(["ops:access"]) } as AuthContext;
const bytes = Buffer.from([0x49, 0x44, 0x33, 0x04, 0, 0]);
const file = {
  originalFilename: "waiting.mp3",
  mimeType: "audio/mpeg",
  sizeBytes: bytes.length,
  buffer: bytes,
};

afterEach(() => {
  vi.unstubAllGlobals();
  resetWeddingCampaignForTests();
});

describe("wedding storage configuration", () => {
  it("retains local development uploads and the wedding UUID namespace", async () => {
    resetWeddingCampaignForTests();
    const root = await mkdtemp(join(tmpdir(), "wedding-local-"));
    const service = new WeddingCampaignService(
      parseEnvironment({ NODE_ENV: "test", UPLOAD_ROOT: root }),
    );
    const row = await service.addWaitingTrack(ops, file);
    expect(row.src).toBe(
      `/api/v1/public/catalog-media/${WEDDING_MEDIA_STORAGE_ID}/${row.storageKey}`,
    );
    expect(
      await readFile(
        join(
          root,
          "public",
          "catalog",
          WEDDING_MEDIA_STORAGE_ID,
          row.storageKey,
        ),
      ),
    ).toEqual(bytes);
  });

  it.each(["supabase", "s3"] as const)(
    "uploads and deletes through configured %s in production",
    async (driver) => {
      resetWeddingCampaignForTests();
      const root = await mkdtemp(join(tmpdir(), "wedding-durable-"));
      const environment = {
        ...parseEnvironment({
          NODE_ENV: "test",
          UPLOAD_ROOT: root,
          CATALOG_MEDIA_DRIVER: driver,
          CATALOG_MEDIA_SUPABASE_URL: "https://storage.example.test",
          CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY: "test-only-key",
          CATALOG_MEDIA_SUPABASE_BUCKET: "wedding-public",
          CATALOG_MEDIA_S3_BUCKET: "wedding-public",
          AWS_REGION: "eu-west-1",
          AWS_ACCESS_KEY_ID: "test-only-id",
          AWS_SECRET_ACCESS_KEY: "test-only-key",
          CATALOG_MEDIA_S3_PUBLIC_BASE_URL: "https://cdn.example.test",
        }),
        NODE_ENV: "production" as const,
      };
      const fetcher = vi
        .fn()
        .mockResolvedValue(new Response(null, { status: 200 }));
      vi.stubGlobal("fetch", fetcher);
      const database = {
        weddingCampaign: {
          findUnique: vi.fn().mockResolvedValue({ overlay: DEFAULT_WEDDING_CAMPAIGN }),
          upsert: vi.fn().mockResolvedValue({ id: "campaign" }),
        },
        weddingWaitingTrack: {
          findMany: vi.fn().mockResolvedValue([]),
          upsert: vi.fn().mockResolvedValue({}),
          delete: vi.fn().mockResolvedValue({}),
        },
      };
      const service = new WeddingCampaignService(environment, database as unknown as DatabaseClient);
      const row = await service.addWaitingTrack(ops, file);
      const key = `catalog/${WEDDING_MEDIA_STORAGE_ID}/${row.storageKey}`;
      expect(row.src).toBe(
        driver === "supabase"
          ? `https://storage.example.test/storage/v1/object/public/wedding-public/${key}`
          : `https://cdn.example.test/${key}`,
      );
      expect(fetcher).toHaveBeenCalledWith(
        expect.stringContaining(key),
        expect.objectContaining({
          method: driver === "supabase" ? "POST" : "PUT",
          body: new Uint8Array(bytes),
        }),
      );
      await expect(stat(join(root, "public", "catalog"))).rejects.toMatchObject(
        { code: "ENOENT" },
      );
      await service.removeWaitingTrack(ops, row.id);
      expect(fetcher).toHaveBeenLastCalledWith(
        expect.stringContaining(key),
        expect.objectContaining({ method: "DELETE" }),
      );
      database.weddingWaitingTrack.findMany.mockRejectedValueOnce(new Error("Database unavailable"));
      await expect(service.setWaitingMusicEnabled(ops, { enabled: true })).rejects.toMatchObject({
        statusCode: 503, code: "WEDDING_PERSISTENCE_UNAVAILABLE",
      });
      await expect(stat(join(root, "wedding"))).rejects.toMatchObject({ code: "ENOENT" });
      markWeddingWaitingTracksUnhydratedForTests();
      database.weddingWaitingTrack.findMany.mockRejectedValueOnce(new Error("Database unavailable"));
      await expect(service.listWaitingTracks()).rejects.toMatchObject({
        statusCode: 503, code: "WEDDING_PERSISTENCE_UNAVAILABLE",
      });
      await expect(service.listWaitingTracks()).resolves.toEqual([]);
      fetcher.mockResolvedValue(new Response(null, { status: 503 }));
      await expect(service.addWaitingTrack(ops, file)).rejects.toMatchObject({
        code: "STORAGE_UNAVAILABLE",
      });
      await expect(stat(join(root, "public", "catalog"))).rejects.toMatchObject(
        { code: "ENOENT" },
      );
    },
  );

  it("rejects local production storage and missing provider configuration", () => {
    const environment = {
      ...parseEnvironment({ NODE_ENV: "test" }),
      NODE_ENV: "production" as const,
    };
    expect(() => new WeddingCampaignService(environment)).toThrow(
      /not allowed in production/,
    );
    for (const driver of ["supabase", "s3"] as const) {
      expect(
        () =>
          new WeddingCampaignService({
            ...environment,
            CATALOG_MEDIA_DRIVER: driver,
          }),
      ).toThrow(/requires/);
    }
  });
});
