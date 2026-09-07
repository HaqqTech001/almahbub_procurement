/** Enterprise Email Center - docs/21 communication templates; hosts inject API. */

export const EMAIL_TEMPLATE_KINDS = [
  "welcome",
  "verify_email",
  "forgot_password",
  "reset_password",
  "procurement_submitted",
  "quotation_received",
  "order_approved",
  "shipment_update",
  "invoice",
  "payment_confirmation",
  "newsletter",
  "wedding_congratulations",
] as const;
export type EmailTemplateKind = (typeof EMAIL_TEMPLATE_KINDS)[number];

export const EMAIL_TEMPLATE_STATUSES = [
  "draft",
  "in_review",
  "published",
  "archived",
  "scheduled",
] as const;
export type EmailTemplateStatus = (typeof EMAIL_TEMPLATE_STATUSES)[number];

export type EmailTemplateVariable = {
  key: string;
  label: string;
  example: string;
  required?: boolean | undefined;
};

export type EmailTemplateVersion = {
  id: string;
  versionNumber: number;
  status: EmailTemplateStatus | string;
  summary?: string | undefined;
  authorName?: string | undefined;
  createdAt: string;
  current?: boolean | undefined;
  subject: string;
  bodyHtml: string;
  bodyText?: string | undefined;
};

export type EmailTemplateRecord = {
  id: string;
  kind: EmailTemplateKind | string;
  name: string;
  locale: string;
  status: EmailTemplateStatus | string;
  versionNumber: number;
  rowVersion: number;
  subject: string;
  bodyHtml: string;
  bodyText?: string | undefined;
  variables: EmailTemplateVariable[];
  versions: EmailTemplateVersion[];
  scheduledFor?: string | null | undefined;
  updatedAt: string;
  updatedBy?: string | undefined;
};

export type EmailDirectoryFilters = {
  query: string;
  kind: "all" | string;
  status: "all" | string;
  page: number;
  pageSize: number;
};

export type EmailSaveDraftInput = {
  subject: string;
  bodyHtml: string;
  bodyText?: string | undefined;
};

export type EmailScheduleInput = {
  scheduledFor: string;
};

export type EmailTestSendInput = {
  to: string;
  /** Variable key → sample value for render. */
  variables?: Record<string, string> | undefined;
};

export type EmailPreviewInput = {
  variables?: Record<string, string> | undefined;
};

export const emptyEmailFilters = (): EmailDirectoryFilters => ({
  query: "",
  kind: "all",
  status: "all",
  page: 1,
  pageSize: 8,
});

export function emailTemplateKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    welcome: "Welcome",
    verify_email: "Verify email",
    forgot_password: "Forgot password",
    reset_password: "Reset password",
    procurement_submitted: "Procurement submitted",
    quotation_received: "Quotation received",
    order_approved: "Order approved",
    shipment_update: "Shipment update",
    invoice: "Invoice",
    payment_confirmation: "Payment confirmation",
    newsletter: "Newsletter",
    wedding_congratulations: "Wedding congratulations",
  };
  return labels[kind] ?? kind.replaceAll("_", " ");
}

export function emailTemplateStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    in_review: "In review",
    published: "Published",
    archived: "Archived",
    scheduled: "Scheduled",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

export function filterEmailTemplates(
  rows: EmailTemplateRecord[],
  filters: EmailDirectoryFilters,
): EmailTemplateRecord[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.kind !== "all" && row.kind !== filters.kind) return false;
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (!q) return true;
    const hay = [
      row.name,
      row.subject,
      row.locale,
      emailTemplateKindLabel(String(row.kind)),
      row.updatedBy ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function paginateEmailTemplates<T>(
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

/** Escape text inserted into HTML email previews (XSS hardening). */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Replace `{{var}}` tokens for preview / test-send samples. */
export function renderEmailTemplate(
  template: string,
  variables: Record<string, string>,
  options: { escapeValues?: boolean } = {},
): string {
  const escapeValues = options.escapeValues ?? true;
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const raw = variables[key];
    if (raw === undefined) return `{{${key}}}`;
    return escapeValues ? escapeHtml(raw) : raw;
  });
}

export function sampleVariablesFrom(
  vars: EmailTemplateVariable[],
  overrides: Record<string, string> = {},
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const v of vars) {
    out[v.key] = overrides[v.key] ?? v.example;
  }
  return { ...out, ...overrides };
}
