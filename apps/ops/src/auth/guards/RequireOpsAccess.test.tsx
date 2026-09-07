import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";

import { RequireOpsAccess } from "./RequireOpsAccess.js";

const useAuth = vi.fn();

vi.mock("../session/AuthProvider.js", () => ({
  useAuth: () => useAuth(),
}));

function renderGate(permissions: string[]) {
  useAuth.mockReturnValue({
    status: "authenticated",
    permissions,
  });
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireOpsAccess>
              <div>Ops console</div>
            </RequireOpsAccess>
          }
        />
        <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireOpsAccess", () => {
  it("allows users with ops:access", () => {
    renderGate(["ops:access", "request:read"]);
    expect(screen.getByText("Ops console")).toBeInTheDocument();
  });

  it("blocks authenticated buyers without ops:access", () => {
    renderGate(["request:read", "request:create", "quotation:read"]);
    expect(screen.getByText("Unauthorized page")).toBeInTheDocument();
    expect(screen.queryByText("Ops console")).not.toBeInTheDocument();
  });
});
