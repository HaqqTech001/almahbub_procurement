import { describe, expect, it } from "vitest";

import { isAllowedDevelopmentBrowserOrigin } from "./dev-cors-origin.js";

describe("isAllowedDevelopmentBrowserOrigin", () => {
  it("allows loopback and private LAN origins", () => {
    expect(isAllowedDevelopmentBrowserOrigin("http://127.0.0.1:3000")).toBe(true);
    expect(isAllowedDevelopmentBrowserOrigin("http://192.168.1.20:3000")).toBe(true);
    expect(isAllowedDevelopmentBrowserOrigin("http://10.0.0.8:3001")).toBe(true);
  });

  it("rejects public internet origins", () => {
    expect(isAllowedDevelopmentBrowserOrigin("https://evil.example")).toBe(false);
    expect(isAllowedDevelopmentBrowserOrigin("http://8.8.8.8:3000")).toBe(false);
  });
});
