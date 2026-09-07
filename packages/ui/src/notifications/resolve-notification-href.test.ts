import { describe, expect, it } from "vitest";

import { resolveNotificationHref } from "./resolve-notification-href.js";

describe("resolveNotificationHref", () => {
  it("maps procurement metadata to the customer request route", () => {
    expect(
      resolveNotificationHref(
        { type: "procurement", metadata: { requestId: "req-1" } },
        "app",
      ),
    ).toBe("/app/requests/req-1");
  });

  it("maps quotation types to ops quotations", () => {
    expect(
      resolveNotificationHref(
        { type: "quotation_received", metadata: { quotationId: "q-9" } },
        "ops",
      ),
    ).toBe("/quotations/q-9");
  });

  it("rewrites a V1 deep link into the customer portal", () => {
    expect(resolveNotificationHref({ deepLink: "/shipments/s-1" }, "app")).toBe(
      "/app/shipments/s-1",
    );
  });

  it("maps announcement notifications to the exact announcement page", () => {
    expect(
      resolveNotificationHref(
        { type: "announcement", metadata: { announcementId: "a-1" } },
        "app",
      ),
    ).toBe("/app/announcements/a-1");
  });

  it("maps clarification notifications to the request clarification anchor", () => {
    expect(
      resolveNotificationHref(
        {
          type: "procurement_clarification",
          metadata: { requestId: "req-9" },
        },
        "app",
      ),
    ).toBe("/app/requests/req-9#clarification");
  });

  it("maps support notifications to chat", () => {
    expect(resolveNotificationHref({ type: "support" }, "app")).toBe("/app/chat");
  });

  it("returns null when there is no meaningful destination", () => {
    expect(resolveNotificationHref({ type: "system" })).toBeNull();
    expect(resolveNotificationHref({ deepLink: "/notifications" }, "app")).toBeNull();
  });
});
