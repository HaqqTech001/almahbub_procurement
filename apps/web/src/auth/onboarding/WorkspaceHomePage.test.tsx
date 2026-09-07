import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  WorkspaceHomePage,
  workspaceGivenName,
  workspaceGreeting,
} from "./WorkspaceHomePage.js";

const { ensureSession } = vi.hoisted(() => ({
  ensureSession: vi.fn(async () => "token"),
}));

vi.mock("../session/AuthProvider.js", () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      email: "abdullahi@example.com",
      firstName: "Abdullahi",
      displayName: "Abdullahi Musa",
    },
    ensureSession,
  }),
}));

vi.mock("../../procurement/procurement-api.js", () => ({
  requireProcurementToken: vi.fn(async () => "token"),
  listProcurementRequests: vi.fn(async () => [
    {
      id: "r-1",
      publicCode: "PR-1048",
      title: "Chest freezer",
      status: "needs_clarification",
      updatedAt: new Date().toISOString(),
    },
  ]),
}));

vi.mock("../../notifications/notification-api.js", () => ({
  requireNotificationToken: vi.fn(async () => "token"),
  listNotifications: vi.fn(async () => [
    {
      id: "n-1",
      type: "quotation",
      title: "Quotation available",
      body: "PR-1032",
      createdAt: new Date().toISOString(),
      status: "unread",
    },
  ]),
}));

vi.mock("../../quotations/quotation-api.js", () => ({
  listQuotations: vi.fn(async () => [{ id: "q1", status: "issued" }]),
}));

vi.mock("../../shipments/shipment-api.js", () => ({
  listShipments: vi.fn(async () => [{ id: "s1", status: "in_transit" }]),
}));

vi.mock("@hamd/ui/notifications", () => ({
  resolveNotificationHref: () => "/app/quotations/q1",
}));

describe("workspace greeting helpers", () => {
  it("uses the given name and time of day", () => {
    expect(workspaceGivenName({ firstName: "Abdullahi" })).toBe("Abdullahi");
    expect(workspaceGreeting(new Date("2026-09-02T08:00:00"))).toBe("Good morning");
  });
});

describe("WorkspaceHomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders compact stats, actions, and navigable activity", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <WorkspaceHomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Abdullahi")).toBeInTheDocument();
    expect(screen.getByLabelText("Procurement overview").querySelectorAll("a")).toHaveLength(4);
    expect(screen.getByRole("link", { name: /new request/i })).toHaveAttribute(
      "href",
      "/app/requests/new",
    );
    expect(screen.getByRole("link", { name: /^chat$/i })).toHaveAttribute("href", "/app/chat");

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /quotation available/i })).toHaveAttribute(
        "href",
        "/app/quotations/q1",
      );
    });
    expect(screen.queryByRole("list", { name: /recent/i })).not.toBeInTheDocument();
    expect(document.querySelector(".hamd-activity")).toBeTruthy();
    await user.click(screen.getByRole("link", { name: /view all/i }));
  });

  it("still renders dashboard actions when notifications fail", async () => {
    const notifications = await import("../../notifications/notification-api.js");
    vi.mocked(notifications.listNotifications).mockRejectedValueOnce(new Error("offline"));
    render(
      <MemoryRouter>
        <WorkspaceHomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /new request/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /browse products/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector(".hamd-activity")).toBeTruthy();
    });
  });
});
