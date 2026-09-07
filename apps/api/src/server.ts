import "./load-env.js";

import { createApp } from "./app.js";
import {
  createApiDependencies,
  disconnectDependencies,
} from "./composition/dependencies.js";
import { parseEnvironment } from "./config/env.js";
import { createLogger } from "./config/logger.js";
import { ensureAdminBootstrap } from "./modules/identity/auth/application/admin-bootstrap.js";
import { createTransactionalEmailGateway } from "./modules/identity/auth/application/auth-email.js";
import { NotificationService } from "./modules/communication/notification/application/notification-service.js";
import { createEmailBrand } from "./modules/communication/email/email-brand.js";
import { startNotificationRelay } from "./workers/start-notification-relay.js";

const environment = parseEnvironment();
const logger = createLogger(environment);
const dependencies = createApiDependencies(environment);

if (dependencies.database) {
  try {
    const result = await ensureAdminBootstrap(dependencies.database, environment);
    if (result) {
      logger.info(
        {
          email: result.email,
          created: result.created,
          organizationId: result.organizationId,
        },
        "Platform admin bootstrap is ensured",
      );
    }
  } catch (error) {
    logger.error(
      { err: error },
      "Failed to ensure the configured platform admin bootstrap account",
    );
    throw error;
  }
}

const app = createApp(environment, dependencies);

let stopNotificationRelay: (() => void) | undefined;
if (dependencies.database) {
  const emailGateway = createTransactionalEmailGateway(environment);
  stopNotificationRelay = startNotificationRelay(
    dependencies.database,
    new NotificationService(
      dependencies.database,
      emailGateway,
      createEmailBrand(environment),
    ),
  );
}

const server = app.listen(environment.API_PORT, environment.API_HOST, () => {
  logger.info(
    {
      host: environment.API_HOST,
      port: environment.API_PORT,
      database: Boolean(environment.DATABASE_URL),
    },
    "HAMD API is listening",
  );
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, "Received shutdown signal");

  server.close(async (error) => {
    if (error) {
      logger.error({ err: error }, "Failed to close HTTP server cleanly");
      process.exitCode = 1;
    }

    try {
      stopNotificationRelay?.();
      await disconnectDependencies(dependencies);
    } catch (disconnectError) {
      logger.error(
        { err: disconnectError },
        "Failed to disconnect dependencies cleanly",
      );
      process.exitCode = 1;
    }

    process.exit();
  });

  setTimeout(() => {
    logger.error("Forced shutdown after grace period");
    process.exit(1);
  }, 10_000).unref();
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
process.once("SIGUSR2", shutdown);
