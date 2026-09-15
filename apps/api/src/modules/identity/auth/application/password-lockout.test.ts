import { describe, expect, it } from "vitest";
import { passwordLockUntil } from "./password-lockout.js";

describe("password cooldown boundaries", () => {
  const start = Date.parse("2026-09-15T10:00:00Z");
  const failures = Array.from({ length: 5 }, (_, i) => new Date(start + i * 1000));
  const expiry = start + 4000 + 900000;
  it.each([0, 1, 2, 3, 4])("does not lock below threshold (%i)", (count) => {
    expect(passwordLockUntil(failures.slice(0, count), new Date(start + 5000), 5, 900)).toBeNull();
  });
  it("anchors the threshold lock to the last genuine failure", () => {
    expect(passwordLockUntil(failures, new Date(start + 5000), 5, 900)?.getTime()).toBe(expiry);
    expect(passwordLockUntil(failures, new Date(expiry - 1), 5, 900)?.getTime()).toBe(expiry);
  });
  it("expires at the exact boundary and stays expired", () => {
    expect(passwordLockUntil(failures, new Date(expiry), 5, 900)).toBeNull();
    expect(passwordLockUntil(failures, new Date(expiry + 1000), 5, 900)).toBeNull();
  });
  it("starts a fresh sequence after expiry", () => {
    expect(passwordLockUntil([...failures, new Date(expiry)], new Date(expiry), 5, 900)).toBeNull();
  });
  it("compares absolute instants across timezone offsets", () => {
    expect(passwordLockUntil(failures, new Date("2026-09-15T11:15:04+01:00"), 5, 900)).toBeNull();
  });
});
