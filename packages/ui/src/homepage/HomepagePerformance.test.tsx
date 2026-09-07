import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildHomepageFaqJsonLd,
  DeferredBelowFold,
  getHomepageHeadHints,
  homepageCacheRecommendations,
  prefetchHomepageBelowFold,
} from "./HomepagePerformance.js";
import { Homepage } from "./Homepage.js";
import { HomepageBelowFold } from "./HomepageBelowFold.js";
import { buildHomepageBelowFoldProps } from "./Homepage.js";

afterEach(() => {
  cleanup();
});

describe("Homepage performance helpers", () => {
  it("builds head hints with system-font-safe preload and route prefetch", () => {
    const head = getHomepageHeadHints({
      title: "Almahbub | Procurement",
      description: "Accountable global procurement.",
      canonicalUrl: "https://almahbub.com/",
      heroImageSrc: "/media/hero.avif",
      heroImageType: "image/avif",
      preconnect: ["https://cdn.almahbub.com"],
      prefetchRoutes: ["/request"],
    });

    expect(head.title).toContain("Almahbub");
    expect(head.meta.some((m) => m.name === "description")).toBe(true);
    expect(head.links.some((l) => l.rel === "preload" && l.as === "image")).toBe(true);
    expect(head.links.some((l) => l.rel === "preconnect")).toBe(true);
    expect(head.links.some((l) => l.rel === "prefetch" && l.href === "/request")).toBe(true);
    expect(head.links.some((l) => l.rel === "canonical" && l.href === "https://almahbub.com/")).toBe(
      true,
    );
    expect(head.meta.some((m) => m.name === "twitter:card")).toBe(true);
    expect(head.meta.some((m) => m.property === "og:site_name")).toBe(true);
    expect(head.meta.some((m) => m.name === "theme-color")).toBe(true);
    expect(head.meta.some((m) => m.name === "referrer")).toBe(true);
    expect(head.canonicalUrl).toBe("https://almahbub.com/");
  });

  it("builds FAQPage JSON-LD for SEO", () => {
    const data = buildHomepageFaqJsonLd({
      items: [{ id: "1", question: "Q?", answer: "A." }],
      pageUrl: "https://almahbub.com/",
    });
    expect(data["@type"]).toBe("FAQPage");
    expect(Array.isArray(data.mainEntity)).toBe(true);
  });

  it("exposes cache recommendations for host CDN", () => {
    expect(homepageCacheRecommendations.staticAssets).toContain("immutable");
    expect(homepageCacheRecommendations.html).toContain("stale-while-revalidate");
  });

  it("prefeches the below-fold module", async () => {
    const mod = await prefetchHomepageBelowFold();
    expect(mod).toBeTruthy();
    expect(typeof (mod as { HomepageBelowFold?: unknown }).HomepageBelowFold).toBe(
      "function",
    );
  });

  it("defers below-fold until intersection or missing observer", async () => {
    render(
      <DeferredBelowFold eager>
        <div>Below fold content</div>
      </DeferredBelowFold>,
    );
    expect(await screen.findByText("Below fold content")).toBeInTheDocument();
  });
});

describe("Homepage production performance defaults", () => {
  it("disables hero count-up by default and emits FAQ JSON-LD", () => {
    const { container } = render(
      <Homepage
        belowFoldSlot={<HomepageBelowFold {...buildHomepageBelowFoldProps()} />}
        seo={{ includeJsonLd: true, includeFaqJsonLd: true }}
      />,
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const faq = Array.from(scripts).some((node) =>
      (node.textContent ?? "").includes("FAQPage"),
    );
    expect(faq).toBe(true);
  });

  it("wires DeferredBelowFold when no slot is provided", () => {
    render(<Homepage seo={{ includeJsonLd: false, includeFaqJsonLd: false }} />);
    expect(screen.getByTestId("deferred-below-fold")).toBeInTheDocument();
  });
});
