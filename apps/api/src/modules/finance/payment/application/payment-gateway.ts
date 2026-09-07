export interface PaymentGateway {
  createManualReference(input: {
    readonly paymentId: string;
    readonly idempotencyKey: string;
  }): Promise<{ readonly providerReference: string }>;
}

/**
 * Deliberately local-only: a finance operator records externally settled
 * transfer evidence. No provider credentials or live payment SDK are used.
 */
export class ManualPaymentGateway implements PaymentGateway {
  public async createManualReference(input: {
    readonly paymentId: string;
    readonly idempotencyKey: string;
  }): Promise<{ readonly providerReference: string }> {
    return { providerReference: `manual:${input.paymentId}:${input.idempotencyKey}` };
  }
}
