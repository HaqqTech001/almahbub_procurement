import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HorizontalStepper } from "./HorizontalStepper.js";

const steps = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "review", label: "Review" },
];
describe("HorizontalStepper", () => {
  it("exposes states and only lets completed earlier steps be selected by keyboard", async () => {
    const select = vi.fn();
    const user = userEvent.setup();
    render(
      <HorizontalStepper steps={steps} currentStep={1} onStepSelect={select} />,
    );
    const completed = screen.getByRole("button", {
      name: /Account.*completed/,
    });
    expect(completed).toHaveTextContent("\u2713");
    expect(
      screen.getByRole("img", { name: /Security.*current/ }).parentElement,
    ).toHaveAttribute("aria-current", "step");
    expect(
      screen.getByRole("img", { name: /Review.*upcoming/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Review/ }),
    ).not.toBeInTheDocument();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(select).toHaveBeenCalledWith(0);
  });
  it("exposes errors without marking an invalid step complete", () => {
    render(
      <HorizontalStepper steps={steps} currentStep={1} errorSteps={[0, 1]} />,
    );
    expect(
      screen.getByRole("img", { name: /Account.*error/ }),
    ).toHaveTextContent("!");
    expect(
      screen.getByRole("img", { name: /Security.*current, error/ })
        .parentElement,
    ).toHaveAttribute("aria-current", "step");
  });
  it("handles empty steps and invalid indexes", () => {
    const { rerender } = render(
      <HorizontalStepper steps={[]} currentStep={0} />,
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    rerender(
      <HorizontalStepper steps={steps} currentStep={NaN} completedSteps={[]} />,
    );
    expect(
      screen.getByRole("img", { name: /Account.*current/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("scrolls only the overflowing stepper to keep the current step visible", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      label: `Step ${i + 1}`,
    }));
    const { container, rerender } = render(
      <HorizontalStepper steps={many} currentStep={0} />,
    );
    const viewport = container.firstElementChild as HTMLElement;
    Object.defineProperties(viewport, {
      scrollWidth: { value: 800 },
      clientWidth: { value: 320 },
    });
    viewport.getBoundingClientRect = () =>
      ({ left: 0, right: 320, width: 320 }) as DOMRect;
    const last = viewport.querySelectorAll("li")[7]!;
    last.getBoundingClientRect = () =>
      ({ left: 700, right: 800, width: 100 }) as DOMRect;
    viewport.scrollBy = vi.fn();
    rerender(<HorizontalStepper steps={many} currentStep={7} />);
    expect(viewport.scrollBy).toHaveBeenCalledWith({
      left: 590,
      behavior: "auto",
    });
  });
});
