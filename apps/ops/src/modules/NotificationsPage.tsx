import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NotificationCenter,
  type InboxNotification,
  type NotificationPreference,
} from "@hamd/ui/notifications";

import {
  archiveNotification,
  deleteNotification,
  listNotificationPreferences,
  listNotifications,
  markAllNotificationsRead,
  markNotificationUnread,
  markNotificationsRead,
  NotificationApiError,
  requireNotificationToken,
  unarchiveNotification,
  updateNotificationPreferences,
} from "../api/notification-api.js";
import { createNotificationRealtimeTransport } from "../api/notification-realtime.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";

const PIN_STORAGE_KEY = "hamd.ops.notifications.pinned";

function readPinnedIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writePinnedIds(ids: string[]): void {
  try {
    window.localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function NotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InboxNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState("polling");

  const applyPins = useCallback((items: InboxNotification[]) => {
    const pinned = readPinnedIds();
    return items.map((item) => ({
      ...item,
      pinned: pinned.has(item.id),
    }));
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireNotificationToken(auth.ensureSession);
      const [inbox, prefs] = await Promise.all([
        listNotifications(token, { pageSize: 100 }),
        listNotificationPreferences(token),
      ]);
      setRows(applyPins(inbox));
      setPreferences(prefs);
    } catch (err) {
      setError(
        err instanceof NotificationApiError
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, applyPins]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = await requireNotificationToken(auth.ensureSession);
    return fn(token);
  };

  const transport = useMemo(
    () =>
      createNotificationRealtimeTransport({
        getAccessToken: () => auth.ensureSession(),
        fetchInbox: async () => {
          const token = await requireNotificationToken(auth.ensureSession);
          return applyPins(await listNotifications(token, { pageSize: 100 }));
        },
      }),
    [auth.ensureSession, applyPins],
  );

  const subscribe = useCallback(
    (handler: Parameters<typeof transport.subscribe>[0]) => {
      const unsubscribe = transport.subscribe((event) => {
        setTransportMode(transport.getMode());
        if (event.type === "bulk") {
          handler({
            type: "bulk",
            notifications: applyPins(event.notifications),
          });
          return;
        }
        handler(event);
      });
      setTransportMode(transport.getMode());
      return unsubscribe;
    },
    [transport, applyPins],
  );

  return (
    <OpsPage className="hamd-ops-notifications hamd-list-queue">
      <OpsStatus>
        Realtime: {transportMode}
        {transportMode === "polling"
          ? " (WebSocket unavailable - polling inbox)"
          : transportMode === "websocket"
            ? " (live)"
            : ""}
      </OpsStatus>
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      <NotificationCenter
        title="Notification Center"
        notifications={rows}
        preferences={preferences}
        loading={loading}
        subscribe={subscribe}
        onMarkRead={async (ids) => {
          await withToken((token) => markNotificationsRead(token, ids));
          await refresh();
        }}
        onMarkAllRead={async () => {
          await withToken((token) => markAllNotificationsRead(token));
          await refresh();
        }}
        onMarkUnread={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) await markNotificationUnread(token, id);
          });
          await refresh();
        }}
        onArchive={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) await archiveNotification(token, id);
          });
          await refresh();
        }}
        onUnarchive={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) await unarchiveNotification(token, id);
          });
          await refresh();
        }}
        onDelete={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) await deleteNotification(token, id);
          });
          await refresh();
        }}
        onDismiss={async (ids) => {
          await withToken(async (token) => {
            for (const id of ids) await archiveNotification(token, id);
          });
          await refresh();
        }}
        onSchedule={async () => {
          throw new NotificationApiError(
            "Scheduled delivery is not available on the server yet.",
            501,
            "NOT_IMPLEMENTED",
          );
        }}
        onPinChange={(ids) => {
          writePinnedIds(ids);
          setRows((prev) =>
            prev.map((item) => ({
              ...item,
              pinned: ids.includes(item.id),
            })),
          );
        }}
        onUpdatePreferences={async (prefs) => {
          const next = await withToken((token) =>
            updateNotificationPreferences(token, prefs),
          );
          setPreferences(next);
        }}
        onOpen={(item) => {
          navigate(`/notifications/${item.id}`);
        }}
      />
    </OpsPage>
  );
}
