import { describe, expect, it } from "vitest";

import { composeActivityEmail } from "./activity-email.js";
import {
  buildVerificationCodeEmail,
  buildWelcomeVerificationEmail,
} from "./auth-email-templates.js";
import { createEmailBrand } from "./email-brand.js";
import { escapeHtml, renderEmailDocument } from "./email-layout.js";
import { resolveActivityPath } from "./email-paths.js";

const brand = createEmailBrand({
  APP_PUBLIC_URL: "https://buyer.example.com",
  EMAIL_FROM: "notifications@example.com",
  EMAIL_FROM_NAME: "Almahbub International",
  EMAIL_LOGO_URL: "https://buyer.example.com/almahbub.svg",
  EMAIL_CONTACT: "almahbubinternational@gmail.com",
});

const emojiPattern = /\p{Extended_Pictographic}/u;
const emDashPattern = /[\u2013\u2014]/;

function assertBranded(html: string, text: string, subject: string) {
  expect(html).toContain(brand.logoUrl);
  expect(html).toContain('alt="Almahbub International"');
  expect(html).toContain("Almahbub International");
  expect(html).toContain("almahbubinternational@gmail.com");
  expect(html).not.toContain("procurement@almahbubinternational");
  expect(html).not.toMatch(emojiPattern);
  expect(subject).not.toMatch(emojiPattern);
  expect(text).not.toMatch(emojiPattern);
  expect(`${html}${text}${subject}`).not.toMatch(emDashPattern);
  expect(text.length).toBeGreaterThan(20);
}

describe("Almahbub email design system", () => {
  it("renders a branded wrapper with logo, footer and public contact", () => {
    const document = renderEmailDocument({
      brand,
      subject: "Almahbub International: Preview",
      preheader: "A short preview of this message.",
      greeting: "Hello Abdullahi,",
      introHtml: "<p>Body</p>",
      text: "Hello Abdullahi,\nBody",
    });
    expect(document.html).toContain("hamd-email-shell");
    expect(document.html).toContain("max-width:100%");
    expect(document.html).toContain("display:none");
    assertBranded(document.html, document.text, document.subject);
  });

  it("escapes user-provided HTML in templates", () => {
    expect(escapeHtml(`<script>alert(1)</script>`)).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    const mail = composeActivityEmail({
      brand,
      eventType: "procurement.request.needs_clarification",
      notificationType: "procurement",
      payload: {
        requestId: "req-1",
        reason: `<img src=x onerror=alert(1)> Please confirm the voltage.`,
        actorId: "staff-user-should-not-appear",
        internalNotes: "Do not show this staff-only note.",
      },
      recipient: { firstName: "Ada" },
      publicCode: "PR-1024",
    });
    expect(mail.html).toContain("&lt;img src=x");
    expect(mail.html).not.toContain("<img src=x");
    expect(mail.html).not.toContain("staff-user-should-not-appear");
    expect(mail.html).not.toContain("Do not show this staff-only note.");
    expect(mail.html).toContain("Provide Clarification");
    expect(mail.html).toContain(
      "https://buyer.example.com/app/requests/req-1#clarification",
    );
    expect(mail.subject).toContain("PR-1024");
    assertBranded(mail.html, mail.text, mail.subject);
  });

  it("requires an entity CTA for activity emails and never uses the homepage", () => {
    const mail = composeActivityEmail({
      brand,
      eventType: "procurement.request.sourcing",
      notificationType: "procurement",
      payload: { requestId: "req-88", status: "sourcing" },
      recipient: { firstName: "Abdullahi" },
      publicCode: "PR-1024",
      requestTitle: "Industrial pumps",
    });
    expect(mail.html).toContain("View Request");
    expect(mail.html).toContain("https://buyer.example.com/app/requests/req-88");
    expect(mail.html).not.toContain('href="https://buyer.example.com/"');
    expect(mail.html).not.toContain("/app\"");
    expect(mail.subject).toBe("Almahbub International: Update on request PR-1024");
    expect(mail.html).toContain("Hello Abdullahi,");
    assertBranded(mail.html, mail.text, mail.subject);
  });

  it("points quotation, shipment, payment and announcement CTAs at the related record", () => {
    const quotation = composeActivityEmail({
      brand,
      eventType: "procurement.request.quote_issued",
      notificationType: "quotation",
      payload: { requestId: "req-1", quotationId: "qt-9" },
      recipient: { firstName: "Ada" },
      publicCode: "PR-9",
    });
    expect(quotation.html).toContain("View Quotation");
    expect(quotation.html).toContain("/app/quotations/qt-9");

    const shipment = composeActivityEmail({
      brand,
      eventType: "shipment.created",
      notificationType: "shipment",
      payload: { shipmentId: "sh-1", requestId: "req-1" },
      recipient: { firstName: "Ada" },
      publicCode: "PR-9",
    });
    expect(shipment.html).toContain("View Shipment");
    expect(shipment.html).toContain("/app/shipments/sh-1");

    const payment = composeActivityEmail({
      brand,
      eventType: "payment.confirmed",
      notificationType: "payment",
      payload: { paymentId: "pay-1" },
      recipient: { firstName: "Ada" },
    });
    expect(payment.html).toContain("View Payment");
    expect(payment.html).toContain("/app/payments/pay-1");

    const announcement = composeActivityEmail({
      brand,
      eventType: "announcement.published",
      notificationType: "announcement",
      payload: {
        announcementId: "an-1",
        announcementTitle: "Port schedule",
        excerpt: "Updated berth windows.",
      },
      recipient: { firstName: "Ada" },
    });
    expect(announcement.html).toContain("View Announcement");
    expect(announcement.html).toContain("/app/announcements/an-1");
    expect(announcement.html).not.toContain("every reply");
  });

  it("does not put a generic activity CTA on OTP mail", () => {
    const mail = buildVerificationCodeEmail({
      brand,
      otp: "211072",
      verifyUrl: "https://buyer.example.com/verify-email?token=211072",
      firstName: "Ada",
    });
    expect(mail.html).toContain("211072");
    expect(mail.html).toContain("Verify email");
    expect(mail.html).not.toContain("View Request");
    expect(mail.html).not.toContain("View Notification");
    expect(mail.text).toContain("211072");
    assertBranded(mail.html, mail.text, mail.subject);
  });

  it("keeps welcome verification branded and includes a plaintext alternative", () => {
    const mail = buildWelcomeVerificationEmail({
      brand,
      firstName: "Ada",
      otp: "100001",
      verifyUrl: "https://buyer.example.com/verify-email?token=100001",
    });
    expect(mail.subject).toMatch(/Welcome to Almahbub International/i);
    expect(mail.text).toContain("Verification code: 100001");
    assertBranded(mail.html, mail.text, mail.subject);
  });

  it("resolves activity paths without sending users to a generic dashboard", () => {
    expect(resolveActivityPath("procurement", { requestId: "r1" })).toBe(
      "/app/requests/r1",
    );
    expect(resolveActivityPath("quotation", { quotationId: "q1" })).toBe(
      "/app/quotations/q1",
    );
    expect(resolveActivityPath("support", { conversationId: "c1" })).toBe(
      "/app/support?room=c1",
    );
  });
});
