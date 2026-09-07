-- Sprint 9: governed invoice aggregate, sourceable only from issued POs.
ALTER TABLE "invoices"
  ALTER COLUMN "purchase_order_id" SET NOT NULL,
  ADD COLUMN "exchange_rate" DECIMAL(18,8),
  ADD COLUMN "subtotal_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "shipping_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "duty_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "other_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN "voided_at" TIMESTAMPTZ,
  ADD COLUMN "void_reason" TEXT,
  ADD COLUMN "row_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "invoice_items" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "purchase_order_item_id" UUID,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "unit_amount" DECIMAL(18,2) NOT NULL,
  "line_amount" DECIMAL(18,2) NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_documents" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_history" (
  "id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "from_status" "InvoiceStatus",
  "to_status" "InvoiceStatus" NOT NULL,
  "command" TEXT NOT NULL,
  "reason" TEXT,
  "actor_id" UUID NOT NULL,
  "row_version" INTEGER NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_items_invoice_id_idx" ON "invoice_items"("invoice_id");
CREATE INDEX "invoice_items_purchase_order_item_id_idx" ON "invoice_items"("purchase_order_item_id");
CREATE UNIQUE INDEX "invoice_documents_invoice_id_document_id_key"
  ON "invoice_documents"("invoice_id", "document_id");
CREATE INDEX "invoice_documents_document_id_idx" ON "invoice_documents"("document_id");
CREATE INDEX "invoice_history_invoice_id_created_at_idx"
  ON "invoice_history"("invoice_id", "created_at" DESC);
CREATE INDEX "invoice_history_actor_id_created_at_idx"
  ON "invoice_history"("actor_id", "created_at" DESC);

ALTER TABLE "invoice_items"
  ADD CONSTRAINT "invoice_items_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "invoice_items_purchase_order_item_id_fkey"
    FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_documents"
  ADD CONSTRAINT "invoice_documents_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "invoice_history"
  ADD CONSTRAINT "invoice_history_invoice_id_fkey"
    FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "invoice_history_actor_id_fkey"
    FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
