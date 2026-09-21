import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage.js";
import { AuthApiError } from "../api/auth-errors.js";
const { login, loginWithGoogle } = vi.hoisted(() => ({ login: vi.fn(), loginWithGoogle: vi.fn() }));
vi.mock("../session/AuthProvider.js", () => ({ useAuth: () => ({ login, loginWithGoogle, status: "anonymous", bootstrapping: false, lockUntil: null, rememberedEmail: "", rememberMe: false, googleSignInAvailable: true }) }));
vi.mock("../api/auth-client.js", () => ({ googleOAuthStatusRequest: async () => ({ enabled: true }) }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); });
it("shows a request countdown for 429 and automatically restores sign-in without account-lock navigation", async () => {
  vi.useFakeTimers();
  login.mockRejectedValue(new AuthApiError({ status: 429, code: "API_RATE_LIMITED", message: "requests", retryAfterSeconds: 50 }));
  render(<MemoryRouter><LoginPage /></MemoryRouter>);
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: "buyer@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "SecurePass1" } });
  await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Sign in" })); });
  expect(screen.getByText(/Try again in 50 seconds/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  act(() => { vi.advanceTimersByTime(50000); });
  expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
  expect(screen.queryByText(/Try again in/)).not.toBeInTheDocument();
  expect(login).toHaveBeenCalledTimes(1);
});

vi.mock("../google/GoogleSignInButton.js", () => ({
 GOOGLE_SIGN_IN_FAILURE: "Google sign-in failed",
 GoogleSignInButton: ({ onCredential }: { onCredential: (credential: string) => void }) => <button onClick={() => onCredential("token")}>Google sign in</button>,
}));
it("Google throttling has its own countdown and never disables password sign-in", async () => {
 vi.useFakeTimers();
 loginWithGoogle.mockRejectedValue(new AuthApiError({ status: 429, code: "AUTH_RATE_LIMITED", message: "requests", retryAfterSeconds: 50 }));
 await act(async () => { render(<MemoryRouter><LoginPage /></MemoryRouter>); });
 await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Google sign in" })); });
 expect(screen.getByText(/Google sign-in requests.*50 seconds/)).toBeInTheDocument();
 expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
 expect(login).not.toHaveBeenCalled();
 act(() => { vi.advanceTimersByTime(50000); });
 expect(screen.getByRole("button", { name: "Google sign in" })).toBeInTheDocument();
});
