import { domainEventEnvelopeSchema, type DomainEventEnvelope } from "@hamd/contracts";
import type { Prisma } from "@hamd/database";

export interface PublishDomainEventInput extends Omit<DomainEventEnvelope, "id" | "occurredAt" | "metadata" | "version"> {
  readonly legacyEventType?: string;
}

export async function publishDomainEvent(
  transaction: Prisma.TransactionClient,
  input: PublishDomainEventInput,
): Promise<void> {
  const { legacyEventType, ...eventInput } = input;
  const event = domainEventEnvelopeSchema.parse({
    ...eventInput,
    id: crypto.randomUUID(),
    version: 1,
    occurredAt: new Date(),
    metadata: { schemaVersion: 1 },
  });
  await transaction.outboxEvent.create({
    data: {
      id: event.id,
      organizationId: event.organizationId,
      aggregateType: event.aggregate.type,
      aggregateId: event.aggregate.id,
      eventType: legacyEventType ?? event.name,
      eventName: event.name,
      eventVersion: event.version,
      ...(event.actor ? { actorId: event.actor.id } : {}),
      ...(event.correlationId ? { correlationId: event.correlationId } : {}),
      ...(event.causationId ? { causationId: event.causationId } : {}),
      metadata: event.metadata,
      payload: event.payload as Prisma.InputJsonValue,
      occurredAt: event.occurredAt,
    },
  });
}
