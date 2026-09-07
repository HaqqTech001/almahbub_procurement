import { NotificationEventConsumer } from "../modules/communication/notification/application/notification-event-consumer.js";
import type { NotificationService } from "../modules/communication/notification/application/notification-service.js";
import type { DatabaseClient } from "../shared/database/database-client.js";
import { DomainEventRelay } from "../shared/events/event-relay.js";

export function startNotificationRelay(
  database: DatabaseClient,
  notifications: NotificationService,
  intervalMs = 2_000,
): () => void {
  const relay = new DomainEventRelay(database, [
    new NotificationEventConsumer(notifications),
  ]);
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await relay.relayPending(50);
    } catch {
      /* next tick */
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(() => {
    void tick();
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
