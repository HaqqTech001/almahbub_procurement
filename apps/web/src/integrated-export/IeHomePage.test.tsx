import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("./commodities/use-published-ie-catalogue.js", () => ({
  usePublishedIeCommodities: () => ({
    previews: [],
    commodities: [],
    source: "api",
    loading: false,
    error: null,
    retry: () => undefined,
  }),
}));

import { AppProviders } from "../app/providers/AppProviders.js";
import { IntegratedExportLayout } from "./IntegratedExportLayout.js";
import { getIeCommodityPreviews } from "./commodities/index.js";
import { IeHomePage } from "./pages/IeHomePage.js";

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route index element={<IeHomePage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-2 homepage", () => {
  it("renders approved hero heading, CTAs, and staged representative hero media", () => {
    renderHome();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Almahbub Integrated Export Ltd.",
      }),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".hamd-aie-home__lead")?.textContent,
    ).toMatch(/agro commodities, bulk supply, and export/i);
    const hero = screen.getByRole("img", {
      name: /agricultural produce arranged for commercial trade/i,
    });
    expect(hero).toHaveAttribute(
      "src",
      "/media/ie/process-sourcing-beans.jpg",
    );
    const explore = screen.getAllByRole("link", { name: /explore commodities/i });
    expect(explore.some((el) => el.getAttribute("href") === "/businesses/almahbub-integrated-export/commodities")).toBe(
      true,
    );
    const quote = screen.getAllByRole("link", { name: /request a quote/i });
    expect(
      quote.some((el) =>
        el.getAttribute("href") ===
        `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
  });

  it("shows an empty commodity preview without inventing prices or checkout", () => {
    expect(getIeCommodityPreviews()).toEqual([]);
    renderHome();
    expect(screen.queryByRole("link", { name: "Sesame Seeds" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Cashew" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it("renders process, quality, markets, and final CTA sections", () => {
    renderHome();
    expect(
      screen.getByRole("heading", { name: /from enquiry to export coordination/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quality guided by specification/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /learn about quality/i })).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export/quality",
    );
    expect(
      screen.getByRole("heading", { name: /connecting supply with buyer demand/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore global markets/i })).toHaveAttribute(
      "href",
      "/businesses/almahbub-integrated-export/markets",
    );
    expect(
      screen.getByRole("heading", { name: /have a sourcing requirement/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not as self-serve checkout/i)).toBeInTheDocument();
  });
});
