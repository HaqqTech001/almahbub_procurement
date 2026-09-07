import { describe, expect, it } from "vitest";

import {
  formatClarificationReason,
  isMeaningfulClarificationQuestion,
  parseClarificationReason,
} from "./clarification.js";

describe("clarification reason encoding", () => {
  it("round-trips area and exact question", () => {
    const reason = formatClarificationReason(
      "Product specification",
      "Please confirm the required freezer capacity in litres.",
    );
    expect(parseClarificationReason(reason)).toEqual({
      area: "Product specification",
      question: "Please confirm the required freezer capacity in litres.",
      items: [
        {
          fieldKey: "custom",
          label: "Product specification",
          currentValue: "",
          prompt: "Please confirm the required freezer capacity in litres.",
        },
      ],
    });
  });

  it("rejects generic questions", () => {
    expect(isMeaningfulClarificationQuestion("More clarification is required.")).toBe(
      false,
    );
    expect(
      isMeaningfulClarificationQuestion(
        "Please confirm the required freezer capacity in litres.",
      ),
    ).toBe(true);
  });
});
