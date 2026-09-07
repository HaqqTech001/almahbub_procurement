import { describe, expect, it } from "vitest";
import { button, color } from "./index.js";

function luminance(hex: string): number {
  const raw = hex.replace("#", "");
  const n = Number.parseInt(raw, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("theme text contrast", () => {
  it("keeps primary text readable on dark surfaces", () => {
    expect(contrast(color.dark.textPrimary, color.dark.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.dark.textPrimary, color.dark.canvas)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.dark.textSecondary, color.dark.surface)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary text readable on light surfaces", () => {
    expect(contrast(color.light.textPrimary, color.light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(color.light.textPrimary, color.light.canvas)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("button state contrast", () => {
  const pairs: Array<[string, keyof typeof button.light, keyof typeof button.light]> = [
    ["primary", "primaryBg", "primaryText"],
    ["primary hover", "primaryHoverBg", "primaryHoverText"],
    ["secondary", "secondaryBg", "secondaryText"],
    ["secondary hover", "secondaryHoverBg", "secondaryHoverText"],
    ["outline hover", "outlineHoverBg", "outlineHoverText"],
    ["ghost hover", "ghostHoverBg", "ghostHoverText"],
    ["danger", "dangerBg", "dangerText"],
    ["danger hover", "dangerHoverBg", "dangerHoverText"],
  ];

  for (const theme of ["light", "dark"] as const) {
    it(`keeps ${theme} button labels readable on default and hover surfaces`, () => {
      const tokens = button[theme];
      for (const [label, bg, text] of pairs) {
        expect(contrast(tokens[bg], tokens[text]), `${theme} ${label}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
