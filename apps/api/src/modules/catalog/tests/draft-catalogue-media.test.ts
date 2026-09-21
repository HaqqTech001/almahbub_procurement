import { describe, expect, it } from "vitest";
import {
  electronicsDraftPrompt,
  validateGeneratedPng,
  generateApprovedDraft,
} from "../media/draft-catalogue-media.js";
import { resolveCategorySlug } from "../application/category-alias.js";
describe("controlled P1 drafts", () => {
  it("rejects batch generation and ambiguous targets before database access", async () => {
    await expect(
      generateApprovedDraft(["--draft-product=one", "--limit=20"]),
    ).rejects.toThrow("One explicit");
    await expect(
      generateApprovedDraft(["--draft-product=one", "--draft-product=two"]),
    ).rejects.toThrow("One explicit");
  });
  it("never constructs branded lookalike prompts", () => {
    expect(electronicsDraftPrompt("Apple iPhone 17")).toBeNull();
    expect(electronicsDraftPrompt("Wireless Earbuds")).toContain(
      "not Apple AirPods",
    );
    expect(electronicsDraftPrompt("20,000mAh Power Bank")).toContain(
      "20,000mAh",
    );
  });
  it("rejects empty, truncated and falsely labeled PNG binaries", () => {
    for (const bytes of [
      Buffer.alloc(0),
      Buffer.from("not an image"),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    ])
      expect(() => validateGeneratedPng(bytes)).toThrow();
  });
  it("preserves legacy storage identity through the canonical alias", () => {
    expect(resolveCategorySlug("electronics-mobile-digital-technology")).toBe(
      "iphones-gadgets",
    );
    expect(resolveCategorySlug("iphones-gadgets")).toBe("iphones-gadgets");
    expect(resolveCategorySlug("other")).toBe("other");
  });
});
