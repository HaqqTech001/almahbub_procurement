import { StrictMode } from "react";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider.js";
import { AuthApiError } from "../api/auth-errors.js";
import { setSessionHint, clearAccessToken, getAccessToken } from "./token-store.js";
import { getLoginLockUntil, clearLoginFailures } from "./client-rate-limit.js";
const api = vi.hoisted(() => ({ loginRequest: vi.fn(), refreshRequest: vi.fn(), googleSignInRequest: vi.fn(), meRequest: vi.fn(), logoutRequest: vi.fn() }));
vi.mock("../api/auth-client.js", async (original) => ({ ...await original<object>(), ...api }));
vi.mock("../google/gis.js", async (original) => ({ ...await original<object>(), googleClientIdFromEnv: () => "" }));
let auth: ReturnType<typeof useAuth>;
function Probe() { auth = useAuth(); return null; }
beforeEach(() => { vi.clearAllMocks(); clearAccessToken(); setSessionHint(false); clearLoginFailures(); });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); clearAccessToken(); setSessionHint(false); clearLoginFailures(); });
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

it("repeated login-page restoration under StrictMode never submits credentials", async () => {
 api.refreshRequest.mockRejectedValue(new AuthApiError({ status: 401, code: "INVALID_REFRESH_TOKEN", message: "expired" }));
 for (let i = 0; i < 3; i++) {
  setSessionHint(true);
  render(<StrictMode><AuthProvider><Probe /></AuthProvider></StrictMode>);
  await waitFor(() => expect(auth.bootstrapping).toBe(false));
  expect(api.loginRequest).not.toHaveBeenCalled();
  expect(getLoginLockUntil()).toBeNull();
  cleanup();
 }
});

const sessionUser = { id: "buyer", email: "buyer@example.com", displayName: "Buyer" };
function successfulSession(token: string) { return { accessToken: token, expiresIn: 3600, user: sessionUser, organizationId: "org" }; }
it("silently refreshes a server-rejected token even when locally considered fresh", async () => {
 api.meRequest.mockResolvedValue({ user: sessionUser, organizationId: "org", permissions: [] });
 api.loginRequest.mockResolvedValue(successfulSession("rejected")); api.refreshRequest.mockResolvedValue(successfulSession("fresh"));
 await mount(); await act(async () => { await auth.login({ email: "buyer@example.com", password: "test", rememberMe: false }); });
 const send = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({error:{code:"UNAUTHENTICATED"}}), {status:401})).mockResolvedValueOnce(new Response("{}", {status:201}));
 vi.stubGlobal("fetch", send);
 const { sessionFetch } = await import("./session-http.js");
 await act(async () => { expect((await sessionFetch("/api/v1/documents", {method:"POST",body:new FormData()})).status).toBe(201); });
 expect(api.refreshRequest).toHaveBeenCalledOnce(); expect(auth.status).toBe("authenticated"); expect(send).toHaveBeenCalledTimes(2);
});
it("restores a cookie session on reload and clears locally before sign-out completes", async () => {
 setSessionHint(true); api.refreshRequest.mockResolvedValue(successfulSession("restored"));
 api.meRequest.mockResolvedValue({ user: sessionUser, organizationId: "org", permissions: [] });
 await mount(); expect(auth.status).toBe("authenticated");
 let finish!: () => void; api.logoutRequest.mockImplementation(() => new Promise<void>(resolve => {finish=resolve;}));
 let pending!: Promise<void>; act(() => { pending=auth.logout(); });
 expect(getAccessToken()).toBeNull(); expect(auth.status).toBe("anonymous");
 await act(async () => { finish(); await pending; });
});

it("does not restore a revoked profile from a successful refresh payload", async () => {
 setSessionHint(true); api.refreshRequest.mockResolvedValue(successfulSession("revoked"));
 api.meRequest.mockRejectedValue(new AuthApiError({status:401,code:"SESSION_REVOKED",message:"revoked"}));
 await mount(); expect(auth.status).toBe("expired"); expect(getAccessToken()).toBeNull();
});
it("does not restore authentication when an in-flight refresh finishes after logout", async () => {
 api.meRequest.mockResolvedValue({user:sessionUser,organizationId:"org",permissions:[]});
 api.loginRequest.mockResolvedValue(successfulSession("original"));api.logoutRequest.mockResolvedValue(undefined);
 await mount();await act(async()=>{await auth.login({email:sessionUser.email,password:"test",rememberMe:false});});
 let finish!: (value: ReturnType<typeof successfulSession>) => void;
 api.refreshRequest.mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 let refreshing!: Promise<boolean>; act(()=>{refreshing=auth.refreshSession();});
 await waitFor(()=>expect(finish).toBeDefined());
 await act(async()=>{await auth.logout();finish(successfulSession("late"));expect(await refreshing).toBe(false);});
 expect(auth.status).toBe("anonymous");expect(getAccessToken()).toBeNull();
});
