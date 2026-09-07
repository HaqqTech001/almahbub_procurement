import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button.js";
import { IconButton } from "./IconButton.js";

const foundationCss = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../styles/foundation.css"),
  "utf8",
);

describe("ButtonStates fixture", () => {
  it("exposes every shared variant for default, disabled, and loading", () => {
    render(
      <div data-testid="hamd-button-states">
        {(["primary", "secondary", "outline", "ghost", "destructive", "link"] as const).map((variant) => (
          <div key={variant} data-variant={variant}>
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} disabled>
              {variant} disabled
            </Button>
            <Button variant={variant} aria-busy="true">
              {variant} loading
            </Button>
          </div>
        ))}
        <IconButton label="More">
          <span aria-hidden="true">···</span>
        </IconButton>
      </div>,
    );

    const fixture = screen.getByTestId("hamd-button-states");
    expect(fixture.querySelectorAll(".hamd-btn--primary")).toHaveLength(3);
    expect(fixture.querySelectorAll(".hamd-btn--secondary")).toHaveLength(3);
    expect(fixture.querySelectorAll(".hamd-btn--outline")).toHaveLength(3);
    expect(fixture.querySelectorAll(".hamd-btn--ghost")).toHaveLength(3);
    expect(fixture.querySelectorAll(".hamd-btn--destructive")).toHaveLength(3);
    expect(fixture.querySelectorAll(".hamd-btn--link")).toHaveLength(3);
    expect(fixture.querySelector(".hamd-icon-btn")).toHaveAttribute("aria-label", "More");
    expect(fixture.querySelectorAll("[aria-busy='true']")).toHaveLength(6);
  });

  it("pairs hover background and text tokens in the shared button system", () => {
    const required = [
      "--hamd-btn-primary-hover-bg",
      "--hamd-btn-primary-hover-text",
      "--hamd-btn-secondary-hover-bg",
      "--hamd-btn-secondary-hover-text",
      "--hamd-btn-outline-hover-bg",
      "--hamd-btn-outline-hover-text",
      "--hamd-btn-ghost-hover-bg",
      "--hamd-btn-ghost-hover-text",
      "--hamd-btn-danger-hover-bg",
      "--hamd-btn-danger-hover-text",
    ];
    for (const token of required) {
      expect(foundationCss).toContain(token);
    }
    expect(foundationCss).toMatch(/\.hamd-btn--secondary:hover[\s\S]*color:\s*var\(--hamd-btn-secondary-hover-text\)/);
    expect(foundationCss).toMatch(/\.hamd-btn--outline:hover[\s\S]*color:\s*var\(--hamd-btn-outline-hover-text\)/);
    expect(foundationCss).toMatch(/\.hamd-btn--ghost:hover[\s\S]*color:\s*var\(--hamd-btn-ghost-hover-text\)/);
    expect(foundationCss).not.toMatch(/\.hamd-btn--primary:hover[\s\S]{0,180}filter:\s*brightness/);
  });
});
