import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductFormPage } from "./ProductFormPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    user: { email: "ops@example.com" },
    status: "authenticated",
  }),
}));

const fetchOpsCategories = vi.hoisted(() => vi.fn());
const createOpsProduct = vi.hoisted(() => vi.fn());
const fetchOpsProduct = vi.hoisted(() => vi.fn());
const updateOpsProduct = vi.hoisted(() => vi.fn());

vi.mock("../api/ops-api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/ops-api.js")>();
  return {
    ...actual,
    requireToken: async () => "token",
    fetchOpsCategories,
    fetchOpsBrands: vi.fn().mockResolvedValue([]),
    fetchOpsManufacturers: vi.fn().mockResolvedValue([]),
    fetchOpsProduct,
    createOpsProduct,
    updateOpsProduct,
    uploadOpsProductImage: vi.fn(),
    uploadOpsProductVideo: vi.fn(),
    deleteOpsProductImage: vi.fn(),
    deleteOpsProductVideo: vi.fn(),
    setOpsProductImagePrimary: vi.fn(),
  };
});

describe("ProductFormPage", () => {
  beforeEach(() => {
    fetchOpsCategories.mockResolvedValue([{ id: "cat-1", name: "Valves" }]);
    createOpsProduct.mockResolvedValue({ id: "prod-1", name: "Gate valve", slug: "gate-valve" });
    fetchOpsProduct.mockResolvedValue({
      id: "prod-1",
      name: "Gate valve",
      slug: "gate-valve",
      status: "draft",
      categoryId: "cat-1",
      description: "Industrial valve",
      images: [],
      videos: [],
    });
    updateOpsProduct.mockResolvedValue({});
  });

  it("creates a product from grouped fields without a primary slug input", async () => {
    render(
      <MemoryRouter initialEntries={["/products/new"]}>
        <Routes>
          <Route path="/products/new" element={<ProductFormPage />} />
          <Route path="/products/:id" element={<p>Product detail</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: /create product/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/^slug$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/upload product media/i)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: /^product name$/i }), {
      target: { value: "Gate valve" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: /create product/i })[0]!);
    await waitFor(() =>
      expect(createOpsProduct).toHaveBeenCalledWith(
        "token",
        expect.objectContaining({ name: "Gate valve", status: "draft" }),
      ),
    );
  });

  it("loads existing product values on edit", async () => {
    render(
      <MemoryRouter initialEntries={["/products/prod-1/edit"]}>
        <Routes>
          <Route path="/products/:id/edit" element={<ProductFormPage />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByDisplayValue("Gate valve")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Industrial valve")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /edit product/i })).toBeInTheDocument();
  });
});
