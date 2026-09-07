import { describe, expect, it } from "vitest";

import { toCmsAnnouncementSlide } from "./announcement-slides.js";

describe("toCmsAnnouncementSlide", () => {
  it("maps a published CMS announcement and ignores draft-only fields leaking into the slide", () => {
    const slide = toCmsAnnouncementSlide({
      id: "0190c8a0-1000-7000-8000-00000000a001",
      title: "Q4 sourcing window",
      slug: "q4-sourcing-window",
      summary: "Submit requests early.",
      body: "Long body that should not replace summary.",
      status: "published",
      publishedAt: "2026-08-01T00:00:00.000Z",
      viewCount: 12,
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
      media: [
        {
          id: "media-1",
          documentId: "doc-1",
          name: "notice.jpg",
          mimeType: "image/jpeg",
          sizeBytes: 1200,
          kind: "image",
          href: "/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001/media/media-1",
          sortOrder: 0,
        },
      ],
    });

    expect(slide.id).toBe(
      "cms-announcement-0190c8a0-1000-7000-8000-00000000a001",
    );
    expect(slide.title).toBe("Q4 sourcing window");
    expect(slide.message).toBe("Submit requests early.");
    expect(slide.href).toBe("/announcements/q4-sourcing-window");
    expect(slide.mediaSrc).toBe(
      "/api/v1/announcements/0190c8a0-1000-7000-8000-00000000a001/media/media-1",
    );
    expect(slide).not.toHaveProperty("status");
    expect(slide).not.toHaveProperty("viewCount");
  });
});
