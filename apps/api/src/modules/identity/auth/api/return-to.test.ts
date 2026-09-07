import { describe, expect, it } from "vitest";

import { sanitizeReturnTo } from "./return-to.js";

describe("sanitizeReturnTo", () => {
  it("allows in-app paths and rejects open redirects", () => {
    expect(sanitizeReturnTo("/app/requests")).toBe("/app/requests");
    expect(sanitizeReturnTo("/")).toBe("/app");
    expect(sanitizeReturnTo("//evil.example")).toBe("/app");
    expect(sanitizeReturnTo("https://evil.example")).toBe("/app");
    expect(sanitizeReturnTo("/\\evil")).toBe("/app");
    expect(sanitizeReturnTo("/app/requests?q=steel")).toBe("/app/requests?q=steel");
    expect(sanitizeReturnTo("/rowdotul-hamd-26/live?mode=test")).toBe(
      "/rowdotul-hamd-26/live?mode=test",
    );
    expect(sanitizeReturnTo("/login?next=https://evil.example")).toBe("/app");
  });
});
