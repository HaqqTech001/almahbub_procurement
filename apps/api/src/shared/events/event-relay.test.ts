import { describe, expect, it } from "vitest";

import { retryDelay } from "./event-relay.js";

describe("domain event retry policy", () => {
  it("increases delay exponentially with a bounded maximum", () => {
    expect(retryDelay(1)).toBe(2_000);
    expect(retryDelay(2)).toBe(4_000);
    expect(retryDelay(20)).toBe(256_000);
  });
});
