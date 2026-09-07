import type { OutboxEvent } from "@hamd/database";

import type { DomainEventConsumer } from "../../../../shared/events/event-relay.js";
import type { NotificationService } from "./notification-service.js";

export class NotificationEventConsumer implements DomainEventConsumer {
  public readonly name = "notification";

  public constructor(private readonly notificationService: NotificationService) {}

  public async consume(event: OutboxEvent): Promise<void> {
    await this.notificationService.consumeOutboxEvent(event);
  }
}
