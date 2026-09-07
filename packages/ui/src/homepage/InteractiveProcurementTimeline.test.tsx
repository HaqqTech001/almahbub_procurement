import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  InteractiveProcurementTimeline,
  defaultProcurementTimelineSteps,
} from "./InteractiveProcurementTimeline.js";

afterEach(() => {
  cleanup();
});

describe("InteractiveProcurementTimeline", () => {
  it("renders all nine journey stages", () => {
    render(<InteractiveProcurementTimeline defaultStepId="discover" />);
    const list = screen.getByRole("list", { name: "Procurement journey" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(9);
    for (const title of [
      "Discover",
      "Browse",
      "Request",
      "Review",
      "Quotation",
      "Approval",
      "Payment",
      "Shipment",
      "Delivery",
    ]) {
      expect(within(list).getByRole("button", { name: new RegExp(title, "i") })).toBeInTheDocument();
    }
  });

  it("communicates where you are, what happens next, and duration", () => {
    render(<InteractiveProcurementTimeline defaultStepId="request" />);
    expect(screen.getByText("Where you are")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Request" })).toBeInTheDocument();
    expect(screen.getByText("What happens next")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Review" })).toBeInTheDocument();
    expect(screen.getByText("Expected duration")).toBeInTheDocument();
    expect(screen.getAllByText("15–45 min").length).toBeGreaterThan(0);
    expect(screen.getByText(/Step 3 of 9/i)).toBeInTheDocument();
  });

  it("supports keyboard navigation across steps", async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    render(
      <InteractiveProcurementTimeline defaultStepId="discover" onStepChange={onStepChange} />,
    );

    const discover = screen.getByRole("button", { name: /Discover/i });
    discover.focus();
    await user.keyboard("{ArrowRight}");
    expect(onStepChange).toHaveBeenCalledWith("browse", 1);
    expect(screen.getByRole("button", { name: /Browse/i })).toHaveAttribute("aria-current", "step");
  });

  it("marks completed steps before the current index", () => {
    const { container } = render(
      <InteractiveProcurementTimeline
        steps={defaultProcurementTimelineSteps}
        defaultStepId="quotation"
      />,
    );
    expect(container.querySelectorAll(".hamd-timeline__step--complete").length).toBe(4);
    expect(container.querySelector(".hamd-timeline__step--current")).not.toBeNull();
  });
});
