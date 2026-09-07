import { describe, expect, it } from "vitest";

import {
  V1_PUBLIC_CATEGORIES,
  V1_PUBLIC_CATEGORY_SLUGS,
} from "../domain/v1-taxonomy.js";

describe("V1 public taxonomy", () => {
  it("preserves the five production category names and slugs", () => {
    expect(V1_PUBLIC_CATEGORIES.map((category) => category.name)).toEqual([
      "iPhones & Gadgets",
      "Medical Equipments",
      "Home & Garden Wares",
      "Machineries",
      "General Procurement",
    ]);
    expect(V1_PUBLIC_CATEGORY_SLUGS).toEqual([
      "iphones-gadgets",
      "medical-equipments",
      "home-garden-wares",
      "machineries",
      "general-procurement",
    ]);
  });

  it("does not introduce unapproved future categories", () => {
    expect(V1_PUBLIC_CATEGORY_SLUGS).not.toContain("industrial-supplies");
    expect(V1_PUBLIC_CATEGORY_SLUGS).not.toContain("agro-commodities");
  });
});
