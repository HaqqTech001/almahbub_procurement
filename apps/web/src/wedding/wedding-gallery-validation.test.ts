import { describe, expect, it } from "vitest";

import { assertWeddingGalleryFile, WEDDING_GALLERY_MAX_BYTES } from "./wedding-api.js";

describe("wedding gallery client validation", () => {
  it("rejects files over 10 MB", () => {
    const file = new File([new Uint8Array(WEDDING_GALLERY_MAX_BYTES + 1)], "clip.mp4", {
      type: "video/mp4",
    });
    expect(assertWeddingGalleryFile(file)).toMatch(/10 MB/i);
  });

  it("allows a small JPEG", () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", {
      type: "image/jpeg",
    });
    expect(assertWeddingGalleryFile(file)).toBeNull();
  });
});
