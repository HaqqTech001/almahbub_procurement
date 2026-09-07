import { describe, expect, it } from "vitest";

import { expandTourSelector, queryVisibleTourTarget } from "./tour-target.js";

describe("tour targeting", () => {
  it("adds a data-tour fallback beside data-guide", () => {
    expect(expandTourSelector("[data-guide='dashboard-nav']")).toBe(
      "[data-tour='dashboard-nav'], [data-guide='dashboard-nav']",
    );
  });

  it("skips closed-drawer and zero-size nodes", () => {
    document.body.innerHTML = `
      <aside class="hamd-client-shell__sidebar">
        <a data-tour="dashboard-nav" data-guide="dashboard-nav">Dashboard</a>
      </aside>
      <div class="hamd-client-shell__drawer">
        <a data-tour="dashboard-nav" data-guide="dashboard-nav">Hidden</a>
      </div>
    `;
    document.querySelectorAll("a").forEach((node) => {
      Object.defineProperty(node, "getBoundingClientRect", {
        value: () => ({ top: 10, left: 10, width: 80, height: 24, right: 90, bottom: 34 }),
      });
    });
    const found = queryVisibleTourTarget("[data-guide='dashboard-nav']");
    expect(found?.closest(".hamd-client-shell__sidebar")).toBeTruthy();
  });
});
