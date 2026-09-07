-- CreateEnum
CREATE TYPE "ProcurementRequestLob" AS ENUM ('international', 'integrated_export');

-- AlterTable: existing rows become international (NOT NULL DEFAULT backfills).
ALTER TABLE "procurement_requests"
ADD COLUMN "lob" "ProcurementRequestLob" NOT NULL DEFAULT 'international';

-- CreateIndex: LOB-scoped listing by organization / recency
CREATE INDEX "procurement_requests_organization_id_lob_created_at_idx"
ON "procurement_requests"("organization_id", "lob", "created_at" DESC);
