import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { LoginPage } from "./pages/LoginPage.js";
import { AuthProvider } from "./session/AuthProvider.js";
import { AuthApiError } from "./api/auth-errors.js";
import { loginRequest, meRequest } from "./api/auth-client.js";
import { RequireAuth } from "./guards/RequireAuth.js";
import { RequireOpsAccess } from "./guards/RequireOpsAccess.js";
import { clearAccessToken, setRememberMe } from "./session/token-store.js";
import { clearLoginFailures } from "./session/client-rate-limit.js";
import { clearTrustedDevices } from "./session/trusted-devices.js";

vi.mock("./api/auth-client.js", () => ({
  loginRequest: vi.fn(),
  refreshRequest: vi.fn().mockRejectedValue(new Error("no session")),
  logoutRequest: vi.fn(),
  logoutEverywhereRequest: vi.fn(),
  meRequest: vi.fn(),
  validateRequest: vi.fn(),
  forgotPasswordRequest: vi.fn(),
  resetPasswordRequest: vi.fn(),
  googleOAuthStatusRequest: vi.fn().mockResolvedValue({ enabled: false }),
  googleOAuthStartUrl: vi.fn(() => "/api/v1/auth/google"),
}));

const adminUser = {
  id: "admin-1",
  email: "ops@almahbub.com",
  firstName: "Ops",
  lastName: "Admin",
  displayName: null,
  locale: "en",
  timeZone: null,
};

function renderOps(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <RequireOpsAccess>
                  <div>Ops dashboard</div>
                </RequireOpsAccess>
              </RequireAuth>
            }
          />
          <Route path="/unauthorized" element={<div>Unauthorized page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

function submitLogin(email: string, password: string) {
  fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText(/^password$/i), {
    target: { value: password },
  });
  fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
}

describe("ops login", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAccessToken();
    clearLoginFailures();
    clearTrustedDevices();
    setRememberMe(false);
    vi.mocked(loginRequest).mockReset();
    vi.mocked(meRequest).mockReset();
  });

  it("waits for bootstrap then renders operations sign in", async () => {
    renderOps("/login");
    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/operations console/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /create an account/i })).not.toBeInTheDocument();
  });

  it("shows invalid credential errors without sending buyers to OTP", async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new AuthApiError({
        message: "Invalid email or password.",
        status: 401,
        code: "INVALID_CREDENTIALS",
      }),
    );
    renderOps("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ops@almahbub.com", "WrongPass1");
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it("opens the ops dashboard after a permitted login", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      user: adminUser,
      organizationId: "org-1",
    });
    vi.mocked(meRequest).mockResolvedValue({
      user: adminUser,
      organizationId: "org-1",
      permissions: ["ops:access", "audit:read"],
    });
    renderOps("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ops@almahbub.com", "SecurePass1");
    expect(await screen.findByText("Ops dashboard")).toBeInTheDocument();
  });

  it("blocks a signed-in buyer from the ops shell", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      user: adminUser,
      organizationId: "org-1",
    });
    vi.mocked(meRequest).mockResolvedValue({
      user: adminUser,
      organizationId: "org-1",
      permissions: ["request:read"],
    });
    renderOps("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("buyer@example.com", "SecurePass1");
    expect(await screen.findByText("Unauthorized page")).toBeInTheDocument();
    expect(screen.queryByText("Ops dashboard")).not.toBeInTheDocument();
  });
});
