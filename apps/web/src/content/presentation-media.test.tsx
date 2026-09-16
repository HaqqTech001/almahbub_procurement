import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PresentationImage } from "../components/PresentationImage.js";
import { IeCommodityImage } from "../integrated-export/IeCommodityImage.js";
import { INTERNATIONAL_PRESENTATION_MEDIA, IE_PRESENTATION_MEDIA, IE_PRESENTATION_GALLERY, presentationSource } from "./presentation-media.js";

afterEach(cleanup);
const root = resolve(process.cwd(), "../..");
const publicRoot = resolve(process.cwd(), "public");

describe("permanent presentation artwork", () => {
  it("covers every authoritative category and commodity without publishing any records", () => {
    const categories = JSON.parse(readFileSync(join(root, "catalogue-package/category-media-plan.json"), "utf8"));
    const commodities = JSON.parse(readFileSync(join(root, "database/prisma/seed/ie-owner-approved-commodity-drafts.json"), "utf8"));
    expect(Object.keys(INTERNATIONAL_PRESENTATION_MEDIA).sort()).toEqual(categories.map((r: { categorySlug: string }) => r.categorySlug).sort());
    expect(Object.keys(IE_PRESENTATION_MEDIA).sort()).toEqual(commodities.commodities.map((r: { slug: string }) => r.slug).sort());
  });

  it("validates every static path with exact Linux casing, including gallery artwork", () => {
    for (const src of [...Object.values(INTERNATIONAL_PRESENTATION_MEDIA), ...Object.values(IE_PRESENTATION_MEDIA), ...IE_PRESENTATION_GALLERY]) {
      expect(src).toBeTruthy();
      let directory = publicRoot;
      for (const segment of src!.slice(1).split("/")) {
        expect(readdirSync(directory), src!).toContain(segment);
        directory = join(directory, segment);
      }
      expect(readFileSync(directory).length).toBeGreaterThan(100);
    }
  });

  it.each(Object.entries(INTERNATIONAL_PRESENTATION_MEDIA))("International %s has durable artwork and bounded error recovery", (_slug, fallback) => {
    expect(presentationSource("/api/v1/public/catalog-media/id/lost.png", fallback)).toBe(fallback);
    render(<PresentationImage src="https://cdn.example/broken.png" fallbackSrc={fallback!} alt="Category cover" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", fallback);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAccessibleName("Category cover: image unavailable");
    expect(document.querySelector("img")).toBeNull();
  });

  it.each(Object.entries(IE_PRESENTATION_MEDIA))("Integrated Export %s recovers a broken persistent cover", (slug, fallback) => {
    render(<IeCommodityImage slug={slug} src="https://cdn.example/broken.png" alt="Commodity cover" />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("img")).toHaveAttribute("src", fallback);
    fireEvent.error(screen.getByRole("img"));
    expect(document.querySelector("img")).toBeNull();
    expect(screen.getByRole("img")).toHaveAccessibleName("Commodity cover: image unavailable");
  });

  it("does not retry duplicate fallback URLs indefinitely and resets for a changed source", () => {
    const { rerender } = render(<PresentationImage src="/media/same.png" fallbackSrc="/media/same.png" alt="Cover" />);
    fireEvent.error(screen.getByRole("img"));
    expect(document.querySelector("img")).toBeNull();
    rerender(<PresentationImage src="/media/new.png" fallbackSrc="/media/same.png" alt="Cover" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/media/new.png");
  });

  it("substitutes matching tracked IE gallery images for stale local URLs", () => {
    render(<IeCommodityImage src="/api/v1/public/catalog-media/id/ie-cashew-whole-01.jpg" alt="Cashew kernels" />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/media/ie/commodities/cashew/whole/ie-cashew-whole-01.webp");
  });
});
