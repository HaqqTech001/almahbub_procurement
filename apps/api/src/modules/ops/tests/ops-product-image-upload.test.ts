import { describe, expect, it, vi } from "vitest";

import { OpsService } from "../application/ops-service.js";
import type { AuthContext } from "../../../shared/auth/auth-context.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";

const auth = {
  userId: "user-1",
  organizationId: "org-1",
  membershipId: "mem-1",
  sessionId: "sess-1",
  permissionKeys: new Set(["ops:access"]),
} as AuthContext;

describe("ops product image upload metadata", () => {
  it("persists storage key, mime, size and primary flag", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "img-1",
      url: "/api/v1/public/catalog-media/p1/stored.webp",
      altText: null,
      position: 0,
    });
    const database = {
      product: {
        findUnique: vi.fn().mockResolvedValue({ id: "p1" }),
      },
      productImage: {
        aggregate: vi.fn().mockResolvedValue({ _max: { position: null } }),
        updateMany: vi.fn(),
        create,
      },
    } as unknown as DatabaseClient;
    const put = vi.fn().mockResolvedValue({
      filename: "stored.webp",
      publicUrl: "/api/v1/public/catalog-media/p1/stored.webp",
    });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const service = new OpsService(database, "uploads", {
      put,
      remove: vi.fn(),
    });

    const row = await service.uploadProductImage(auth, "p1", {
      originalFilename: "hero.jpg",
      mimeType: "image/jpeg",
      sizeBytes: jpeg.length,
      buffer: jpeg,
    });

    expect(put).toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          url: "/api/v1/public/catalog-media/p1/stored.webp",
          storageKey: "stored.webp",
          mimeType: "image/jpeg",
          fileSize: jpeg.length,
          position: 0,
          isPrimary: true,
        }),
      }),
    );
    expect(row.position).toBe(0);
  });
});
