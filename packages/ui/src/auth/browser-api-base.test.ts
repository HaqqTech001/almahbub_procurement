import { describe, expect, it } from "vitest";

import {
  resolveBrowserApiBase,
  statusAfterFailedRefresh,
} from "./browser-api-base.js";

describe("resolveBrowserApiBase", () => {
  it("uses the Vite proxy for loopback API on another port", () => {
    expect(resolveBrowserApiBase("http://127.0.0.1:4000", "http://127.0.0.1:3000")).toBe(
      "",
    );
  });

  it("does not send a LAN page to the device's own localhost API", () => {
    expect(
      resolveBrowserApiBase("http://127.0.0.1:4000", "http://192.168.1.20:3000"),
    ).toBe("");
    expect(
      resolveBrowserApiBase("http://localhost:4000", "http://10.0.0.8:3001"),
    ).toBe("");
  });

  it("keeps a split production API host", () => {
    expect(
      resolveBrowserApiBase("https://api.example.com", "https://www.example.com"),
    ).toBe("https://api.example.com");
  });
});

describe("statusAfterFailedRefresh", () => {
  it("settles anonymous when CSRF/network refresh fails without an access token", () => {
    expect(
      statusAfterFailedRefresh({ kind: "transient", hasAccessToken: false }),
    ).toBe("anonymous");
  });

  it("keeps authenticated when a token exists and the failure is transient", () => {
    expect(
      statusAfterFailedRefresh({ kind: "transient", hasAccessToken: true }),
    ).toBe("authenticated");
  });

  it("settles anonymous when the refresh session is expired", () => {
    expect(
      statusAfterFailedRefresh({ kind: "expired", hasAccessToken: true }),
    ).toBe("anonymous");
  });
});
