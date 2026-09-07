CREATE TABLE "announcement_reactions" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "announcement_reactions_announcement_id_user_id_emoji_key" ON "announcement_reactions"("announcement_id", "user_id", "emoji");
CREATE INDEX "announcement_reactions_announcement_id_idx" ON "announcement_reactions"("announcement_id");
CREATE INDEX "announcement_reactions_user_id_idx" ON "announcement_reactions"("user_id");

ALTER TABLE "announcement_reactions" ADD CONSTRAINT "announcement_reactions_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_reactions" ADD CONSTRAINT "announcement_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
