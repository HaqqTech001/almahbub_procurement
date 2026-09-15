import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { IeHomePage } from "./pages/IeHomePage.js";
vi.mock("./commodities/use-published-ie-catalogue.js", () => ({
  usePublishedIeCommodities: () => ({
    previews: [],
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
}));
describe("Integrated Export home", () => {
  it("keeps commodity discovery and essential order guidance", () => {
    render(
      <MemoryRouter>
        <IeHomePage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Almahbub Integrated Export",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/current commodity availability/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Before you request a quotation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Request a Quote" }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export/request");
    expect(
      screen.queryByRole("heading", { name: /who we are|global markets/ }),
    ).toBeNull();
  });
});
