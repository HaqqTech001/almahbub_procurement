import { afterEach, describe, expect, it } from "vitest";

import {
  clearAccessToken,
  getCsrfToken,
  setAccessToken,
  setCsrfToken,
} from "./token-store.js";

describe("ops token store csrf", () => {
  afterEach(() => {
    clearAccessToken();
    sessionStorage.clear();
  });

  it("persists csrf across memory clear via sessionStorage", () => {
    setCsrfToken("csrf-from-login");
    expect(getCsrfToken()).toBe("csrf-from-login");
    expect(sessionStorage.getItem("hamd.ops.auth.csrf")).toBe("csrf-from-login");
  });

  it("clears csrf when the access token is cleared", () => {
    setAccessToken("token", 900);
    setCsrfToken("csrf-from-login");
    clearAccessToken();
    expect(getCsrfToken()).toBeNull();
  });
});
