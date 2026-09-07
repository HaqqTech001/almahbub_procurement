import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HeroVisualSystem } from "./HeroVisualSystem.js";
import { HomepageHero } from "./HomepageHero.js";

afterEach(() => {
  cleanup();
});

describe("HeroVisualSystem", () => {
  it("renders layered SVG system with accessible name and floating cards", () => {
    const { container } = render(
      <HeroVisualSystem
        label="Global procurement visualization"
        cards={[
          { id: "a", eyebrow: "Trade corridor", title: "Lagos → Rotterdam", meta: "Active lane" },
        ]}
      />,
    );

    const root = screen.getByTestId("hero-visual-system");
    expect(root).toHaveAttribute("role", "img");
    expect(root).toHaveAttribute("aria-label", "Global procurement visualization");
    expect(container.querySelector("svg.hamd-hero-visual__canvas")).not.toBeNull();
    expect(container.querySelector(".hamd-hero-visual__cards")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Lagos → Rotterdam")).toBeInTheDocument();
  });

  it("defaults include Ilorin corridor branding", () => {
    render(<HeroVisualSystem label="Default visual" />);
    expect(screen.getByText("Ilorin → Global corridors")).toBeInTheDocument();
  });

  it("supports static mode for reduced motion hosts", () => {
    const { container } = render(<HeroVisualSystem reduceMotion />);
    expect(container.querySelector(".hamd-hero-visual--static")).not.toBeNull();
  });
});

describe("HomepageHero visual modes", () => {
  it("defaults to layered visual system when no image is provided", () => {
    render(<HomepageHero statistics={[]} animateCounters={false} />);
    expect(screen.getByTestId("hero-visual-system")).toBeInTheDocument();
    expect(document.querySelector('[data-visual-mode="layered"]')).not.toBeNull();
  });

  it("uses image mode with LCP priority when visualMode=image", () => {
    const { container } = render(
      <HomepageHero
        visualMode="image"
        imageSrc="/media/hero.webp"
        imageAlt="Inspection bay"
        statistics={[]}
        animateCounters={false}
      />,
    );
    const img = container.querySelector("img.hamd-hero__image");
    expect(img).toHaveAttribute("fetchpriority", "high");
    expect(img).toHaveAttribute("alt", "Inspection bay");
    expect(screen.queryByTestId("hero-visual-system")).not.toBeInTheDocument();
  });

  it("uses hybrid mode with lazy photo base under the layered system", () => {
    const { container } = render(
      <HomepageHero
        visualMode="hybrid"
        imageSrc="/media/hero.webp"
        statistics={[]}
        animateCounters={false}
      />,
    );
    expect(screen.getByTestId("hero-visual-system")).toBeInTheDocument();
    const img = container.querySelector("img.hamd-hero__image");
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).toHaveAttribute("alt", "");
    expect(document.querySelector('[data-visual-mode="hybrid"]')).not.toBeNull();
  });

  it("uses a split layout so copy and visual stage are siblings", () => {
    const { container } = render(
      <HomepageHero statistics={[]} animateCounters={false} />,
    );
    expect(container.querySelector(".hamd-hero--split")).not.toBeNull();
    expect(container.querySelector(".hamd-hero__layout")).not.toBeNull();
    expect(container.querySelector(".hamd-hero__stage")).not.toBeNull();
    expect(container.querySelector(".hamd-hero__search")).not.toBeNull();
    expect(container.querySelectorAll(".hamd-hero-visual__card").length).toBe(3);
  });
});
