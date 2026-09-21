import { safeErrorMessage } from "@hamd/ui/auth";
import type {
  InboxNotification,
  NotificationPreference,
} from "@hamd/ui/notifications";

import { getAccessToken } from "../auth/session/token-store.js";
import { sessionFetch } from "../auth/session/session-http.js";
import { browserApiBase } from "../lib/api-origin.js";

type Envelope<T> = { data: T; error?: { code?: string; message?: string } };

export type ApiNotification = {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  body: string;
  deepLink?: string | null;
  locale?: string;
  metadata?: Record<string, unknown> | null;
  readAt?: string | null;
  archivedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  deliveries?: Array<{ channel: string; status: string }>;
};

export type ApiPreference = {
  type: string;
  channel: string;
  enabled: boolean;
  locale?: string | null;
};

function apiBase(): string {
  return browserApiBase();
}

function url(path: string): string {
  const base = apiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return `/api/v1${normalized}`;
  return `${base}/api/v1${normalized}`;
}

export class NotificationApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(message: string, status: number, code: string) {
    super(safeErrorMessage(message, status));
    this.name = "NotificationApiError";
    this.status = status;
    this.code = code;
  }
}

async function notificationFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken: string;
    query?: Record<string, string | number | undefined>;
  },
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${options.accessToken}`,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let endpoint = url(path);
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    if (qs) endpoint += `?${qs}`;
  }

  const response = await sessionFetch(endpoint, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const envelope = body as {
      error?: { code?: string; message?: string };
      message?: string;
    } | null;
    throw new NotificationApiError(
      envelope?.error?.message ??
        envelope?.message ??
        "Notification request failed.",
      response.status,
      envelope?.error?.code ?? "NOTIFICATION_ERROR",
    );
  }

  const envelope = body as Envelope<T> | null;
  if (envelope && "data" in envelope) return envelope.data;
  return body as T;
}

export function mapApiNotification(
  row: ApiNotification,
): InboxNotification {
  const channels = (row.deliveries ?? [])
    .map((delivery) => delivery.channel)
    .filter(Boolean);
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    status: row.status === "deleted" ? "dismissed" : row.status,
    title: row.title,
    body: row.body,
    deepLink: row.deepLink,
    locale: row.locale,
    metadata: (row.metadata ?? undefined) as
      | Record<string, unknown>
      | undefined,
    readAt: row.readAt,
    archivedAt: row.archivedAt,
    expiresAt: row.expiresAt,
    createdAt:
      typeof row.createdAt === "string"
        ? row.createdAt
        : new Date(row.createdAt).toISOString(),
    channels: channels.length ? channels : ["in_app"],
    primaryChannel: channels[0] ?? "in_app",
  };
}

export async function fetchUnreadNotificationCount(
  accessToken: string,
): Promise<number> {
  const data = await notificationFetch<{ count?: number } | number>(
    "/notifications/unread-count",
    { method: "GET", accessToken },
  );
  if (typeof data === "number") return data;
  return Number(data?.count ?? 0);
}

export async function listNotifications(
  accessToken: string,
  query?: {
    pageSize?: number;
    status?: string;
    type?: string;
    priority?: string;
    q?: string;
  },
): Promise<InboxNotification[]> {
  const rows = await notificationFetch<ApiNotification[]>("/notifications", {
    method: "GET",
    accessToken,
    query: {
      pageSize: query?.pageSize ?? 100,
      status: query?.status,
      type: query?.type,
      priority: query?.priority,
      q: query?.q,
    },
  });
  return rows.map(mapApiNotification);
}

export async function getNotification(
  accessToken: string,
  notificationId: string,
): Promise<InboxNotification> {
  const row = await notificationFetch<ApiNotification>(
    `/notifications/${encodeURIComponent(notificationId)}`,
    { method: "GET", accessToken },
  );
  return mapApiNotification(row);
}

export async function markNotificationsRead(
  accessToken: string,
  notificationIds: string[],
): Promise<void> {
  if (notificationIds.length === 0) return;
  await notificationFetch("/notifications/read", {
    method: "POST",
    accessToken,
    body: { notificationIds },
  });
}

export async function markAllNotificationsRead(
  accessToken: string,
): Promise<{ count: number }> {
  return notificationFetch("/notifications/read-all", {
    method: "POST",
    accessToken,
    body: {},
  });
}

export async function markNotificationUnread(
  accessToken: string,
  notificationId: string,
): Promise<InboxNotification> {
  return mapApiNotification(
    await notificationFetch(`/notifications/${notificationId}/unread`, {
      method: "POST",
      accessToken,
      body: {},
    }),
  );
}

export async function archiveNotification(
  accessToken: string,
  notificationId: string,
): Promise<InboxNotification> {
  return mapApiNotification(
    await notificationFetch(`/notifications/${notificationId}/archive`, {
      method: "POST",
      accessToken,
      body: {},
    }),
  );
}

export async function unarchiveNotification(
  accessToken: string,
  notificationId: string,
): Promise<InboxNotification> {
  return mapApiNotification(
    await notificationFetch(`/notifications/${notificationId}/unarchive`, {
      method: "POST",
      accessToken,
      body: {},
    }),
  );
}

export async function deleteNotification(
  accessToken: string,
  notificationId: string,
): Promise<void> {
  await notificationFetch(`/notifications/${notificationId}`, {
    method: "DELETE",
    accessToken,
  });
}

export async function listNotificationPreferences(
  accessToken: string,
): Promise<NotificationPreference[]> {
  const rows = await notificationFetch<ApiPreference[]>(
    "/notification-preferences",
    { method: "GET", accessToken },
  );
  return rows.map((row) => ({
    type: row.type,
    channel: row.channel,
    enabled: row.enabled,
    ...(row.locale ? { locale: row.locale } : {}),
  }));
}

export async function updateNotificationPreferences(
  accessToken: string,
  preferences: NotificationPreference[],
): Promise<NotificationPreference[]> {
  const rows = await notificationFetch<ApiPreference[]>(
    "/notification-preferences",
    {
      method: "PATCH",
      accessToken,
      body: {
        preferences: preferences.map((preference) => ({
          type: preference.type,
          channel: preference.channel,
          enabled: preference.enabled,
          ...(preference.locale ? { locale: preference.locale } : {}),
        })),
      },
    },
  );
  return rows.map((row) => ({
    type: row.type,
    channel: row.channel,
    enabled: row.enabled,
    ...(row.locale ? { locale: row.locale } : {}),
  }));
}

export async function requireNotificationToken(
  ensureSession: () => Promise<string | null>,
): Promise<string> {
  const token = getAccessToken() ?? (await ensureSession());
  if (!token) {
    throw new NotificationApiError(
      "Sign in again to manage notifications.",
      401,
      "UNAUTHENTICATED",
    );
  }
  return token;
}
