CREATE TYPE "OutboxEventStatus" AS ENUM ('pending', 'processing', 'published', 'dead_lettered');

ALTER TABLE "outbox_events"
  ADD COLUMN "event_name" TEXT,
  ADD COLUMN "event_version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "actor_id" UUID,
  ADD COLUMN "correlation_id" TEXT,
  ADD COLUMN "causation_id" TEXT,
  ADD COLUMN "metadata" JSONB,
  ADD COLUMN "status" "OutboxEventStatus" NOT NULL DEFAULT 'pending',
  ADD COLUMN "available_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "lease_token" TEXT,
  ADD COLUMN "leased_until" TIMESTAMPTZ;

UPDATE "outbox_events"
SET "event_name" = "event_type",
    "status" = CASE WHEN "published_at" IS NULL THEN 'pending'::"OutboxEventStatus" ELSE 'published'::"OutboxEventStatus" END
WHERE "event_name" IS NULL;

CREATE TABLE "event_consumer_inbox" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "outbox_event_id" UUID NOT NULL,
  "consumer_name" TEXT NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "event_consumer_inbox_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "event_consumer_inbox_outbox_event_id_consumer_name_key" UNIQUE ("outbox_event_id", "consumer_name"),
  CONSTRAINT "event_consumer_inbox_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "event_consumer_inbox_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "dead_letter_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "outbox_event_id" UUID NOT NULL,
  "consumer_name" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL,
  "error_code" TEXT,
  "error_message" TEXT NOT NULL,
  "dead_lettered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dead_letter_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dead_letter_events_outbox_event_id_consumer_name_key" UNIQUE ("outbox_event_id", "consumer_name"),
  CONSTRAINT "dead_letter_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "dead_letter_events_outbox_event_id_fkey" FOREIGN KEY ("outbox_event_id") REFERENCES "outbox_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");
CREATE INDEX "outbox_events_lease_token_leased_until_idx" ON "outbox_events"("lease_token", "leased_until");
CREATE INDEX "event_consumer_inbox_organization_id_consumer_name_processed_at_idx" ON "event_consumer_inbox"("organization_id", "consumer_name", "processed_at" DESC);
CREATE INDEX "dead_letter_events_organization_id_dead_lettered_at_idx" ON "dead_letter_events"("organization_id", "dead_lettered_at" DESC);
