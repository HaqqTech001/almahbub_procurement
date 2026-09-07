CREATE TYPE "NotificationType" AS ENUM ('account', 'procurement', 'quotation', 'invoice', 'payment', 'shipment', 'announcement', 'support', 'system');
CREATE TYPE "NotificationPriority" AS ENUM ('critical', 'high', 'normal', 'low');
CREATE TYPE "NotificationStatus" AS ENUM ('unread', 'read', 'archived', 'deleted', 'expired');
CREATE TYPE "NotificationChannel" AS ENUM ('in_app', 'email', 'sms', 'push');
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('planned', 'sent', 'delivered', 'failed', 'suppressed', 'expired');
CREATE TYPE "CommunicationTemplateStatus" AS ENUM ('draft', 'published', 'archived');

CREATE TABLE "notification_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "outbox_event_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'planned',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  "processed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_events_outbox_event_id_key" UNIQUE ("outbox_event_id"),
  CONSTRAINT "notification_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notification_events_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "recipient_user_id" UUID NOT NULL,
  "notification_event_id" UUID,
  "type" "NotificationType" NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'normal',
  "status" "NotificationStatus" NOT NULL DEFAULT 'unread',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "deep_link" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "metadata" JSONB,
  "read_at" TIMESTAMPTZ,
  "archived_at" TIMESTAMPTZ,
  "deleted_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notifications_notification_event_id_recipient_user_id_key" UNIQUE ("notification_event_id", "recipient_user_id"),
  CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notifications_notification_event_id_fkey" FOREIGN KEY ("notification_event_id") REFERENCES "notification_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "notification_deliveries" (
  "id" UUID NOT NULL,
  "notification_id" UUID NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'planned',
  "destination" TEXT,
  "provider_message_id" TEXT,
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "scheduled_at" TIMESTAMPTZ,
  "sent_at" TIMESTAMPTZ,
  "delivered_at" TIMESTAMPTZ,
  "failed_at" TIMESTAMPTZ,
  "error_code" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_deliveries_notification_id_channel_attempt_key" UNIQUE ("notification_id", "channel", "attempt"),
  CONSTRAINT "notification_deliveries_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "notification_preferences" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "locale" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_preferences_organization_id_user_id_type_channel_key" UNIQUE ("organization_id", "user_id", "type", "channel"),
  CONSTRAINT "notification_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "communication_templates" (
  "id" UUID NOT NULL,
  "organization_id" UUID,
  "key" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "channel" "NotificationChannel" NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "status" "CommunicationTemplateStatus" NOT NULL DEFAULT 'draft',
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_templates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "communication_templates_organization_id_key_channel_locale_key" UNIQUE NULLS NOT DISTINCT ("organization_id", "key", "channel", "locale"),
  CONSTRAINT "communication_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "communication_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "communication_template_versions" (
  "id" UUID NOT NULL,
  "template_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "subject" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "variable_schema" JSONB,
  "status" "CommunicationTemplateStatus" NOT NULL DEFAULT 'draft',
  "published_at" TIMESTAMPTZ,
  "published_by_id" UUID,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "communication_template_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "communication_template_versions_template_id_version_key" UNIQUE ("template_id", "version"),
  CONSTRAINT "communication_template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "communication_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "communication_template_versions_published_by_id_fkey" FOREIGN KEY ("published_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "notification_events_status_created_at_idx" ON "notification_events"("status", "created_at");
CREATE INDEX "notification_events_organization_id_event_type_created_at_idx" ON "notification_events"("organization_id", "event_type", "created_at" DESC);
CREATE INDEX "notifications_organization_id_recipient_user_id_status_created_at_idx" ON "notifications"("organization_id", "recipient_user_id", "status", "created_at" DESC);
CREATE INDEX "notifications_recipient_user_id_deleted_at_created_at_idx" ON "notifications"("recipient_user_id", "deleted_at", "created_at" DESC);
CREATE INDEX "notification_deliveries_status_scheduled_at_idx" ON "notification_deliveries"("status", "scheduled_at");
CREATE INDEX "notification_preferences_user_id_organization_id_idx" ON "notification_preferences"("user_id", "organization_id");
CREATE INDEX "communication_templates_type_channel_locale_status_idx" ON "communication_templates"("type", "channel", "locale", "status");
CREATE INDEX "communication_template_versions_template_id_status_version_idx" ON "communication_template_versions"("template_id", "status", "version" DESC);
