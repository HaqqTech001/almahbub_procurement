import { describe, expect, it } from "vitest";
import { catalogueCopy } from "./catalogue-copy.js";
describe("stored catalogue copy", () => {
  it("preserves the meaning of stored contrast and explanatory clauses", () => {
    expect(catalogueCopy("Confirmed with the buyer \u2014 not as a priced SKU.")).toBe("Confirmed with the buyer, not as a priced SKU.");
    expect(catalogueCopy("Confirmed with the buyer \u2014 this page does not assume a single form.")).toBe("Confirmed with the buyer; this page does not assume a single form.");
  });
});
