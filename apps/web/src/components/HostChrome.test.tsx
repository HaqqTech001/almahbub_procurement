import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import {
  HostAlert,
  HostBackLink,
  HostLoading,
  HostStatus,
} from "./HostChrome.js";

describe("host chrome polish", () => {
  it("makes authentication failures actionable and preserves the destination", () => {
    render(<MemoryRouter initialEntries={["/app/requests/new?product=valves#delivery"]}>
      <HostAlert>Authentication is required.</HostAlert>
    </MemoryRouter>);
    expect(screen.getByRole("link", { name: "Continue to sign in" })).toHaveAttribute("href", "/login?returnTo=%2Fapp%2Frequests%2Fnew%3Fproduct%3Dvalves%23delivery");
  });
  it("offers support for permissions and a reload for recoverable reads", () => {
    render(<MemoryRouter><HostAlert>Access denied.</HostAlert><HostAlert>Unable to load requests.</HostAlert></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", "/contact");
    expect(screen.getByRole("button", { name: "Reload page" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /sign in/i })).toBeNull();
  });
  it("renders shared alert, status, loading, and back link landmarks", () => {
    render(
      <MemoryRouter>
        <HostAlert>Load failed</HostAlert>
        <HostStatus tone="success">Saved</HostStatus>
        <HostLoading label="Loading module…" />
        <HostBackLink to="/app">← Back</HostBackLink>
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Load failed");
    expect(screen.getByText("Saved")).toHaveAttribute("role", "status");
    expect(screen.getByText("Loading module…")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/app",
    );
  });
});
