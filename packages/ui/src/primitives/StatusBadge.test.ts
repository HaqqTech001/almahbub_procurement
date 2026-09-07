import { describe, expect, it } from "vitest";
import { statusSemantic } from "./StatusBadge.js";

describe("statusSemantic", () => {
  it("maps procurement statuses without changing their labels", () => {
    expect(statusSemantic("draft")).toBe("neutral");
    expect(statusSemantic("in_progress")).toBe("info");
    expect(statusSemantic("approved")).toBe("success");
    expect(statusSemantic("pending review")).toBe("warning");
    expect(statusSemantic("needs_clarification")).toBe("warning");
    expect(statusSemantic("sourcing")).toBe("info");
    expect(statusSemantic("pending_verification")).toBe("warning");
    expect(statusSemantic("submitted")).toBe("info");
  });
});
