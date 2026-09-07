import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IeCommoditiesPage } from "./IeCommoditiesPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    user: { email: "ops@example.com" },
    status: "authenticated",
    permissions: ["ops:access"],
  }),
}));

const listIeCommodities = vi.hoisted(() => vi.fn());
const getIeCommodity = vi.hoisted(() => vi.fn());

vi.mock("../api/ie-commodity-api.js", () => ({
  listIeCommodities,
  getIeCommodity,
  createIeCommodity: vi.fn(),
  updateIeCommodity: vi.fn(),
  archiveIeCommodity: vi.fn(),
}));

vi.mock("../api/ops-api.js", () => ({
  requireToken: async () => "token",
  OpsApiError: class OpsApiError extends Error {
    status: number;
    constructor(message: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
}));

describe("IE commodity Ops CMS", () => {
  beforeEach(() => {
    listIeCommodities.mockReset();
    getIeCommodity.mockReset();
    listIeCommodities.mockResolvedValue({
      data: [
        {
          id: "0190c8a0-1000-7000-8000-00000000c001",
          slug: "test-commodity-only",
          name: "TEST COMMODITY ONLY",
          published: false,
          category: null,
          shortDescription: null,
          heroMedia: null,
          sortOrder: 0,
        },
      ],
    });
  });

  it("lists API rows and does not hardcode sesame/cashew catalogue cards", async () => {
    render(
      <MemoryRouter initialEntries={["/integrated-export/commodities"]}>
        <Routes>
          <Route
            path="/integrated-export/commodities"
            element={<IeCommoditiesPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /^commodities$/i,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText("TEST COMMODITY ONLY")).toBeInTheDocument();
    expect(screen.queryByText(/sesame/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cashew/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create commodity/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /create commodity/i })).not.toBeInTheDocument();
  });

  it("opens the editor for a new draft without assigning stock photography", async () => {
    render(
      <MemoryRouter initialEntries={["/integrated-export/commodities/new"]}>
        <Routes>
          <Route
            path="/integrated-export/commodities/:id"
            element={<IeCommoditiesPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: /create commodity/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue("");
    expect(screen.queryByText(/unsplash|pexels|stock/i)).not.toBeInTheDocument();
    const heroInput = document.getElementById("ie-commodity-hero");
    expect(heroInput).toBeInstanceOf(HTMLInputElement);
    expect(heroInput).toHaveAttribute("type", "file");
    expect(heroInput?.closest(".hamd-entity-dropzone")).toBeTruthy();
  });
});
