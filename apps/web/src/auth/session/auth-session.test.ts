import { describe, expect, it, beforeEach } from "vitest";

import {
  clearLoginFailures,
  getLoginLockUntil,
  isLoginLocked,
  recordLoginFailure,
} from "./client-rate-limit.js";
import {
  clearAccessToken,
  getAccessToken,
  getCsrfToken,
  setAccessToken,
  setCsrfToken,
  setRememberMe,
  getRememberMe,
  getRememberedEmail,
} from "./token-store.js";
import {
  clearTrustedDevices,
  listTrustedDevices,
  trustCurrentDevice,
  revokeOtherTrustedDevices,
} from "./trusted-devices.js";

describe("auth token store", () => {
  beforeEach(() => {
    clearAccessToken();
    setRememberMe(false);
    window.localStorage.clear();
  });

  it("keeps access tokens in memory only", () => {
    setAccessToken("token-abc", 900);
    expect(getAccessToken()).toBe("token-abc");
    expect(window.localStorage.getItem("accessToken")).toBeNull();
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it("persists remember-me preference without storing secrets", () => {
    setRememberMe(true, "buyer@almahbub.com");
    expect(getRememberMe()).toBe(true);
    expect(getRememberedEmail()).toBe("buyer@almahbub.com");
  });

  it("keeps the CSRF token across browser restarts", () => {
    setCsrfToken("csrf-keep");
    expect(window.localStorage.getItem("hamd.web.auth.csrf")).toBe("csrf-keep");
    expect(getCsrfToken()).toBe("csrf-keep");
    setCsrfToken(null);
    expect(window.localStorage.getItem("hamd.web.auth.csrf")).toBeNull();
  });

  it("prefers the current browser cookie over stale local CSRF state", () => {
    document.cookie = "hamd_csrf=server-cookie; path=/;";
    setCsrfToken("stale-local-token");
    expect(getCsrfToken()).toBe("server-cookie");
    document.cookie = "hamd_csrf=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    setCsrfToken(null);
  });
});

describe("client login rate limit", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearLoginFailures();
  });

  it("locks after repeated failures", () => {
    for (let i = 0; i < 4; i += 1) {
      expect(recordLoginFailure().locked).toBe(false);
    }
    const result = recordLoginFailure();
    expect(result.locked).toBe(true);
    expect(isLoginLocked()).toBe(true);
    expect(getLoginLockUntil()).toBeTypeOf("number");
  });
});

describe("trusted devices", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearTrustedDevices();
  });

  it("registers and lists the current device", () => {
    trustCurrentDevice();
    const devices = listTrustedDevices();
    expect(devices.length).toBe(1);
    expect(devices[0]?.current).toBe(true);
    revokeOtherTrustedDevices();
    expect(listTrustedDevices().length).toBe(1);
  });
});
