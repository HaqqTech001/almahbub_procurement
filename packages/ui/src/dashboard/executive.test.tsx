import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExecutiveDashboard } from "./ExecutiveDashboard.js";
import { executiveDashboardFixture } from "./executive-fixtures.js";
import {
  AreaChart,
  BarChart,
  DonutChart,
  HeatmapPlaceholder,
  LineChart,
} from "./charts/DashboardCharts.js";

describe("executive charts", () => {
  it("renders chart figures and heatmap placeholder", () => {
    const points = [
      { label: "A", value: 10 },
      { label: "B", value: 20 },
    ];
    const { rerender } = render(
      <LineChart title="Revenue" points={points} />,
    );
    expect(document.querySelector('figure[aria-label="Revenue"]')).toBeTruthy();

    rerender(<BarChart title="Volume" points={points} />);
    expect(document.querySelector('figure[aria-label="Volume"]')).toBeTruthy();

    rerender(<AreaChart title="Cash" points={points} />);
    expect(document.querySelector('figure[aria-label="Cash"]')).toBeTruthy();

    rerender(<DonutChart title="Status" points={points} />);
    expect(document.querySelector('figure[aria-label="Status"]')).toBeTruthy();

    rerender(<HeatmapPlaceholder title="Heat" />);
    expect(screen.getByText(/heatmap placeholder/i)).toBeInTheDocument();
  });
});

describe("ExecutiveDashboard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("covers mission sections, charts, and widget controls", async () => {
    const user = userEvent.setup();
    const onOpenHref = vi.fn();

    render(
      <ExecutiveDashboard
        data={executiveDashboardFixture}
        onOpenHref={onOpenHref}
        persistLayout
        storageKey="hamd.test.exec.layout"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /operations overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to dashboard widgets/i }),
    ).toHaveAttribute("href", "#hamd-exec-grid");

    expect(screen.getByLabelText(/executive kpi cards/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /revenue overview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /procurement pipeline/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /pending approvals/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent procurement requests/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /supplier performance/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /financial summary/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /shipment status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /inventory snapshot/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/future-ready/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: /customer activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent notifications/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /system health/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ai procurement insights/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /quick actions/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /recent audit events/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /corridor activity/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/heatmap placeholder/i).length,
    ).toBeGreaterThan(0);

    expect(
      document.querySelector('figure[aria-label="Revenue by month"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('figure[aria-label="Cash collection"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('figure[aria-label="Pipeline stage volume"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('figure[aria-label="Shipments by status"]'),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: /review approvals/i }),
    );
    expect(onOpenHref).toHaveBeenCalledWith("/approvals");

    const approvals = document.getElementById("exec-approvals");
    expect(approvals).toBeTruthy();
    await user.click(
      within(approvals!).getByRole("button", { name: /collapse/i }),
    );
    expect(approvals).toHaveAttribute("data-collapsed", "true");
    await user.click(
      within(approvals!).getByRole("button", { name: /expand/i }),
    );
    expect(approvals).toHaveAttribute("data-collapsed", "false");

    await user.click(
      within(approvals!).getByRole("button", {
        name: /resize pending approvals widget/i,
      }),
    );
    expect(approvals).toHaveAttribute("data-col-span");

    expect(screen.getByText(/layout saved locally/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reset layout/i }));
  });

  it("renders loading skeleton", () => {
    render(<ExecutiveDashboard data={executiveDashboardFixture} loading />);
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
