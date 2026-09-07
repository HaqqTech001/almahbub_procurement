-- V1 announcement pin / schedule / expiry, stored as first-class columns
-- instead of free-form status strings.

ALTER TABLE "announcements"
    ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "scheduled_for" TIMESTAMPTZ,
    ADD COLUMN "expires_at" TIMESTAMPTZ;

CREATE INDEX "announcements_pinned_published_at_idx"
    ON "announcements" ("pinned", "published_at" DESC);
