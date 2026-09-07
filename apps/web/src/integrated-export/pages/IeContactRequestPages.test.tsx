import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { SITE } from "../../content/site.js";
import { IntegratedExportLayout } from "../IntegratedExportLayout.js";
import { IeContactPage } from "./IeContactPage.js";
import { IeRequestPage } from "./IeRequestPage.js";

function renderContact() {
  return render(
    <MemoryRouter initialEntries={["/businesses/almahbub-integrated-export/contact"]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="contact" element={<IeContactPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

function renderRequest(entry = "/businesses/almahbub-integrated-export/request") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AppProviders>
        <Routes>
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<IntegratedExportLayout />}
          >
            <Route path="request" element={<IeRequestPage />} />
          </Route>
        </Routes>
      </AppProviders>
    </MemoryRouter>,
  );
}

describe("IE-8 contact page", () => {
  it("renders hero and verified Group contact email", () => {
    renderContact();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /let's discuss your export requirement/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: SITE.contactEmail }).some((el) =>
        (el.getAttribute("href") ?? "").includes(`mailto:${SITE.contactEmail}`),
      ),
    ).toBe(true);
    expect(screen.queryByText(/export@almahbub\.com/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/reply within 24 hours/i)).not.toBeInTheDocument();
  });

  it("wires request CTA", () => {
    renderContact();
    expect(
      screen.getAllByRole("link", { name: /^Request a Quote$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          `/login?returnTo=${encodeURIComponent("/app/requests/new?lob=integrated_export")}`,
      ),
    ).toBe(true);
  });
});

describe("IE-8 request page", () => {
  it("renders form fields and validates without fake success or logging", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    renderRequest();

    expect(
      screen.getByRole("heading", { level: 1, name: /^request a quote$/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/company \/ buyer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commodity \/ requirement/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone \/ whatsapp/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /what happens next/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^submit enquiry$/i }));
    expect(screen.getByText(/enter your company or buyer name/i)).toBeInTheDocument();
    expect(screen.queryByText(/enquiry received #/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/request id/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/company \/ buyer name/i), {
      target: { value: "Acme Trading" },
    });
    fireEvent.change(screen.getByLabelText(/business email/i), {
      target: { value: "not-valid" },
    });
    fireEvent.change(screen.getByLabelText(/commodity \/ requirement/i), {
      target: { value: "Bulk agro need" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^submit enquiry$/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/business email/i), {
      target: { value: "buyer@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^submit enquiry$/i }));

    expect(
      screen.getByRole("heading", {
        name: /sign in to submit this enquiry/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /sign in to submit/i }),
    ).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fbusinesses%2Falmahbub-integrated-export%2Frequest",
    );
    expect(
      screen.getByRole("link", { name: /open email with your enquiry/i }),
    ).toHaveAttribute("href", expect.stringContaining(`mailto:${SITE.contactEmail}`));
    expect(screen.queryByText(/structured portal submission is not available yet/i)).not.toBeInTheDocument();
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it("does not prefill unpublished commodity slugs from the query string", () => {
    renderRequest(
      "/businesses/almahbub-integrated-export/request?commodity=sesame-seeds",
    );
    expect(screen.getByLabelText(/commodity \/ requirement/i)).toHaveValue("");
  });

  it("ignores invalid commodity query context and links contact / catalogue", () => {
    renderRequest(
      "/businesses/almahbub-integrated-export/request?commodity=not-a-real-ie-commodity",
    );
    expect(screen.queryByText(/requesting:/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /^Browse Commodities$/i }).some(
        (el) =>
          el.getAttribute("href") ===
          "/businesses/almahbub-integrated-export/commodities",
      ),
    ).toBe(true);
    expect(
      screen.getAllByRole("link", { name: /^Contact$/i }).some(
        (el) =>
          el.getAttribute("href") === "/businesses/almahbub-integrated-export/contact",
      ),
    ).toBe(true);
  });
});
