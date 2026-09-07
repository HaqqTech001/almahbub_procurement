import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AnnouncementSlider, type AnnouncementSlide } from "./AnnouncementSlider.js";
import { CelebrationEffects } from "./CelebrationEffects.js";

afterEach(() => {
  cleanup();
});

describe("CelebrationEffects", () => {
  it("renders layered celebration markup without interactive controls", () => {
    const { container } = render(<CelebrationEffects intensity="hamd" />);
    const root = container.querySelector(".hamd-celebration-fx");
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".hamd-celebration-fx__glow")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__stage")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__popper")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__ribbons")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__rain")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__stars")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__sparkles")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__bokeh")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__balloons")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__balloon--pops")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__burst")).not.toBeNull();
    expect(container.querySelector(".hamd-celebration-fx__slide-shimmer")).not.toBeNull();
    expect(container.querySelectorAll("button, a").length).toBe(0);
  });

  it("pulses a slide shimmer without remounting the stage", async () => {
    const { rerender } = render(
      <CelebrationEffects intensity="hamd" pulseKey="slide-a" />,
    );
    const stage = document.querySelector(".hamd-celebration-fx__stage");
    expect(stage).not.toBeNull();
    rerender(<CelebrationEffects intensity="hamd" pulseKey="slide-b" />);
    expect(document.querySelector(".hamd-celebration-fx__stage")).toBe(stage);
    await waitFor(() => {
      expect(document.querySelector(".hamd-celebration-fx.is-slide-pulse")).not.toBeNull();
    });
  });
});

describe("AnnouncementSlider celebration wiring", () => {
  const wedding: AnnouncementSlide = {
    id: "founder-wedding-september-2026-line-hamd",
    title: "Rowdotul HAMD'26",
    message: "",
    dismissible: false,
    theme: "celebration",
    showConfetti: true,
    accent: "hamd",
  };

  it("mounts celebration effects for Rowdotul HAMD'26 strip slides", () => {
    render(<AnnouncementSlider announcements={[wedding]} chrome="minimal" autoRotateMs={0} />);
    expect(screen.getByText(/Rowdotul HAMD'26/i)).toBeInTheDocument();
    expect(document.querySelector(".hamd-celebration-fx--hamd")).not.toBeNull();
    expect(document.querySelector(".hamd-announcement-slider__effects")).not.toBeNull();
    expect(document.querySelector(".hamd-celebration-fx__stage")).not.toBeNull();
  });
});
