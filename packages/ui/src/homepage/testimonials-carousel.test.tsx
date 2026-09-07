import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TestimonialsSection } from "./WorkflowIndustriesSocial.js";

const items = [
  { id: "a", quote: "Quote A", name: "", role: "", organization: "Org A" },
  { id: "b", quote: "Quote B", name: "", role: "", organization: "Org B" },
  { id: "c", quote: "Quote C", name: "", role: "", organization: "Org C" },
  { id: "d", quote: "Quote D", name: "", role: "", organization: "Org D" },
];

describe("testimonial carousel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shifts one card after 3000ms instead of replacing the whole set", () => {
    vi.useFakeTimers();
    render(
      <TestimonialsSection
        title="What Our Customers Say"
        testimonials={items}
        autoRotateMs={3000}
      />,
    );
    const quotes = () => screen.getAllByTestId("testimonial-card").map((node) => node.textContent);
    expect(quotes()[0]).toMatch(/Quote A/);
    expect(quotes()[1]).toMatch(/Quote B/);
    expect(quotes()[2]).toMatch(/Quote C/);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(quotes()[0]).toMatch(/Quote A/);
    expect(document.querySelector(".hamd-testimonials__track")?.getAttribute("style")).toMatch(
      /translateX/,
    );
  });
});
