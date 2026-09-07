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
