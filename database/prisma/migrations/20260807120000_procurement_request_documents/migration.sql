-- Procurement request attachment storage (V1 parity)

CREATE TABLE "stored_documents" (
  "id" UUID NOT NULL,
  "organization_id" UUID NOT NULL,
  "uploaded_by_id" UUID NOT NULL,
  "original_filename" TEXT NOT NULL,
  "stored_filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "storage_provider" TEXT NOT NULL DEFAULT 'local',
  "storage_path" TEXT NOT NULL,
  "checksum_sha256" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "procurement_request_documents" (
  "id" UUID NOT NULL,
  "procurement_request_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "procurement_request_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stored_documents_organization_id_created_at_idx" ON "stored_documents"("organization_id", "created_at" DESC);
CREATE INDEX "stored_documents_uploaded_by_id_created_at_idx" ON "stored_documents"("uploaded_by_id", "created_at" DESC);
CREATE UNIQUE INDEX "procurement_request_documents_procurement_request_id_document_id_key" ON "procurement_request_documents"("procurement_request_id", "document_id");
CREATE INDEX "procurement_request_documents_document_id_idx" ON "procurement_request_documents"("document_id");

ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stored_documents" ADD CONSTRAINT "stored_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "procurement_request_documents" ADD CONSTRAINT "procurement_request_documents_procurement_request_id_fkey" FOREIGN KEY ("procurement_request_id") REFERENCES "procurement_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "procurement_request_documents" ADD CONSTRAINT "procurement_request_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "stored_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
