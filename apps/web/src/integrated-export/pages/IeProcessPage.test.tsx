import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IE_PROCESS_MEDIA } from "../../content/media-assets.js";
import { IE_COMMODITY_RECORDS } from "../commodities/index.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { IeProcessPage } from "./IeProcessPage.js";

function renderProcess() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/process"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="process" element={<IeProcessPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-4 process page", () => {
  it("renders approved process stages and CTAs", () => {
    renderProcess();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /from enquiry to export coordination/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /buyer enquiry/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /sourcing & coordination/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /logistics planning/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /^Request a Quote$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /explore commodities/i }).some(
        (el) =>
          el.getAttribute("href") ===
          "/businesses/almahbub-integrated-export/commodities",
      ),
    ).toBe(true);
  });

  it("uses representative media without inventing commodities or facilities", () => {
    expect(IE_COMMODITY_RECORDS).toHaveLength(0);
    renderProcess();
    expect(screen.getByAltText(IE_PROCESS_MEDIA.heroPort.alt)).toBeInTheDocument();
    expect(screen.queryByText(/representative imagery for illustration, not Almahbub facilities/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/this is almahbub's facility/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sesame/i)).not.toBeInTheDocument();
    expect(IE_PROCESS_MEDIA.heroPort.kind).toBe("representative");
  });
});
