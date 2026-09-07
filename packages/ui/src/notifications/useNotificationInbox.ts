import { useCallback, useEffect, useRef, useState } from "react";
import type { InboxNotification } from "./types.js";

export type NotificationRealtimeEvent =
  | { type: "upsert"; notification: InboxNotification }
  | { type: "remove"; id: string }
  | { type: "bulk"; notifications: InboxNotification[] };

/**
 * Host injects a subscribe function (poll, websocket, SSE).
 * UI stays presentational - no hard realtime dependency.
 */
export function useNotificationRealtime(
  subscribe?:
    | ((handler: (event: NotificationRealtimeEvent) => void) => () => void)
    | undefined,
  onEvent?: ((event: NotificationRealtimeEvent) => void) | undefined,
) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!subscribe) return;
    return subscribe((event) => handlerRef.current?.(event));
  }, [subscribe]);
}

export function useNotificationInbox(
  initial: InboxNotification[],
  options?: {
    onMarkRead?: (ids: string[]) => void | Promise<void>;
    onMarkAllRead?: () => void | Promise<void>;
    onMarkUnread?: (ids: string[]) => void | Promise<void>;
    onArchive?: (ids: string[]) => void | Promise<void>;
    onUnarchive?: (ids: string[]) => void | Promise<void>;
    onDelete?: (ids: string[]) => void | Promise<void>;
    onDismiss?: (ids: string[]) => void | Promise<void>;
    onSchedule?: (
      id: string,
      input: { scheduledFor: string },
    ) => void | Promise<void>;
    onPinChange?: (ids: string[]) => void | Promise<void>;
    subscribe?: (
      handler: (event: NotificationRealtimeEvent) => void,
    ) => () => void;
  },
) {
  const [items, setItems] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useNotificationRealtime(options?.subscribe, (event) => {
    if (event.type === "upsert") {
      setItems((prev) => {
        const without = prev.filter((n) => n.id !== event.notification.id);
        return [event.notification, ...without];
      });
      setAnnounce(`New notification: ${event.notification.title}`);
    }
    if (event.type === "remove") {
      setItems((prev) => prev.filter((n) => n.id !== event.id));
    }
    if (event.type === "bulk") {
      setItems(event.notifications);
    }
  });

  const run = useCallback(
    async (
      next: InboxNotification[],
      commit?: () => void | Promise<void>,
      message?: string,
    ) => {
      const previous = items;
      setError(null);
      setItems(next);
      if (message) setAnnounce(message);
      if (!commit) return;
      try {
        await commit();
      } catch (err) {
        setItems(previous);
        setError(err instanceof Error ? err.message : "Update failed.");
      }
    },
    [items],
  );

  const markRead = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.map((n) =>
        idSet.has(n.id) && n.status === "unread"
          ? { ...n, status: "read" as const, readAt: new Date().toISOString() }
          : n,
      );
      return run(
        next,
        options?.onMarkRead ? () => options.onMarkRead!(ids) : undefined,
        ids.length > 1 ? "Marked all as read" : "Notification marked as read",
      );
    },
    [items, options, run],
  );

  const markAllRead = useCallback(() => {
    const unread = items.filter((n) => n.status === "unread");
    if (!unread.length) return Promise.resolve();
    const next = items.map((n) =>
      n.status === "unread"
        ? { ...n, status: "read" as const, readAt: new Date().toISOString() }
        : n,
    );
    if (options?.onMarkAllRead) {
      return run(next, () => options.onMarkAllRead!(), "Marked all as read");
    }
    return markRead(unread.map((n) => n.id));
  }, [items, markRead, options, run]);

  const markUnread = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.map((n) =>
        idSet.has(n.id) && (n.status === "read" || n.status === "unread")
          ? { ...n, status: "unread" as const, readAt: null }
          : n,
      );
      return run(
        next,
        options?.onMarkUnread ? () => options.onMarkUnread!(ids) : undefined,
        "Notification marked unread",
      );
    },
    [items, options, run],
  );

  const archive = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.map((n) =>
        idSet.has(n.id)
          ? {
              ...n,
              status: "archived" as const,
              archivedAt: new Date().toISOString(),
              pinned: false,
            }
          : n,
      );
      return run(
        next,
        options?.onArchive ? () => options.onArchive!(ids) : undefined,
        "Notification archived",
      );
    },
    [items, options, run],
  );

  const unarchive = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.map((n) =>
        idSet.has(n.id)
          ? { ...n, status: "read" as const, archivedAt: null }
          : n,
      );
      return run(
        next,
        options?.onUnarchive ? () => options.onUnarchive!(ids) : undefined,
        "Notification restored",
      );
    },
    [items, options, run],
  );

  const remove = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.filter((n) => !idSet.has(n.id));
      return run(
        next,
        options?.onDelete ? () => options.onDelete!(ids) : undefined,
        "Notification deleted",
      );
    },
    [items, options, run],
  );

  const dismiss = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      const next = items.map((n) =>
        idSet.has(n.id)
          ? {
              ...n,
              status: "dismissed" as const,
              dismissedAt: new Date().toISOString(),
              pinned: false,
            }
          : n,
      );
      return run(
        next,
        options?.onDismiss ? () => options.onDismiss!(ids) : undefined,
        "Notification dismissed",
      );
    },
    [items, options, run],
  );

  const schedule = useCallback(
    (id: string, scheduledFor: string) => {
      const next = items.map((n) =>
        n.id === id
          ? {
              ...n,
              status: "scheduled" as const,
              scheduledFor,
            }
          : n,
      );
      return run(
        next,
        options?.onSchedule
          ? () => options.onSchedule!(id, { scheduledFor })
          : undefined,
        "Notification scheduled",
      );
    },
    [items, options, run],
  );

  const togglePin = useCallback(
    (id: string) => {
      const next = items.map((n) =>
        n.id === id ? { ...n, pinned: !n.pinned } : n,
      );
      const pinnedIds = next.filter((n) => n.pinned).map((n) => n.id);
      const pinned = next.find((n) => n.id === id)?.pinned;
      return run(
        next,
        options?.onPinChange ? () => options.onPinChange!(pinnedIds) : undefined,
        pinned ? "Notification pinned" : "Notification unpinned",
      );
    },
    [items, options, run],
  );

  const unreadCount = items.filter((n) => n.status === "unread").length;

  return {
    items,
    setItems,
    error,
    announce,
    unreadCount,
    markRead,
    markAllRead,
    markUnread,
    archive,
    unarchive,
    remove,
    dismiss,
    schedule,
    togglePin,
  };
}
