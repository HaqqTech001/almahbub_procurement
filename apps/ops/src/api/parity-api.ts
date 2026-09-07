import { opsFetch } from "../lib/ops-fetch.js";
import { browserApiBase } from "../lib/api-origin.js";

export type OpsSupportThreadRow = {
  id: string;
  subject: string;
  status: string;
  requesterEmail: string;
  requesterName: string;
  messageCount: number;
  unreadCount?: number;
  lastMessage: {
    id: string;
    body: string;
    fromOps: boolean;
    createdAt: string;
  } | null;
  updatedAt: string;
};

export type OpsSupportThreadDetail = {
  id: string;
  subject: string;
  status: string;
  requesterEmail: string;
  requesterName: string;
  messages: Array<{
    id: string;
    body: string;
    fromOps: boolean;
    createdAt: string;
  }>;
};

export type KnowledgeArticleRow = Record<string, unknown> & {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
  hitCount: number;
};

export type AnnouncementAdminRow = Record<string, unknown> & {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  status: string;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
};

export function listOpsSupportThreads(
  accessToken: string,
): Promise<OpsSupportThreadRow[]> {
  return opsFetch("/support/threads", { accessToken });
}

export function getOpsSupportThread(
  accessToken: string,
  threadId: string,
): Promise<OpsSupportThreadDetail> {
  return opsFetch(`/support/threads/${encodeURIComponent(threadId)}`, {
    accessToken,
  });
}

export function replyOpsSupport(
  accessToken: string,
  threadId: string,
  body: string,
): Promise<unknown> {
  return opsFetch("/support/reply", {
    method: "POST",
    accessToken,
    body: { threadId, body },
  });
}

export function listKnowledgeArticles(
  accessToken: string,
): Promise<KnowledgeArticleRow[]> {
  return opsFetch("/ai/knowledge", { accessToken });
}

export function createKnowledgeArticle(
  accessToken: string,
  input: {
    question: string;
    answer: string;
    keywords?: string[];
    active?: boolean;
  },
): Promise<KnowledgeArticleRow> {
  return opsFetch("/ai/knowledge", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updateKnowledgeArticle(
  accessToken: string,
  id: string,
  input: Partial<{
    question: string;
    answer: string;
    keywords: string[];
    active: boolean;
  }>,
): Promise<KnowledgeArticleRow> {
  return opsFetch(`/ai/knowledge/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function deleteKnowledgeArticle(
  accessToken: string,
  id: string,
): Promise<void> {
  return opsFetch(`/ai/knowledge/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function listAnnouncementsPublic(): Promise<AnnouncementAdminRow[]> {
  const base = browserApiBase();
  const url = `${base}/api/v1/announcements`;
  const response = await fetch(url.startsWith("http") ? url : "/api/v1/announcements", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Unable to load announcements.");
  }
  const body = (await response.json()) as { data: AnnouncementAdminRow[] };
  return body.data;
}

export function createAnnouncement(
  accessToken: string,
  input: {
    title: string;
    slug: string;
    summary?: string;
    body: string;
    status?: string;
  },
): Promise<AnnouncementAdminRow> {
  return opsFetch("/announcements", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updateAnnouncement(
  accessToken: string,
  id: string,
  input: Record<string, unknown>,
): Promise<AnnouncementAdminRow> {
  return opsFetch(`/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function deleteAnnouncement(
  accessToken: string,
  id: string,
): Promise<void> {
  return opsFetch(`/announcements/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken,
  });
}
