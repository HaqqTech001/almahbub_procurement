import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BellIcon } from "@hamd/ui/notifications";
import { useAuth } from "../auth/session/AuthProvider.js";
import { fetchUnreadNotificationCount, requireNotificationToken } from "./notification-api.js";

/**
 * Workspace bell: red unread dot; opens the notifications page (no topbar expansion).
 */
export function CustomerNotificationMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const token = await requireNotificationToken(auth.ensureSession);
      setUnread(await fetchUnreadNotificationCount(token));
    } catch {
      setUnread(0);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  return (
    <button
      type="button"
      className="hamd-client-shell__icon-btn hamd-customer-bell"
      aria-label={
        unread > 0
          ? `Notifications, ${unread} unread`
          : "Notifications"
      }
      data-tour="notifications-nav"
      data-guide="notification-trigger"
      onClick={() => navigate("/app/notifications")}
    >
      <BellIcon />
      {unread > 0 ? (
        <span className="hamd-client-shell__unread-dot" aria-hidden="true" />
      ) : null}
    </button>
  );
}
