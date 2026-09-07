import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../app/providers/AppProviders.js";
import { SpaLinkInterceptor } from "../app/SpaLinkInterceptor.js";
import { IntegratedExportLayout } from "../integrated-export/IntegratedExportLayout.js";
import { IeHomePage } from "../integrated-export/pages/IeHomePage.js";
import { IeCommoditiesPage } from "../integrated-export/pages/IeCommoditiesPage.js";
import { GroupPage } from "./GroupPage.js";
import { BusinessPage } from "./BusinessPage.js";

describe("group pages", () => {
  it("presents both businesses as separate companies", () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <GroupPage />
        </AppProviders>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Almahbub Group" })).toBeInTheDocument();
    expect(screen.getByText(/two distinct businesses/i)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Almahbub International" }).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("heading", { name: "Almahbub Integrated Export Ltd." }).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/parent group/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /enter business portal/i })).toBeInTheDocument();
    expect(screen.getAllByText(/part of almahbub group/i).length).toBeGreaterThan(0);
  });

  it("renders the Integrated Export portal foundation without catalogue checkout", () => {
    render(
      <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export"]}>
        <AppProviders>
          <Routes>
            <Route
              path="/businesses/almahbub-integrated-export"
              element={<IntegratedExportLayout />}
            >
              <Route index element={<IeHomePage />} />
              <Route path="commodities" element={<IeCommoditiesPage />} />
            </Route>
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: "Almahbub Integrated Export Ltd." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /integrated export/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /request a quote/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/add to cart/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not as self-serve checkout/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Sesame Seeds" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /no commodities published yet/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/powered by haqqtech/i)).toBeInTheDocument();
  });

  it("keeps International on the profile route", () => {
    render(
      <MemoryRouter initialEntries={["/businesses/almahbub-international"]}>
        <AppProviders>
          <Routes>
            <Route path="/businesses/:slug" element={<BusinessPage />} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Almahbub International" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /product catalogue/i })).toBeInTheDocument();
  });

  it("resolves the Group page Almahbub International button to the existing profile route", () => {
    render(
      <MemoryRouter initialEntries={["/group"]}>
        <AppProviders>
          <SpaLinkInterceptor>
            <Routes>
              <Route path="/group" element={<GroupPage />} />
              <Route path="/businesses/almahbub-international" element={<BusinessPage />} />
              <Route path="*" element={<h1>Page not found</h1>} />
            </Routes>
          </SpaLinkInterceptor>
        </AppProviders>
      </MemoryRouter>,
    );

    const heroCta = document.querySelector(
      ".hamd-page-hero a[href='/businesses/almahbub-international']",
    );
    expect(heroCta).toBeTruthy();
    expect(heroCta).toHaveAttribute("href", "/businesses/almahbub-international");

    fireEvent.click(heroCta!);

    expect(screen.queryByRole("heading", { name: /page not found/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /business not found/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Almahbub International" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /product catalogue/i })).toBeInTheDocument();
  });

  it("renders International on the static profile route without a :slug param", () => {
    render(
      <MemoryRouter initialEntries={["/businesses/almahbub-international"]}>
        <AppProviders>
          <Routes>
            <Route path="/businesses/almahbub-international" element={<BusinessPage />} />
            <Route path="*" element={<h1>Page not found</h1>} />
          </Routes>
        </AppProviders>
      </MemoryRouter>,
    );
    expect(screen.queryByRole("heading", { name: /page not found/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /business not found/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Almahbub International" })).toBeInTheDocument();
  });
});
