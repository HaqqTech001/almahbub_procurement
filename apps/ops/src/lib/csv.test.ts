import { describe, expect, it } from "vitest";

import { escapeCsvCell, parseCsv, rowsToCsv } from "./csv.js";

describe("csv helpers", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('Acme, "Inc"')).toBe('"Acme, ""Inc"""');
    expect(escapeCsvCell("plain")).toBe("plain");
  });

  it("builds a header + body csv", () => {
    const csv = rowsToCsv(
      [
        { name: "Valve", status: "active" },
        { name: 'Pipe, "DN50"', status: "draft" },
      ],
      ["name", "status"],
    );
    expect(csv).toBe('name,status\nValve,active\n"Pipe, ""DN50""",draft');
  });

  it("parses quoted csv rows", () => {
    const rows = parseCsv('name,status\nValve,active\n"Pipe, ""DN50""",draft');
    expect(rows).toEqual([
      { name: "Valve", status: "active" },
      { name: 'Pipe, "DN50"', status: "draft" },
    ]);
  });
});
