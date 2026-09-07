import { useEffect, useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import {
  emptyNotificationFilters,
  filterNotifications,
  groupNotifications,
  isNotificationScheduled,
  NOTIFICATION_CHANNEL_DESCRIPTORS,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_SETTINGS_TYPES,
  NOTIFICATION_TYPES,
  notificationChannelLabel,
  notificationKindLabel,
  notificationTypeLabel,
  resolveNotificationChannels,
  resolveNotificationKind,
  type InboxNotification,
  type NotificationFilterState,
  type NotificationKind,
  type NotificationPreference,
} from "./types.js";
import { useNotificationInbox } from "./useNotificationInbox.js";
import type { NotificationRealtimeEvent } from "./useNotificationInbox.js";

const KIND_FILTERS: NotificationKind[] = [
  "procurement_update",
  "quotation_received",
  "order_approved",
  "shipment_update",
  "invoice_generated",
  "payment_received",
  "system_announcement",
  "message",
  "mention",
  "ai_recommendation",
];

function formatRelative(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const mins = Math.round(delta / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export type NotificationCenterView = "inbox" | "channels";

export type NotificationCenterProps = {
  notifications: InboxNotification[];
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  density?: "comfortable" | "compact" | undefined;
  /** `simple` = list + search + mark-all + detail (buyer inbox). */
  variant?: "full" | "simple" | undefined;
  preferences?: NotificationPreference[] | undefined;
  onMarkRead?: ((ids: string[]) => void | Promise<void>) | undefined;
  onMarkAllRead?: (() => void | Promise<void>) | undefined;
  onMarkUnread?: ((ids: string[]) => void | Promise<void>) | undefined;
  onArchive?: ((ids: string[]) => void | Promise<void>) | undefined;
  onUnarchive?: ((ids: string[]) => void | Promise<void>) | undefined;
  onDelete?: ((ids: string[]) => void | Promise<void>) | undefined;
  onDismiss?: ((ids: string[]) => void | Promise<void>) | undefined;
  onSchedule?:
    | ((id: string, input: { scheduledFor: string }) => void | Promise<void>)
    | undefined;
  onPinChange?: ((ids: string[]) => void | Promise<void>) | undefined;
  onUpdatePreferences?:
    | ((prefs: NotificationPreference[]) => void | Promise<void>)
    | undefined;
  /** Injectable realtime (poll / socket / SSE). */
  subscribe?:
    | ((handler: (event: NotificationRealtimeEvent) => void) => () => void)
    | undefined;
  onOpen?: ((item: InboxNotification) => void) | undefined;
  initialFilters?: NotificationFilterState | undefined;
  initialView?: NotificationCenterView | undefined;
};

export function NotificationCenterSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-nc", "hamd-nc--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-nc-skel hamd-nc-skel--title" />
      <div className="hamd-nc-skel hamd-nc-skel--toolbar" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="hamd-nc-skel hamd-nc-skel--row" />
      ))}
    </div>
  );
}

/**
 * Enterprise Notification Engine - In-App, Email, SMS/Push placeholders,
 * priority, categories, grouping, realtime, scheduling, dismiss, archive,
 * search. Presentational; hosts own API.
 */
export function NotificationCenter({
  notifications,
  title = "Enterprise Notification Engine",
  loading,
  className,
  density = "comfortable",
  variant = "full",
  preferences = [],
  onMarkRead,
  onMarkAllRead,
  onMarkUnread,
  onArchive,
  onUnarchive,
  onDelete,
  onDismiss,
  onSchedule,
  onPinChange,
  onUpdatePreferences,
  subscribe,
  onOpen,
  initialFilters,
  initialView = "inbox",
}: NotificationCenterProps) {
  const simple = variant === "simple";
  const searchId = useId();
  const scheduleId = useId();
  const [view, setView] = useState<NotificationCenterView>(
    simple ? "inbox" : initialView,
  );
  const [filters, setFilters] = useState<NotificationFilterState>(
    initialFilters ?? emptyNotificationFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleAt, setScheduleAt] = useState("");
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefToast, setPrefToast] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compactToolbar, setCompactToolbar] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const sync = () => setCompactToolbar(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const inbox = useNotificationInbox(notifications, {
    ...(onMarkRead ? { onMarkRead } : {}),
    ...(onMarkAllRead ? { onMarkAllRead } : {}),
    ...(onMarkUnread ? { onMarkUnread } : {}),
    ...(onArchive ? { onArchive } : {}),
    ...(onUnarchive ? { onUnarchive } : {}),
    ...(onDelete ? { onDelete } : {}),
    ...(onDismiss ? { onDismiss } : {}),
    ...(onSchedule ? { onSchedule } : {}),
    ...(onPinChange ? { onPinChange } : {}),
    ...(subscribe ? { subscribe } : {}),
  });

  const filtered = useMemo(
    () => filterNotifications(inbox.items, filters),
    [inbox.items, filters],
  );
  const groups = useMemo(() => groupNotifications(filtered), [filtered]);
  const selected =
    filtered.find((n) => n.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selected?.scheduledFor) {
      setScheduleAt("");
      return;
    }
    const d = new Date(selected.scheduledFor);
    if (Number.isNaN(d.getTime())) {
      setScheduleAt("");
      return;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    setScheduleAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
  }, [selected?.id, selected?.scheduledFor]);

  const preferenceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const pref of preferences) {
      map.set(`${pref.type}:${pref.channel}`, pref.enabled);
    }
    return map;
  }, [preferences]);

  const toggleList = (
    key: "types" | "priorities" | "kinds" | "channels",
    value: string,
  ) => {
    setFilters((prev) => {
      const list = prev[key];
      const next = list.includes(value)
        ? list.filter((x) => x !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const togglePreference = async (
    type: string,
    channel: string,
    enabled: boolean,
  ) => {
    setPrefError(null);
    try {
      await onUpdatePreferences?.([{ type, channel, enabled }]);
      setPrefToast(`${notificationChannelLabel(channel)} preference updated`);
    } catch (err) {
      setPrefError(
        err instanceof Error ? err.message : "Preference update failed.",
      );
    }
  };

  if (loading) {
    return <NotificationCenterSkeleton className={className} />;
  }

  return (
    <div
      className={cx(
        "hamd-nc",
        "hamd-list-module-frame",
        `hamd-nc--${density}`,
        filtersOpen && "hamd-nc--filters-open",
        className,
      )}
      data-unread={inbox.unreadCount}
      data-realtime={subscribe ? "ready" : "offline"}
      data-guide="notification-center"
    >
      <a className="hamd-nc__skip" href="#nc-list">
        Skip to notifications
      </a>

      <header className="hamd-nc__header">
        <div>
          <h1 className="hamd-nc__title">{title}</h1>
          <p className="hamd-nc__subtitle" aria-live="polite">
            {inbox.unreadCount === 0
              ? "You're caught up"
              : `${inbox.unreadCount} unread`}
            {!simple ? (
              <>
                {" · "}
                <span className="hamd-nc-live" data-live={Boolean(subscribe)}>
                  {subscribe ? "Realtime connected" : "Realtime via host"}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <div className="hamd-nc__actions">
          {!simple ? (
            <nav className="hamd-nc-view" aria-label="Notification views">
              <button
                type="button"
                className={cx("hamd-nc-chip", view === "inbox" && "is-active")}
                aria-pressed={view === "inbox"}
                onClick={() => setView("inbox")}
              >
                Inbox
              </button>
              <button
                type="button"
                className={cx("hamd-nc-chip", view === "channels" && "is-active")}
                aria-pressed={view === "channels"}
                onClick={() => setView("channels")}
              >
                Settings
              </button>
            </nav>
          ) : null}
          {view === "inbox" ? (
            <>
              <button
                type="button"
                className="hamd-nc-btn hamd-nc-filters-toggle"
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((open) => !open)}
              >
                Filters
              </button>
              <button
                type="button"
                className="hamd-nc-btn hamd-nc-btn--primary"
                onClick={() => void inbox.markAllRead()}
                disabled={inbox.unreadCount === 0}
              >
                Mark all as read
              </button>
              {!simple ? (
                <button
                  type="button"
                  className="hamd-nc-btn"
                  onClick={() => setFilters(emptyNotificationFilters())}
                >
                  Clear filters
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </header>

      {view === "inbox" ? (
        <div className="hamd-nc__toolbar">
          <div className="hamd-nc-search">
            <label htmlFor={searchId} className="hamd-sr-only">
              Search notifications
            </label>
            <input
              id={searchId}
              type="search"
              value={filters.query}
              placeholder="Search notifications"
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, query: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
          <div className="hamd-nc-chips hamd-nc-chips--status" role="group" aria-label="Read status">
            {compactToolbar
              ? (
                  [
                    ["all", "All"],
                    ["unread", "Unread"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cx("hamd-nc-chip", filters.status === value && "is-active")}
                    aria-pressed={filters.status === value}
                    onClick={() => setFilters((prev) => ({ ...prev, status: value }))}
                  >
                    {label}
                  </button>
                ))
              : null}
          </div>
        </div>
      ) : null}

      {!simple && view === "channels" ? (
        <section
          className="hamd-nc-channels"
          aria-label="Notification settings"
        >
          <p className="hamd-nc-channels__intro">
            Notification settings by type and channel. Email and In-App are
            active. SMS and Push remain placeholders until providers are
            configured. Security and system alerts stay mandatory.
          </p>
          <ul className="hamd-nc-channels__grid">
            {NOTIFICATION_CHANNEL_DESCRIPTORS.map((channel) => (
              <li
                key={channel.id}
                className="hamd-nc-channel-card"
                data-availability={channel.availability}
              >
                <div className="hamd-nc-channel-card__head">
                  <h2>{channel.label}</h2>
                  <span
                    className="hamd-nc-channel-badge"
                    data-availability={channel.availability}
                  >
                    {channel.availability === "active"
                      ? "Active"
                      : channel.availability === "future"
                        ? "Future"
                        : "Placeholder"}
                  </span>
                </div>
                <p>{channel.description}</p>
                {channel.availability === "placeholder" ? (
                  <p className="hamd-nc-channel-note" role="note">
                    {channel.id === "sms" ? "SMS" : "Push"} placeholder -
                    gateway not configured.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>

          {onUpdatePreferences ? (
            <div className="hamd-nc-settings" aria-label="Type preferences">
              <h2>Type preferences</h2>
              <table className="hamd-nc-settings__table">
                <thead>
                  <tr>
                    <th scope="col">Type</th>
                    <th scope="col">In-app</th>
                    <th scope="col">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {NOTIFICATION_SETTINGS_TYPES.map((type) => {
                    const mandatory = type === "system" || type === "security";
                    return (
                      <tr key={type}>
                        <th scope="row">{notificationTypeLabel(type)}</th>
                        {(["in_app", "email"] as const).map((channel) => {
                          const enabled =
                            preferenceMap.get(`${type}:${channel}`) ?? true;
                          return (
                            <td key={`${type}:${channel}`}>
                              <label className="hamd-nc-channel-toggle">
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  disabled={mandatory}
                                  onChange={(e) =>
                                    void togglePreference(
                                      type,
                                      channel,
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span className="hamd-sr-only">
                                  {notificationTypeLabel(type)} {channel}
                                </span>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ) : (
        <div className="hamd-nc__layout">
          <aside className="hamd-nc__filters" aria-label="Notification filters">
            <fieldset className="hamd-nc-facet hamd-nc-facet--status-full">
              <legend>Status</legend>
              <div
                className="hamd-nc-chips"
                role="group"
                aria-label="Status filter"
              >
                {(
                  simple
                    ? ([
                        ["all", "All"],
                        ["unread", "Unread"],
                        ["read", "Read"],
                      ] as const)
                    : ([
                        ["all", "All"],
                        ["unread", "Unread"],
                        ["read", "Read"],
                        ["pinned", "Pinned"],
                        ["scheduled", "Scheduled"],
                        ["archived", "Archived"],
                        ["dismissed", "Dismissed"],
                      ] as const)
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={cx(
                      "hamd-nc-chip",
                      filters.status === value && "is-active",
                    )}
                    aria-pressed={filters.status === value}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            {!simple ? (
              <>
            <fieldset className="hamd-nc-facet">
              <legend>Channel</legend>
              <ul className="hamd-nc-check-list">
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <li key={channel}>
                    <label>
                      <input
                        type="checkbox"
                        checked={filters.channels.includes(channel)}
                        onChange={() => toggleList("channels", channel)}
                      />
                      <span>{notificationChannelLabel(channel)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset className="hamd-nc-facet">
              <legend>Category</legend>
              <ul className="hamd-nc-check-list">
                {KIND_FILTERS.map((kind) => (
                  <li key={kind}>
                    <label>
                      <input
                        type="checkbox"
                        checked={filters.kinds.includes(kind)}
                        onChange={() => toggleList("kinds", kind)}
                      />
                      <span>{notificationKindLabel(kind)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset className="hamd-nc-facet">
              <legend>Type</legend>
              <ul className="hamd-nc-check-list">
                {NOTIFICATION_TYPES.map((type) => (
                  <li key={type}>
                    <label>
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={() => toggleList("types", type)}
                      />
                      <span>{notificationTypeLabel(type)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <fieldset className="hamd-nc-facet">
              <legend>Priority</legend>
              <ul className="hamd-nc-check-list">
                {NOTIFICATION_PRIORITIES.map((priority) => (
                  <li key={priority}>
                    <label>
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={() => toggleList("priorities", priority)}
                      />
                      <span
                        className="hamd-nc-priority"
                        data-priority={priority}
                      >
                        {priority}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
              </>
            ) : null}
          </aside>

          <div className="hamd-nc__main">
            <div
              id="nc-list"
              className="hamd-nc__list"
              role="list"
              aria-label="Notifications"
              tabIndex={-1}
            >
              {groups.length === 0 ? (
                <p className="hamd-nc-empty" role="status">
                  No notifications match these filters.
                </p>
              ) : (
                groups.map((group) => (
                  <section
                    key={group.id}
                    className="hamd-nc-group"
                    aria-labelledby={`nc-group-${group.id}`}
                  >
                    <h2
                      id={`nc-group-${group.id}`}
                      className="hamd-nc-group__title"
                    >
                      {group.label}
                      <span className="hamd-nc-group__count" aria-hidden="true">
                        {group.items.length}
                      </span>
                    </h2>
                    <ul className="hamd-nc-group__items">
                      {group.items.map((item) => {
                        const kind = resolveNotificationKind(item);
                        const channels = resolveNotificationChannels(item);
                        const active = selected?.id === item.id;
                        return (
                          <li key={item.id} role="listitem">
                            <article
                              className={cx(
                                "hamd-nc-item",
                                item.status === "unread" && "is-unread",
                                item.pinned && "is-pinned",
                                active && "is-active",
                              )}
                              data-type={item.type}
                              data-kind={kind}
                              data-priority={item.priority}
                              data-channels={channels.join(",")}
                            >
                              <button
                                type="button"
                                className="hamd-nc-item__main"
                                onClick={() => {
                                  setSelectedId(item.id);
                                  if (item.status === "unread") {
                                    void inbox.markRead([item.id]);
                                  }
                                  onOpen?.(item);
                                }}
                              >
                                <span className="hamd-nc-item__meta">
                                  <span className="hamd-nc-item__kind">
                                    {notificationKindLabel(kind)}
                                  </span>
                                  {channels.map((channel) => (
                                    <span
                                      key={channel}
                                      className="hamd-nc-channel-pill"
                                      data-channel={channel}
                                    >
                                      {notificationChannelLabel(channel)}
                                    </span>
                                  ))}
                                  <span
                                    className="hamd-nc-priority"
                                    data-priority={item.priority}
                                  >
                                    {item.priority}
                                  </span>
                                  <time dateTime={item.createdAt}>
                                    {formatRelative(item.createdAt)}
                                  </time>
                                </span>
                                <h3 className="hamd-nc-item__title">
                                  {item.title}
                                </h3>
                                <p className="hamd-nc-item__body">{item.body}</p>
                              </button>
                              <div className="hamd-nc-item__actions">
                                <button
                                  type="button"
                                  className="hamd-nc-icon"
                                  aria-pressed={Boolean(item.pinned)}
                                  aria-label={
                                    item.pinned
                                      ? `Unpin ${item.title}`
                                      : `Pin ${item.title}`
                                  }
                                  onClick={() => void inbox.togglePin(item.id)}
                                >
                                  {item.pinned ? "Unpin" : "Pin"}
                                </button>
                                {item.status !== "dismissed" &&
                                item.status !== "archived" ? (
                                  <button
                                    type="button"
                                    className="hamd-nc-icon"
                                    aria-label={`Dismiss ${item.title}`}
                                    onClick={() =>
                                      void inbox.dismiss([item.id])
                                    }
                                  >
                                    Dismiss
                                  </button>
                                ) : null}
                                {item.status === "archived" ? (
                                  <button
                                    type="button"
                                    className="hamd-nc-icon"
                                    aria-label={`Restore ${item.title}`}
                                    onClick={() =>
                                      void inbox.unarchive([item.id])
                                    }
                                  >
                                    Restore
                                  </button>
                                ) : item.status !== "dismissed" ? (
                                  <button
                                    type="button"
                                    className="hamd-nc-icon"
                                    aria-label={`Archive ${item.title}`}
                                    onClick={() =>
                                      void inbox.archive([item.id])
                                    }
                                  >
                                    Archive
                                  </button>
                                ) : null}
                                {item.deepLink ? (
                                  <a
                                    className="hamd-nc-icon"
                                    href={item.deepLink}
                                    onClick={() => {
                                      if (item.status === "unread") {
                                        void inbox.markRead([item.id]);
                                      }
                                    }}
                                  >
                                    Open
                                  </a>
                                ) : null}
                              </div>
                            </article>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>

            <aside
              className="hamd-nc__detail"
              aria-label="Notification detail"
              hidden={!selected}
            >
              {selected ? (
                <div className="hamd-nc-detail">
                  <p className="hamd-nc-detail__kind">
                    {notificationKindLabel(resolveNotificationKind(selected))}
                  </p>
                  <h2 className="hamd-nc-detail__title">{selected.title}</h2>
                  <p className="hamd-nc-detail__body">{selected.body}</p>
                  <dl className="hamd-nc-detail__facts">
                    <div>
                      <dt>Type</dt>
                      <dd>{notificationTypeLabel(String(selected.type))}</dd>
                    </div>
                    <div>
                      <dt>Channels</dt>
                      <dd>
                        {resolveNotificationChannels(selected)
                          .map(notificationChannelLabel)
                          .join(", ")}
                      </dd>
                    </div>
                    <div>
                      <dt>Priority</dt>
                      <dd>{selected.priority}</dd>
                    </div>
                    <div>
                      <dt>Received</dt>
                      <dd>
                        <time dateTime={selected.createdAt}>
                          {new Date(selected.createdAt).toLocaleString()}
                        </time>
                      </dd>
                    </div>
                    {selected.scheduledFor ||
                    isNotificationScheduled(selected) ? (
                      <div>
                        <dt>Scheduled for</dt>
                        <dd>
                          <time
                            dateTime={
                              selected.scheduledFor ?? selected.createdAt
                            }
                          >
                            {selected.scheduledFor
                              ? new Date(selected.scheduledFor).toLocaleString()
                              : "-"}
                          </time>
                        </dd>
                      </div>
                    ) : null}
                  </dl>

                  {selected.status !== "dismissed" &&
                  selected.status !== "archived" ? (
                    <form
                      className="hamd-nc-schedule"
                      aria-label="Schedule notification"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!scheduleAt.trim()) return;
                        void inbox.schedule(
                          selected.id,
                          new Date(scheduleAt).toISOString(),
                        );
                      }}
                    >
                      <label htmlFor={scheduleId}>
                        Schedule delivery
                        <input
                          id={scheduleId}
                          type="datetime-local"
                          required
                          value={scheduleAt}
                          onChange={(e) => setScheduleAt(e.target.value)}
                        />
                      </label>
                      <button type="submit" className="hamd-nc-btn">
                        Save schedule
                      </button>
                    </form>
                  ) : null}

                  <div className="hamd-nc-detail__actions">
                    {selected.status === "unread" ? (
                      <button
                        type="button"
                        className="hamd-nc-btn"
                        onClick={() => void inbox.markRead([selected.id])}
                      >
                        Mark read
                      </button>
                    ) : null}
                    {selected.status === "read" && onMarkUnread ? (
                      <button
                        type="button"
                        className="hamd-nc-btn"
                        onClick={() => void inbox.markUnread([selected.id])}
                      >
                        Mark unread
                      </button>
                    ) : null}
                    {selected.status !== "dismissed" &&
                    selected.status !== "archived" ? (
                      <button
                        type="button"
                        className="hamd-nc-btn"
                        onClick={() => void inbox.dismiss([selected.id])}
                      >
                        Dismiss
                      </button>
                    ) : null}
                    {selected.status !== "archived" &&
                    selected.status !== "dismissed" ? (
                      <button
                        type="button"
                        className="hamd-nc-btn"
                        onClick={() => void inbox.archive([selected.id])}
                      >
                        Archive
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button
                        type="button"
                        className="hamd-nc-btn hamd-nc-btn--danger"
                        onClick={() => void inbox.remove([selected.id])}
                      >
                        Delete
                      </button>
                    ) : null}
                    {selected.deepLink ? (
                      <a
                        className="hamd-nc-btn hamd-nc-btn--primary"
                        href={selected.deepLink}
                      >
                        Open related record
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      )}

      {inbox.error || prefError ? (
        <p className="hamd-nc-toast" role="alert">
          {inbox.error || prefError}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {inbox.announce || prefToast}
      </div>
    </div>
  );
}
