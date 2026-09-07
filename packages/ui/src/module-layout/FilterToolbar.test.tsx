import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterToolbar } from "./FilterToolbar.js";
import { StatsRow } from "./StatsRow.js";

describe("FilterToolbar", () => {
  it("opens a filter sheet and applies on confirm", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterToolbar
        search={{ value: "", onChange: () => undefined, placeholder: "Search products" }}
        filters={[
          {
            label: "Status",
            value: "all",
            onChange,
            options: [
              { value: "all", label: "All statuses" },
              { value: "draft", label: "Draft" },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^filters$/i }));
    expect(screen.getByRole("dialog", { name: /filters/i })).toBeInTheDocument();
    await user.selectOptions(screen.getAllByLabelText("Status")[1]!, "draft");
    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(onChange).toHaveBeenCalledWith("draft");
  });

  it("shows an active filter count", () => {
    render(
      <FilterToolbar
        search={{ value: "valve", onChange: () => undefined }}
        filters={[
          {
            label: "Status",
            value: "draft",
            onChange: () => undefined,
            options: [
              { value: "all", label: "All statuses" },
              { value: "draft", label: "Draft" },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /filters \(1\)/i })).toBeInTheDocument();
  });
});

describe("StatsRow", () => {
  it("renders a compact overview summary and desktop stats", () => {
    render(
      <StatsRow
        items={[
          { label: "Products", value: 148 },
          { label: "Active", value: 121 },
        ]}
      />,
    );
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getAllByText("148").length).toBeGreaterThan(0);
  });
});
