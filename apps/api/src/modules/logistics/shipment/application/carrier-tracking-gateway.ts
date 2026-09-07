/**
 * Integration boundary for future carrier/forwarder adapters. No provider is
 * wired in Sprint 10; operations records normalized tracking facts manually.
 */
export interface CarrierTrackingGateway {
  registerTracking(input: {
    shipmentId: string;
    carrierName: string;
    trackingNumber: string;
  }): Promise<void>;
  normalizeInboundEvent(input: {
    provider: string;
    payload: unknown;
  }): Promise<NormalizedTrackingEvent | null>;
}

export interface NormalizedTrackingEvent {
  readonly trackingNumber: string;
  readonly eventType: string;
  readonly observedAt?: Date;
  readonly location?: string;
  readonly rawReference?: string;
}

export class NoopCarrierTrackingGateway implements CarrierTrackingGateway {
  public async registerTracking(): Promise<void> {
    // Intentionally no-op until a carrier provider is approved and configured.
  }

  public async normalizeInboundEvent(): Promise<null> {
    return null;
  }
}
