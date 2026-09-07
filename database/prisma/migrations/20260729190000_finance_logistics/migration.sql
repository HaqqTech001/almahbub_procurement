-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('draft', 'issued', 'paid', 'partially_paid', 'overdue', 'voided');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('draft', 'requested', 'initiated', 'pending_confirmation', 'confirmed', 'allocated', 'settled', 'failed', 'refunded', 'voided', 'disputed');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('planned', 'supplier_ready', 'picked_up', 'departed', 'arrived', 'import_cleared', 'warehouse_received', 'dispatched', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'held');

-- CreateEnum
CREATE TYPE "ShipmentMilestoneType" AS ENUM ('po_confirmed', 'supplier_ready', 'pickup_scheduled', 'picked_up', 'export_cleared', 'departed', 'transshipment', 'arrived', 'import_cleared', 'warehouse_arrival', 'dispatched', 'out_for_delivery', 'delivered', 'completed', 'exception_opened');

-- CreateEnum
CREATE TYPE "MilestoneConfidence" AS ENUM ('confirmed', 'probable', 'estimated', 'unverified');

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "purchase_order_id" UUID,
    "invoice_number" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'draft',
    "currency_code" CHAR(3) NOT NULL DEFAULT 'USD',
    "total_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "due_at" TIMESTAMPTZ,
    "issued_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "provider_reference" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'draft',
    "currency_code" CHAR(3) NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(18,2) NOT NULL,
    "confirmed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_allocations" (
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "allocated_amount" DECIMAL(18,2) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_allocations_pkey" PRIMARY KEY ("payment_id","invoice_id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "purchase_order_id" UUID NOT NULL,
    "public_code" TEXT NOT NULL,
    "public_tracking_token_hash" TEXT,
    "public_tracking_expires_at" TIMESTAMPTZ,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'planned',
    "estimated_arrival_at" TIMESTAMPTZ,
    "row_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_milestones" (
    "id" UUID NOT NULL,
    "shipment_id" UUID NOT NULL,
    "type" "ShipmentMilestoneType" NOT NULL,
    "confidence" "MilestoneConfidence" NOT NULL DEFAULT 'unverified',
    "occurred_at" TIMESTAMPTZ,
    "estimated_at" TIMESTAMPTZ,
    "location" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_organization_id_status_due_at_idx" ON "invoices"("organization_id", "status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_organization_id_invoice_number_key" ON "invoices"("organization_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_reference_key" ON "payments"("provider_reference");

-- CreateIndex
CREATE INDEX "payments_organization_id_status_created_at_idx" ON "payments"("organization_id", "status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "shipments_public_tracking_token_hash_key" ON "shipments"("public_tracking_token_hash");

-- CreateIndex
CREATE INDEX "shipments_organization_id_status_estimated_arrival_at_idx" ON "shipments"("organization_id", "status", "estimated_arrival_at");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_organization_id_public_code_key" ON "shipments"("organization_id", "public_code");

-- CreateIndex
CREATE INDEX "shipment_milestones_shipment_id_occurred_at_idx" ON "shipment_milestones"("shipment_id", "occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_milestones" ADD CONSTRAINT "shipment_milestones_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
