import type { OutboxEvent } from "@hamd/database";

import type { DatabaseClient } from "../database/database-client.js";

export interface DomainEventConsumer {
  readonly name: string;
  consume(event: OutboxEvent): Promise<void>;
}

export interface EventQueueAdapter {
  publish(event: OutboxEvent): Promise<void>;
}

export class DomainEventRelay {
  public constructor(private readonly database: DatabaseClient, private readonly consumers: readonly DomainEventConsumer[], private readonly maxAttempts = 8) {}

  public async relayPending(limit = 25): Promise<number> {
    const events = await this.database.outboxEvent.findMany({
      where: { status: "pending", availableAt: { lte: new Date() } },
      orderBy: { occurredAt: "asc" },
      take: limit,
    });
    let processed = 0;
    for (const event of events) {
      const claimed = await this.database.outboxEvent.updateMany({
        where: { id: event.id, status: "pending", availableAt: { lte: new Date() } },
        data: { status: "processing", leaseToken: crypto.randomUUID(), leasedUntil: new Date(Date.now() + 60_000) },
      });
      if (!claimed.count) continue;
      try {
        for (const consumer of this.consumers) {
          const seen = await this.database.eventConsumerInbox.findUnique({ where: { outboxEventId_consumerName: { outboxEventId: event.id, consumerName: consumer.name } } });
          if (seen) continue;
          await consumer.consume(event);
          await this.database.eventConsumerInbox.create({ data: { organizationId: event.organizationId, outboxEventId: event.id, consumerName: consumer.name } });
        }
        await this.database.outboxEvent.update({ where: { id: event.id }, data: { status: "published", publishedAt: new Date(), leaseToken: null, leasedUntil: null, lastError: null } });
        processed += 1;
      } catch (error) {
        await this.fail(event, error);
      }
    }
    return processed;
  }

  private async fail(event: OutboxEvent, error: unknown): Promise<void> {
    const attempts = event.attempts + 1;
    const message = error instanceof Error ? error.message.slice(0, 1_000) : "Domain event relay failed.";
    if (attempts >= this.maxAttempts) {
      await this.database.$transaction(async (transaction) => {
        await transaction.deadLetterEvent.upsert({
          where: { outboxEventId_consumerName: { outboxEventId: event.id, consumerName: "relay" } },
          create: { organizationId: event.organizationId, outboxEventId: event.id, consumerName: "relay", attempts, errorMessage: message },
          update: { attempts, errorMessage: message, deadLetteredAt: new Date() },
        });
        await transaction.outboxEvent.update({ where: { id: event.id }, data: { attempts, lastError: message, status: "dead_lettered", leaseToken: null, leasedUntil: null } });
      });
      return;
    }
    await this.database.outboxEvent.update({
      where: { id: event.id },
      data: { attempts, lastError: message, status: "pending", availableAt: new Date(Date.now() + retryDelay(attempts)), leaseToken: null, leasedUntil: null },
    });
  }
}

export function retryDelay(attempt: number): number {
  return Math.min(300_000, 1_000 * 2 ** Math.min(attempt, 8));
}
