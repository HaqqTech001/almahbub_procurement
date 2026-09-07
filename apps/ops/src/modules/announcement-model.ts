export type AnnouncementStatus = "draft" | "published" | "archived";

export type AnnouncementMediaItem = {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  href: string;
  sizeBytes: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  body: string;
  status: string;
  publishedAt: string | null;
  pinned?: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  viewCount: number;
  updatedAt: string;
  organizationId?: string | null;
  media?: AnnouncementMediaItem[];
};

export const ANNOUNCEMENT_MEDIA_MAX = 3;

export const ANNOUNCEMENT_MEDIA_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
] as const;

export const ANNOUNCEMENT_MEDIA_ACCEPT = ANNOUNCEMENT_MEDIA_MIMES.join(",");

export function isAnnouncementMediaFile(file: File): boolean {
  return (ANNOUNCEMENT_MEDIA_MIMES as readonly string[]).includes(file.type);
}

export function announcementMediaKind(mimeType: string): "image" | "video" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

export const emptyAnnouncementForm = {
  title: "",
  slug: "",
  summary: "",
  body: "",
  status: "draft" as AnnouncementStatus,
  pinned: false,
  scheduledFor: "",
  expiresAt: "",
};

export function slugifyAnnouncement(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toIsoOrNull(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function announcementAudience(row: AnnouncementRow): string {
  return row.organizationId ? "Organisation" : "Global public";
}

export function announcementStatusLabel(status: string): string {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}
