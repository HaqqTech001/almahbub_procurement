import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";

import { SpaLinkInterceptor } from "./SpaLinkInterceptor.js";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{`${location.pathname}${location.search}`}</div>;
}

function renderWithInterceptor(ui: ReactNode, path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SpaLinkInterceptor>
        <LocationProbe />
        {ui}
        <Routes>
          <Route path="/" element={<div>home</div>} />
          <Route path="/products" element={<div>products</div>} />
          <Route path="/about" element={<div>about</div>} />
          <Route
            path="/businesses/almahbub-integrated-export"
            element={<div data-testid="aie-portal">portal</div>}
          />
          <Route
            path="/businesses/almahbub-integrated-export/commodities"
            element={<div data-testid="aie-commodities">commodities</div>}
          />
          <Route path="/businesses/:slug" element={<div data-testid="business-profile">profile</div>} />
        </Routes>
      </SpaLinkInterceptor>
    </MemoryRouter>,
  );
}

describe("SpaLinkInterceptor", () => {
  it("navigates internal anchors without a full document load", () => {
    renderWithInterceptor(<a href="/products">Products</a>);

    fireEvent.click(screen.getByRole("link", { name: "Products" }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/products");
    expect(screen.getByText("products")).toBeInTheDocument();
  });

  it("preserves query strings on internal links", () => {
    renderWithInterceptor(<a href="/products?q=steel">Search steel</a>);

    fireEvent.click(screen.getByRole("link", { name: "Search steel" }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/products?q=steel");
  });

  it("opens the Integrated Export portal instead of a generic business profile", () => {
    renderWithInterceptor(
      <a href="/businesses/almahbub-integrated-export">Almahbub Integrated Export Ltd.</a>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Almahbub Integrated Export Ltd." }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/businesses/almahbub-integrated-export");
    expect(screen.getByTestId("aie-portal")).toBeInTheDocument();
    expect(screen.queryByTestId("business-profile")).not.toBeInTheDocument();
  });

  it("rewrites legacy IE hash links to multi-page routes", () => {
    renderWithInterceptor(
      <a href="/businesses/almahbub-integrated-export#commodities">Commodities</a>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Commodities" }));
    expect(screen.getByTestId("loc")).toHaveTextContent(
      "/businesses/almahbub-integrated-export/commodities",
    );
    expect(screen.getByTestId("aie-commodities")).toBeInTheDocument();
  });

  it("does not intercept external, mailto, or new-tab links", () => {
    renderWithInterceptor(
      <div>
        <a href="https://example.com">External</a>
        <a href="mailto:procurement@almahbub.com">Email</a>
        <a href="/about" target="_blank">
          New tab
        </a>
      </div>,
    );

    fireEvent.click(screen.getByRole("link", { name: "External" }));
    fireEvent.click(screen.getByRole("link", { name: "Email" }));
    fireEvent.click(screen.getByRole("link", { name: "New tab" }));
    expect(screen.getByTestId("loc")).toHaveTextContent("/");
  });
});
