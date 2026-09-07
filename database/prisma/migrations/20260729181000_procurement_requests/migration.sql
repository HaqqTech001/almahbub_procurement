-- CreateEnum
CREATE TYPE "ProcurementRequestStatus" AS ENUM ('draft', 'submitted', 'needs_clarification', 'sourcing', 'quote_issued', 'approved', 'declined', 'purchase_in_progress', 'fulfilled', 'cancelled', 'closed');

-- CreateTable
CREATE TABLE "procurement_requests" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "public_code" TEXT NOT NULL,
    "status" "ProcurementRequestStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "currency_code" CHAR(3) NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "row_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_request_items" (
    "id" UUID NOT NULL,
    "procurement_request_id" UUID NOT NULL,
    "product_variant_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(18,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "target_unit_amount" DECIMAL(18,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "procurement_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "procurement_requests_organization_id_status_created_at_idx" ON "procurement_requests"("organization_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "procurement_requests_organization_id_public_code_key" ON "procurement_requests"("organization_id", "public_code");

-- CreateIndex
CREATE INDEX "procurement_request_items_procurement_request_id_idx" ON "procurement_request_items"("procurement_request_id");

-- CreateIndex
CREATE INDEX "procurement_request_items_product_variant_id_idx" ON "procurement_request_items"("product_variant_id");

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_request_items" ADD CONSTRAINT "procurement_request_items_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_request_items" ADD CONSTRAINT "procurement_request_items_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
