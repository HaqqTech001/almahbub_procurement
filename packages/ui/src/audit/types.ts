/** Enterprise Audit contracts - docs/13 immutable events; hosts inject API. */

export const AUDIT_CATEGORIES = [
  "authentication",
  "role_changes",
  "permission_changes",
  "procurement_actions",
  "approvals",
  "payments",
  "supplier_updates",
  "cms_changes",
  "security_events",
] as const;
export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_OUTCOMES = [
  "success",
  "failure",
  "denied",
  "pending_review",
] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export const AUDIT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

export const AUDIT_EXPORT_FORMATS = ["csv", "excel", "pdf", "json"] as const;
export type AuditExportFormat = (typeof AUDIT_EXPORT_FORMATS)[number];

export type AuditActor = {
  id?: string | undefined;
  name: string;
  type?: "user" | "system" | "service" | string | undefined;
  organizationName?: string | undefined;
};

export type AuditTarget = {
  type: string;
  id?: string | undefined;
  label?: string | undefined;
};

export type AuditEvent = {
  id: string;
  category: AuditCategory | string;
  action: string;
  summary: string;
  outcome: AuditOutcome | string;
  severity?: AuditSeverity | string | undefined;
  actor: AuditActor;
  target?: AuditTarget | undefined;
  occurredAt: string;
  correlationId?: string | undefined;
  requestId?: string | undefined;
  ipAddress?: string | undefined;
  reason?: string | undefined;
  /** Safe, non-secret before/after metadata for inspectors. */
  metadata?: Record<string, unknown> | undefined;
  retentionClass?: string | undefined;
  legalHold?: boolean | undefined;
};

export type AuditRetentionPolicy = {
  defaultDays: number;
  byCategory?: Partial<Record<string, number>> | undefined;
  legalHoldNote?: string | undefined;
  lastReviewedAt?: string | undefined;
};

export type AuditDirectoryFilters = {
  query: string;
  category: "all" | string;
  outcome: "all" | string;
  severity: "all" | string;
  from?: string | undefined;
  to?: string | undefined;
  page: number;
  pageSize: number;
};

export type AuditExportRequest = {
  format: AuditExportFormat;
  filters: AuditDirectoryFilters;
  eventIds?: string[] | undefined;
};

export const emptyAuditFilters = (): AuditDirectoryFilters => ({
  query: "",
  category: "all",
  outcome: "all",
  severity: "all",
  from: undefined,
  to: undefined,
  page: 1,
  pageSize: 10,
});

export function auditCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    authentication: "Sign-in & access",
    role_changes: "Role updates",
    permission_changes: "Access permissions",
    procurement_actions: "Buying activity",
    approvals: "Approvals",
    payments: "Payments",
    supplier_updates: "Supplier changes",
    cms_changes: "Website content",
    security_events: "Security alerts",
  };
  return labels[category] ?? category.replaceAll("_", " ");
}

export function auditOutcomeLabel(outcome: string): string {
  const labels: Record<string, string> = {
    success: "Completed",
    failure: "Did not work",
    denied: "Blocked",
    pending_review: "Waiting for review",
  };
  return labels[outcome] ?? outcome.replaceAll("_", " ");
}

export function auditSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    low: "Info",
    medium: "Notable",
    high: "Important",
    critical: "Urgent",
  };
  return labels[severity] ?? severity;
}

/** Plain-language summary for dotted action codes and resource types. */
export function humanizeAuditSummary(
  action: string,
  resourceType: string,
  resourceId?: string | null,
): string {
  const a = action.toLowerCase();
  const resource = resourceType.replaceAll("_", " ");
  const looksLikeId = Boolean(
    resourceId && /^[0-9a-f-]{8,}$/i.test(resourceId),
  );
  const idBit = resourceId && !looksLikeId ? ` (${resourceId})` : "";

  if (a.includes("login") && (a.includes("success") || a.includes(".ok"))) {
    return "Someone signed in successfully";
  }
  if (a.includes("login") && (a.includes("fail") || a.includes("denied"))) {
    return "Sign-in attempt failed";
  }
  if (a.includes("logout")) return "Someone signed out";
  if (a.includes("password") && a.includes("reset")) {
    return "Password reset was completed";
  }
  if (a.includes("password") && a.includes("change")) {
    return "Password was changed";
  }
  if (a.includes("mfa") || a.includes("otp") || a.includes("2fa")) {
    return "Extra security check was used";
  }
  if (a.includes("role") && a.includes("assign")) {
    return `A role was assigned${idBit}`;
  }
  if (a.includes("permission") && (a.includes("grant") || a.includes("allow"))) {
    return `Access permission was granted${idBit}`;
  }
  if (a.includes("permission") && (a.includes("revoke") || a.includes("deny"))) {
    return `Access permission was removed${idBit}`;
  }
  if (a.includes("approve")) return `Approved a ${resource}${idBit}`;
  if (a.includes("reject") || a.includes("deny")) {
    return `Rejected a ${resource}${idBit}`;
  }
  if (a.includes("customer_revised") || a.includes("customer_update")) {
    return "Customer updated the request";
  }
  if (a.includes("procurement_request") && a.includes("sourcing")) {
    return "Request moved to Sourcing";
  }
  if (a.includes("publish")) return `Published a ${resource}${idBit}`;
  if (a.includes("create") || a.includes("created")) {
    return `Created a ${resource}${idBit}`;
  }
  if (a.includes("update") || a.includes("updated") || a.includes("patch")) {
    return `Updated a ${resource}${idBit}`;
  }
  if (a.includes("delete") || a.includes("removed") || a.includes("archive")) {
    return `Removed a ${resource}${idBit}`;
  }
  if (a.includes("export")) return `Exported ${resource} data`;
  if (a.includes("download")) return `Downloaded a ${resource}${idBit}`;
  if (a.includes("upload")) return `Uploaded a ${resource}${idBit}`;
  if (a.includes("payment") || a.includes("pay.")) {
    return `Payment activity on ${resource}${idBit}`;
  }
  if (a.includes("ship")) return `Shipment update${idBit}`;
  if (a.includes("invite")) return `Sent an invitation${idBit}`;
  if (a.includes("verify")) return `Verified ${resource}${idBit}`;
  if (a.includes("token") && a.includes("reuse")) {
    return "Suspicious session reuse was blocked";
  }
  if (a.includes("export") && a.includes("block")) {
    return "An export attempt was blocked";
  }

  const last = action.split(".").pop()?.replaceAll("_", " ") ?? "change";
  return `${last.charAt(0).toUpperCase()}${last.slice(1)} on ${resource}${idBit}`;
}

export function humanizeAuditAction(action: string): string {
  return humanizeAuditSummary(action, "record", null).replace(
    / on record$/,
    "",
  );
}

export function auditExportLabel(format: string): string {
  const labels: Record<string, string> = {
    csv: "CSV",
    excel: "Excel",
    pdf: "PDF",
    json: "JSON",
  };
  return labels[format] ?? format.toUpperCase();
}

export function filterAuditEvents(
  events: AuditEvent[],
  filters: AuditDirectoryFilters,
): AuditEvent[] {
  const q = filters.query.trim().toLowerCase();
  const fromMs = filters.from ? Date.parse(filters.from) : NaN;
  const toMs = filters.to ? Date.parse(filters.to) : NaN;

  return events.filter((event) => {
    if (filters.category !== "all" && event.category !== filters.category) {
      return false;
    }
    if (filters.outcome !== "all" && event.outcome !== filters.outcome) {
      return false;
    }
    if (
      filters.severity !== "all" &&
      (event.severity ?? "low") !== filters.severity
    ) {
      return false;
    }
    const at = Date.parse(event.occurredAt);
    if (!Number.isNaN(fromMs) && at < fromMs) return false;
    if (!Number.isNaN(toMs) && at > toMs + 86_400_000 - 1) return false;
    if (!q) return true;
    const hay = [
      event.id,
      event.action,
      event.summary,
      event.actor.name,
      event.actor.organizationName ?? "",
      event.target?.label ?? "",
      event.target?.type ?? "",
      event.correlationId ?? "",
      event.requestId ?? "",
      event.reason ?? "",
      auditCategoryLabel(String(event.category)),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateAuditEvents<T>(
  rows: T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; page: number; pageCount: number } {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
  };
}

export function sortAuditTimeline(events: AuditEvent[]): AuditEvent[] {
  return [...events].sort(
    (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
  );
}

export function retentionDaysFor(
  policy: AuditRetentionPolicy,
  category: string,
): number {
  return policy.byCategory?.[category] ?? policy.defaultDays;
}
