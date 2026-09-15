import { describe, expect, it } from "vitest";

import { resolveMediaUrl } from "./media-url.js";

describe("resolveMediaUrl", () => {
  it("resolves public catalog media on the configured API origin", () => {
    expect(
      resolveMediaUrl(
        "/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000c0de/hero.webp",
        "http://127.0.0.1:4000",
      ),
    ).toBe("http://127.0.0.1:4000/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000c0de/hero.webp");
  });

  it("preserves proxy-relative and static URLs without double-prefixing", () => {
    expect(resolveMediaUrl("/api/v1/public/catalog-media/id/a.mp3", "")).toBe("/api/v1/public/catalog-media/id/a.mp3");
    expect(resolveMediaUrl("/media/ie/process-logistics-ship.jpg", "https://api.example")).toBe("/media/ie/process-logistics-ship.jpg");
    expect(resolveMediaUrl("https://storage.example/a.jpg", "https://api.example/")).toBe("https://storage.example/a.jpg");
  });

  it("leaves absolute URLs unchanged", () => {
    expect(resolveMediaUrl("https://cdn.example/a.webp")).toBe("https://cdn.example/a.webp");
  });
});
