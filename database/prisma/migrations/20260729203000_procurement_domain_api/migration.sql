-- Expand the Procurement Request aggregate for governed, tenant-scoped
-- workflow commands. This migration assumes the new HAMD database contains no
-- unowned requests; production imports must backfill requester ownership first.
ALTER TYPE "ProcurementRequestStatus" ADD VALUE IF NOT EXISTS 'accepted_for_sourcing';
ALTER TYPE "ProcurementRequestStatus" ADD VALUE IF NOT EXISTS 'revision_requested';
ALTER TYPE "ProcurementRequestStatus" ADD VALUE IF NOT EXISTS 'expired';

CREATE TYPE "ProcurementRequestPriority" AS ENUM ('low', 'normal', 'high', 'urgent');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "procurement_requests") THEN
    RAISE EXCEPTION
      'Procurement Request ownership must be backfilled before Sprint 7 migration.';
  END IF;
END $$;

ALTER TABLE "procurement_requests"
  ADD COLUMN "requester_id" UUID NOT NULL,
  ADD COLUMN "destination_country_code" CHAR(2),
  ADD COLUMN "destination_address" TEXT,
  ADD COLUMN "required_by_date" DATE,
  ADD COLUMN "budget_amount" DECIMAL(18,2),
  ADD COLUMN "priority" "ProcurementRequestPriority" NOT NULL DEFAULT 'normal',
  ADD COLUMN "restricted_goods_declared" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archived_at" TIMESTAMPTZ,
  ADD COLUMN "archived_by_id" UUID,
  ADD COLUMN "duplicated_from_id" UUID;

CREATE TABLE "procurement_request_assignments" (
  "id" UUID NOT NULL,
  "procurement_request_id" UUID NOT NULL,
  "membership_id" UUID NOT NULL,
  "assigned_by_id" UUID NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT true,
  "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "unassigned_at" TIMESTAMPTZ,
  CONSTRAINT "procurement_request_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_request_status_events" (
  "id" UUID NOT NULL,
  "procurement_request_id" UUID NOT NULL,
  "from_status" "ProcurementRequestStatus",
  "to_status" "ProcurementRequestStatus" NOT NULL,
  "command" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" UUID NOT NULL,
  "row_version" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procurement_request_status_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "actor_id" UUID,
  "action" TEXT NOT NULL,
  "resource_type" TEXT NOT NULL,
  "resource_id" UUID NOT NULL,
  "request_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_events" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "aggregate_type" TEXT NOT NULL,
  "aggregate_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMPTZ,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "last_error" TEXT,
  CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "procurement_requests_organization_id_requester_id_created_at_idx"
  ON "procurement_requests"("organization_id", "requester_id", "created_at" DESC);
CREATE INDEX "procurement_requests_organization_id_deleted_at_status_created_at_idx"
  ON "procurement_requests"("organization_id", "deleted_at", "status", "created_at" DESC);
CREATE INDEX "procurement_request_assignments_request_id_unassigned_at_idx"
  ON "procurement_request_assignments"("procurement_request_id", "unassigned_at");
CREATE INDEX "procurement_request_assignments_membership_id_unassigned_at_idx"
  ON "procurement_request_assignments"("membership_id", "unassigned_at");
CREATE INDEX "procurement_request_status_events_request_id_created_at_idx"
  ON "procurement_request_status_events"("procurement_request_id", "created_at" DESC);
CREATE INDEX "procurement_request_status_events_actor_id_created_at_idx"
  ON "procurement_request_status_events"("actor_id", "created_at" DESC);
CREATE INDEX "audit_events_organization_resource_created_at_idx"
  ON "audit_events"("organization_id", "resource_type", "resource_id", "created_at" DESC);
CREATE INDEX "audit_events_actor_id_created_at_idx"
  ON "audit_events"("actor_id", "created_at" DESC);
CREATE INDEX "outbox_events_published_at_occurred_at_idx"
  ON "outbox_events"("published_at", "occurred_at");
CREATE INDEX "outbox_events_organization_aggregate_occurred_at_idx"
  ON "outbox_events"("organization_id", "aggregate_type", "aggregate_id", "occurred_at");

ALTER TABLE "procurement_requests"
  ADD CONSTRAINT "procurement_requests_requester_id_fkey"
  FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "procurement_requests_archived_by_id_fkey"
  FOREIGN KEY ("archived_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "procurement_requests_duplicated_from_id_fkey"
  FOREIGN KEY ("duplicated_from_id") REFERENCES "procurement_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procurement_request_assignments"
  ADD CONSTRAINT "procurement_request_assignments_request_id_fkey"
  FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "procurement_request_assignments_membership_id_fkey"
  FOREIGN KEY ("membership_id") REFERENCES "organization_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "procurement_request_assignments_assigned_by_id_fkey"
  FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "procurement_request_status_events"
  ADD CONSTRAINT "procurement_request_status_events_request_id_fkey"
  FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "procurement_request_status_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_events"
  ADD CONSTRAINT "audit_events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "audit_events_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "outbox_events"
  ADD CONSTRAINT "outbox_events_organization_id_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
