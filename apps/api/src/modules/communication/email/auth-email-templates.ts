import {
  greetingLine,
  type EmailBrand,
} from "./email-brand.js";
import {
  codeBlock,
  mutedParagraph,
  paragraph,
  renderEmailDocument,
  type EmailDocument,
} from "./email-layout.js";

export function buildWelcomeVerificationEmail(input: {
  readonly brand: EmailBrand;
  readonly firstName: string;
  readonly otp: string;
  readonly verifyUrl: string;
}): EmailDocument {
  const greeting = greetingLine(input.firstName.trim());
  return renderEmailDocument({
    brand: input.brand,
    subject: "Welcome to Almahbub International: verify your email",
    preheader: "Use your verification code to activate your procurement workspace.",
    greeting,
    introHtml: paragraph(
      "Welcome to Almahbub International. Confirm your email to activate your procurement workspace.",
    ),
    explanationHtml:
      `${paragraph("Use this verification code:")}${codeBlock(input.otp)}${mutedParagraph("This code expires in 24 hours. Do not share it with anyone. Almahbub International will never ask you for it.")}`,
    cta: { label: "Verify email address", href: input.verifyUrl },
    detailsHtml: mutedParagraph(`If the button does not work, open: ${input.verifyUrl}`),
    noticeHtml: mutedParagraph("This is a security message for your account, not a procurement update."),
    text: [
      greeting,
      "",
      "Welcome to Almahbub International. Confirm your email to activate your procurement workspace.",
      `Verification code: ${input.otp}`,
      `Or open: ${input.verifyUrl}`,
      "",
      "This code expires in 24 hours.",
      "Do not share this code with anyone. Almahbub International will never ask you for it.",
    ].join("\n"),
  });
}

export function buildVerificationCodeEmail(input: {
  readonly brand: EmailBrand;
  readonly otp: string;
  readonly verifyUrl: string;
  readonly firstName?: string;
}): EmailDocument {
  const greeting = greetingLine(input.firstName?.trim() ?? "");
  return renderEmailDocument({
    brand: input.brand,
    subject: "Your Almahbub International verification code",
    preheader: "Your verification code is ready. It expires in 24 hours.",
    greeting,
    introHtml: paragraph("Use this verification code to confirm your email address."),
    explanationHtml:
      `${codeBlock(input.otp)}${mutedParagraph("This code expires in 24 hours. Do not share it with anyone. Almahbub International will never ask you for this code.")}`,
    cta: { label: "Verify email", href: input.verifyUrl },
    noticeHtml: mutedParagraph("This is a security message for your account, not a procurement update."),
    text: `Your Almahbub International verification code is ${input.otp}. Or open ${input.verifyUrl}. Expires in 24 hours. Do not share this code.`,
  });
}

export function buildAccountActivatedEmail(input: {
  readonly brand: EmailBrand;
  readonly firstName: string;
}): EmailDocument {
  const greeting = greetingLine(input.firstName.trim());
  const signInUrl = `${input.brand.publicUrl}/login`;
  return renderEmailDocument({
    brand: input.brand,
    subject: "Your Almahbub International account is ready",
    preheader: "Your email is verified. You can sign in to your workspace.",
    greeting,
    introHtml: paragraph("Your email is verified. Your Almahbub International procurement workspace is ready."),
    cta: { label: "Sign in", href: signInUrl },
    text: [
      greeting,
      "",
      "Your email is verified and your procurement workspace is active.",
      `Sign in: ${signInUrl}`,
    ].join("\n"),
  });
}

export function buildPasswordResetEmail(input: {
  readonly brand: EmailBrand;
  readonly resetUrl: string;
  readonly firstName?: string;
}): EmailDocument {
  const greeting = greetingLine(input.firstName?.trim() ?? "");
  return renderEmailDocument({
    brand: input.brand,
    subject: "Reset your Almahbub International password",
    preheader: "This password reset link expires in one hour.",
    greeting,
    introHtml: paragraph("We received a request to reset your Almahbub International password."),
    explanationHtml: paragraph("This link expires in one hour. If you did not request a reset, you can ignore this email."),
    cta: { label: "Reset password", href: input.resetUrl },
    noticeHtml: mutedParagraph("Almahbub International will never ask you to share your password or this link."),
    text: [
      greeting,
      "",
      "Reset your Almahbub International password using this link (expires in 1 hour):",
      input.resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

export function buildInvitationEmail(input: {
  readonly brand: EmailBrand;
  readonly inviteUrl: string;
  readonly organizationName?: string;
}): EmailDocument {
  const org = input.organizationName?.trim();
  return renderEmailDocument({
    brand: input.brand,
    subject: "You are invited to Almahbub International",
    preheader: "Accept this invitation to join an organisation workspace.",
    greeting: "Hello,",
    introHtml: paragraph(
      org
        ? `You have been invited to join ${org} on Almahbub International.`
        : "You have been invited to join an organisation on Almahbub International.",
    ),
    explanationHtml: paragraph("This invitation expires in 7 days."),
    cta: { label: "Accept invitation", href: input.inviteUrl },
    text: [
      "Hello,",
      "",
      org
        ? `You have been invited to join ${org} on Almahbub International.`
        : "You have been invited to join an organisation on Almahbub International.",
      `Accept: ${input.inviteUrl}`,
      "This invite expires in 7 days.",
    ].join("\n"),
  });
}
