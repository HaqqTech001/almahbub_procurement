import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { API_V1_PATH } from "@hamd/constants";

import type { Request, Response } from "express";

import type { Environment } from "./config/env.js";
import { isAllowedDevelopmentBrowserOrigin } from "./shared/http/dev-cors-origin.js";
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
import { createRootRouter } from "./routes/root.js";
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
import { createAuthenticate, createOptionalAuthenticate } from "./shared/auth/authenticate.js";
import { AuthRepository } from "./modules/identity/auth/infrastructure/auth-repository.js";
import { AuthService } from "./modules/identity/auth/application/auth-service.js";
import { createAuthEmailGateway, createTransactionalEmailGateway } from "./modules/identity/auth/application/auth-email.js";
import { createEmailBrand } from "./modules/communication/email/email-brand.js";
import { createAuthRouter } from "./modules/identity/auth/api/auth-routes.js";
import { CatalogService } from "./modules/catalog/application/catalog-service.js";
import { createCatalogRouters } from "./modules/catalog/api/catalog-routes.js";
import { createCatalogMediaRouter } from "./modules/catalog/api/catalog-media-routes.js";
import { createCatalogMediaStore } from "./modules/catalog/infrastructure/catalog-media-store.js";
import { createApiAbuseLimiters } from "./middleware/redis-rate-limit.js";
import { IeCommodityService } from "./modules/integrated-export/application/ie-commodity-service.js";
import { createIeCommodityRouter } from "./modules/integrated-export/api/ie-commodity-routes.js";
import { WeddingCampaignService } from "./modules/wedding/application/wedding-campaign-service.js";
import { WeddingParticipationService } from "./modules/wedding/application/wedding-participation-service.js";
import { createWeddingRouter } from "./modules/wedding/api/wedding-routes.js";

export function createApp(
  environment: Environment,
  dependencies: ApiDependencies = {},
): express.Express {
  const app = express();
  const logger = createLogger(environment);
  const allowedOrigins = new Set([
    ...environment.CORS_ORIGINS,
    ...(environment.NODE_ENV === "production"
      ? [
          "https://almahbubinternational.com",
          "https://www.almahbubinternational.com",
        ]
      : []),
  ]);

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
        if (
          environment.NODE_ENV !== "production" &&
          isAllowedDevelopmentBrowserOrigin(origin)
        ) {
          callback(null, origin);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      exposedHeaders: ["Retry-After"],
      maxAge: 86_400,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb", strict: true }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(apiEnvelope);

  app.use(createRootRouter());
  app.use(
    "/health",
    createHealthRouter(environment, createReadinessDependencies(dependencies)),
  );
  app.use(createOpenApiRouter());
  if (dependencies.database) {
    const database = dependencies.database;
    const authenticate = createAuthenticate(database, environment);
    const optionalAuthenticate = createOptionalAuthenticate(
      database,
      environment,
    );
    const authEmailGateway = createAuthEmailGateway(environment);
    const authService = new AuthService(
      new AuthRepository(database),
      environment,
      authEmailGateway,
    );
    const quotationService = new QuotationService(database);
    const invoiceService = new InvoiceService(database);
    const paymentService = new PaymentService(database);
    const shipmentService = new ShipmentService(database);
    const emailGateway = createTransactionalEmailGateway(environment);
    const notificationService = new NotificationService(
      database,
      emailGateway,
      createEmailBrand(environment),
    );
    const procurementService = new ProcurementRequestService(database);
    const documentService = new DocumentService(
      database,
      environment.UPLOAD_ROOT,
    );
    const guidanceService = new GuidanceService(database);
    const catalogMediaStore = createCatalogMediaStore({
        uploadRoot: environment.UPLOAD_ROOT,
        driver: environment.CATALOG_MEDIA_DRIVER,
        nodeEnv: environment.NODE_ENV,
        s3Bucket: environment.CATALOG_MEDIA_S3_BUCKET,
        s3Region: environment.AWS_REGION,
        s3AccessKeyId: environment.AWS_ACCESS_KEY_ID,
        s3SecretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
        s3PublicBaseUrl: environment.CATALOG_MEDIA_S3_PUBLIC_BASE_URL,
        supabaseUrl: environment.CATALOG_MEDIA_SUPABASE_URL,
        supabaseServiceRoleKey: environment.CATALOG_MEDIA_SUPABASE_SERVICE_ROLE_KEY,
        supabaseBucket: environment.CATALOG_MEDIA_SUPABASE_BUCKET,
      });
    const opsService = new OpsService(database, environment.UPLOAD_ROOT, catalogMediaStore);
    const limiters = createApiAbuseLimiters(dependencies.redis);
    const parityService = new ParityService(database, documentService);
    const parityRouters = createParityRouters(
      authenticate,
      parityService,
      limiters.marketing,
      optionalAuthenticate,
    );
    const llmProvider = createLlmProviderFromEnv(environment);
    const copilotService = new CopilotService(database, llmProvider);
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
    app.use(
      `${API_V1_PATH}/public/catalog-media`,
      createCatalogMediaRouter(environment.UPLOAD_ROOT, {
        canServeCatalogEntity: async (entityId) => {
          const product = await database.product.findFirst({
            where: { id: entityId },
            select: { id: true },
          });
          if (product) return true;
          const category = await database.productCategory.findFirst({
            where: { id: entityId },
            select: { id: true },
          });
          if (category) return true;
          const ie = (
            database as unknown as {
              integratedExportCommodity?: {
                findFirst: (args: {
                  where: { id: string };
                  select: { id: true };
                }) => Promise<{ id: string } | null>;
              };
            }
          ).integratedExportCommodity;
          const commodity = await ie?.findFirst({
            where: { id: entityId },
            select: { id: true },
          });
          return Boolean(commodity);
        },
      }),
    );
    const catalogRouters = createCatalogRouters(new CatalogService(database));
    app.use(`${API_V1_PATH}/products`, catalogRouters.products);
    app.use(`${API_V1_PATH}/categories`, catalogRouters.categories);
    app.use(
      `${API_V1_PATH}/integrated-export/commodities`,
      createIeCommodityRouter(
        authenticate,
        optionalAuthenticate,
        new IeCommodityService(
          database,
          catalogMediaStore,
        ),
      ),
    );
    app.use(
      `${API_V1_PATH}/wedding`,
      createWeddingRouter(
        authenticate,
        optionalAuthenticate,
        new WeddingCampaignService(environment, database),
        new WeddingParticipationService(database),
      ),
    );
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
