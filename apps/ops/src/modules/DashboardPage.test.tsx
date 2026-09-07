import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpsApiError } from "../api/ops-api.js";
import { DashboardPage } from "./DashboardPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    user: { email: "ops@example.com", firstName: "Amina" },
    status: "authenticated",
    permissions: ["ops:access", "quotation:create", "cms:manage"],
  }),
}));

const fetchOpsDashboard = vi.hoisted(() => vi.fn());

vi.mock("../api/ops-api.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    requireToken: async () => "token",
    fetchOpsDashboard,
  };
});

describe("ops dashboard", () => {
  beforeEach(() => {
    fetchOpsDashboard.mockReset();
  });

  it("renders live KPI cards, attention, and does not invent fixture stats", async () => {
    fetchOpsDashboard.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      kpis: [
        { id: "kpi-published-products", label: "Published catalogue", value: "2", href: "/products" },
        { id: "kpi-orders", label: "Procurement requests", value: "4", href: "/requests" },
      ],
      attention: [
        {
          id: "attention-requests",
          label: "Procurement requests awaiting action",
          count: 3,
          href: "/requests?status=submitted",
        },
      ],
      requestPipeline: [
        { id: "submitted", label: "Submitted", count: 2, href: "/requests?status=submitted" },
        { id: "quoted", label: "Quoted", count: 1, href: "/requests?status=quote_issued" },
      ],
      catalogue: { published: 2, draft: 1, archived: 0 },
      quotationBreakdown: { issued: 1 },
      requestSeries: {
        "7d": [
          { date: "2026-08-07", count: 0 },
          { date: "2026-08-08", count: 2 },
        ],
        "30d": [],
        "90d": [],
      },
      recentProducts: [
        {
          id: "p1",
          name: "Hospital Beds",
          slug: "hospital-beds",
          status: "draft",
          categoryName: "Medical Equipments",
          updatedAt: new Date().toISOString(),
          href: "/products",
        },
      ],
      recentRequests: [],
      recentActivity: [],
      quickActions: [{ id: "qa-requests", label: "Review requests", href: "/requests" }],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Published catalogue")).toBeInTheDocument();
    expect(screen.getByText(/good (morning|afternoon|evening), amina/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /3\s+procurement requests awaiting action/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Hospital Beds")).toBeInTheDocument();
    expect(screen.queryByText(/showing fixtures/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/welcome admin/i)).not.toBeInTheDocument();
  });

  it("shows an empty attention state when nothing is queued", async () => {
    fetchOpsDashboard.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      kpis: [],
      attention: [],
      requestPipeline: [],
      recentProducts: [],
      recentRequests: [],
      recentActivity: [],
      quickActions: [],
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/you're all caught up/i)).toBeInTheDocument();
  });

  it("shows an error when the dashboard API fails", async () => {
    fetchOpsDashboard.mockRejectedValue(
      new OpsApiError("Unable to load dashboard.", 500, "INTERNAL_ERROR"),
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to load/i);
    expect(screen.queryByText(/showing fixtures/i)).not.toBeInTheDocument();
  });
});
