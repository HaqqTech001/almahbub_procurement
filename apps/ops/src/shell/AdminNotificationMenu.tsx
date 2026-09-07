import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BellIcon,
  resolveNotificationHref,
  type InboxNotification,
} from "@hamd/ui/notifications";

import {
  fetchUnreadNotificationCount,
  listNotifications,
  markNotificationsRead,
  requireNotificationToken,
} from "../api/notification-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function AdminNotificationMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<InboxNotification[]>([]);

  const refresh = useCallback(async () => {
    try {
      const token = await requireNotificationToken(auth.ensureSession);
      const [count, inbox] = await Promise.all([
        fetchUnreadNotificationCount(token),
        listNotifications(token, { pageSize: 5 }),
      ]);
      setUnread(count);
      setItems(inbox.slice(0, 5));
    } catch {
      setUnread(0);
      setItems([]);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    void refresh();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
    };
  }, [open, refresh]);

  const openItem = async (item: InboxNotification) => {
    const href = resolveNotificationHref(item, "ops");
    if (item.status === "unread") {
      try {
        const token = await requireNotificationToken(auth.ensureSession);
        await markNotificationsRead(token, [item.id]);
        setUnread((count) => Math.max(0, count - 1));
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, status: "read", readAt: new Date().toISOString() }
              : row,
          ),
        );
      } catch {
        /* keep unread until next refresh */
      }
    }
    setOpen(false);
    if (href) navigate(href);
  };

  return (
    <div className="hamd-admin-bell" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="hamd-admin-icon-btn hamd-admin-bell__trigger"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => navigate("/notifications")}
      >
        <BellIcon />
        {unread > 0 ? <span className="hamd-admin-bell__dot" aria-hidden="true" /> : null}
      </button>
      {open ? (
        <div
          id={menuId}
          className="hamd-admin-bell__menu"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="hamd-admin-bell__head">
            <p>Notifications</p>
            <Link to="/notifications" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="hamd-ops-empty" role="status">
              No notifications yet.
            </p>
          ) : (
            <ul>
              {items.map((item) => {
                const href = resolveNotificationHref(item, "ops");
                const interactive = Boolean(href) || item.status === "unread";
                return (
                  <li key={item.id}>
                    {interactive ? (
                      <button type="button" onClick={() => void openItem(item)}>
                        <strong>{item.title}</strong>
                        <span>{formatWhen(item.createdAt)}</span>
                      </button>
                    ) : (
                      <div>
                        <strong>{item.title}</strong>
                        <span>{formatWhen(item.createdAt)}</span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
