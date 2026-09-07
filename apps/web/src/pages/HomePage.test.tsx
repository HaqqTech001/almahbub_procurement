import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { AppProviders } from "../app/providers/AppProviders.js";
import { HomePage } from "./HomePage.js";

function renderHome() {
  return render(
    <MemoryRouter>
      <AppProviders>
        <HomePage />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("HomePage", () => {
  it(
    "renders the production Homepage shell with RC4.2 sections",
    async () => {
      renderHome();

      expect(await screen.findByTestId("homepage")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          name: /global procurement\. local accountability/i,
        }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole(
          "heading",
          { name: /why buyers choose almahbub/i },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole(
          "heading",
          { name: /what can we source for you/i },
          { timeout: 10_000 },
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /explore full catalogue/i })).toHaveAttribute(
        "href",
        "/products",
      );
      expect(screen.getAllByRole("link", { name: "Part of Almahbub Group" }).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: /explore our businesses/i })).toBeInTheDocument();
      expect(
        await screen.findByText(/current website/i, {}, { timeout: 10_000 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/explore our other business/i)).toBeInTheDocument();
      expect(screen.getByText(/interested in agro/i)).toBeInTheDocument();
      expect(
        await screen.findByRole("link", { name: /explore integrated export/i }, { timeout: 10_000 }),
      ).toHaveAttribute("href", "/businesses/almahbub-integrated-export");
      expect(document.querySelector(".hamd-business-relation")).toBeTruthy();
      expect(
        await screen.findByRole("heading", { name: "Almahbub Group" }, { timeout: 10_000 }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("heading", { name: "Almahbub Integrated Export Ltd." }).length,
      ).toBeGreaterThan(0);
      expect(document.querySelector(".hamd-group-structure")).toBeTruthy();
      expect(screen.getByText("Powered by HaqqTech")).toBeInTheDocument();
    },
    45_000,
  );
  it("does not duplicate the global Rowdotul HAMD'26 announcement inside the homepage body", async () => {
    renderHome();
    expect(await screen.findByTestId("homepage")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: /site announcements?/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Rowdotul HAMD'26/i)).not.toBeInTheDocument();
  });
});
