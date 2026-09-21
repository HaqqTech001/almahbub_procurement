import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../app/providers/AppProviders.js";
import { IntegratedExportLayout } from "./IntegratedExportLayout.js";
import { IeHomePage } from "./pages/IeHomePage.js";

function renderPortal() {
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

describe("Integrated Export layout chrome", () => {
  it("shares the public navbar, exact export identity and root Home", () => {
    renderPortal();
    const header = document.querySelector("header")!;
    expect(within(header).getByRole("link", { name: "Almahbub Integrated Export Ltd.", exact: true })).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
    expect(header.querySelector("img")).toHaveAttribute("src", "/media/brands/almahbub-integrated-export.jpg");
    expect(within(header).getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
    expect(within(header).getByRole("link", { name: "Global Procurement", exact: true })).toHaveAttribute("href", "/businesses/almahbub-international");
    const open = screen.getByRole("button", { name: "Open menu" });
    fireEvent.click(open);
    const drawer = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(drawer).toBeVisible();
    fireEvent.click(within(drawer).getByRole("button", { name: "Nigerian Export menu" }));
    expect(within(drawer).getByRole("link", { name: "Commodities", exact: true })).toHaveAttribute("href", "/businesses/almahbub-integrated-export/commodities");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(drawer).not.toBeVisible();
  });

  it("sends Almahbub International brand links to the public profile, not home", () => {
    renderPortal();
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const links = screen.getAllByRole("link", { name: "Almahbub International" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/businesses/almahbub-international");
    }
  });
});
