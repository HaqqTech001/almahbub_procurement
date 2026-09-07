import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SCAN_ROOTS = [
  join(ROOT, "apps/web/src"),
  join(ROOT, "apps/ops/src"),
  join(ROOT, "packages/ui/src"),
];
const ALLOWED_EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir: string, acc: string[]): void {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === "test-results") continue;
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, acc);
      continue;
    }
    const ext = name.slice(name.lastIndexOf("."));
    if (!ALLOWED_EXT.has(ext)) continue;
    if (/\.test\.(ts|tsx|js|jsx)$/.test(name)) continue;
    acc.push(full);
  }
}

function relativePath(file: string): string {
  return file.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, "");
}

function hitsFor(pattern: RegExp, files: string[]): string[] {
  const hits: string[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    if (pattern.test(text)) hits.push(relativePath(file));
  }
  return hits;
}

describe("native browser dialogs", () => {
  it("does not use window.alert, window.confirm, or window.prompt in production UI", () => {
    const files: string[] = [];
    for (const root of SCAN_ROOTS) walk(root, files);
    expect(hitsFor(/\bwindow\.alert\s*\(/, files)).toEqual([]);
    expect(hitsFor(/\bwindow\.confirm\s*\(/, files)).toEqual([]);
    expect(hitsFor(/\bwindow\.prompt\s*\(/, files)).toEqual([]);
  });

  it("does not call global alert, confirm, or prompt in production UI", () => {
    const files: string[] = [];
    for (const root of SCAN_ROOTS) walk(root, files);
    const blocked = [
      /(?<![.\w])alert\s*\(/,
      /(?<![.\w])confirm\s*\(/,
      /(?<![.\w])prompt\s*\(/,
    ];
    const hits: string[] = [];
    for (const file of files) {
      const relative = relativePath(file);
      if (relative.includes("OpsConfirmModal")) continue;
      const text = readFileSync(file, "utf8");
      if (blocked.some((pattern) => pattern.test(text))) hits.push(relative);
    }
    expect(hits).toEqual([]);
  });
});
