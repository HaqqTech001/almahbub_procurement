import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import { RedirectIfAuthenticated } from "./RedirectIfAuthenticated.js";

const authState = vi.hoisted(() => ({
  status: "anonymous" as
    | "booting"
    | "anonymous"
    | "authenticated"
    | "expired"
    | "locked",
  bootstrapping: false,
}));

vi.mock("../session/AuthProvider.js", () => ({
  useAuth: () => ({
    status: authState.status,
    bootstrapping: authState.bootstrapping,
    user: authState.status === "authenticated" ? { id: "u1", email: "a@b.com" } : null,
  }),
}));

vi.mock("@hamd/ui/primitives", () => ({
  LoadingSkeleton: () => <div>loading</div>,
}));

function renderHome() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/app" element={<div>Workspace</div>} />
        <Route
          path="/"
          element={
            <RedirectIfAuthenticated>
              <div>Marketing home</div>
            </RedirectIfAuthenticated>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RedirectIfAuthenticated", () => {
  beforeEach(() => {
    authState.status = "anonymous";
    authState.bootstrapping = false;
  });

  it("shows children when anonymous", () => {
    renderHome();
    expect(screen.getByText("Marketing home")).toBeInTheDocument();
  });

  it("redirects authenticated users to /app", () => {
    authState.status = "authenticated";
    renderHome();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.queryByText("Marketing home")).not.toBeInTheDocument();
  });

  it("waits while session is booting", () => {
    authState.bootstrapping = true;
    authState.status = "booting";
    renderHome();
    expect(screen.getByText(/Checking session/i)).toBeInTheDocument();
  });

  it("renders public home if hydration finished without a session", () => {
    authState.bootstrapping = false;
    authState.status = "booting";
    renderHome();
    expect(screen.getByText("Marketing home")).toBeInTheDocument();
  });
});
