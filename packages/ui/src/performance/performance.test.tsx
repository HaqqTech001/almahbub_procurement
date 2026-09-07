import { describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import {
  buildSrcSet,
  fontLoadingPolicy,
  getPublicPageHeadHints,
  lighthouseBundleBudgets,
  platformCacheRecommendations,
  preferModernImageFormats,
} from "./budgets.js";
import { DeferredMount } from "./runtime.js";

afterEach(() => {
  cleanup();
});

describe("enterprise performance budgets", () => {
  it("exposes cache, font, and bundle budgets for Lighthouse hosts", () => {
    expect(platformCacheRecommendations.staticAssets).toContain("immutable");
    expect(platformCacheRecommendations.openApi).toContain("stale-while-revalidate");
    expect(fontLoadingPolicy.display).toBe("swap");
    expect(fontLoadingPolicy.disallowThirdPartyOnCriticalPath).toBe(true);
    expect(lighthouseBundleBudgets.homepageInitialJsKb).toBeLessThanOrEqual(180);
  });

  it("builds responsive srcsets and modern format candidates", () => {
    expect(
      buildSrcSet([
        { src: "/a.jpg", width: 800 },
        { src: "/b.jpg", width: 400 },
      ]),
    ).toBe("/b.jpg 400w, /a.jpg 800w");

    const modern = preferModernImageFormats("https://cdn.example.com/hero.jpg", [
      480,
      960,
    ]);
    expect(modern.avifSrcSet).toContain("fm=avif");
    expect(modern.webpSrcSet).toContain("fm=webp");
    expect(modern.fallbackSrc).toContain("fm=jpg");
  });

  it("emits SEO and best-practice head hints", () => {
    const head = getPublicPageHeadHints({
      canonicalUrl: "https://almahbub.com/",
      preconnect: ["https://cdn.almahbub.com"],
    });
    expect(head.meta.some((m) => m.name === "theme-color")).toBe(true);
    expect(head.meta.some((m) => m.name === "referrer")).toBe(true);
    expect(head.links.some((l) => l.rel === "canonical")).toBe(true);
  });
});

describe("DeferredMount", () => {
  it("mounts eagerly when requested", async () => {
    const onArm = vi.fn();
    render(
      <DeferredMount eager onArm={onArm}>
        <p>Deferred body</p>
      </DeferredMount>,
    );
    expect(await screen.findByText("Deferred body")).toBeInTheDocument();
    expect(onArm).toHaveBeenCalled();
  });
});
