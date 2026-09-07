import { resolveNotificationHref, type NotificationHrefAudience } from "./resolve-notification-href.js";
import type { InboxNotification } from "./types.js";
import { notificationTypeLabel } from "./types.js";

export type NotificationDetailViewProps = {
  notification: InboxNotification;
  audience?: NotificationHrefAudience;
  onOpenRelated?: (href: string) => void;
};

function relatedCtaLabel(href: string | null, type: string): string | null {
  if (!href) return null;
  const value = `${href} ${type}`.toLowerCase();
  if (value.includes("announcement")) return "View Announcement";
  if (value.includes("quotation")) return "View Quotation";
  if (value.includes("chat") || value.includes("support")) return "Open Chat";
  if (value.includes("shipment")) return "Track Shipment";
  if (value.includes("invoice")) return "View Invoice";
  if (value.includes("payment")) return "View Payment";
  if (value.includes("product")) return "View Product";
  if (value.includes("request")) return "View Request";
  return "Open related item";
}

function relatedContext(item: InboxNotification): string | null {
  const metadata = item.metadata ?? {};
  const publicCode = metadata.publicCode ?? metadata.requestCode ?? metadata.reference;
  if (typeof publicCode === "string" && publicCode.trim()) {
    return `Related record: ${publicCode.trim()}`;
  }
  const title = metadata.requestTitle ?? metadata.productName;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }
  return null;
}

export function NotificationDetailView({
  notification,
  audience = "app",
  onOpenRelated,
}: NotificationDetailViewProps) {
  const href = resolveNotificationHref(notification, audience);
  const cta = relatedCtaLabel(href, notification.type);
  const context = relatedContext(notification);
  const when = new Date(notification.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <article className="hamd-notification-detail">
      <p className="hamd-notification-detail__type">{notificationTypeLabel(notification.type)}</p>
      <h1 className="hamd-notification-detail__title">{notification.title}</h1>
      <p className="hamd-notification-detail__meta">
        <time dateTime={notification.createdAt}>{when}</time>
        {notification.status === "unread" ? <span>Unread</span> : <span>Read</span>}
      </p>
      <p className="hamd-notification-detail__body">{notification.body}</p>
      {context ? <p className="hamd-notification-detail__context">{context}</p> : null}
      {href && cta ? (
        <p className="hamd-notification-detail__actions">
          <button
            type="button"
            className="hamd-btn hamd-btn--primary"
            onClick={() => onOpenRelated?.(href)}
          >
            {cta}
          </button>
        </p>
      ) : null}
    </article>
  );
}
