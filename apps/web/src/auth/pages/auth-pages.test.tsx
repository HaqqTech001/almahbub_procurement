import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AppProviders } from "../../app/providers/AppProviders.js";
import { AuthProvider } from "../session/AuthProvider.js";
import { LoginPage } from "./LoginPage.js";
import { RegisterPage } from "./RegisterPage.js";
import { ForgotPasswordPage } from "./ForgotPasswordPage.js";
import { OtpVerificationPage } from "./VerificationPages.js";
import { UnauthorizedPage } from "./StatusPages.js";
import { AuthApiError } from "../api/auth-errors.js";
import { clearAccessToken, setRememberMe } from "../session/token-store.js";
import { clearLoginFailures } from "../session/client-rate-limit.js";
import { clearTrustedDevices } from "../session/trusted-devices.js";
import {
  googleOAuthStatusRequest,
  googleSignInRequest,
  loginRequest,
  meRequest,
  registerRequest,
} from "../api/auth-client.js";
import { RequireAuth } from "../guards/RequireAuth.js";
import { resetGoogleIdentityLoaderForTests } from "../google/gis.js";
import { clearPendingGoogleCredential } from "../google/pending-credential.js";

vi.mock("../api/auth-client.js", () => ({
  loginRequest: vi.fn(),
  refreshRequest: vi.fn().mockRejectedValue(new Error("no session")),
  logoutRequest: vi.fn(),
  logoutEverywhereRequest: vi.fn(),
  meRequest: vi.fn(),
  validateRequest: vi.fn(),
  registerRequest: vi.fn(),
  forgotPasswordRequest: vi.fn().mockResolvedValue({ message: "ok" }),
  resetPasswordRequest: vi.fn(),
  verifyEmailRequest: vi.fn(),
  verifyOtpRequest: vi.fn().mockResolvedValue({
    email: "ada@example.com",
    status: "active",
    message: "verified",
  }),
  resendOtpRequest: vi.fn().mockResolvedValue({ message: "ok" }),
  googleOAuthStatusRequest: vi.fn().mockResolvedValue({ enabled: false }),
  googleOAuthStartUrl: vi.fn(() => "/api/v1/auth/google"),
  googleSignInRequest: vi.fn(),
}));

function installMockGis() {
  let callback: ((response: { credential?: string }) => void) | null = null;
  window.google = {
    accounts: {
      id: {
        initialize: (config) => {
          callback = config.callback;
        },
        renderButton: (parent, options) => {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent =
            options.text === "signup_with"
              ? "Sign up with Google"
              : "Sign in with Google";
          button.addEventListener("click", () => {
            callback?.({ credential: "aaa.bbb.ccc" });
          });
          parent.appendChild(button);
        },
      },
    },
  };
  return {
    cancel: () => {
      /* GIS does not invoke the callback when the chooser is dismissed. */
    },
  };
}

const sampleUser = {
  id: "u1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Buyer",
  displayName: null,
  locale: "en",
  timeZone: null,
};

function renderAuth(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/otp" element={<OtpVerificationPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/app"
              element={
                <RequireAuth>
                  <div>Workspace</div>
                </RequireAuth>
              }
            />
            <Route path="/app/requests" element={<div>Requests</div>} />
            <Route path="/rowdotul-hamd-26/live" element={<div>Wedding live</div>} />
          </Routes>
        </AuthProvider>
      </AppProviders>
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
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

describe("auth pages", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearAccessToken();
    clearLoginFailures();
    clearTrustedDevices();
    clearPendingGoogleCredential();
    resetGoogleIdentityLoaderForTests();
    delete window.google;
    setRememberMe(false);
    vi.unstubAllEnvs();
    vi.mocked(loginRequest).mockReset();
    vi.mocked(meRequest).mockReset();
    vi.mocked(googleSignInRequest).mockReset();
    vi.mocked(registerRequest).mockReset();
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: false });
  });

  it("renders the login experience", async () => {
    renderAuth("/login");
    expect(
      await screen.findByRole("heading", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in|continue|log in/i }),
    ).toBeInTheDocument();
  });

  it("blocks submit while invalid and shows field errors", async () => {
    renderAuth("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(vi.mocked(loginRequest)).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("shows a user-safe API error on invalid credentials", async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new AuthApiError({
        message: "Invalid email or password.",
        status: 401,
        code: "INVALID_CREDENTIALS",
      }),
    );
    renderAuth("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ada@example.com", "WrongPass1");
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("enters the workspace after a successful login", async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      user: sampleUser,
      organizationId: "org-1",
    });
    vi.mocked(meRequest).mockResolvedValue({
      user: sampleUser,
      organizationId: "org-1",
      permissions: ["request:read"],
    });
    renderAuth("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ada@example.com", "SecurePass1");
    expect(await screen.findByText("Workspace")).toBeInTheDocument();
  });

  it("sends unverified accounts to OTP instead of treating 403 as a generic failure", async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new AuthApiError({
        message: "Verify your email.",
        status: 403,
        code: "EMAIL_NOT_VERIFIED",
      }),
    );
    renderAuth("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ada@example.com", "SecurePass1");
    expect(
      await screen.findByRole("heading", { name: /enter verification code/i }),
    ).toBeInTheDocument();
  });

  it("does not send a forbidden 403 to OTP", async () => {
    vi.mocked(loginRequest).mockRejectedValue(
      new AuthApiError({
        message: "You do not have access.",
        status: 403,
        code: "FORBIDDEN",
      }),
    );
    renderAuth("/login");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ada@example.com", "SecurePass1");
    expect(await screen.findByText(/you do not have access/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /enter verification code/i }),
    ).not.toBeInTheDocument();
  });

  it("submits forgot password with enumeration-safe copy", async () => {
    renderAuth("/forgot-password");
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    expect(
      await screen.findByText(/if an account exists for that email/i),
    ).toBeInTheDocument();
  });

  it("verifies OTP and returns to login", async () => {
    renderAuth("/otp?email=ada@example.com");
    const first = await screen.findByLabelText("Digit 1 of 6");
    fireEvent.paste(first, {
      clipboardData: { getData: () => "123456" },
    } as unknown as ClipboardEvent);
    fireEvent.click(screen.getByRole("button", { name: /verify code/i }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument(),
    );
  });

  it("keeps protected workspace behind login", async () => {
    renderAuth("/app");
    expect(await screen.findByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.queryByText("Workspace")).not.toBeInTheDocument();
  });

  it("renders unauthorized status screen", async () => {
    renderAuth("/unauthorized");
    expect(
      await screen.findByRole("heading", { name: /unauthorized/i }),
    ).toBeInTheDocument();
  });

  it("keeps password login working when Google is configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: true });
    installMockGis();
    vi.mocked(loginRequest).mockResolvedValue({
      accessToken: "access-token",
      expiresIn: 900,
      user: sampleUser,
      organizationId: "org-1",
    });
    vi.mocked(meRequest).mockResolvedValue({
      user: sampleUser,
      organizationId: "org-1",
      permissions: ["request:read"],
    });
    renderAuth("/login?returnTo=/app/requests");
    await screen.findByRole("heading", { name: /sign in/i });
    submitLogin("ada@example.com", "SecurePass1");
    expect(await screen.findByText("Requests")).toBeInTheDocument();
  });

  it("signs in with Google and preserves a wedding returnTo including query", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: true });
    installMockGis();
    vi.mocked(googleSignInRequest).mockResolvedValue({
      accessToken: "google-access",
      expiresIn: 900,
      user: sampleUser,
      organizationId: "org-1",
    });
    vi.mocked(meRequest).mockResolvedValue({
      user: sampleUser,
      organizationId: "org-1",
      permissions: ["request:read"],
    });
    renderAuth("/login?returnTo=/rowdotul-hamd-26/live%3Fmode%3Dtest");
    const google = await screen.findByRole("button", {
      name: "Sign in with Google",
    });
    fireEvent.click(google);
    expect(await screen.findByText("Wedding live")).toBeInTheDocument();
    expect(googleSignInRequest).toHaveBeenCalledWith({
      credential: "aaa.bbb.ccc",
    });
  });

  it("does not show a scary error when the Google chooser is cancelled", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: true });
    const gis = installMockGis();
    renderAuth("/login");
    await screen.findByRole("button", { name: "Sign in with Google" });
    gis.cancel();
    expect(screen.queryByText(/couldn't sign you in/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    expect(googleSignInRequest).not.toHaveBeenCalled();
  });

  it("shows a friendly Google API failure and Try Again", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: true });
    installMockGis();
    vi.mocked(googleSignInRequest).mockRejectedValue(
      new AuthApiError({
        message: "boom",
        status: 500,
        code: "GOOGLE_OAUTH_FAILED",
      }),
    );
    renderAuth("/login");
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in with Google" }),
    );
    expect(
      await screen.findByText(/couldn't sign you in with google right now/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("sends email collision to OTP for safe Google linking", async () => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com");
    vi.mocked(googleOAuthStatusRequest).mockResolvedValue({ enabled: true });
    installMockGis();
    vi.mocked(googleSignInRequest).mockRejectedValue(
      new AuthApiError({
        message:
          "An Almahbub account already uses this email. Verify your account to connect Google and continue.",
        status: 409,
        code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
        details: [
          {
            field: "email",
            code: "GOOGLE_ACCOUNT_LINK_REQUIRED",
            message: "ada@example.com",
          },
        ],
      }),
    );
    renderAuth("/login");
    fireEvent.click(
      await screen.findByRole("button", { name: "Sign in with Google" }),
    );
    expect(
      await screen.findByText(/already uses this email/i),
    ).toBeInTheDocument();
  });

  it("keeps password registration working", async () => {
    vi.mocked(registerRequest).mockResolvedValue({
      status: "pending_verification",
      email: "ada@example.com",
      message: "Check your email",
    });
    renderAuth("/register");
    expect(
      await screen.findByRole("heading", { name: /create/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /first name/i })).toBeInTheDocument();
  });
});
