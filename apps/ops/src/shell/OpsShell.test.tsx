import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { AdminShell } from "./AdminShell.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    status: "authenticated",
    user: {
      id: "u-1",
      email: "ops@almahbub.com",
      firstName: "Ops",
      lastName: "Admin",
      displayName: "Ops Admin",
    },
    permissions: ["ops:access", "audit:read"],
    logout: vi.fn(),
    ensureSession: vi.fn(async () => "token"),
  }),
}));

vi.mock("../content/campaigns.js", () => ({
  getActiveOpsCampaigns: () => [],
  opsCampaignSystem: { storagePrefix: "hamd.ops.campaign.dismissed." },
}));

describe("AdminShell", () => {
  it("renders a dedicated admin console, not customer workspace chrome", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<div>Dashboard body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/operations/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Almahbub Ops" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /^Dashboard$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Products$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Users$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Audit Log$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Invoices$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /^Payments$/i }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /Purchase Orders/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Inventory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Analytics/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Platform Settings/i })).not.toBeInTheDocument();
    expect(screen.getByText("Dashboard body")).toBeInTheDocument();
    expect(document.querySelector(".hamd-admin-shell")?.querySelectorAll(":scope > .hamd-admin-sidebar, :scope > .hamd-admin-frame, :scope > .hamd-admin-layer")).toHaveLength(3);
    expect(document.querySelector(".hamd-admin-frame")?.className).not.toMatch(/min-h-screen|h-screen/);
  });

  it("exposes a mobile menu trigger with aria-expanded", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AdminShell />}>
            <Route index element={<div>Dashboard body</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const trigger = screen.getByRole("button", { name: /open menu/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
