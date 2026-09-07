-- Shipment domain: governed logistics lifecycle, carrier references, append-only
-- evidence/history, and optimistic concurrency.
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'inspection_pending';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'pickup_scheduled';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'export_cleared';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'transshipment';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'quality_checked';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'lost';

ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'inspection_booked';
ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'inspection_passed';
ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'inspection_failed';
ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'quality_checked';
ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'delivery_attempted';
ALTER TYPE "ShipmentMilestoneType" ADD VALUE IF NOT EXISTS 'delivery_confirmed';

CREATE TYPE "ShipmentInspectionStatus" AS ENUM ('pending', 'passed', 'conditional_pass', 'failed', 'not_required');

ALTER TABLE "shipments"
  ADD COLUMN "carrier_name" TEXT,
  ADD COLUMN "tracking_number" TEXT,
  ADD COLUMN "transport_mode" TEXT,
  ADD COLUMN "actual_delivery_at" TIMESTAMPTZ,
  ADD COLUMN "confirmed_by_id" UUID,
  ADD COLUMN "confirmed_at" TIMESTAMPTZ,
  ADD COLUMN "recipient_name" TEXT,
  ADD COLUMN "delivery_evidence" JSONB;

CREATE TABLE "shipment_containers" (
  "id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "container_number" TEXT NOT NULL,
  "container_type" TEXT,
  "seal_number" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_containers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_documents" (
  "id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_inspections" (
  "id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "status" "ShipmentInspectionStatus" NOT NULL DEFAULT 'pending',
  "inspector" TEXT,
  "notes" TEXT,
  "evidence" JSONB,
  "inspected_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_history" (
  "id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "from_status" "ShipmentStatus",
  "to_status" "ShipmentStatus" NOT NULL,
  "command" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" UUID NOT NULL,
  "row_version" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipments_organization_id_carrier_name_tracking_number_idx"
  ON "shipments"("organization_id", "carrier_name", "tracking_number");
CREATE UNIQUE INDEX "shipment_containers_shipment_id_container_number_key"
  ON "shipment_containers"("shipment_id", "container_number");
CREATE INDEX "shipment_containers_container_number_idx" ON "shipment_containers"("container_number");
CREATE UNIQUE INDEX "shipment_documents_shipment_id_document_id_role_key"
  ON "shipment_documents"("shipment_id", "document_id", "role");
CREATE INDEX "shipment_documents_document_id_idx" ON "shipment_documents"("document_id");
CREATE INDEX "shipment_inspections_shipment_id_status_created_at_idx"
  ON "shipment_inspections"("shipment_id", "status", "created_at" DESC);
CREATE INDEX "shipment_history_shipment_id_created_at_idx"
  ON "shipment_history"("shipment_id", "created_at" DESC);
CREATE INDEX "shipment_history_actor_id_created_at_idx"
  ON "shipment_history"("actor_id", "created_at" DESC);

ALTER TABLE "shipments"
  ADD CONSTRAINT "shipments_confirmed_by_id_fkey"
    FOREIGN KEY ("confirmed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "shipment_containers"
  ADD CONSTRAINT "shipment_containers_shipment_id_fkey"
    FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipment_documents"
  ADD CONSTRAINT "shipment_documents_shipment_id_fkey"
    FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipment_inspections"
  ADD CONSTRAINT "shipment_inspections_shipment_id_fkey"
    FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipment_history"
  ADD CONSTRAINT "shipment_history_shipment_id_fkey"
    FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "shipment_history_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
