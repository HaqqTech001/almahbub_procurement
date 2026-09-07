import type { Prisma } from "@hamd/database";

export type AnnouncementVisibilityFields = {
  status: string;
  publishedAt: Date | null;
  scheduledFor?: Date | null;
  expiresAt?: Date | null;
};

export function isLivePublishedAnnouncement(
  row: AnnouncementVisibilityFields,
  now = new Date(),
): boolean {
  if (String(row.status).trim().toLowerCase() !== "published") return false;
  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) return false;
  return true;
}

export function publishedAnnouncementWhere(
  now = new Date(),
): Prisma.AnnouncementWhereInput {
  return {
    status: { equals: "published", mode: "insensitive" },
    AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
  };
}
