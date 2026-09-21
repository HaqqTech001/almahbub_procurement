import { describe, expect, it, vi } from "vitest";
import {
  commodityFingerprint,
  commodityPublicationApproved,
  type CommodityPublicationReview,
} from "../application/commodity-publication-review.js";
const row = {
  id: "one",
  slug: "ginger",
  name: "Ginger",
  description: "Ginger root",
  heroMedia: { src: "/hero.png" },
  gallery: [],
};
const hashValue = "a".repeat(64);
const review: CommodityPublicationReview = {
  commodityId: "one",
  fingerprint: commodityFingerprint(row),
  identityApproved: true,
  reviewedBy: "reviewer",
  checkedAt: "2026-09-18",
  media: [
    {
      src: "/hero.png",
      sha256: hashValue,
      semanticApproved: true,
      sourceUrl: "https://example.com/source",
      usageEvidence: "Licensed fixture",
    },
  ],
};
describe("commodity publication review", () => {
  it("fails closed without approval", async () => {
    expect(await commodityPublicationApproved(row)).toBe(false);
  });
  it("requires actual healthy reviewed bytes", async () => {
    expect(
      await commodityPublicationApproved(
        row,
        [review],
        async () => hashValue,
        async () => "valid",
      ),
    ).toBe(true);
    expect(
      await commodityPublicationApproved(
        row,
        [review],
        async () => "b".repeat(64),
        async () => "valid",
      ),
    ).toBe(false);
    expect(
      await commodityPublicationApproved(
        row,
        [review],
        async () => hashValue,
        async () => "broken",
      ),
    ).toBe(false);
  });
  it("invalidates identity and gallery edits before fetching", async () => {
    const hash = vi.fn();
    expect(
      await commodityPublicationApproved(
        { ...row, name: "Cashew" },
        [review],
        hash,
      ),
    ).toBe(false);
    expect(
      await commodityPublicationApproved(
        { ...row, gallery: [{ src: "/other.png" }] },
        [review],
        hash,
      ),
    ).toBe(false);
    expect(hash).not.toHaveBeenCalled();
  });
  it("requires explicit source rights evidence", async () => {
    const invalid = {
      ...review,
      media: review.media.map((item) => ({ ...item, usageEvidence: "" })),
    };
    expect(
      await commodityPublicationApproved(
        row,
        [invalid],
        async () => hashValue,
        async () => "valid",
      ),
    ).toBe(false);
  });
});
