import { describe, expect, it } from "vitest";

import { makeInitials } from "./makeInitials.js";

describe("makeInitials", () => {
  it("uses the first letter of the first two words", () => {
    expect(makeInitials("Al-Imam Ala-Mujahid")).toBe("AA");
    expect(makeInitials("Almahbub Trading Company")).toBe("AT");
    expect(makeInitials("Abdullahi Abdullateef")).toBe("AA");
  });

  it("falls back to the first two characters of a single token", () => {
    expect(makeInitials("Ada")).toBe("AD");
  });
});
