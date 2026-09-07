import { ALMAHBUB_BRAND_NAME, type EmailBrand } from "./email-brand.js";

export type EmailDocument = {
  readonly subject: string;
  readonly preheader: string;
  readonly text: string;
  readonly html: string;
};

export type EmailCta = {
  readonly label: string;
  readonly href: string;
};

export type EmailPanelRow = {
  readonly label: string;
  readonly value: string;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function panelHtml(title: string, rows: readonly EmailPanelRow[]): string {
  const body = rows
    .map(
      (row) => `<tr>
        <td style="padding:6px 0 2px;font-size:11px;letter-spacing:0.04em;text-transform:uppercase;color:#667085;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(row.label)}</td>
      </tr>
      <tr>
        <td style="padding:0 0 10px;font-size:16px;font-weight:700;color:#101828;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0;border:1px solid #d0d5dd;background:#f8fafc;">
    <tr>
      <td style="width:4px;background:#155aaf;"></td>
      <td style="padding:14px 16px;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#123b66;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(title)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${body}</table>
      </td>
    </tr>
  </table>`;
}

function ctaHtml(cta: EmailCta): string {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="padding:22px 0 8px;" align="left">
        <a href="${escapeHtml(cta.href)}"
           style="background:#155aaf;color:#ffffff;padding:14px 28px;text-decoration:none;font-weight:700;display:inline-block;font-size:16px;line-height:1.2;font-family:Segoe UI,Arial,sans-serif;border-radius:4px;">
          ${escapeHtml(cta.label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function renderEmailDocument(input: {
  readonly brand: EmailBrand;
  readonly subject: string;
  readonly preheader: string;
  readonly greeting: string;
  readonly introHtml: string;
  readonly panelTitle?: string;
  readonly panelRows?: readonly EmailPanelRow[];
  readonly explanationHtml?: string;
  readonly cta?: EmailCta;
  readonly detailsHtml?: string;
  readonly noticeHtml?: string;
  readonly text: string;
}): EmailDocument {
  const year = new Date().getFullYear();
  const panel =
    input.panelTitle && input.panelRows && input.panelRows.length > 0
      ? panelHtml(input.panelTitle, input.panelRows)
      : "";
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(input.subject)}</title>
  <!--[if mso]><style>table,td{font-family:Arial,sans-serif !important;}</style><![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .hamd-email-shell { width: 100% !important; }
      .hamd-email-pad { padding: 20px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#eef3f8;font-family:Segoe UI,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3f8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="hamd-email-shell" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #d0d5dd;">
          <tr>
            <td class="hamd-email-pad" style="background:#123b66;padding:20px 32px;">
              <img src="${escapeHtml(input.brand.logoUrl)}" alt="${escapeHtml(input.brand.logoAlt)}" width="48" height="48" style="display:block;width:48px;height:48px;border:0;outline:none;">
              <p style="margin:10px 0 0;color:#ffffff;font-size:16px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(ALMAHBUB_BRAND_NAME)}</p>
            </td>
          </tr>
          <tr>
            <td class="hamd-email-pad" style="padding:28px 32px;color:#101828;font-size:16px;line-height:1.6;">
              <p style="margin:0 0 14px;">${escapeHtml(input.greeting)}</p>
              ${input.introHtml}
              ${panel}
              ${input.explanationHtml ?? ""}
              ${input.cta ? ctaHtml(input.cta) : ""}
              ${input.detailsHtml ?? ""}
              ${input.noticeHtml ?? ""}
              <p style="margin:24px 0 0;font-size:14px;color:#344054;">Need help? Contact Almahbub International at <a href="mailto:${escapeHtml(input.brand.contactEmail)}" style="color:#155aaf;text-decoration:none;">${escapeHtml(input.brand.contactEmail)}</a>, or use support in your account.</p>
            </td>
          </tr>
          <tr>
            <td class="hamd-email-pad" style="background:#f2f4f7;padding:18px 32px;border-top:1px solid #eaecf0;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#123b66;">${escapeHtml(ALMAHBUB_BRAND_NAME)}</p>
              <p style="margin:6px 0 0;font-size:12px;color:#667085;line-height:1.5;">This message was sent regarding activity on your Almahbub International account.<br>${escapeHtml(input.brand.contactEmail)}<br>&copy; ${year} ${escapeHtml(ALMAHBUB_BRAND_NAME)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: input.subject,
    preheader: input.preheader,
    text: input.text,
    html,
  };
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;color:#101828;font-size:16px;line-height:1.6;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(text)}</p>`;
}

export function mutedParagraph(text: string): string {
  return `<p style="margin:12px 0 0;color:#667085;font-size:14px;line-height:1.55;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(text)}</p>`;
}

export function codeBlock(code: string): string {
  return `<p style="margin:16px 0;font-size:28px;letter-spacing:0.18em;font-weight:700;color:#155aaf;font-family:Segoe UI,Arial,sans-serif;">${escapeHtml(code)}</p>`;
}
