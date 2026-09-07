import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "./StatusBadge.js";

describe("StatusBadge", () => {
  it("stays content-sized with a semantic tone class", () => {
    const { container } = render(
      <StatusBadge status="published" label="Published" />,
    );
    const badge = container.querySelector(".hamd-badge");
    expect(badge).toHaveClass("hamd-badge--success");
    expect(badge).not.toHaveClass("hamd-badge--full");
    expect(getComputedStyle(badge!).width).not.toBe("100%");
  });

  it("keeps long labels inside the badge", () => {
    const { container } = render(
      <StatusBadge status="accepted_for_sourcing" label="Accepted for sourcing with a very long operational label" />,
    );
    const badge = container.querySelector(".hamd-badge");
    expect(badge?.textContent).toMatch(/Accepted for sourcing/);
  });
});
