import { describe, expect, it } from "vitest";

import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";
import { DEFAULT_BUYER_PERMISSIONS } from "../../../identity/auth/domain/permission-catalog.js";
import {
  assertTemplatePermission,
  isMandatoryNotification,
  mergeNotificationPreferenceDefaults,
} from "../application/notification-policy.js";

function context(permissions: readonly string[]): AuthContext {
  return {
    userId: "user-1",
    organizationId: "org-1",
    membershipId: "mem-1",
    sessionId: "sess-1",
    permissionKeys: new Set(permissions),
  };
}

describe("notification policy", () => {
  it("protects account, system, and security notices from preference opt-out", () => {
    expect(isMandatoryNotification("account")).toBe(true);
    expect(isMandatoryNotification("system")).toBe(true);
    expect(isMandatoryNotification("security")).toBe(true);
    expect(isMandatoryNotification("shipment")).toBe(false);
  });

  it("enables useful optional categories when the user has never saved preferences", () => {
    const merged = mergeNotificationPreferenceDefaults([]);
    expect(merged.find((row) => row.type === "procurement" && row.channel === "in_app")?.enabled).toBe(true);
    expect(merged.find((row) => row.type === "announcement" && row.channel === "in_app")?.enabled).toBe(true);
  });

  it("keeps an explicit opt-out after the user has saved preferences", () => {
    const merged = mergeNotificationPreferenceDefaults([
      { type: "announcement", channel: "in_app", enabled: false },
    ]);
    expect(merged.find((row) => row.type === "announcement" && row.channel === "in_app")?.enabled).toBe(false);
    expect(merged.find((row) => row.type === "procurement" && row.channel === "in_app")?.enabled).toBe(true);
  });

  it("does not let buyer defaults administer communication templates", () => {
    try {
      assertTemplatePermission(
        context(DEFAULT_BUYER_PERMISSIONS),
        "communication:manage",
      );
      throw new Error("expected buyer template manage to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect(error).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
    }
  });
});
