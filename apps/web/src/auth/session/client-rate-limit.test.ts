import { afterEach, describe, expect, it, vi } from "vitest";
import { clearLoginFailures, getLoginLockUntil, rememberLoginLock } from "./client-rate-limit.js";
import { AuthApiError } from "../api/auth-errors.js";

afterEach(() => { clearLoginFailures(); vi.useRealTimers(); });
describe("server password cooldown", () => {
  it("recovers at the deadline across page reload reads", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-15T10:00:00Z"));
    const deadline = rememberLoginLock(900);
    expect(getLoginLockUntil()).toBe(deadline);
    vi.advanceTimersByTime(899999); expect(getLoginLockUntil()).toBe(deadline);
    vi.advanceTimersByTime(1); expect(getLoginLockUntil()).toBeNull();
  });
  it("clears stale legacy browser failure state", () => {
    localStorage.setItem("hamd.web.auth.loginAttempts", "stale");
    expect(getLoginLockUntil()).toBeNull();
    expect(localStorage.getItem("hamd.web.auth.loginAttempts")).toBeNull();
  });
  it("clears cooldown on successful authentication", () => {
    rememberLoginLock(900); clearLoginFailures(); expect(getLoginLockUntil()).toBeNull();
  });
  it.each([[403, "FORBIDDEN"], [500, "INTERNAL_ERROR"], [429, "TOO_MANY_REQUESTS"], [401, "INVALID_GOOGLE_TOKEN"]])("does not classify %s %s as a password lock", (status, code) => {
    expect(new AuthApiError({ status, code, message: "error" }).isLocked).toBe(false);
    expect(getLoginLockUntil()).toBeNull();
  });
  it("recognizes only explicit server account lock responses", () => {
    expect(new AuthApiError({ status: 423, code: "ACCOUNT_LOCKED", message: "locked" }).isLocked).toBe(true);
  });
});
