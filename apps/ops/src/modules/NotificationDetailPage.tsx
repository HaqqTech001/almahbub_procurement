import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NotificationDetailView, type InboxNotification } from "@hamd/ui/notifications";

import {
  getNotification,
  markNotificationsRead,
  NotificationApiError,
  requireNotificationToken,
} from "../api/notification-api.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { OpsAlert, OpsPage } from "../components/OpsChrome.js";

export function NotificationDetailPage() {
  const { id = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [row, setRow] = useState<InboxNotification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireNotificationToken(auth.ensureSession);
      const item = await getNotification(token, id);
      setRow(item);
      if (item.status === "unread") {
        await markNotificationsRead(token, [item.id]);
      }
    } catch (err) {
      setRow(null);
      setError(
        err instanceof NotificationApiError
          ? err.message
          : "Unable to load this notification.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <OpsPage className="hamd-ops-notifications">
      <p>
        <Link to="/notifications">Back to notifications</Link>
      </p>
      {loading ? <p role="status">Loading notification…</p> : null}
      {error ? (
        <OpsAlert>
          {error}{" "}
          <button type="button" className="hamd-btn hamd-btn--secondary" onClick={() => void load()}>
            Retry
          </button>
        </OpsAlert>
      ) : null}
      {row ? (
        <NotificationDetailView
          notification={row}
          audience="ops"
          onOpenRelated={(href) => navigate(href)}
        />
      ) : null}
    </OpsPage>
  );
}
