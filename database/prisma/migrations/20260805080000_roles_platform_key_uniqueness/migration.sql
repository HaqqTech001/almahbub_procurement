-- PostgreSQL treats NULL as distinct in unique indexes, so
-- @@unique([organizationId, key]) cannot prevent duplicate platform roles
-- (organization_id IS NULL). Replace with partial unique indexes.

DROP INDEX IF EXISTS "roles_organization_id_key_key";

CREATE UNIQUE INDEX "roles_organization_id_key_uidx"
  ON "roles"("organization_id", "key")
  WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX "roles_platform_key_uidx"
  ON "roles"("key")
  WHERE "organization_id" IS NULL;
