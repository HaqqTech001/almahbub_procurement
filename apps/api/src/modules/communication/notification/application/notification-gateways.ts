import { Resend } from "resend";

export interface EmailGateway {
  send(input: { readonly to: string; readonly subject: string; readonly text: string; readonly html: string }): Promise<{ readonly providerMessageId: string }>;
}

export interface SmsGateway {
  send(_input: { readonly to: string; readonly body: string }): Promise<void>;
}

export interface PushGateway {
  send(_input: { readonly recipientUserId: string; readonly title: string; readonly body: string }): Promise<void>;
}

export class ResendEmailGateway implements EmailGateway {
  private readonly client: Resend;

  public constructor(
    apiKey: string,
    private readonly from: string,
    private readonly replyTo?: string,
  ) {
    this.client = new Resend(apiKey);
  }

  public async send(input: { readonly to: string; readonly subject: string; readonly text: string; readonly html: string }): Promise<{ readonly providerMessageId: string }> {
    const result = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      ...(this.replyTo ? { replyTo: this.replyTo } : {}),
    });
    if (result.error || !result.data?.id) throw new Error(result.error?.message ?? "Email provider did not return a message ID.");
    return { providerMessageId: result.data.id };
  }
}

export class UnsupportedSmsGateway implements SmsGateway {
  public async send(): Promise<void> { throw new Error("SMS delivery is not configured."); }
}

export class UnsupportedPushGateway implements PushGateway {
  public async send(): Promise<void> { throw new Error("Push delivery is not configured."); }
}
