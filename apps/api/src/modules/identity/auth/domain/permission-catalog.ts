/**
 * Canonical permission catalog for identity bootstrap.
 * Registration and invites upsert these rows so RBAC never depends on a
 * one-off seed having been run against the target database.
 */
export const PERMISSION_CATALOG = [
  ["request:read", "request", "read"],
  ["request:create", "request", "create"],
  ["request:update", "request", "update"],
  ["request:submit", "request", "submit"],
  ["request:cancel", "request", "cancel"],
  ["request:archive", "request", "archive"],
  ["request:restore", "request", "restore"],
  ["request:duplicate", "request", "duplicate"],
  ["request:assign", "request", "assign"],
  ["request:manage", "request", "manage"],
  ["quotation:read", "quotation", "read"],
  ["quotation:create", "quotation", "create"],
  ["quotation:update", "quotation", "update"],
  ["quotation:review", "quotation", "review"],
  ["quotation:issue", "quotation", "issue"],
  ["quotation:approve", "quotation", "approve"],
  ["quotation:revise", "quotation", "revise"],
  ["invoice:read", "invoice", "read"],
  ["invoice:create", "invoice", "create"],
  ["invoice:update", "invoice", "update"],
  ["invoice:issue", "invoice", "issue"],
  ["invoice:void", "invoice", "void"],
  ["payment:read", "payment", "read"],
  ["payment:create", "payment", "create"],
  ["payment:submit", "payment", "submit"],
  ["payment:confirm", "payment", "confirm"],
  ["shipment:read", "shipment", "read"],
  ["shipment:create", "shipment", "create"],
  ["shipment:update", "shipment", "update"],
  ["shipment:manage", "shipment", "manage"],
  ["shipment:confirm", "shipment", "confirm"],
  ["notification:read", "notification", "read"],
  ["notification:manage", "notification", "manage"],
  ["communication:manage", "communication", "manage"],
  ["communication:publish", "communication", "publish"],
  ["guidance:read", "guidance", "read"],
  ["guidance:manage", "guidance", "manage"],
  ["ops:access", "ops", "access"],
  ["audit:read", "audit", "read"],
  ["ai:use", "ai", "use"],
  ["cms:manage", "cms", "manage"],
] as const;

export type PermissionKey = (typeof PERMISSION_CATALOG)[number][0];

export const DEFAULT_BUYER_PERMISSIONS = [
  "request:read",
  "request:create",
  "request:update",
  "request:submit",
  "request:cancel",
  "request:archive",
  "request:duplicate",
  "quotation:read",
  "invoice:read",
  "payment:read",
  "shipment:read",
  "notification:read",
  "guidance:read",
  "ai:use",
] as const satisfies ReadonlyArray<PermissionKey>;

/** Privileged operations console role - never granted by public registration. */
export const DEFAULT_OPS_PERMISSIONS = [
  ...DEFAULT_BUYER_PERMISSIONS,
  "ops:access",
  "request:manage",
  "request:assign",
  "request:restore",
  "quotation:create",
  "quotation:update",
  "quotation:review",
  "quotation:issue",
  "quotation:approve",
  "quotation:revise",
  "invoice:create",
  "invoice:update",
  "invoice:issue",
  "invoice:void",
  "payment:create",
  "payment:submit",
  "payment:confirm",
  "shipment:create",
  "shipment:update",
  "shipment:manage",
  "shipment:confirm",
  "notification:manage",
  "communication:manage",
  "communication:publish",
  "guidance:manage",
  "audit:read",
  "cms:manage",
] as const satisfies ReadonlyArray<PermissionKey>;

const catalogByKey = new Map(
  PERMISSION_CATALOG.map(([key, resource, action]) => [
    key,
    { key, resource, action },
  ]),
);

export function resolvePermissionRows(keys: readonly string[]): Array<{
  key: string;
  resource: string;
  action: string;
}> {
  const rows: Array<{ key: string; resource: string; action: string }> = [];
  const missing: string[] = [];
  for (const key of keys) {
    const row = catalogByKey.get(key as PermissionKey);
    if (!row) {
      missing.push(key);
      continue;
    }
    rows.push(row);
  }
  if (missing.length > 0) {
    throw new Error(
      `Unknown permission keys requested: ${missing.sort().join(", ")}`,
    );
  }
  return rows;
}
