import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsWorkspace } from "./AnalyticsWorkspace.js";
import { analyticsSnapshotFixture } from "./fixtures.js";
import {
  ANALYTICS_METRIC_KEYS,
  analyticsPeriodLabel,
  emptyAnalyticsFilters,
  filterAnalyticsMetrics,
} from "./types.js";

describe("analytics helpers", () => {
  it("covers all mission track metrics in fixtures", () => {
    const keys = new Set(analyticsSnapshotFixture.metrics.map((m) => m.key));
    for (const key of ANALYTICS_METRIC_KEYS) {
      expect(keys.has(key)).toBe(true);
    }
  });

  it("filters metrics by query", () => {
    expect(
      filterAnalyticsMetrics(analyticsSnapshotFixture.metrics, "revenue").map(
        (m) => m.key,
      ),
    ).toEqual(["revenue"]);
    expect(analyticsPeriodLabel("custom")).toBe("Custom range");
  });
});

describe("AnalyticsWorkspace", () => {
  it("renders metrics, period filters, export, and skip link", async () => {
    const user = userEvent.setup();
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onApplyFilters = vi.fn().mockResolvedValue(undefined);
    const onSelectMetric = vi.fn();

    render(
      <AnalyticsWorkspace
        snapshot={analyticsSnapshotFixture}
        onExport={onExport}
        onApplyFilters={onApplyFilters}
        onSelectMetric={onSelectMetric}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /enterprise analytics/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /skip to metric detail/i }),
    ).toHaveAttribute("href", "#hamd-an-detail");

    const grid = screen.getByLabelText(/tracked metrics/i);
    expect(
      within(grid).getByRole("button", { name: /visitors/i }),
    ).toBeInTheDocument();
    expect(
      within(grid).getByRole("button", { name: /customer satisfaction/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^weekly$/i }));
    await user.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(onApplyFilters).toHaveBeenCalledWith(
      expect.objectContaining({ period: "weekly" }),
    );

    await user.click(screen.getByRole("button", { name: /^csv$/i }));
    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "csv",
        filters: expect.objectContaining({ period: "weekly" }),
      }),
    );

    await user.click(within(grid).getByRole("button", { name: /revenue/i }));
    expect(onSelectMetric).toHaveBeenCalled();
    expect(document.querySelector('[aria-label="Revenue trend"]')).toBeTruthy();
  });

  it("renders loading skeleton", () => {
    render(
      <AnalyticsWorkspace
        snapshot={{ ...analyticsSnapshotFixture, metrics: [] }}
        loading
      />,
    );
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("supports controlled empty filters helper", () => {
    expect(emptyAnalyticsFilters().period).toBe("monthly");
  });
});
