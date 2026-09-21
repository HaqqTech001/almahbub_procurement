import { act, fireEvent, render, screen } from "@testing-library/react";
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

  it("wraps at the last full desktop group without revealing empty slides", () => {
    render(<TestimonialsSection title="Customer comments" testimonials={items} autoRotateMs={0} />);
    const next = screen.getByRole("button", { name: "Next testimonial" });
    fireEvent.click(next);
    expect(screen.getByText("Showing 2 to 4 of 4")).toBeInTheDocument();
    fireEvent.click(next);
    expect(screen.getByText("Showing 1 to 3 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Previous testimonial" }));
    expect(screen.getByText("Showing 2 to 4 of 4")).toBeInTheDocument();
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
