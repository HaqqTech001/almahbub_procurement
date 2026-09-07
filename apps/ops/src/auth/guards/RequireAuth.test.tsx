import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { RequireAuth } from "./RequireAuth.js";

const useAuth = vi.fn();

vi.mock("../session/AuthProvider.js", () => ({
  useAuth: () => useAuth(),
}));

vi.mock("@hamd/ui/primitives", () => ({
  LoadingSkeleton: ({ height }: { height?: string }) => (
    <div data-testid="skeleton" style={{ height }} />
  ),
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <div>Protected</div>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ops RequireAuth", () => {
  it("sends anonymous users to login with returnTo, not Unauthorized", () => {
    useAuth.mockReturnValue({ status: "anonymous", bootstrapping: false });
    renderAt("/app/dashboard");
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized page")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    useAuth.mockReturnValue({ status: "authenticated", bootstrapping: false });
    renderAt("/app/dashboard");
    expect(screen.getByText("Protected")).toBeInTheDocument();
  });

  it("does not keep the skeleton after hydration if status is still booting", () => {
    useAuth.mockReturnValue({ status: "booting", bootstrapping: false });
    renderAt("/app/dashboard");
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Protected")).not.toBeInTheDocument();
  });
});
