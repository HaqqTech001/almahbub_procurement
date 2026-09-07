import type { Environment } from "../../../../config/env.js";
import {
  createEmailBrand,
  formatFromAddress,
} from "../../../communication/email/email-brand.js";
import {
  ResendEmailGateway,
  type EmailGateway,
} from "../../../communication/notification/application/notification-gateways.js";

export type AuthEmailPayload = {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
};

export {
  buildAccountActivatedEmail,
  buildInvitationEmail,
  buildPasswordResetEmail,
  buildVerificationCodeEmail,
  buildWelcomeVerificationEmail,
} from "../../../communication/email/auth-email-templates.js";
export { appPublicUrl, createEmailBrand } from "../../../communication/email/email-brand.js";

/** Development / test email sink - persists delivery in logs, never invents success in DB. */
export class ConsoleEmailGateway implements EmailGateway {
  public async send(input: AuthEmailPayload): Promise<{ readonly providerMessageId: string }> {
    const id = `console-${Date.now()}`;
    process.stdout.write(
      `[auth-email] to=${input.to} subject=${input.subject} (body omitted)\n`,
    );
    return { providerMessageId: id };
  }
}

/**
 * Prefer Resend when configured; in non-production, fall back to console so
 * registration/verification still works if the provider rejects the recipient.
 */
export class ResilientAuthEmailGateway implements EmailGateway {
  public constructor(
    private readonly primary: EmailGateway,
    private readonly fallback: EmailGateway,
    private readonly allowFallback: boolean,
  ) {}

  public async send(input: AuthEmailPayload): Promise<{ readonly providerMessageId: string }> {
    try {
      const result = await this.primary.send(input);
      process.stdout.write(
        `[auth-email] delivered via resend id=${result.providerMessageId} to=${input.to} subject=${input.subject}\n`,
      );
      return result;
    } catch (error) {
      if (!this.allowFallback) throw error;
      console.warn(
        "[auth-email] Resend delivery failed; using console sink.",
        error instanceof Error ? error.message : error,
      );
      return this.fallback.send(input);
    }
  }
}

function authEmailProviderFlag(): string {
  return (
    process.env.AUTH_EMAIL_PROVIDER ??
    process.env.EMAIL_PROVIDER ??
    ""
  )
    .trim()
    .toLowerCase();
}

export function shouldUseResendAuthEmail(environment: Environment): boolean {
  const configured = Boolean(
    environment.RESEND_API_KEY?.trim() && environment.EMAIL_FROM,
  );
  if (!configured) return false;

  const flag = authEmailProviderFlag();
  if (flag === "console") return false;
  if (environment.NODE_ENV === "test") return flag === "resend";
  return true;
}

export function createTransactionalEmailGateway(
  environment: Environment,
): ResendEmailGateway | undefined {
  if (!environment.RESEND_API_KEY?.trim() || !environment.EMAIL_FROM) return undefined;
  const brand = createEmailBrand(environment);
  return new ResendEmailGateway(
    environment.RESEND_API_KEY,
    formatFromAddress(environment),
    brand.replyTo,
  );
}

export function createAuthEmailGateway(
  environment: Environment,
): EmailGateway {
  const consoleGateway = new ConsoleEmailGateway();
  if (!shouldUseResendAuthEmail(environment)) {
    process.stdout.write(
      "[auth-email] using console sink (set RESEND_API_KEY + EMAIL_FROM to send real mail).\n",
    );
    return consoleGateway;
  }

  const resend = createTransactionalEmailGateway(environment);
  if (!resend) return consoleGateway;
  if (environment.NODE_ENV === "production") {
    process.stdout.write("[auth-email] using Resend.\n");
    return resend;
  }

  process.stdout.write(
    "[auth-email] using Resend with console fallback for local delivery errors.\n",
  );
  return new ResilientAuthEmailGateway(resend, consoleGateway, true);
}
