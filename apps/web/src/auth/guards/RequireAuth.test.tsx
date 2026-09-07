import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen, waitFor } from "@testing-library/react";

import { RequireAuth } from "./RequireAuth.js";

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
    permissions: ["request:read", "request:create"],
  }),
}));

vi.mock("@hamd/ui/primitives", () => ({
  LoadingSkeleton: () => <div>loading</div>,
}));

function renderJourney(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
        <Route path="/session-expired" element={<div>Session expired page</div>} />
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <div>Client workspace</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth client journey", () => {
  beforeEach(() => {
    authState.status = "anonymous";
    authState.bootstrapping = false;
  });

  it("sends anonymous users to login with returnTo (not Unauthorized)", async () => {
    renderJourney("/app/requests");
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized page")).not.toBeInTheDocument();
  });

  it("allows authenticated clients into workspace routes", async () => {
    authState.status = "authenticated";
    renderJourney("/app/requests");
    expect(await screen.findByText("Client workspace")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized page")).not.toBeInTheDocument();
  });

  it("sends expired sessions to login with returnTo", async () => {
    authState.status = "expired";
    renderJourney("/app/requests");
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Client workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Session expired page")).not.toBeInTheDocument();
  });

  it("does not keep the skeleton after hydration if status is still booting", async () => {
    authState.bootstrapping = false;
    authState.status = "booting";
    renderJourney("/app/requests");
    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Client workspace")).not.toBeInTheDocument();
  });

  it("waits for auth hydration before deciding", async () => {
    authState.bootstrapping = true;
    authState.status = "booting";
    renderJourney("/app");
    expect(screen.getAllByText("loading").length).toBeGreaterThan(0);
    authState.bootstrapping = false;
    authState.status = "authenticated";
    renderJourney("/app");
    await waitFor(() => {
      expect(screen.getAllByText("Client workspace").length).toBeGreaterThan(0);
    });
  });
});
