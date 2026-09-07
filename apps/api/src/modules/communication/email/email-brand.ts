import type { Environment } from "../../../config/env.js";

export const ALMAHBUB_CONTACT_EMAIL = "almahbubinternational@gmail.com";
export const ALMAHBUB_BRAND_NAME = "Almahbub International";

export type EmailBrand = {
  readonly brandName: string;
  readonly publicUrl: string;
  readonly logoUrl: string;
  readonly logoAlt: string;
  readonly contactEmail: string;
  readonly fromAddress: string;
  readonly replyTo: string;
};

export function appPublicUrl(environment: Pick<Environment, "APP_PUBLIC_URL">): string {
  return environment.APP_PUBLIC_URL?.replace(/\/$/, "") ?? "http://localhost:5173";
}

export function formatFromAddress(
  environment: Pick<Environment, "EMAIL_FROM" | "EMAIL_FROM_NAME">,
): string {
  const email = environment.EMAIL_FROM;
  if (!email) return `${ALMAHBUB_BRAND_NAME} <${ALMAHBUB_CONTACT_EMAIL}>`;
  const name = environment.EMAIL_FROM_NAME?.trim() || ALMAHBUB_BRAND_NAME;
  return `${name} <${email}>`;
}

export function createEmailBrand(
  environment: Partial<
    Pick<
      Environment,
      | "APP_PUBLIC_URL"
      | "EMAIL_FROM"
      | "EMAIL_FROM_NAME"
      | "EMAIL_REPLY_TO"
      | "EMAIL_LOGO_URL"
      | "EMAIL_CONTACT"
    >
  > = {},
): EmailBrand {
  const publicUrl = appPublicUrl(environment);
  const contactEmail = environment.EMAIL_CONTACT?.trim() || ALMAHBUB_CONTACT_EMAIL;
  return {
    brandName: ALMAHBUB_BRAND_NAME,
    publicUrl,
    logoUrl: environment.EMAIL_LOGO_URL?.trim() || `${publicUrl}/almahbub.svg`,
    logoAlt: ALMAHBUB_BRAND_NAME,
    contactEmail,
    fromAddress: formatFromAddress(environment),
    replyTo: environment.EMAIL_REPLY_TO?.trim() || contactEmail,
  };
}

export function absolutePublicUrl(brand: EmailBrand, path: string): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${brand.publicUrl}${normalised}`;
}

/** Email CTAs point at the real destination. Login returnTo is handled by the web app. */
export function activityDestinationUrl(brand: EmailBrand, path: string): string {
  return absolutePublicUrl(brand, path);
}

export function greetingName(input: {
  readonly firstName?: string | null;
  readonly displayName?: string | null;
}): string {
  const display = input.displayName?.trim();
  if (display) return display.split(/\s+/)[0] ?? display;
  const first = input.firstName?.trim();
  if (first) return first;
  return "";
}

export function greetingLine(name: string): string {
  return name ? `Hello ${name},` : "Hello,";
}
