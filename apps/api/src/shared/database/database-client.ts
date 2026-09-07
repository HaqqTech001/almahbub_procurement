import { createDatabaseClient, type PrismaClient } from "@hamd/database";

export type DatabaseClient = PrismaClient;

type AnnouncementReplyRecord = {
  id: string;
  announcementId: string;
  authorUserId: string;
  body: string;
  hiddenAt: Date | null;
  hiddenByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: { firstName: string; lastName: string; displayName: string | null };
};

type AnnouncementReplyDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<AnnouncementReplyRecord[]>;
  findUnique: (args: Record<string, unknown>) => Promise<AnnouncementReplyRecord | null>;
  create: (args: Record<string, unknown>) => Promise<AnnouncementReplyRecord>;
  update: (args: Record<string, unknown>) => Promise<AnnouncementReplyRecord>;
};

/** Prisma TypeMap can lag newly generated models in this workspace's tsc graph. */
export function announcementReplyDelegate(
  database: DatabaseClient,
): AnnouncementReplyDelegate {
  return (database as unknown as { announcementReply: AnnouncementReplyDelegate })
    .announcementReply;
}

type AnnouncementReactionRecord = {
  id: string;
  announcementId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
};

type AnnouncementReactionDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<AnnouncementReactionRecord[]>;
  findUnique: (args: Record<string, unknown>) => Promise<AnnouncementReactionRecord | null>;
  create: (args: Record<string, unknown>) => Promise<AnnouncementReactionRecord>;
  delete: (args: Record<string, unknown>) => Promise<AnnouncementReactionRecord>;
};

export function announcementReactionDelegate(
  database: DatabaseClient,
): AnnouncementReactionDelegate {
  return (database as unknown as { announcementReaction: AnnouncementReactionDelegate })
    .announcementReaction;
}

type CategoryMediaFields = {
  description: string | null;
  imageUrl: string | null;
  imageAlt?: string | null;
  imageStorageKey?: string | null;
  imageMimeType?: string | null;
  imageBytes?: number | null;
};

export function withCategoryMedia<T>(row: T): T & CategoryMediaFields {
  return row as T & CategoryMediaFields;
}

export function categoryWriteData(data: Record<string, unknown>): never {
  return data as never;
}

/** Prisma TypeMap in this workspace can lag ProductImage / Category media columns. */
export function mediaWriteData(data: Record<string, unknown>): never {
  return data as never;
}

export function createApiDatabaseClient(databaseUrl: string): DatabaseClient {
  return createDatabaseClient(databaseUrl);
}

type WeddingWaitingTrackRecord = {
  id: string;
  weddingCampaignId: string;
  title: string;
  caption: string;
  storageKey: string;
  src: string;
  mimeType: string;
  fileSize: number;
  durationSeconds: number | null;
  position: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type WeddingWaitingTrackDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<WeddingWaitingTrackRecord[]>;
  upsert: (args: Record<string, unknown>) => Promise<WeddingWaitingTrackRecord>;
  update: (args: Record<string, unknown>) => Promise<WeddingWaitingTrackRecord>;
  delete: (args: Record<string, unknown>) => Promise<WeddingWaitingTrackRecord>;
  deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
};

type WeddingCampaignDelegate = {
  upsert: (args: Record<string, unknown>) => Promise<{ id: string }>;
  findUnique: (args: Record<string, unknown>) => Promise<{
    id?: string;
    slug?: string;
    streamStatus?: string;
    overlay?: unknown;
  } | null>;
};

/** Prisma TypeMap can lag newly generated wedding playlist models. */
export function weddingWaitingTrackDelegate(database: DatabaseClient): WeddingWaitingTrackDelegate {
  return (database as unknown as { weddingWaitingTrack: WeddingWaitingTrackDelegate }).weddingWaitingTrack;
}

export function weddingCampaignDelegate(database: DatabaseClient): WeddingCampaignDelegate {
  return (database as unknown as { weddingCampaign: WeddingCampaignDelegate }).weddingCampaign;
}
