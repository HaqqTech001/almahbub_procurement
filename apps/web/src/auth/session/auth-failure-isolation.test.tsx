import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider.js";
import { AuthApiError } from "../api/auth-errors.js";
import { setSessionHint, clearAccessToken } from "./token-store.js";
import { getLoginLockUntil, clearLoginFailures } from "./client-rate-limit.js";
const api = vi.hoisted(() => ({ loginRequest: vi.fn(), refreshRequest: vi.fn(), googleSignInRequest: vi.fn() }));
vi.mock("../api/auth-client.js", async (original) => ({ ...await original<object>(), ...api }));
vi.mock("../google/gis.js", async (original) => ({ ...await original<object>(), googleClientIdFromEnv: () => "" }));
let auth: ReturnType<typeof useAuth>;
function Probe() { auth = useAuth(); return null; }
beforeEach(() => { vi.clearAllMocks(); clearAccessToken(); setSessionHint(false); clearLoginFailures(); });
afterEach(() => { cleanup(); clearAccessToken(); setSessionHint(false); clearLoginFailures(); });
async function mount() { render(<AuthProvider><Probe /></AuthProvider>); await waitFor(() => expect(auth.bootstrapping).toBe(false)); }
it("page reload and refresh 403 never submit a password or lock the account", async () => {
 setSessionHint(true); api.refreshRequest.mockRejectedValue(new AuthApiError({ status: 403, code: "FORBIDDEN", message: "expired" }));
 await mount(); expect(api.refreshRequest).toHaveBeenCalled(); expect(api.loginRequest).not.toHaveBeenCalled();
 expect(auth.status).not.toBe("locked"); expect(getLoginLockUntil()).toBeNull();
});
it.each([new Error("network unavailable"), new AuthApiError({ status: 500, code: "INTERNAL_ERROR", message: "unavailable" }), new AuthApiError({ status: 429, code: "TOO_MANY_REQUESTS", message: "wait" })])("does not turn transport or IP errors into password locks", async (error) => {
 api.loginRequest.mockRejectedValue(error); await mount();
 await act(async () => { await expect(auth.login({ email: "buyer@example.com", password: "password", rememberMe: false })).rejects.toBe(error); });
 expect(auth.status).not.toBe("locked"); expect(getLoginLockUntil()).toBeNull();
});
it("Google errors never submit passwords or create a password cooldown", async () => {
 const error = new AuthApiError({ status: 401, code: "INVALID_GOOGLE_TOKEN", message: "invalid" }); api.googleSignInRequest.mockRejectedValue(error);
 await mount(); await act(async () => { await expect(auth.loginWithGoogle("bad-token")).rejects.toBe(error); });
 expect(api.loginRequest).not.toHaveBeenCalled(); expect(auth.status).not.toBe("locked"); expect(getLoginLockUntil()).toBeNull();
});
