import { isUsableTermiiSenderId } from "@hamd/constants";

import type { Environment } from "../../../config/env.js";
import type { SmsGateway } from "../../communication/notification/application/notification-gateways.js";

export type TermiiSendResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
};

/**
 * Promotional/event SMS via Termii. Sender ID is taken only from env.
 */
export class TermiiSmsGateway implements SmsGateway {
  public constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly senderId: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  public async send(input: { readonly to: string; readonly body: string }): Promise<void> {
    const result = await this.sendDetailed(input);
    if (!result.ok) {
      throw new Error(result.error ?? "SMS delivery failed.");
    }
  }

  public async sendDetailed(input: {
    readonly to: string;
    readonly body: string;
  }): Promise<TermiiSendResult> {
    if (!isUsableTermiiSenderId(this.senderId)) {
      process.stderr.write(
        "[wedding-sms] configured TERMII_SENDER_ID is not a usable alphanumeric sender (3–11 characters). SMS skipped.\n",
      );
      return { ok: false, error: "TERMII_SENDER_INVALID" };
    }
    const endpoint = `${this.baseUrl.replace(/\/$/, "")}/api/sms/send`;
    const to = input.to.replace(/^\+/, "");
    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          to,
          from: this.senderId.trim(),
          sms: input.body,
          type: "plain",
          channel: "generic",
          api_key: this.apiKey,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message_id?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        return {
          ok: false,
          error: "TERMII_REJECTED",
        };
      }
      return {
        ok: true,
        ...(payload?.message_id ? { providerMessageId: payload.message_id } : {}),
      };
    } catch {
      return { ok: false, error: "TERMII_UNAVAILABLE" };
    }
  }
}

export function createTermiiSmsGateway(
  environment: Environment,
): TermiiSmsGateway | undefined {
  const key = environment.TERMII_API_KEY?.trim();
  const base = environment.TERMII_BASE_URL?.trim();
  const sender = environment.TERMII_SENDER_ID?.trim();
  if (!key || !base || !sender) return undefined;
  if (environment.NODE_ENV !== "production" && !isUsableTermiiSenderId(sender)) {
    process.stderr.write(
      "[wedding-sms] TERMII_SENDER_ID failed local validation. SMS remains disabled.\n",
    );
  }
  return new TermiiSmsGateway(key, base, sender);
}

export function assertTermiiSenderAtStartup(environment: Environment): void {
  const sender = environment.TERMII_SENDER_ID?.trim();
  if (!sender) return;
  if (!isUsableTermiiSenderId(sender)) {
    process.stderr.write(
      "[wedding-sms] TERMII_SENDER_ID is configured but not usable (need 3–11 alphanumeric characters). SMS will fail closed.\n",
    );
  }
}
