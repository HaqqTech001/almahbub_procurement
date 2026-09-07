import { describe, expect, it } from "vitest";

import { resolveMediaUrl } from "./media-url.js";

describe("resolveMediaUrl", () => {
  it("keeps public catalog-media paths same-origin so the Vite proxy serves them", () => {
    expect(
      resolveMediaUrl(
        "/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000c0de/hero.webp",
        "http://127.0.0.1:4000",
      ),
    ).toBe("/api/v1/public/catalog-media/0190c8a0-1000-7000-8000-00000000c0de/hero.webp");
  });

  it("leaves absolute URLs unchanged", () => {
    expect(resolveMediaUrl("https://cdn.example/a.webp")).toBe("https://cdn.example/a.webp");
  });
});
