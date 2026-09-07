import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IE_PROCESS_MEDIA } from "../../content/media-assets.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { IE_MARKET_RECORDS } from "../markets/index.js";
import { IeMarketsPage } from "./IeMarketsPage.js";

function renderMarkets() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/markets"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="markets" element={<IeMarketsPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-6 markets page", () => {
  it("renders hero, reach, coordination, destination flow, and data-ready state", () => {
    renderMarkets();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /connecting supply with buyer demand/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /international orientation, enquiry-led coverage/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^market coordination$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /buyer destination requirements/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /market information is being updated/i }),
    ).toBeInTheDocument();
    expect(document.querySelector(".hamd-aie-markets__globe")).not.toBeNull();
    expect(document.querySelector('.hamd-aie-markets__globe[aria-hidden="true"]')).not.toBeNull();
  });

  it("wires CTAs without inventing countries, flags, or coverage claims", () => {
    expect(IE_MARKET_RECORDS).toEqual([]);
    renderMarkets();
    expect(
      screen.getAllByRole("link", { name: /^Request a Quote$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /^Explore Commodities$/i }).some(
        (el) =>
          el.getAttribute("href") === "/businesses/almahbub-integrated-export/commodities",
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /see how the export process works/i }).some(
        (el) =>
          el.getAttribute("href") === "/businesses/almahbub-integrated-export/process",
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /quality & specification alignment/i }).some(
        (el) =>
          el.getAttribute("href") === "/businesses/almahbub-integrated-export/quality",
      ),
    ).toBe(true);
    expect(screen.queryByText(/\bUAE\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bUSA\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bUK\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bEurope\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/50\+\s*countries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/export worldwide/i)).not.toBeInTheDocument();
    expect(screen.getByAltText(IE_PROCESS_MEDIA.heroPort.alt)).toBeInTheDocument();
    expect(screen.queryByText(/representative imagery for illustration, not Almahbub facilities/i)).not.toBeInTheDocument();
  });
});
