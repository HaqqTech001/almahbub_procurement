import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const opsCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../styles/ops.css"),
  "utf8",
);

describe("Ops Admin Chat workspace height", () => {
  it("does not size the chat host from content", () => {
    expect(opsCss).toMatch(
      /\.hamd-admin-main > \.hamd-ops-host:not\(\.hamd-list-queue\):not\(\.hamd-ops-procurement--queue\):not\(:has\(\.hamd-chat\)\)/,
    );
    expect(opsCss).toMatch(
      /\.hamd-admin-main:has\(\.hamd-ops-support:has\(\.hamd-chat\)\)/,
    );
    expect(opsCss).toMatch(
      /\.hamd-admin-main > \.hamd-ops-host\.hamd-ops-support:has\(\.hamd-chat\)/,
    );
    expect(opsCss).toMatch(/grid-template-columns:\s*320px minmax\(0,\s*1fr\)/);
    expect(opsCss).toMatch(/\.hamd-ops-support \.hamd-chat-room-list[\s\S]*overflow-y:\s*auto/);
    expect(opsCss).toMatch(/\.hamd-ops-support \.hamd-chat__messages[\s\S]*overflow-y:\s*auto/);
    expect(opsCss).toMatch(/\.hamd-ops-support \.hamd-chat__composer[\s\S]*margin-top:\s*auto/);
  });
});
