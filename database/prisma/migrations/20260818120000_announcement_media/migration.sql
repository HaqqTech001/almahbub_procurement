-- V1 announcement media_files: join announcements to stored_documents (max 5 enforced in API).

CREATE TABLE "announcement_media" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "document_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcement_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "announcement_media_announcement_id_document_id_key" ON "announcement_media"("announcement_id", "document_id");
CREATE INDEX "announcement_media_document_id_idx" ON "announcement_media"("document_id");
CREATE INDEX "announcement_media_announcement_id_sort_order_idx" ON "announcement_media"("announcement_id", "sort_order");

ALTER TABLE "announcement_media" ADD CONSTRAINT "announcement_media_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_media" ADD CONSTRAINT "announcement_media_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "stored_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
