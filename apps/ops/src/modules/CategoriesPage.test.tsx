import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CategoriesPage } from "./CategoriesPage.js";
import { CategoryFormPage } from "./CategoryFormPage.js";

vi.mock("../auth/session/AuthProvider.js", () => ({
  useAuth: () => ({
    ensureSession: async () => "token",
    user: { email: "ops@example.com" },
    status: "authenticated",
  }),
}));

const fetchOpsCategories = vi.hoisted(() => vi.fn());
const createOpsCategory = vi.hoisted(() => vi.fn());

vi.mock("../api/ops-api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/ops-api.js")>();
  return {
    ...actual,
    requireToken: async () => "token",
    fetchOpsCategories,
    createOpsCategory,
    updateOpsCategory: vi.fn(),
    uploadOpsCategoryImage: vi.fn(),
  };
});

describe("ops categories page", () => {
  it("opens the create category form from the header action", async () => {
    fetchOpsCategories.mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/new" element={<CategoryFormPage />} />
          <Route path="/categories/:id" element={<div>Category detail</div>} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("button", { name: /create category/i });
    fireEvent.click(screen.getAllByRole("button", { name: /create category/i })[0]!);
    expect(await screen.findByRole("heading", { name: /create category/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
  });
});
