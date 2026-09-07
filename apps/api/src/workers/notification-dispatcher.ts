import "dotenv/config";

import { createApiDatabaseClient } from "../shared/database/database-client.js";
import { parseEnvironment } from "../config/env.js";
import { createTransactionalEmailGateway } from "../modules/identity/auth/application/auth-email.js";
import { NotificationEventConsumer } from "../modules/communication/notification/application/notification-event-consumer.js";
import { NotificationService } from "../modules/communication/notification/application/notification-service.js";
import { createEmailBrand } from "../modules/communication/email/email-brand.js";
import { DomainEventRelay } from "../shared/events/event-relay.js";

const environment = parseEnvironment();
if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required to run the notification dispatcher.");

const database = createApiDatabaseClient(environment.DATABASE_URL);
const emailGateway = createTransactionalEmailGateway(environment);

try {
  const notifications = new NotificationService(
    database,
    emailGateway,
    createEmailBrand(environment),
  );
  const processed = await new DomainEventRelay(database, [new NotificationEventConsumer(notifications)]).relayPending();
  console.log(`Notification dispatcher relayed ${processed} domain events.`);
} finally {
  await database.$disconnect();
}
