import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { API_V1_PATH } from "@hamd/constants";

import type { Request, Response } from "express";

import type { Environment } from "./config/env.js";
import {
  createReadinessDependencies,
  type ApiDependencies,
} from "./composition/dependencies.js";
import { createLogger } from "./config/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiEnvelope } from "./middleware/api-envelope.js";
import { requestContext } from "./middleware/request-context.js";
import { createHealthRouter } from "./routes/health.js";
import { createOpenApiRouter } from "./routes/openapi.js";
import { ProcurementRequestService } from "./modules/procurement/application/procurement-request-service.js";
import { createProcurementRequestRouter } from "./modules/procurement/api/procurement-request-routes.js";
import { DocumentService } from "./modules/media/document/application/document-service.js";
import { createDocumentRouter } from "./modules/media/document/api/document-routes.js";
import { QuotationService } from "./modules/procurement/quotation/application/quotation-service.js";
import { createQuotationRouter } from "./modules/procurement/quotation/api/quotation-routes.js";
import { InvoiceService } from "./modules/finance/invoice/application/invoice-service.js";
import { createInvoiceRouter } from "./modules/finance/invoice/api/invoice-routes.js";
import { PaymentService } from "./modules/finance/payment/application/payment-service.js";
import { createPaymentRouter } from "./modules/finance/payment/api/payment-routes.js";
import { ShipmentService } from "./modules/logistics/shipment/application/shipment-service.js";
import { createShipmentRouter } from "./modules/logistics/shipment/api/shipment-routes.js";
import { NotificationService } from "./modules/communication/notification/application/notification-service.js";
import { ResendEmailGateway } from "./modules/communication/notification/application/notification-gateways.js";
import { createCommunicationTemplateRouter, createNotificationPreferenceRouter, createNotificationRouter } from "./modules/communication/notification/api/notification-routes.js";
import { GuidanceService } from "./modules/communication/guidance/application/guidance-service.js";
import { createGuidanceAdminRouter, createGuidanceRouter } from "./modules/communication/guidance/api/guidance-routes.js";
import { OpsService } from "./modules/ops/application/ops-service.js";
import { createOpsRouter } from "./modules/ops/api/ops-routes.js";
import { ParityService } from "./modules/communication/parity/application/parity-service.js";
import { createParityRouters } from "./modules/communication/parity/api/parity-routes.js";
import { CopilotService } from "./modules/ai/application/copilot-service.js";
import { createCopilotRouter } from "./modules/ai/api/copilot-routes.js";
import { createLlmProviderFromEnv } from "./modules/ai/providers/create-llm-gateway.js";
import { createAuthenticate } from "./shared/auth/authenticate.js";
import { AuthRepository } from "./modules/identity/auth/infrastructure/auth-repository.js";
import { AuthService } from "./modules/identity/auth/application/auth-service.js";
import { createAuthEmailGateway } from "./modules/identity/auth/application/auth-email.js";
import { createAuthRouter } from "./modules/identity/auth/api/auth-routes.js";
import { createApiAbuseLimiters } from "./middleware/redis-rate-limit.js";

export function createApp(
  environment: Environment,
  dependencies: ApiDependencies = {},
): express.Express {
  const app = express();
  const logger = createLogger(environment);
  const allowedOrigins = new Set(environment.CORS_ORIGINS);

  app.disable("x-powered-by");
  if (environment.TRUST_PROXY > 0) {
    app.set("trust proxy", environment.TRUST_PROXY);
  }
  app.use(requestContext);
  app.use(
    pinoHttp<Request, Response>({
      logger,
      customProps: (_request, response) => ({
        requestId: response.locals.requestId as string,
      }),
      autoLogging: {
        ignore: (request) => request.url.startsWith("/health/"),
      },
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: "no-referrer" },
      hsts:
        environment.NODE_ENV === "production"
          ? { maxAge: 31536000, includeSubDomains: true, preload: false }
          : false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
      maxAge: 86_400,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(apiEnvelope);

  app.use(
    "/health",
    createHealthRouter(environment, createReadinessDependencies(dependencies)),
  );
  app.use(createOpenApiRouter());
  if (dependencies.database) {
    const authenticate = createAuthenticate(dependencies.database, environment);
    const authEmailGateway = createAuthEmailGateway(environment);
    const authService = new AuthService(
      new AuthRepository(dependencies.database),
      environment,
      authEmailGateway,
    );
    const procurementService = new ProcurementRequestService(
      dependencies.database,
    );
    const documentService = new DocumentService(
      dependencies.database,
      environment.UPLOAD_ROOT,
    );
    const quotationService = new QuotationService(dependencies.database);
    const invoiceService = new InvoiceService(dependencies.database);
    const paymentService = new PaymentService(dependencies.database);
    const shipmentService = new ShipmentService(dependencies.database);
    const emailGateway = environment.RESEND_API_KEY && environment.EMAIL_FROM
      ? new ResendEmailGateway(environment.RESEND_API_KEY, environment.EMAIL_FROM)
      : undefined;
    const notificationService = new NotificationService(dependencies.database, emailGateway);
    const guidanceService = new GuidanceService(dependencies.database);
    const opsService = new OpsService(dependencies.database);
    const limiters = createApiAbuseLimiters(dependencies.redis);
    const parityService = new ParityService(dependencies.database);
    const parityRouters = createParityRouters(
      authenticate,
      parityService,
      limiters.marketing,
    );
    const llmProvider = createLlmProviderFromEnv(environment);
    const copilotService = new CopilotService(
      dependencies.database,
      llmProvider,
    );
    app.use(API_V1_PATH, limiters.api);
    app.use(
      `${API_V1_PATH}/auth`,
      createAuthRouter(authenticate, authService, environment, limiters.auth),
    );
    app.use(
      `${API_V1_PATH}/procurement-requests`,
      createProcurementRequestRouter(authenticate, procurementService),
    );
    app.use(
      `${API_V1_PATH}/documents`,
      createDocumentRouter(authenticate, documentService),
    );
    app.use(
      `${API_V1_PATH}/quotations`,
      createQuotationRouter(authenticate, quotationService),
    );
    app.use(
      `${API_V1_PATH}/invoices`,
      createInvoiceRouter(authenticate, invoiceService),
    );
    app.use(
      `${API_V1_PATH}/payments`,
      createPaymentRouter(authenticate, paymentService),
    );
    app.use(
      `${API_V1_PATH}/shipments`,
      createShipmentRouter(authenticate, shipmentService),
    );
    app.use(
      `${API_V1_PATH}/notifications`,
      createNotificationRouter(authenticate, notificationService),
    );
    app.use(
      `${API_V1_PATH}/notification-preferences`,
      createNotificationPreferenceRouter(authenticate, notificationService),
    );
    app.use(
      `${API_V1_PATH}/admin/communication/templates`,
      createCommunicationTemplateRouter(authenticate, notificationService),
    );
    app.use(
      `${API_V1_PATH}/guidance`,
      createGuidanceRouter(authenticate, guidanceService),
    );
    app.use(
      `${API_V1_PATH}/admin/guidance`,
      createGuidanceAdminRouter(authenticate, guidanceService),
    );
    app.use(`${API_V1_PATH}/ops`, createOpsRouter(authenticate, opsService));
    app.use(`${API_V1_PATH}/announcements`, parityRouters.announcements);
    app.use(`${API_V1_PATH}/support`, parityRouters.support);
    app.use(
      `${API_V1_PATH}/ai`,
      createCopilotRouter(authenticate, copilotService, limiters.ai),
    );
    app.use(`${API_V1_PATH}/ai`, parityRouters.ai);
    app.use(`${API_V1_PATH}/services`, parityRouters.services);
    app.use(`${API_V1_PATH}/marketing`, parityRouters.marketing);
  }
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
