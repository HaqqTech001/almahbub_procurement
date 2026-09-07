import { AppError } from "../../../../lib/app-error.js";
import type { AuthContext } from "../../../../shared/auth/auth-context.js";

export function assertNotificationPermission(context: AuthContext, permission: "notification:read" | "notification:manage"): void {
  if (!context.permissionKeys.has(permission)) {
    throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "You do not have permission to access notifications." });
  }
}

export function assertTemplatePermission(context: AuthContext, permission: "communication:manage" | "communication:publish"): void {
  if (!context.permissionKeys.has(permission)) {
    throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "You do not have permission to manage communication templates." });
  }
}

export function isMandatoryNotification(type: string): boolean {
  return type === "account" || type === "system" || type === "security";
}

export const DEFAULT_OPTIONAL_NOTIFICATION_PREFERENCES = [
  { type: "procurement", channel: "in_app" },
  { type: "procurement", channel: "email" },
  { type: "quotation", channel: "in_app" },
  { type: "quotation", channel: "email" },
  { type: "invoice", channel: "in_app" },
  { type: "payment", channel: "in_app" },
  { type: "shipment", channel: "in_app" },
  { type: "announcement", channel: "in_app" },
  { type: "announcement", channel: "email" },
  { type: "support", channel: "in_app" },
] as const;

export type NotificationPreferenceRecord = {
  type: string;
  channel: string;
  enabled: boolean;
  locale?: string | null;
};

/**
 * Missing rows mean the user has never chosen. Those categories stay enabled.
 * Stored rows always win. Mandatory types cannot be returned as disabled.
 */
export function mergeNotificationPreferenceDefaults(
  stored: readonly NotificationPreferenceRecord[],
): NotificationPreferenceRecord[] {
  const byKey = new Map(
    stored.map((row) => [`${row.type}:${row.channel}`, row] as const),
  );
  const merged: NotificationPreferenceRecord[] = DEFAULT_OPTIONAL_NOTIFICATION_PREFERENCES.map(
    (def) => {
      const hit = byKey.get(`${def.type}:${def.channel}`);
      if (hit) {
        byKey.delete(`${def.type}:${def.channel}`);
        return hit;
      }
      return { type: def.type, channel: def.channel, enabled: true };
    },
  );
  for (const extra of byKey.values()) {
    merged.push(
      isMandatoryNotification(extra.type) ? { ...extra, enabled: true } : extra,
    );
  }
  return merged;
}
