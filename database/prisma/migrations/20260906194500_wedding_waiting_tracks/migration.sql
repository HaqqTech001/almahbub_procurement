-- Durable Ops-managed waiting playlist for Rowdotul HAMD'26.
-- Campaign row is created if the wedding tables were not migrated yet.

DO $$ BEGIN
  CREATE TYPE "WeddingStreamStatus" AS ENUM ('draft', 'upcoming', 'live', 'ended', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wedding_campaigns" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "stream_status" "WeddingStreamStatus" NOT NULL DEFAULT 'upcoming',
  "overlay" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wedding_campaigns_slug_key" ON "wedding_campaigns"("slug");

CREATE TABLE IF NOT EXISTS "wedding_waiting_tracks" (
  "id" UUID NOT NULL,
  "wedding_campaign_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "caption" TEXT NOT NULL DEFAULT '',
  "storage_key" TEXT NOT NULL,
  "src" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "duration_seconds" DOUBLE PRECISION,
  "position" INTEGER NOT NULL DEFAULT 0,
  "is_enabled" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_waiting_tracks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wedding_waiting_tracks_wedding_campaign_id_position_idx"
  ON "wedding_waiting_tracks"("wedding_campaign_id", "position");

DO $$ BEGIN
  ALTER TABLE "wedding_waiting_tracks"
    ADD CONSTRAINT "wedding_waiting_tracks_wedding_campaign_id_fkey"
    FOREIGN KEY ("wedding_campaign_id") REFERENCES "wedding_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wedding_comments" (
  "id" UUID NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "user_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "hidden" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wedding_comments_campaign_id_created_at_idx"
  ON "wedding_comments"("campaign_id", "created_at");

DO $$ BEGIN
  ALTER TABLE "wedding_comments"
    ADD CONSTRAINT "wedding_comments_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "wedding_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "wedding_comments"
    ADD CONSTRAINT "wedding_comments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wedding_gallery_items" (
  "id" UUID NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "src" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "caption" TEXT NOT NULL DEFAULT '',
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "downloadable" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_gallery_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "wedding_gallery_items_campaign_id_sort_order_idx"
  ON "wedding_gallery_items"("campaign_id", "sort_order");

DO $$ BEGIN
  ALTER TABLE "wedding_gallery_items"
    ADD CONSTRAINT "wedding_gallery_items_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "wedding_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "wedding_recordings" (
  "id" UUID NOT NULL,
  "campaign_id" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "public_url" TEXT,
  "duration_seconds" INTEGER,
  "size_bytes" INTEGER,
  "mime_type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "downloadable" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_recordings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "wedding_recordings_campaign_id_key"
  ON "wedding_recordings"("campaign_id");

DO $$ BEGIN
  ALTER TABLE "wedding_recordings"
    ADD CONSTRAINT "wedding_recordings_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "wedding_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO "wedding_campaigns" ("id", "slug", "stream_status", "overlay", "created_at", "updated_at")
VALUES (
  'founder-wedding-september-2026',
  'rowdotul-hamd-26',
  'upcoming',
  '{
    "id": "founder-wedding-september-2026",
    "slug": "rowdotul-hamd-26",
    "title": "Rowdotul HAMD''26",
    "tagline": "A beautiful union begins",
    "coupleNames": "",
    "familyLine": "Together with their families",
    "invitationHeading": "Alhamdulillah",
    "invitationBody": "cordially invite you to celebrate their wedding",
    "eventAt": "2026-09-29",
    "streamAt": "2026-09-29",
    "venue": "",
    "venueAddress": "",
    "modalEnabled": true,
    "modalStartsAt": "2026-08-01T00:00:00+01:00",
    "modalEndsAt": "2026-10-02T00:00:00.000Z",
    "streamStatus": "upcoming",
    "galleryEnabled": true,
    "commentsEnabled": true,
    "recordingAvailable": false,
    "recordingDownloadEnabled": false,
    "campaignStatus": "upcoming",
    "sitePath": "/rowdotul-hamd-26",
    "livePath": "/rowdotul-hamd-26/live",
    "liveMode": "none",
    "endedKind": "none",
    "waitingMusicEnabled": false,
    "waitingMusicLoop": true,
    "primaryFeedId": null
  }'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
