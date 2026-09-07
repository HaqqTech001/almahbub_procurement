import { describe, expect, it } from "vitest";

import { escapeCsvCell, rowsToCsv } from "./export.js";

describe("export csv (compat)", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('Acme, "Inc"')).toBe('"Acme, ""Inc"""');
  });

  it("builds csv via re-export", () => {
    expect(rowsToCsv([{ a: 1 }], ["a"])).toBe("a\n1");
  });
});
