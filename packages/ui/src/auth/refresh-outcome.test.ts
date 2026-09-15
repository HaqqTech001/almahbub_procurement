import { describe, expect, it } from "vitest";

import {
  classifyRefreshFailure,
  isTerminalRefreshFailure,
} from "./refresh-outcome.js";

describe("refresh failure classification", () => {
  it("treats invalid refresh as terminal", () => {
    expect(
      isTerminalRefreshFailure({ status: 401, code: "INVALID_REFRESH_TOKEN" }),
    ).toBe(true);
    expect(classifyRefreshFailure({ status: 401, code: "SESSION_REVOKED" })).toBe(
      "expired",
    );
  });

  it("does not treat network, CSRF, 429, or 500 as logout", () => {
    expect(isTerminalRefreshFailure({ status: 0, code: "NETWORK_ERROR" })).toBe(
      false,
    );
    expect(
      isTerminalRefreshFailure({ status: 403, code: "CSRF_VALIDATION_FAILED" }),
    ).toBe(false);
    expect(isTerminalRefreshFailure({ status: 403, code: "FORBIDDEN" })).toBe(true);
    expect(isTerminalRefreshFailure({ status: 429, code: "TOO_MANY_REQUESTS" })).toBe(
      false,
    );
    expect(isTerminalRefreshFailure({ status: 500, code: "INTERNAL_ERROR" })).toBe(
      false,
    );
    expect(isTerminalRefreshFailure({ name: "AbortError" })).toBe(false);
  });
});
