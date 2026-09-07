import { describe, expect, it } from "vitest";

import { isPoolExhaustedError } from "./index.js";

describe("isPoolExhaustedError", () => {
  it("detects Supabase session pooler exhaustion", () => {
    expect(
      isPoolExhaustedError({
        code: "P2039",
        message:
          "(EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15",
      }),
    ).toBe(true);
    expect(isPoolExhaustedError({ code: "P1017", message: "closed" })).toBe(
      false,
    );
  });
});
