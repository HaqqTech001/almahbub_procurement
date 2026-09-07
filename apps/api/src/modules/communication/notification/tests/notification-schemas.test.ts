import { describe, expect, it } from "vitest";

import { createTemplateSchema, listNotificationsSchema, updatePreferencesSchema } from "../api/notification-schemas.js";

describe("notification schemas", () => {
  it("parses a bounded inbox query", () => {
    expect(listNotificationsSchema.parse({ pageSize: "25", type: "shipment", priority: "normal" })).toMatchObject({ pageSize: 25, type: "shipment" });
  });

  it("rejects malformed template keys and unknown variables", () => {
    expect(() => createTemplateSchema.parse({ key: "Invalid key", type: "account", channel: "email", title: "Hello", body: "Body" })).toThrow();
    expect(() => createTemplateSchema.parse({ key: "account.notice", type: "account", channel: "email", title: "Hello", body: "Body", variableSchema: { name: "unsafe" } })).toThrow();
  });

  it("accepts security notification type in preferences", () => {
    expect(
      updatePreferencesSchema.parse({
        preferences: [{ type: "security", channel: "in_app", enabled: true }],
      }),
    ).toMatchObject({ preferences: [{ type: "security", enabled: true }] });
  });
});
