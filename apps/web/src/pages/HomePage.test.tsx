import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppProviders } from "../app/providers/AppProviders.js";
import { HomePage } from "./HomePage.js";
import { listPublicCategories } from "../api/catalog-api.js";
vi.mock("../api/catalog-api.js", () => ({
  listPublicCategories: vi
    .fn()
    .mockResolvedValue({
      data: [
        {
          slug: "machineries",
          name: "Machinery",
          imageUrl: "/media/category-industrial.svg",
        },
      ],
    }),
}));
vi.mock(
  "../integrated-export/commodities/use-published-ie-catalogue.js",
  () => ({
    usePublishedIeCommodities: () => ({
      previews: [
        {
          slug: "sesame-seeds",
          name: "Sesame Seeds",
          imageSrc: "/media/category-industrial.svg",
        },
      ],
      loading: false,
      error: null,
      retry: vi.fn(),
    }),
  }),
);
function renderHome() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <HomePage />
      </AppProviders>
    </MemoryRouter>,
  );
}
describe("HomePage business gateway", () => {
  it("introduces both operations immediately and links directly to catalogue records", async () => {
    renderHome();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Commerce Across Borders.",
    );
    const sections = document.querySelectorAll("main > section");
    expect(sections[1]).toHaveAttribute("id", "international");
    expect(sections[2]).toHaveAttribute("id", "integrated-export");
    expect(
      await screen.findByRole("link", { name: /Machinery Machinery/ }),
    ).toHaveAttribute("href", "/products?category=machineries");
    expect(
      within(
        screen.getByRole("list", { name: "Integrated Export commodities" }),
      ).getByRole("link"),
    ).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export/commodities/sesame-seeds",
    );
    expect(
      screen.getByRole("link", { name: "Explore International" }),
    ).toHaveAttribute("href", "/businesses/almahbub-international");
    expect(
      screen.getByRole("link", { name: "Explore Integrated Export" }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    expect(document.querySelector('a[href="/group"]')).toBeNull();
    expect(document.querySelector('[type="application/ld+json"]')).toBeTruthy();
  });
  it("keeps both business entries and request actions during a category outage", async () => {
    vi.mocked(listPublicCategories).mockRejectedValueOnce(new Error("offline"));
    renderHome();
    expect(
      await screen.findByText(/catalogue is temporarily unavailable/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explore International" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request an export quotation" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Rowdotul HAMD'26/i)).toBeNull();
  });
});
