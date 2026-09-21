import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ProcurementCategoryPage } from "./ProcurementCategoryPage.js";
import { getPublicCategoryPreview } from "../api/catalog-api.js";
vi.mock("../api/catalog-api.js", () => ({
  getPublicCategoryPreview: vi.fn(),
  CatalogApiError: class extends Error {
    status = 404;
  },
}));
const category = {
  id: "c",
  slug: "office-business",
  name: "Office devices",
  description: "Stored category description",
  imageUrl: "/office.webp",
};
function renderPage(slug = "office-business") {
  return render(
    <MemoryRouter initialEntries={[`/global-procurement/category/${slug}`]}>
      <Routes>
        <Route
          path="/global-procurement/category/:slug"
          element={<ProcurementCategoryPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}
describe("category landing", () => {
  it("preserves canonical electronics filtering while the API retains the legacy category identity", async () => {
    vi.mocked(getPublicCategoryPreview).mockResolvedValue({
      category: { ...category, slug: "iphones-gadgets" },
      products: [],
      limit: 16,
    });
    renderPage("electronics-mobile-digital-technology");
    expect(
      await screen.findByRole("link", { name: "View More Products" }),
    ).toHaveAttribute(
      "href",
      "/products?category=electronics-mobile-digital-technology",
    );
    expect(getPublicCategoryPreview).toHaveBeenCalledWith(
      "electronics-mobile-digital-technology",
    );
  });
  it("uses category metadata, limits preview and preserves detail/filter links", async () => {
    vi.mocked(getPublicCategoryPreview).mockResolvedValue({
      category,
      limit: 16,
      products: Array.from({ length: 20 }, (_, index) => ({
        slug: `printer-${index}`,
        name: `Printer ${index}`,
        description: null,
        category,
        brandName: null,
        manufacturerName: null,
        images: [{ url: `/printer-${index}.png`, altText: null, position: 0 }],
        videos: [],
        variants: [],
      })),
    });
    renderPage();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Office devices" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Stored category description")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(16);
    expect(
      screen.getByRole("link", { name: "View More Products" }),
    ).toHaveAttribute("href", "/products?category=office-business");
    expect(screen.getByRole("link", { name: /Printer 0/ })).toHaveAttribute(
      "href",
      "/product/printer-0",
    );
    expect(getPublicCategoryPreview).toHaveBeenCalledWith("office-business");
    fireEvent.error(
      screen.getByRole("img", { name: "Printer 0", exact: true }),
    );
    expect(screen.queryByRole("link", { name: /Printer 0/ })).toBeNull();
  });
  it("offers sourcing when no approved media-backed products exist", async () => {
    vi.mocked(getPublicCategoryPreview).mockResolvedValue({
      category,
      products: [],
      limit: 16,
    });
    renderPage();
    expect(
      await screen.findByRole("link", { name: "Engage in Global Procurement" }),
    ).toHaveAttribute("href", "/app/requests/new");
    expect(screen.queryByRole("list")).toBeNull();
    expect(screen.queryByText(/placeholder/i)).toBeNull();
  });
});
