import type { EmailTemplateRecord } from "./types.js";

const hours = (h: number) =>
  new Date(Date.now() - h * 3_600_000).toISOString();
const futureHours = (h: number) =>
  new Date(Date.now() + h * 3_600_000).toISOString();

function vars(
  entries: { key: string; label: string; example: string; required?: boolean }[],
) {
  return entries.map((e) => ({
    key: e.key,
    label: e.label,
    example: e.example,
    ...(e.required ? { required: true } : {}),
  }));
}

/** Mission coverage - one record per email template kind. */
export const emailTemplatesFixture: EmailTemplateRecord[] = [
  {
    id: "em-welcome",
    kind: "welcome",
    name: "Welcome",
    locale: "en",
    status: "published",
    versionNumber: 3,
    rowVersion: 3,
    subject: "Welcome to {{org_name}}, {{first_name}}",
    bodyHtml:
      "<p>Hi {{first_name}},</p><p>Welcome to {{org_name}}. Your account is ready.</p><p><a href=\"{{dashboard_url}}\">Open dashboard</a></p>",
    bodyText: "Hi {{first_name}}, welcome to {{org_name}}. {{dashboard_url}}",
    variables: vars([
      { key: "first_name", label: "First name", example: "Ada", required: true },
      { key: "org_name", label: "Organization", example: "Almahbub International", required: true },
      { key: "dashboard_url", label: "Dashboard URL", example: "https://app.example.com", required: true },
    ]),
    versions: [
      {
        id: "em-welcome-v2",
        versionNumber: 2,
        status: "archived",
        summary: "Initial welcome copy",
        authorName: "Content Publisher",
        createdAt: hours(400),
        subject: "Welcome, {{first_name}}",
        bodyHtml: "<p>Welcome {{first_name}}</p>",
      },
      {
        id: "em-welcome-v3",
        versionNumber: 3,
        status: "published",
        summary: "Added dashboard CTA",
        authorName: "Content Publisher",
        createdAt: hours(40),
        current: true,
        subject: "Welcome to {{org_name}}, {{first_name}}",
        bodyHtml:
          "<p>Hi {{first_name}},</p><p>Welcome to {{org_name}}. Your account is ready.</p><p><a href=\"{{dashboard_url}}\">Open dashboard</a></p>",
      },
    ],
    updatedAt: hours(40),
    updatedBy: "Content Publisher",
  },
  {
    id: "em-verify",
    kind: "verify_email",
    name: "Verify email",
    locale: "en",
    status: "published",
    versionNumber: 2,
    rowVersion: 2,
    subject: "Verify your email for {{org_name}}",
    bodyHtml:
      "<p>Confirm {{email}} by visiting <a href=\"{{verify_url}}\">this link</a>. Expires in {{expiry_hours}} hours.</p>",
    variables: vars([
      { key: "email", label: "Email", example: "ada@example.com", required: true },
      { key: "verify_url", label: "Verify URL", example: "https://app.example.com/verify?t=…", required: true },
      { key: "expiry_hours", label: "Expiry hours", example: "24", required: true },
      { key: "org_name", label: "Organization", example: "Almahbub International" },
    ]),
    versions: [
      {
        id: "em-verify-v2",
        versionNumber: 2,
        status: "published",
        createdAt: hours(80),
        current: true,
        subject: "Verify your email for {{org_name}}",
        bodyHtml:
          "<p>Confirm {{email}} by visiting <a href=\"{{verify_url}}\">this link</a>. Expires in {{expiry_hours}} hours.</p>",
      },
    ],
    updatedAt: hours(80),
  },
  {
    id: "em-forgot",
    kind: "forgot_password",
    name: "Forgot password",
    locale: "en",
    status: "published",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Reset your password",
    bodyHtml:
      "<p>We received a reset request for {{email}}. Use <a href=\"{{reset_url}}\">this secure link</a> if it was you.</p>",
    variables: vars([
      { key: "email", label: "Email", example: "ada@example.com", required: true },
      { key: "reset_url", label: "Reset URL", example: "https://app.example.com/reset?t=…", required: true },
    ]),
    versions: [
      {
        id: "em-forgot-v1",
        versionNumber: 1,
        status: "published",
        createdAt: hours(120),
        current: true,
        subject: "Reset your password",
        bodyHtml:
          "<p>We received a reset request for {{email}}. Use <a href=\"{{reset_url}}\">this secure link</a> if it was you.</p>",
      },
    ],
    updatedAt: hours(120),
  },
  {
    id: "em-reset",
    kind: "reset_password",
    name: "Reset password",
    locale: "en",
    status: "published",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Your password was changed",
    bodyHtml:
      "<p>Hi {{first_name}}, your password for {{email}} was changed at {{changed_at}}. If this wasn’t you, contact support.</p>",
    variables: vars([
      { key: "first_name", label: "First name", example: "Ada" },
      { key: "email", label: "Email", example: "ada@example.com", required: true },
      { key: "changed_at", label: "Changed at", example: "2026-08-05 06:00 UTC", required: true },
    ]),
    versions: [
      {
        id: "em-reset-v1",
        versionNumber: 1,
        status: "published",
        createdAt: hours(90),
        current: true,
        subject: "Your password was changed",
        bodyHtml:
          "<p>Hi {{first_name}}, your password for {{email}} was changed at {{changed_at}}. If this wasn’t you, contact support.</p>",
      },
    ],
    updatedAt: hours(90),
  },
  {
    id: "em-proc",
    kind: "procurement_submitted",
    name: "Procurement submitted",
    locale: "en",
    status: "published",
    versionNumber: 2,
    rowVersion: 2,
    subject: "Request {{request_code}} submitted",
    bodyHtml:
      "<p>{{first_name}}, procurement request <strong>{{request_code}}</strong> was submitted. Track status: <a href=\"{{request_url}}\">view request</a>.</p>",
    variables: vars([
      { key: "first_name", label: "First name", example: "Ada", required: true },
      { key: "request_code", label: "Request code", example: "PR-1042", required: true },
      { key: "request_url", label: "Request URL", example: "https://app.example.com/requests/PR-1042", required: true },
    ]),
    versions: [
      {
        id: "em-proc-v2",
        versionNumber: 2,
        status: "published",
        createdAt: hours(30),
        current: true,
        subject: "Request {{request_code}} submitted",
        bodyHtml:
          "<p>{{first_name}}, procurement request <strong>{{request_code}}</strong> was submitted. Track status: <a href=\"{{request_url}}\">view request</a>.</p>",
      },
    ],
    updatedAt: hours(30),
  },
  {
    id: "em-quote",
    kind: "quotation_received",
    name: "Quotation received",
    locale: "en",
    status: "draft",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Quotation {{quote_code}} is ready",
    bodyHtml:
      "<p>A quotation for {{request_code}} is ready ({{quote_code}}). Total {{currency}} {{amount}}. <a href=\"{{quote_url}}\">Review quotation</a>.</p>",
    variables: vars([
      { key: "request_code", label: "Request code", example: "PR-1042", required: true },
      { key: "quote_code", label: "Quote code", example: "Q-220", required: true },
      { key: "currency", label: "Currency", example: "USD", required: true },
      { key: "amount", label: "Amount", example: "12,400", required: true },
      { key: "quote_url", label: "Quote URL", example: "https://app.example.com/quotes/Q-220", required: true },
    ]),
    versions: [
      {
        id: "em-quote-v1",
        versionNumber: 1,
        status: "draft",
        createdAt: hours(8),
        current: true,
        subject: "Quotation {{quote_code}} is ready",
        bodyHtml:
          "<p>A quotation for {{request_code}} is ready ({{quote_code}}). Total {{currency}} {{amount}}. <a href=\"{{quote_url}}\">Review quotation</a>.</p>",
      },
    ],
    updatedAt: hours(8),
    updatedBy: "Ops Writer",
  },
  {
    id: "em-order",
    kind: "order_approved",
    name: "Order approved",
    locale: "en",
    status: "published",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Order {{order_code}} approved",
    bodyHtml:
      "<p>Purchase order <strong>{{order_code}}</strong> was approved. Supplier: {{supplier_name}}. <a href=\"{{order_url}}\">View order</a>.</p>",
    variables: vars([
      { key: "order_code", label: "Order code", example: "PO-778", required: true },
      { key: "supplier_name", label: "Supplier", example: "West Africa Valves", required: true },
      { key: "order_url", label: "Order URL", example: "https://app.example.com/orders/PO-778", required: true },
    ]),
    versions: [
      {
        id: "em-order-v1",
        versionNumber: 1,
        status: "published",
        createdAt: hours(60),
        current: true,
        subject: "Order {{order_code}} approved",
        bodyHtml:
          "<p>Purchase order <strong>{{order_code}}</strong> was approved. Supplier: {{supplier_name}}. <a href=\"{{order_url}}\">View order</a>.</p>",
      },
    ],
    updatedAt: hours(60),
  },
  {
    id: "em-ship",
    kind: "shipment_update",
    name: "Shipment update",
    locale: "en",
    status: "published",
    versionNumber: 2,
    rowVersion: 2,
    subject: "Shipment {{shipment_code}}: {{milestone}}",
    bodyHtml:
      "<p>Shipment <strong>{{shipment_code}}</strong> is now <em>{{milestone}}</em>. ETA {{eta}}. <a href=\"{{tracking_url}}\">Track</a>.</p>",
    variables: vars([
      { key: "shipment_code", label: "Shipment code", example: "SH-901", required: true },
      { key: "milestone", label: "Milestone", example: "In transit", required: true },
      { key: "eta", label: "ETA", example: "2026-08-12", required: true },
      { key: "tracking_url", label: "Tracking URL", example: "https://app.example.com/shipments/SH-901", required: true },
    ]),
    versions: [
      {
        id: "em-ship-v2",
        versionNumber: 2,
        status: "published",
        createdAt: hours(20),
        current: true,
        subject: "Shipment {{shipment_code}}: {{milestone}}",
        bodyHtml:
          "<p>Shipment <strong>{{shipment_code}}</strong> is now <em>{{milestone}}</em>. ETA {{eta}}. <a href=\"{{tracking_url}}\">Track</a>.</p>",
      },
    ],
    updatedAt: hours(20),
  },
  {
    id: "em-inv",
    kind: "invoice",
    name: "Invoice",
    locale: "en",
    status: "published",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Invoice {{invoice_code}} for {{currency}} {{amount}}",
    bodyHtml:
      "<p>Invoice <strong>{{invoice_code}}</strong> is available. Amount due: {{currency}} {{amount}} by {{due_date}}. <a href=\"{{invoice_url}}\">View invoice</a>.</p>",
    variables: vars([
      { key: "invoice_code", label: "Invoice code", example: "INV-2201", required: true },
      { key: "currency", label: "Currency", example: "USD", required: true },
      { key: "amount", label: "Amount", example: "8,250", required: true },
      { key: "due_date", label: "Due date", example: "2026-08-20", required: true },
      { key: "invoice_url", label: "Invoice URL", example: "https://app.example.com/invoices/INV-2201", required: true },
    ]),
    versions: [
      {
        id: "em-inv-v1",
        versionNumber: 1,
        status: "published",
        createdAt: hours(50),
        current: true,
        subject: "Invoice {{invoice_code}} for {{currency}} {{amount}}",
        bodyHtml:
          "<p>Invoice <strong>{{invoice_code}}</strong> is available. Amount due: {{currency}} {{amount}} by {{due_date}}. <a href=\"{{invoice_url}}\">View invoice</a>.</p>",
      },
    ],
    updatedAt: hours(50),
  },
  {
    id: "em-pay",
    kind: "payment_confirmation",
    name: "Payment confirmation",
    locale: "en",
    status: "published",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Payment confirmed for {{invoice_code}}",
    bodyHtml:
      "<p>We confirmed payment of {{currency}} {{amount}} for invoice {{invoice_code}} on {{paid_at}}. Reference {{payment_ref}}.</p>",
    variables: vars([
      { key: "invoice_code", label: "Invoice code", example: "INV-2201", required: true },
      { key: "currency", label: "Currency", example: "USD", required: true },
      { key: "amount", label: "Amount", example: "8,250", required: true },
      { key: "paid_at", label: "Paid at", example: "2026-08-04", required: true },
      { key: "payment_ref", label: "Payment reference", example: "PAY-441", required: true },
    ]),
    versions: [
      {
        id: "em-pay-v1",
        versionNumber: 1,
        status: "published",
        createdAt: hours(15),
        current: true,
        subject: "Payment confirmed for {{invoice_code}}",
        bodyHtml:
          "<p>We confirmed payment of {{currency}} {{amount}} for invoice {{invoice_code}} on {{paid_at}}. Reference {{payment_ref}}.</p>",
      },
    ],
    updatedAt: hours(15),
  },
  {
    id: "em-news",
    kind: "newsletter",
    name: "Newsletter",
    locale: "en",
    status: "scheduled",
    versionNumber: 2,
    rowVersion: 2,
    subject: "{{campaign_title}} - Almahbub insights",
    bodyHtml:
      "<p>{{intro}}</p><p>{{body}}</p><p><a href=\"{{cta_url}}\">{{cta_label}}</a></p><p><a href=\"{{unsubscribe_url}}\">Unsubscribe</a></p>",
    variables: vars([
      { key: "campaign_title", label: "Campaign title", example: "August corridor update", required: true },
      { key: "intro", label: "Intro", example: "This month’s procurement highlights.", required: true },
      { key: "body", label: "Body", example: "New suppliers onboarded across West Africa.", required: true },
      { key: "cta_url", label: "CTA URL", example: "https://www.example.com/news", required: true },
      { key: "cta_label", label: "CTA label", example: "Read more", required: true },
      { key: "unsubscribe_url", label: "Unsubscribe URL", example: "https://app.example.com/unsubscribe", required: true },
    ]),
    versions: [
      {
        id: "em-news-v2",
        versionNumber: 2,
        status: "scheduled",
        createdAt: hours(6),
        current: true,
        subject: "{{campaign_title}} - Almahbub insights",
        bodyHtml:
          "<p>{{intro}}</p><p>{{body}}</p><p><a href=\"{{cta_url}}\">{{cta_label}}</a></p><p><a href=\"{{unsubscribe_url}}\">Unsubscribe</a></p>",
      },
    ],
    scheduledFor: futureHours(48),
    updatedAt: hours(6),
    updatedBy: "Growth",
  },
  {
    id: "em-wedding",
    kind: "wedding_congratulations",
    name: "Wedding congratulations",
    locale: "en",
    status: "draft",
    versionNumber: 1,
    rowVersion: 1,
    subject: "Congratulations, {{honoree_name}}!",
    bodyHtml:
      "<p>Dear {{honoree_name}},</p><p>{{message}}</p><p>With warm regards,<br/>{{org_name}}</p><p><a href=\"{{celebration_url}}\">View celebration</a></p>",
    variables: vars([
      { key: "honoree_name", label: "Honoree name", example: "Ada & Chidi", required: true },
      { key: "message", label: "Message", example: "Wishing you joy as you celebrate.", required: true },
      { key: "org_name", label: "Organization", example: "Almahbub International", required: true },
      { key: "celebration_url", label: "Celebration URL", example: "https://www.example.com/celebrations", required: true },
    ]),
    versions: [
      {
        id: "em-wedding-v1",
        versionNumber: 1,
        status: "draft",
        createdAt: hours(4),
        current: true,
        subject: "Congratulations, {{honoree_name}}!",
        bodyHtml:
          "<p>Dear {{honoree_name}},</p><p>{{message}}</p><p>With warm regards,<br/>{{org_name}}</p><p><a href=\"{{celebration_url}}\">View celebration</a></p>",
      },
    ],
    updatedAt: hours(4),
    updatedBy: "Celebration Editor",
  },
];
