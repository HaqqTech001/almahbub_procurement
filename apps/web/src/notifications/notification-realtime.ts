import type { NotificationRealtimeEvent } from "@hamd/ui/notifications";
import type { InboxNotification } from "@hamd/ui/notifications";

export type NotificationTransportMode = "websocket" | "polling" | "offline";

export type NotificationRealtimeTransport = {
  subscribe: (
    handler: (event: NotificationRealtimeEvent) => void,
  ) => () => void;
  getMode: () => NotificationTransportMode;
};

type TransportOptions = {
  /** Resolve a fresh access token for authenticated polling. */
  getAccessToken: () => string | null | Promise<string | null>;
  /** Fetch the latest inbox snapshot. */
  fetchInbox: () => Promise<InboxNotification[]>;
  /**
   * Optional WebSocket endpoint for live inbox events.
   * Expected message JSON: NotificationRealtimeEvent
   * ({ type: "upsert"|"remove"|"bulk", ... }).
   */
  websocketUrl?: string | undefined;
  pollIntervalMs?: number | undefined;
};

/**
 * Realtime architecture for the Notification Center.
 * Prefer WebSocket when `websocketUrl` is reachable; otherwise poll.
 * Never invents notifications - only relays API/WS payloads.
 */
export function createNotificationRealtimeTransport(
  options: TransportOptions,
): NotificationRealtimeTransport {
  let mode: NotificationTransportMode = "offline";
  const pollIntervalMs = options.pollIntervalMs ?? 30_000;

  const resolveWsUrl = (): string | null => {
    if (options.websocketUrl) return options.websocketUrl;
    const envUrl =
      typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_NOTIFICATIONS_WS_URL
        ? String(import.meta.env.VITE_NOTIFICATIONS_WS_URL)
        : "";
    return envUrl || null;
  };

  return {
    getMode: () => mode,
    subscribe(handler) {
      let cancelled = false;
      let socket: WebSocket | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;
      let lastFingerprint = "";

      const emitBulk = async () => {
        try {
          const notifications = await options.fetchInbox();
          if (cancelled) return;
          const fingerprint = notifications
            .map((row) => `${row.id}:${row.status}:${row.readAt ?? ""}`)
            .join("|");
          if (fingerprint === lastFingerprint) return;
          lastFingerprint = fingerprint;
          handler({ type: "bulk", notifications });
        } catch {
          /* keep last snapshot; host surfaces API errors on primary load */
        }
      };

      const startPolling = () => {
        mode = "polling";
        void emitBulk();
        pollTimer = setInterval(() => {
          void emitBulk();
        }, pollIntervalMs);
      };

      const wsUrl = resolveWsUrl();
      if (wsUrl && typeof WebSocket !== "undefined") {
        try {
          socket = new WebSocket(wsUrl);
          socket.addEventListener("open", () => {
            if (cancelled) return;
            mode = "websocket";
            if (pollTimer) {
              clearInterval(pollTimer);
              pollTimer = null;
            }
          });
          socket.addEventListener("message", (event) => {
            try {
              const payload = JSON.parse(String(event.data)) as NotificationRealtimeEvent;
              if (
                payload &&
                (payload.type === "upsert" ||
                  payload.type === "remove" ||
                  payload.type === "bulk")
              ) {
                handler(payload);
              }
            } catch {
              /* ignore malformed frames */
            }
          });
          socket.addEventListener("error", () => {
            if (cancelled || pollTimer) return;
            startPolling();
          });
          socket.addEventListener("close", () => {
            if (cancelled || pollTimer) return;
            startPolling();
          });
          /* Safety net: if WS never opens, fall back. */
          window.setTimeout(() => {
            if (cancelled || mode === "websocket" || pollTimer) return;
            startPolling();
          }, 2_500);
        } catch {
          startPolling();
        }
      } else {
        startPolling();
      }

      return () => {
        cancelled = true;
        mode = "offline";
        if (pollTimer) clearInterval(pollTimer);
        if (socket && socket.readyState <= WebSocket.OPEN) socket.close();
      };
    },
  };
}
