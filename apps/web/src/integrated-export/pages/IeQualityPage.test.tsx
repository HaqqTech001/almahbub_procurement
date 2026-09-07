import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IE_PROCESS_MEDIA } from "../../content/media-assets.js";
import { IE_COMMODITY_RECORDS } from "../commodities/index.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { IeQualityPage } from "./IeQualityPage.js";

function renderQuality() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/quality"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="quality" element={<IeQualityPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-5 quality page", () => {
  it("renders hero, approach, specification, documentation, and destination sections", () => {
    renderQuality();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /quality guided by specification/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /how quality relates to your requirement/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^specification alignment$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^quality & specification alignment$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^documentation$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /destination requirements/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /help us understand your requirement/i }),
    ).toBeInTheDocument();
  });

  it("wires request and process CTAs without inventing certifications or countries", () => {
    expect(IE_COMMODITY_RECORDS).toHaveLength(0);
    renderQuality();
    expect(
      screen.getAllByRole("link", { name: /^Request a Quote$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /see how the export process works/i }).some(
        (el) =>
          el.getAttribute("href") === "/businesses/almahbub-integrated-export/process",
      ),
    ).toBe(true);
    expect(screen.queryByText(/iso\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/haccp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/nafdac/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/our certifications/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bUAE\b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\bEurope\b/i)).not.toBeInTheDocument();
    expect(screen.getByAltText(IE_PROCESS_MEDIA.qualityBeans.alt)).toBeInTheDocument();
    expect(screen.queryByText(/representative imagery for illustration, not Almahbub facilities/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sesame Seeds" })).not.toBeInTheDocument();
  });
});
