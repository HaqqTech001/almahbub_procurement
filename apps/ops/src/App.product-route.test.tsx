import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "App.tsx"),
  "utf8",
);

describe("ops product routes", () => {
  it("registers product detail at /products/:id instead of falling through to the dashboard", () => {
    expect(appSource).toMatch(/path="\/products\/:id"/);
    expect(appSource).toMatch("ProductDetailPage");
    expect(appSource).toMatch(/path="\/products\/:id\/edit"/);
    const detailIndex = appSource.indexOf('path="/products/:id"');
    const wildcardIndex = appSource.indexOf('path="*"');
    expect(detailIndex).toBeGreaterThan(-1);
    expect(wildcardIndex).toBeGreaterThan(detailIndex);
  });
});
