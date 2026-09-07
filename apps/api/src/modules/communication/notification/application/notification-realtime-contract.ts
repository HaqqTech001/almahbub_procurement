/**
 * Future WebSocket / SSE fan-out contract for the Notification Center.
 *
 * Client transport (`apps/web` notification-realtime) already understands these
 * frames. Until a gateway is deployed, hosts poll `GET /api/v1/notifications`
 * and synthesize `{ type: "bulk", notifications }`.
 *
 * Suggested gateway path: `ws(s)://{api}/ws/notifications` with bearer /
 * cookie auth matching REST session rules. On connect, optionally push an
 * initial `bulk` snapshot; thereafter push `upsert` / `remove` for owned
 * inbox mutations (create, read, archive, delete).
 */
export type NotificationRealtimePayload = {
  id: string;
  type: string;
  priority: string;
  status: string;
  title: string;
  body: string;
  deepLink?: string | null;
  createdAt: string;
  readAt?: string | null;
  archivedAt?: string | null;
  expiresAt?: string | null;
  locale?: string;
  metadata?: Record<string, unknown> | null;
  deliveries?: Array<{ channel: string; status: string }>;
};

export type NotificationRealtimeFrame =
  | { type: "upsert"; notification: NotificationRealtimePayload }
  | { type: "remove"; id: string }
  | { type: "bulk"; notifications: NotificationRealtimePayload[] };
