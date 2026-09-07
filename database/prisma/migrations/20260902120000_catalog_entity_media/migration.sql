-- Catalog entity media metadata for admin-managed images.

ALTER TABLE "product_categories"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "image_url" TEXT,
  ADD COLUMN IF NOT EXISTS "image_alt" TEXT,
  ADD COLUMN IF NOT EXISTS "image_storage_key" TEXT,
  ADD COLUMN IF NOT EXISTS "image_mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "image_bytes" INTEGER;

ALTER TABLE "product_images"
  ADD COLUMN IF NOT EXISTS "storage_key" TEXT,
  ADD COLUMN IF NOT EXISTS "mime_type" TEXT,
  ADD COLUMN IF NOT EXISTS "file_size" INTEGER,
  ADD COLUMN IF NOT EXISTS "caption" TEXT,
  ADD COLUMN IF NOT EXISTS "is_primary" BOOLEAN NOT NULL DEFAULT false;
