import { fireEvent, render, screen } from "@testing-library/react";
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
  it("uses icon navigation controls with accessible names, not Menu/Close text", () => {
    renderPortal();
    const open = screen.getByRole("button", { name: "Open navigation" });
    expect(open).toBeInTheDocument();
    expect(open).toHaveAttribute("title", "Open navigation");
    expect(open.textContent?.trim()).toBe("");
    expect(screen.queryByRole("button", { name: /^menu$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^close$/i })).not.toBeInTheDocument();

    fireEvent.click(open);
    const drawer = screen.getByRole("dialog", { name: /integrated export menu/i });
    expect(drawer).toBeVisible();
    const closeButtons = screen.getAllByRole("button", { name: "Close navigation" });
    expect(closeButtons.length).toBeGreaterThan(0);
    for (const button of closeButtons) {
      expect(button.textContent?.trim()).toBe("");
    }

    fireEvent.keyDown(window, { key: "Escape" });
    expect(drawer).not.toBeVisible();
  });

  it("sends Almahbub International brand links to the public profile, not home", () => {
    renderPortal();
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const links = screen.getAllByRole("link", { name: "Almahbub International" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/businesses/almahbub-international");
    }
  });
});
