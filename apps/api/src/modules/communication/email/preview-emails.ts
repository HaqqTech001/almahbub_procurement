import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { composeActivityEmail } from "./activity-email.js";
import {
  buildAccountActivatedEmail,
  buildInvitationEmail,
  buildPasswordResetEmail,
  buildVerificationCodeEmail,
  buildWelcomeVerificationEmail,
} from "./auth-email-templates.js";
import { createEmailBrand } from "./email-brand.js";
import type { EmailDocument } from "./email-layout.js";

const brand = createEmailBrand({
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL ?? "http://localhost:5173",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "notifications@example.com",
  EMAIL_FROM_NAME: "Almahbub International",
  EMAIL_LOGO_URL:
    process.env.EMAIL_LOGO_URL ??
    `${(process.env.APP_PUBLIC_URL ?? "http://localhost:5173").replace(/\/$/, "")}/almahbub.svg`,
  EMAIL_CONTACT: "almahbubinternational@gmail.com",
});

const recipient = { firstName: "Abdullahi", displayName: "Abdullahi Musa" };

const templates: Array<{ slug: string; document: EmailDocument }> = [
  {
    slug: "verification",
    document: buildWelcomeVerificationEmail({
      brand,
      firstName: "Abdullahi",
      otp: "482193",
      verifyUrl: `${brand.publicUrl}/verify-email?token=482193`,
    }),
  },
  {
    slug: "verification-code",
    document: buildVerificationCodeEmail({
      brand,
      firstName: "Abdullahi",
      otp: "482193",
      verifyUrl: `${brand.publicUrl}/verify-email?token=482193`,
    }),
  },
  {
    slug: "password-reset",
    document: buildPasswordResetEmail({
      brand,
      firstName: "Abdullahi",
      resetUrl: `${brand.publicUrl}/reset-password/preview-token`,
    }),
  },
  {
    slug: "account-activated",
    document: buildAccountActivatedEmail({ brand, firstName: "Abdullahi" }),
  },
  {
    slug: "invitation",
    document: buildInvitationEmail({
      brand,
      inviteUrl: `${brand.publicUrl}/invite/preview-token`,
      organizationName: "Northbound Trading",
    }),
  },
  {
    slug: "request-received",
    document: composeActivityEmail({
      brand,
      eventType: "procurement.request.submitted",
      notificationType: "procurement",
      payload: { requestId: "req-preview", status: "submitted" },
      recipient,
      publicCode: "PR-1024",
      requestTitle: "Industrial pumps for Kano facility",
    }),
  },
  {
    slug: "status-update",
    document: composeActivityEmail({
      brand,
      eventType: "procurement.request.sourcing",
      notificationType: "procurement",
      payload: { requestId: "req-preview", status: "sourcing" },
      recipient,
      publicCode: "PR-1024",
      requestTitle: "Industrial pumps for Kano facility",
    }),
  },
  {
    slug: "clarification-required",
    document: composeActivityEmail({
      brand,
      eventType: "procurement.request.needs_clarification",
      notificationType: "procurement",
      payload: {
        requestId: "req-preview",
        status: "needs_clarification",
        reason: "Please confirm the required voltage and mounting standard for the pump motors.",
      },
      recipient,
      publicCode: "PR-1024",
    }),
  },
  {
    slug: "quotation-available",
    document: composeActivityEmail({
      brand,
      eventType: "procurement.request.quote_issued",
      notificationType: "quotation",
      payload: { requestId: "req-preview", quotationId: "qt-preview" },
      recipient,
      publicCode: "PR-1024",
    }),
  },
  {
    slug: "shipment-update",
    document: composeActivityEmail({
      brand,
      eventType: "shipment.created",
      notificationType: "shipment",
      payload: { shipmentId: "sh-preview", requestId: "req-preview" },
      recipient,
      publicCode: "PR-1024",
    }),
  },
  {
    slug: "support-reply",
    document: composeActivityEmail({
      brand,
      eventType: "support.message",
      notificationType: "support",
      payload: {
        conversationId: "thread-preview",
        excerpt: "We have reviewed the packing list and will confirm the next departure window.",
      },
      recipient,
    }),
  },
  {
    slug: "announcement",
    document: composeActivityEmail({
      brand,
      eventType: "announcement.published",
      notificationType: "announcement",
      payload: {
        announcementId: "an-preview",
        announcementTitle: "Eid operating hours",
        excerpt: "Our operations desk hours for the coming week are listed in your workspace.",
      },
      recipient,
    }),
  },
];

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "../../../../.email-previews");
mkdirSync(outDir, { recursive: true });

const cards = templates.map(({ slug, document }) => {
  const file = `${slug}.html`;
  writeFileSync(join(outDir, file), document.html, "utf8");
  writeFileSync(join(outDir, `${slug}.txt`), document.text, "utf8");
  return `<section>
    <h2>${slug}</h2>
    <p class="subject">${document.subject}</p>
    <div class="frames">
      <iframe title="${slug} desktop" src="${file}" width="620" height="820"></iframe>
      <iframe title="${slug} mobile" src="${file}" width="375" height="820"></iframe>
    </div>
  </section>`;
});

writeFileSync(
  join(outDir, "index.html"),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Almahbub email previews</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; background: #eef3f8; margin: 0; padding: 24px; color: #101828; }
    h1 { color: #123b66; }
    .frames { display: flex; gap: 16px; flex-wrap: wrap; }
    iframe { background: #fff; border: 1px solid #d0d5dd; }
    .subject { color: #344054; }
  </style>
</head>
<body>
  <h1>Almahbub International email previews</h1>
  <p>Desktop (620) and mobile (375) for each template. These files are local only.</p>
  ${cards.join("\n")}
</body>
</html>`,
  "utf8",
);

process.stdout.write(`Wrote ${templates.length} email previews to ${outDir}\n`);
