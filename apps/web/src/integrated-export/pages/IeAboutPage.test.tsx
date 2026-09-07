import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { IE_PROCESS_MEDIA } from "../../content/media-assets.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { IeAboutPage } from "./IeAboutPage.js";

function renderAbout() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/about"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="about" element={<IeAboutPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-7 about page", () => {
  it("renders hero, who we are, group relationship, focus, and how we work", () => {
    renderAbout();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /a dedicated business for agro commodity trade/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^who we are$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^part of almahbub group$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^integrated export focus$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^how we work$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /buyer-centered approach/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /what we help coordinate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/almahbub integrated export ltd\./i).length,
    ).toBeGreaterThan(0);
  });

  it("wires CTAs without inventing statistics, certifications, or testimonials", () => {
    renderAbout();
    expect(
      screen.getAllByRole("link", { name: /^Request a Quote$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
    expect(
      screen.getByRole("link", { name: /^Explore Our Process$/i }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export/process");
    expect(
      screen.getByRole("link", { name: /quality & specification alignment/i }),
    ).toHaveAttribute("href", "/businesses/almahbub-integrated-export/quality");
    expect(
      screen.getByRole("link", { name: /explore almahbub group/i }),
    ).toHaveAttribute("href", "/group");
    expect(
      screen.getByRole("link", { name: /explore almahbub international/i }),
    ).toHaveAttribute("href", "/businesses/almahbub-international");
    expect(screen.queryByText(/what our clients say/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/50\+\s*countries/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/15\+\s*years/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/iso\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/haccp/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trusted by thousands/i)).not.toBeInTheDocument();
    expect(screen.getByAltText(IE_PROCESS_MEDIA.sourcingBeans.alt)).toBeInTheDocument();
    expect(screen.queryByText(/representative imagery for illustration, not Almahbub facilities/i)).not.toBeInTheDocument();
  });
});
