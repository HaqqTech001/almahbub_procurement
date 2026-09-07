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
const ALLOWED_EXT = new Set([".ts", ".tsx", ".css", ".json"]);

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
    if (ALLOWED_EXT.has(ext)) acc.push(full);
  }
}

describe("user-facing copy", () => {
  it("does not use the em dash character", () => {
    const files: string[] = [];
    for (const root of SCAN_ROOTS) walk(root, files);
    const hits: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      if (text.includes("\u2014")) hits.push(file.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, ""));
    }
    expect(hits).toEqual([]);
  });

  it("does not put decorative emoji in interface source copy", () => {
    const files: string[] = [];
    for (const root of SCAN_ROOTS) walk(root, files);
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const allow = [
      "EnterpriseChat.tsx",
      "AnnouncementReplies.tsx",
      "WorkspaceAnnouncementDetailPage.tsx",
      "chat.test.tsx",
      "chat.css",
    ];
    const hits: string[] = [];
    for (const file of files) {
      if (allow.some((part) => file.includes(part))) continue;
      const text = readFileSync(file, "utf8");
      if (emoji.test(text)) hits.push(file.replace(`${ROOT}\\`, "").replace(`${ROOT}/`, ""));
    }
    expect(hits).toEqual([]);
  });
});
