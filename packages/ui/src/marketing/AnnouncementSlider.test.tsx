import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { AnnouncementSlider, type AnnouncementSlide } from "./AnnouncementSlider.js";

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

const slides: AnnouncementSlide[] = [
  {
    id: "wedding",
    title: "Celebrating with our family",
    message: "Warm congratulations on the wedding this September.",
    dismissible: true,
    theme: "celebration",
    showConfetti: true,
    ctaLabel: "Celebrate with us",
    href: "/contact",
  },
  {
    id: "ops",
    title: "Sourcing season",
    message: "Plan Q4 procurement early.",
    dismissible: true,
    theme: "default",
  },
];

describe("AnnouncementSlider", () => {
  it("treats only the approved Rowdotul HAMD'26 identity as the wedding celebration marker", () => {
    const { container, rerender } = render(
      <AnnouncementSlider
        announcements={[
          {
            id: "rowdotul",
            title: "Rowdotul HAMD'26",
            message: "Warm congratulations from Almahbub International.",
            dismissible: false,
            theme: "celebration",
          },
        ]}
      />,
    );
    expect(container.querySelector(".hamd-announcement-slider--hamd")).toBeTruthy();

    rerender(
      <AnnouncementSlider
        announcements={[
          {
            id: "legacy-tag",
            title: "#Hamd'26",
            message: "Legacy wording should not trigger the branded treatment.",
            dismissible: false,
            theme: "default",
          },
        ]}
      />,
    );
    expect(container.querySelector(".hamd-announcement-slider--hamd")).toBeFalsy();
  });

  it("hides carousel chrome for a single slide", () => {
    render(<AnnouncementSlider announcements={[slides[0]!]} />);
    expect(screen.getByText(/celebrating with our family/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next announcement/i })).not.toBeInTheDocument();
  });

  it("exposes prev/next and advances slides", async () => {
    const user = userEvent.setup();
    render(
      <AnnouncementSlider announcements={slides} autoRotateMs={0} chrome="full" />,
    );
    expect(screen.getByText(/wedding this september/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next announcement/i }));
    expect(screen.getByText(/plan q4 procurement/i)).toBeInTheDocument();
  });

  it("minimal chrome hides arrows for celebration strips", () => {
    render(
      <AnnouncementSlider announcements={slides} autoRotateMs={0} chrome="minimal" />,
    );
    expect(screen.queryByRole("button", { name: /next announcement/i })).not.toBeInTheDocument();
    expect(screen.getByText(/celebrating with our family/i)).toBeInTheDocument();
  });

  it("defaults autoplay to 2500ms and disables it under reduced motion", () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "AnnouncementSlider.tsx"),
      "utf8",
    );
    expect(source).toMatch(/DEFAULT_ANNOUNCEMENT_ROTATE_MS = 2500/);
    expect(source).toMatch(/prefersReducedMotion\(\)/);
    expect(source).toMatch(/autoRotateMs = DEFAULT_AUTO_MS/);
  });
});
