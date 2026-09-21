import { describe, expect, it, vi } from "vitest";
import {
  persistedPublicationReviews,
  publicationReviewSchema,
} from "../application/persisted-publication-review.js";
import { attachDraftPrimary } from "../application/attach-draft-primary.js";
import { reviewed } from "./publication-fixtures.js";
import type { DatabaseClient } from "../../../shared/database/database-client.js";
const product = {
  id: "p",
  slug: "power-bank",
  name: "Power Bank",
  status: "published",
  description: null,
  category: { slug: "iphones-gadgets" },
  images: [{ id: "i", url: "/image.png", position: 0, isPrimary: true }],
};
describe("persisted publication approvals", () => {
  it("rejects partial approval metadata", () => {
    expect(
      publicationReviewSchema.safeParse({
        productId: "p",
        mediaStatus: "approved",
      }).success,
    ).toBe(false);
  });
  it("requires approval ownership and reads only publicly approved metadata", async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: "v",
        productId: "p",
        specifications: { publicationReview: reviewed(product) },
      },
      {
        id: "other",
        productId: "other",
        specifications: { publicationReview: reviewed(product) },
      },
    ]);
    const result = await persistedPublicationReviews({
      productVariant: { findMany },
    } as unknown as DatabaseClient);
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe("p");
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      take: 100,
      where: {
        product: { status: "published" },
        specifications: {
          path: ["publicationStatus"],
          equals: "PUBLIC_APPROVED",
        },
      },
    });
  });
  it("refuses attachment when the atomic eligibility predicate fails", async () => {
    const query = vi.fn().mockResolvedValue([]);
    const db = { $queryRaw: query } as unknown as DatabaseClient;
    await expect(
      attachDraftPrimary(db, {
        productId: "p",
        productName: "Power Bank",
        updatedAt: new Date(),
        url: "/x",
        storageKey: "x",
        mimeType: "image/png",
        fileSize: 1,
      }),
    ).rejects.toThrow("Draft changed");
    expect(query).toHaveBeenCalledTimes(1);
  });
  it("never retries a write with an uncertain outcome", async () => {
    const query = vi.fn().mockRejectedValue({ code: "P1017" });
    await expect(
      attachDraftPrimary({ $queryRaw: query } as unknown as DatabaseClient, {
        productId: "p",
        productName: "Power Bank",
        updatedAt: new Date(),
        url: "/x",
        storageKey: "x",
        mimeType: "image/png",
        fileSize: 1,
      }),
    ).rejects.toThrow("ProductImage.create (P1017)");
    expect(query).toHaveBeenCalledTimes(1);
  });
});
