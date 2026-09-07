import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HomepageHero } from "./HomepageHero.js";
import { homepageFixtures } from "./fixtures.js";

afterEach(() => {
  cleanup();
});

describe("HomepageHero (Accountable Corridor)", () => {
  const hero = homepageFixtures.hero;

  it("renders blueprint copy, dual CTAs, search, and trust", () => {
    render(
      <HomepageHero
        brandName={hero.brandName}
        groupAffiliation={hero.groupAffiliation}
        groupHref={hero.groupHref}
        groupExploreLabel={hero.groupExploreLabel}
        headline={hero.headline}
        supportingText={hero.supportingText}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
        searchLabel={hero.searchLabel}
        searchPlaceholder={hero.searchPlaceholder}
        trustIndicators={hero.trustIndicators}
        statistics={hero.statistics}
        animateCounters={false}
        scrollTargetId={hero.scrollTargetId}
      />,
    );

    expect(screen.getByText("Almahbub International")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Part of Almahbub Group" })).toHaveAttribute(
      "href",
      "/group",
    );
    expect(screen.getByRole("link", { name: /explore our businesses/i })).toHaveAttribute(
      "href",
      "/group",
    );
    expect(screen.queryByText(/powered by haqq tech/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Global procurement. Local accountability." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request Procurement" })).toHaveAttribute(
      "href",
      "/contact",
    );
    expect(screen.getByRole("link", { name: "Explore Services" })).toHaveAttribute(
      "href",
      "/services",
    );
    expect(screen.getByLabelText("Start a request")).toBeInTheDocument();
    expect(screen.getByText("Managed end-to-end process")).toBeInTheDocument();
    expect(screen.queryByText("Active sourcing corridors")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Scroll to explore" })).toHaveAttribute(
      "href",
      "#trust",
    );
  });

  it("prioritizes LCP image when provided and keeps alt text", () => {
    const { container } = render(
      <HomepageHero
        headline={hero.headline}
        supportingText={hero.supportingText}
        visualMode="image"
        imageSrc="/media/hero.webp"
        imageSrcSet="/media/hero-800.webp 800w, /media/hero-1600.webp 1600w"
        imageAlt="Inspection team reviewing shipment documentation"
        animateCounters={false}
        statistics={[]}
      />,
    );

    const img = container.querySelector("img.hamd-hero__image");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/media/hero.webp");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("alt", "Inspection team reviewing shipment documentation");
    expect(img).not.toHaveAttribute("loading", "lazy");
  });

  it("submits quick procurement entry through onSearchSubmit", async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();

    const { container } = render(
      <HomepageHero
        headline={hero.headline}
        supportingText={hero.supportingText}
        onSearchSubmit={onSearchSubmit}
        animateCounters={false}
        statistics={[]}
      />,
    );

    const view = within(container);
    await user.type(view.getByLabelText("Start a request"), "DN50 flange Lagos");
    await user.click(view.getByRole("button", { name: "Continue" }));
    expect(onSearchSubmit).toHaveBeenCalledWith("DN50 flange Lagos");
  });

  it("defaults to the layered hero visual system when no image is supplied", () => {
    render(
      <HomepageHero
        headline={hero.headline}
        supportingText={hero.supportingText}
        animateCounters={false}
        statistics={[]}
      />,
    );

    expect(screen.getByTestId("hero-visual-system")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /global procurement corridors/i })).toBeInTheDocument();
  });
});
