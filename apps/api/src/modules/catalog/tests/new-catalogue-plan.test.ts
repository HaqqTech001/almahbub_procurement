import { describe, expect, it } from "vitest";
import {
  validateProposals,
  type Proposal,
} from "../application/new-catalogue-plan.js";
const categories = [
  { id: "c", slug: "office-business", name: "Office", status: "published" },
];
const proposal = (name: string): Proposal => ({
  proposedName: name,
  categorySlug: "office-business",
  productFamily: name,
  group: "office",
  context: "office document handling",
  priorityTier: "P1_SHOWCASE",
});
const validate = (names: string[]) =>
  validateProposals(names.map(proposal), categories, [], {
    office: ["office-business"],
  });
describe("catalogue planning gates", () => {
  it("rejects weak identities and trivial adjective/colour duplicates", () => {
    const rows = validate([
      "Premium Generic Appliance",
      "Laser printer",
      "Premium Laser printer",
      "Black Laser printer",
    ]);
    expect(rows.map((row) => row.validationStatus)).toEqual([
      "REJECT_WEAK_IDENTITY",
      "APPROVED_FOR_DRAFT",
      "REJECT_DUPLICATE",
      "REJECT_DUPLICATE",
    ]);
  });
  it("blocks branded generation and compatibility-sensitive families", () => {
    const rows = validate([
      "HP business laptop",
      "Dell X15 laptop",
      "UPS system",
    ]);
    expect(rows[0]?.mediaStrategy).toBe("current_product_research");
    expect(rows[1]?.validationStatus).toBe("CURRENT_PRODUCT_RESEARCH");
    expect(rows[2]?.validationStatus).toBe("MANUAL_REVIEW");
  });
  it("rejects wrong categories and existing slugs", () => {
    expect(
      validateProposals([proposal("Monitor")], categories, [], {
        office: ["other"],
      })[0]?.validationStatus,
    ).toBe("REJECT_CATEGORY_MISMATCH");
    expect(
      validateProposals(
        [proposal("Monitor")],
        categories,
        [{ id: "p", slug: "office-business-monitor", name: "Monitor" }],
        { office: ["office-business"] },
      )[0]?.validationStatus,
    ).toBe("REJECT_DUPLICATE");
  });
});
