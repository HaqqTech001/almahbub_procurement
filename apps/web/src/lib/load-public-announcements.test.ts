import { beforeEach, describe, expect, it, vi } from "vitest";

import { listAnnouncements } from "../api/parity-api.js";
import { loadPublicAnnouncementSlides } from "./load-public-announcements.js";

vi.mock("../api/parity-api.js", () => ({
  listAnnouncements: vi.fn(),
}));

describe("loadPublicAnnouncementSlides", () => {
  beforeEach(() => {
    vi.mocked(listAnnouncements).mockReset();
  });

  it("includes published CMS announcements and dated campaigns", async () => {
    vi.mocked(listAnnouncements).mockResolvedValue([
      {
        id: "cms-1",
        title: "Ops published notice",
        slug: "ops-published-notice",
        summary: "From the operations console.",
        body: "Body",
        status: "published",
        publishedAt: "2026-08-10T00:00:00.000Z",
        viewCount: 0,
        createdAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-10T00:00:00.000Z",
      },
      {
        id: "cms-draft",
        title: "Should not appear",
        slug: "draft-notice",
        body: "Draft",
        status: "draft",
        publishedAt: null,
        viewCount: 0,
        createdAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-10T00:00:00.000Z",
      },
    ]);

    const slides = await loadPublicAnnouncementSlides(
      new Date("2026-08-13T12:00:00+01:00"),
    );
    expect(slides.some((slide) => slide.title === "Ops published notice")).toBe(
      true,
    );
    expect(slides.some((slide) => slide.title === "Should not appear")).toBe(
      false,
    );
    expect(slides.some((slide) => /Alhamdulillah/i.test(slide.title))).toBe(true);
    expect(slides.some((slide) => slide.title.includes("Rowdotul HAMD'26"))).toBe(true);
  });

  it("falls back to dated campaigns when the announcements API is unavailable", async () => {
    vi.mocked(listAnnouncements).mockRejectedValue(new Error("offline"));
    const slides = await loadPublicAnnouncementSlides(
      new Date("2026-08-13T12:00:00+01:00"),
    );
    expect(slides.some((slide) => /Alhamdulillah/i.test(slide.title))).toBe(true);
    expect(slides.some((slide) => slide.title.includes("Rowdotul HAMD'26"))).toBe(true);
  });
});
