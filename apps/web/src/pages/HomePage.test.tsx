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
      page: { hasMore: false },
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
      commodities: [
        {
          slug: "sesame-seeds",
          name: "Sesame Seeds",
          id: "sesame",
          heroMedia: { src: "/media/category-industrial.svg", alt: "Sesame Seeds" },
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
    const hero = document.querySelector(".commerce-hero")!;
    expect(within(hero).getByRole("link", { name: "Global Procurement" })).toHaveAttribute(
      "href",
      "#international",
    );
    expect(within(hero).getByRole("link", { name: "Nigerian Export" })).toHaveAttribute(
      "href",
      "#integrated-export",
    );
    expect(within(hero).queryByRole("heading", { name: "Almahbub International" })).toBeNull();
    expect(within(hero).queryByRole("heading", { name: "Almahbub Integrated Export" })).toBeNull();
    expect(within(hero).queryByRole("link", { name: "Explore International" })).toBeNull();
    expect(within(hero).queryByRole("link", { name: "Explore Integrated Export" })).toBeNull();
    const sections = document.querySelectorAll("main > section");
    expect(sections[1]).toHaveAttribute("id", "international");
    expect(sections[2]).toHaveAttribute("id", "integrated-export");
    expect(
      await screen.findByRole("link", { name: /Machinery/ }),
    ).toHaveAttribute("href", "/global-procurement/category/machineries");
    expect(
      within(
        screen.getByRole("list", { name: "Nigerian Export commodities" }),
      ).getByRole("link", { name: /Sesame Seeds/ }),
    ).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export/commodities/sesame-seeds",
    );
    expect(
      screen.getByRole("link", { name: "Explore Global Procurement" }),
    ).toHaveAttribute("href", "/businesses/almahbub-international");
    expect(
      screen.getByRole("link", { name: "Explore Nigerian Export" }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    expect(document.querySelector('a[href="/group"]')).toBeNull();
    expect(document.querySelector('[type="application/ld+json"]')).toBeTruthy();
  });
  it("keeps both business entries and request actions during a category outage", async () => {
    vi.mocked(listPublicCategories).mockRejectedValueOnce(new Error("offline"));
    renderHome();
    expect(
      await screen.findByRole("alert"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Explore Global Procurement" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request an export quotation" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Rowdotul HAMD'26/i)).toBeNull();
  });
  it("keeps service introductions free of logos and retains the full landing journey", async () => {
    renderHome();
    await screen.findByRole("list", { name: "Global Procurement categories" });
    for (const id of ["international", "integrated-export"]) {
      const section = document.getElementById(id)!;
      expect(section.querySelector(".commerce-business-logo")).toBeNull();
      expect(section.querySelector("h2")?.nextElementSibling).toHaveClass("commerce-lead");
      expect(section.querySelector("ul img")).not.toBeNull();
    }
    expect(screen.getByRole("heading", { name: "What Our Customers Say" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Common procurement questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tell us what you need." })).toBeInTheDocument();
    expect(document.querySelector(".hamd-why__grid")).not.toBeNull();
    expect(document.querySelectorAll(".hamd-why__card")).toHaveLength(4);
    expect(document.querySelector(".hamd-testimonials__viewport")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Next testimonial" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Do you publish live stock and checkout prices?" })).toHaveAttribute("aria-expanded", "true");
    const header = document.querySelector("header")!;
    expect(within(header).getByRole("link", { name: "Services", exact: true })).toHaveAttribute("href", "/services");
    expect(within(header).getByRole("link", { name: "Global Procurement", exact: true })).toHaveAttribute("href", "/businesses/almahbub-international");
    expect(document.querySelector("main")?.textContent).not.toMatch(/\u2014|\u00e2\u20ac\u201d/);
  });
});
