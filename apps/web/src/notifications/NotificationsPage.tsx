import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  NotificationCenter,
  type InboxNotification,
} from "@hamd/ui/notifications";

import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert, HostPage } from "../components/HostChrome.js";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
  NotificationApiError,
  requireNotificationToken,
} from "./notification-api.js";
import { createNotificationRealtimeTransport } from "./notification-realtime.js";

/**
 * Buyer notification inbox - list, search/filter, mark all read, open deep links.
 */
export function NotificationsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireNotificationToken(auth.ensureSession);
      setRows(await listNotifications(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof NotificationApiError
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

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
          return listNotifications(token, { pageSize: 100 });
        },
      }),
    [auth.ensureSession],
  );

  const subscribe = useCallback(
    (handler: Parameters<typeof transport.subscribe>[0]) =>
      transport.subscribe(handler),
    [transport],
  );

  return (
    <HostPage className="hamd-web-notifications hamd-list-queue">
      {error ? <HostAlert>{error}</HostAlert> : null}
      <NotificationCenter
        title="Notifications"
        variant="simple"
        notifications={rows}
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
        onOpen={(item) => {
          void (async () => {
            if (item.status === "unread") {
              try {
                await withToken((token) => markNotificationsRead(token, [item.id]));
                await refresh();
              } catch {
                /* navigate anyway */
              }
            }
            const href = `/app/notifications/${item.id}`;
            navigate(href);
          })();
        }}
      />
    </HostPage>
  );
}
