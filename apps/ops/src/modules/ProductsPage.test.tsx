import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpsApiError } from "../api/ops-api.js";
import { ProductsPage } from "./ProductsPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    user: { email: "ops@example.com" },
    status: "authenticated",
  }),
}));

const fetchOpsProducts = vi.hoisted(() => vi.fn());
const fetchOpsCategories = vi.hoisted(() => vi.fn());
const fetchOpsBrands = vi.hoisted(() => vi.fn());
const fetchOpsManufacturers = vi.hoisted(() => vi.fn());

vi.mock("../api/ops-api.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    requireToken: async () => "token",
    fetchOpsProducts,
    fetchOpsCategories,
    fetchOpsBrands,
    fetchOpsManufacturers,
  };
});

describe("ops products page", () => {
  beforeEach(() => {
    fetchOpsProducts.mockReset();
    fetchOpsCategories.mockReset();
    fetchOpsBrands.mockReset();
    fetchOpsManufacturers.mockReset();
  });

  it("shows live products and does not substitute fixtures", async () => {
    fetchOpsProducts.mockResolvedValue({
      data: [
        {
          id: "1",
          name: "Hospital Beds",
          slug: "hospital-beds",
          status: "draft",
          categoryName: "Medical Equipments",
        },
      ],
      page: { page: 1, pageSize: 25, total: 1, hasMore: false },
    });
    fetchOpsCategories.mockResolvedValue([]);
    fetchOpsBrands.mockResolvedValue([]);
    fetchOpsManufacturers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Hospital Beds")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hospital beds/i })).toHaveAttribute(
      "href",
      "/products/1",
    );
    expect(screen.queryByText(/showing catalog fixtures/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^draft$/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("shows an error and empty list when the API fails", async () => {
    fetchOpsProducts.mockRejectedValue(
      new OpsApiError("Unable to load products.", 500, "INTERNAL_ERROR"),
    );
    fetchOpsCategories.mockResolvedValue([]);
    fetchOpsBrands.mockResolvedValue([]);
    fetchOpsManufacturers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/unable to load products/i);
    expect(screen.queryByText(/fixtures/i)).not.toBeInTheDocument();
  });
});
