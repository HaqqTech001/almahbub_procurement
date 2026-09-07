-- Sprint 8: governed, versioned quotation aggregate. Quotation documents
-- deliberately hold only document UUID references; document ownership belongs
-- to the future media/document domain.
ALTER TYPE "QuotationStatus" ADD VALUE IF NOT EXISTS 'internally_reviewed';

CREATE TABLE "quotation_families" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "procurement_request_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_families_pkey" PRIMARY KEY ("id")
);

-- Preserve all existing quotations as the first, immutable member of their
-- own family. Reusing the quotation UUID avoids relying on database UUID
-- extension availability during deployment.
INSERT INTO "quotation_families" ("id", "organization_id", "procurement_request_id", "created_at")
SELECT "id", "organization_id", "procurement_request_id", "created_at"
FROM "quotations";

ALTER TABLE "quotations"
  ADD COLUMN "family_id" UUID,
  ADD COLUMN "supersedes_id" UUID,
  ADD COLUMN "version_number" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "subtotal_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "shipping_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "duty_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "other_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "delivery_lead_time_days" INTEGER,
  ADD COLUMN "minimum_order_quantity" DECIMAL(18,4),
  ADD COLUMN "payment_terms" TEXT,
  ADD COLUMN "commercial_terms" TEXT;

UPDATE "quotations" SET "family_id" = "id" WHERE "family_id" IS NULL;
ALTER TABLE "quotations" ALTER COLUMN "family_id" SET NOT NULL;

CREATE TABLE "quotation_documents" (
  "id" UUID NOT NULL,
  "quotation_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotation_history" (
  "id" UUID NOT NULL,
  "quotation_id" UUID NOT NULL,
  "from_status" "QuotationStatus",
  "to_status" "QuotationStatus" NOT NULL,
  "command" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" UUID NOT NULL,
  "row_version" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quotation_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "quotations_family_id_version_number_key"
  ON "quotations"("family_id", "version_number");
CREATE UNIQUE INDEX "quotations_supersedes_id_key"
  ON "quotations"("supersedes_id");
CREATE INDEX "quotations_organization_id_status_created_at_idx"
  ON "quotations"("organization_id", "status", "created_at" DESC);
CREATE INDEX "quotations_organization_id_request_status_created_at_idx"
  ON "quotations"("organization_id", "procurement_request_id", "status", "created_at" DESC);
CREATE INDEX "quotations_organization_id_expires_at_idx"
  ON "quotations"("organization_id", "expires_at");
CREATE INDEX "quotation_families_organization_request_created_at_idx"
  ON "quotation_families"("organization_id", "procurement_request_id", "created_at" DESC);
CREATE UNIQUE INDEX "quotation_documents_quotation_id_document_id_key"
  ON "quotation_documents"("quotation_id", "document_id");
CREATE INDEX "quotation_documents_document_id_idx"
  ON "quotation_documents"("document_id");
CREATE INDEX "quotation_history_quotation_id_created_at_idx"
  ON "quotation_history"("quotation_id", "created_at" DESC);
CREATE INDEX "quotation_history_actor_id_created_at_idx"
  ON "quotation_history"("actor_id", "created_at" DESC);

ALTER TABLE "quotation_families"
  ADD CONSTRAINT "quotation_families_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "quotation_families_procurement_request_id_fkey"
    FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotations"
  ADD CONSTRAINT "quotations_family_id_fkey"
    FOREIGN KEY ("family_id") REFERENCES "quotation_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "quotations_supersedes_id_fkey"
    FOREIGN KEY ("supersedes_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotation_documents"
  ADD CONSTRAINT "quotation_documents_quotation_id_fkey"
    FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotation_history"
  ADD CONSTRAINT "quotation_history_quotation_id_fkey"
    FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "quotation_history_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
