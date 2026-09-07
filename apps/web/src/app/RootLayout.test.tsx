import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { RootLayout } from "./RootLayout.js";
import { AppProviders } from "./providers/AppProviders.js";

describe("RootLayout global announcement", () => {
  it("mounts Rowdotul HAMD'26 once above public chrome and does not add a wedding CTA", async () => {
    render(
      <MemoryRouter>
        <AppProviders>
          <RootLayout>
            <p>Page body</p>
          </RootLayout>
        </AppProviders>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("region", { name: /site announcements/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Rowdotul HAMD'26/i).length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: /start a request/i }),
    ).not.toBeInTheDocument();
  });
});
