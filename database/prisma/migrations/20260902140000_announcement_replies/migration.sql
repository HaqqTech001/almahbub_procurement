-- CreateTable
CREATE TABLE "announcement_replies" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "hidden_at" TIMESTAMPTZ,
    "hidden_by_user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcement_replies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcement_replies_announcement_id_created_at_idx" ON "announcement_replies"("announcement_id", "created_at");
CREATE INDEX "announcement_replies_author_user_id_idx" ON "announcement_replies"("author_user_id");

ALTER TABLE "announcement_replies" ADD CONSTRAINT "announcement_replies_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "announcement_replies" ADD CONSTRAINT "announcement_replies_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "announcement_replies" ADD CONSTRAINT "announcement_replies_hidden_by_user_id_fkey" FOREIGN KEY ("hidden_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
