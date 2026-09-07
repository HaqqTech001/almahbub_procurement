import { readResponseBody, toCancelledRequestError, unwrapEnvelopeData, fetchWithTransientRetry } from "@hamd/ui/auth";

import { browserApiBase } from "../lib/api-origin.js";

type Envelope<T> = { data: T };

function apiBase(): string {
  return browserApiBase();
}

function apiUrl(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

export class ParityApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ParityApiError";
    this.status = status;
  }
}

async function parityFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.accessToken) headers.Authorization = `Bearer ${options.accessToken}`;

  let response: Response;
  try {
    response = await fetchWithTransientRetry(apiUrl(path), {
      method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      credentials: "include",
    });
  } catch (error) {
    const cancelled = toCancelledRequestError(error);
    if (cancelled) throw cancelled;
    throw error;
  }

  const body = await readResponseBody(response);
  if (!response.ok) {
    const envelope = body as { error?: { message?: string } } | null;
    throw new ParityApiError(
      envelope?.error?.message ?? "We couldn't complete this action.",
      response.status,
    );
  }
  if (response.status === 204 || response.status === 205 || body == null) {
    return undefined as T;
  }
  return unwrapEnvelopeData<T>(body);
}

export type AnnouncementMediaItem = {
  id: string;
  documentId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: string;
  href: string;
  sortOrder: number;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  status: string;
  publishedAt: string | null;
  pinned?: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  media?: AnnouncementMediaItem[];
};

export type SupportMessageRow = {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  fromOps: boolean;
  readAt: string | null;
  createdAt: string;
};

export type SupportThreadPayload = {
  id: string;
  subject: string;
  status: string;
  requesterId: string;
  messages: SupportMessageRow[];
  createdAt: string;
  updatedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function unwrapAnnouncementListPayload(body: unknown): AnnouncementRow[] {
  if (Array.isArray(body)) return body as AnnouncementRow[];
  if (isRecord(body) && Array.isArray(body.data)) return body.data as AnnouncementRow[];
  if (isRecord(body) && Array.isArray(body.announcements)) {
    return body.announcements as AnnouncementRow[];
  }
  if (isRecord(body) && isRecord(body.data) && Array.isArray(body.data.announcements)) {
    return body.data.announcements as AnnouncementRow[];
  }
  throw new ParityApiError("Invalid announcement list payload.", 500);
}

export async function listAnnouncements(): Promise<AnnouncementRow[]> {
  const rows = unwrapAnnouncementListPayload(await parityFetch("/announcements"));
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    console.info("[announcements]", {
      count: rows.length,
      records: rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        scheduledFor: row.scheduledFor ?? null,
        publishedAt: row.publishedAt,
        expiresAt: row.expiresAt ?? null,
      })),
    });
  }
  return rows;
}

export function getAnnouncement(idOrSlug: string): Promise<AnnouncementRow> {
  return parityFetch(`/announcements/${encodeURIComponent(idOrSlug)}`);
}

export type AnnouncementReplyRow = {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
  hidden?: boolean;
};

export function listAnnouncementReplies(
  idOrSlug: string,
  query: { cursor?: string } = {},
): Promise<{ items: AnnouncementReplyRow[]; nextCursor: string | null }> {
  const params = query.cursor ? `?cursor=${encodeURIComponent(query.cursor)}` : "";
  return parityFetch(`/announcements/${encodeURIComponent(idOrSlug)}/replies${params}`);
}

export function createAnnouncementReply(
  accessToken: string,
  idOrSlug: string,
  body: string,
): Promise<AnnouncementReplyRow> {
  return parityFetch(`/announcements/${encodeURIComponent(idOrSlug)}/replies`, {
    method: "POST",
    accessToken,
    body: { body },
  });
}

export type AnnouncementReactionCount = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export function listAnnouncementReactions(
  idOrSlug: string,
  accessToken?: string,
): Promise<AnnouncementReactionCount[]> {
  return parityFetch(`/announcements/${encodeURIComponent(idOrSlug)}/reactions`, {
    ...(accessToken ? { accessToken } : {}),
  });
}

export function toggleAnnouncementReaction(
  accessToken: string,
  idOrSlug: string,
  emoji: string,
): Promise<AnnouncementReactionCount[]> {
  return parityFetch(`/announcements/${encodeURIComponent(idOrSlug)}/reactions`, {
    method: "POST",
    accessToken,
    body: { emoji },
  });
}

export function getSupportThread(accessToken: string): Promise<SupportThreadPayload> {
  return parityFetch("/support/thread", { accessToken });
}

export function sendSupportMessage(
  accessToken: string,
  body: string,
): Promise<SupportMessageRow> {
  return parityFetch("/support/messages", {
    method: "POST",
    accessToken,
    body: { body },
  });
}

export function autoRespond(
  accessToken: string,
  message: string,
): Promise<{ matched: boolean; reply: string; question?: string }> {
  return parityFetch("/ai/auto-respond", {
    method: "POST",
    accessToken,
    body: { message },
  });
}
