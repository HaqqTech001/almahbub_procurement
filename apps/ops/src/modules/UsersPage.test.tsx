import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationsPage } from "./OrganizationsPage.js";
import { UserDetailPage } from "./UserDetailPage.js";
import { UsersPage } from "./UsersPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    permissions: ["ops:access"],
    user: { id: "admin-1", email: "ops@example.com" },
  }),
}));

const fetchOpsDirectory = vi.hoisted(() => vi.fn());

vi.mock("../api/ops-api.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    requireToken: async () => "token",
    fetchOpsDirectory,
  };
});

const member = {
  id: "m1",
  userId: "u1",
  email: "buyer@example.com",
  firstName: "Ada",
  lastName: "Buyer",
  status: "active",
  userStatus: "active",
  organizationName: "Ada Procurement",
  roles: [{ id: "r1", key: "buyer", name: "Buyer" }],
  requestCount: 2,
  createdAt: "2026-08-01T00:00:00.000Z",
  lastAuthenticatedAt: "2026-08-12T00:00:00.000Z",
};

describe("users directory", () => {
  beforeEach(() => {
    fetchOpsDirectory.mockReset();
  });

  it("renders a concise user list and opens profile detail", async () => {
    fetchOpsDirectory.mockResolvedValue({
      members: [member],
      organizations: [],
      page: { page: 1, pageSize: 25, total: 1, hasMore: false },
    });

    render(
      <MemoryRouter initialEntries={["/users"]}>
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/users/:userId" element={<UserDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect((await screen.findAllByText("Ada Buyer")).length).toBeGreaterThan(0);
    expect(screen.getByText("buyer@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Ada Procurement")).not.toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /open/i }));
    expect(await screen.findByRole("heading", { name: "Ada Buyer" })).toBeInTheDocument();
    expect(screen.getByText("AB")).toBeInTheDocument();
    expect(screen.getByText("Ada Procurement")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^suspend$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /grant operations access/i }),
    ).toBeInTheDocument();
  });

  it("renders organisations without slug dumps in the list", async () => {
    fetchOpsDirectory.mockResolvedValue({
      members: [],
      organizations: [
        {
          id: "o1",
          name: "Ada Procurement",
          slug: "ada-procurement",
          status: "active",
          memberCount: 2,
          createdAt: "2026-08-01T00:00:00.000Z",
        },
      ],
      page: { page: 1, pageSize: 100, total: 0, hasMore: false },
    });

    render(
      <MemoryRouter>
        <OrganizationsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ada Procurement")).toBeInTheDocument();
    expect(screen.queryByText("ada-procurement")).not.toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
  });
});
