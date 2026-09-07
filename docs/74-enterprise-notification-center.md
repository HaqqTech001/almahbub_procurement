# Enterprise Notification Center

**Package:** `@hamd/ui/notifications` (+ `@hamd/ui/notifications.css`)  
**Rule:** Presentational inbox. Hosts wire `apps/api` `/api/v1/notifications` + preferences + optional realtime.

## Audit

| Item | Decision |
| --- | --- |
| API inbox / prefs / mark read / archive | **KEEP** |
| Channels `in_app` · `email` · `sms` · `push` | **KEEP** (SMS placeholder, Push future) |
| Email gateway (Resend) | **KEEP** |
| Dashboard widget / header count | **REFACTOR** (hooks into this center) |
| Legacy NotificationsPage / Socket.IO client | **REPLACE** |
| Channels preference surface in UI | **NEW** (Channels view) |

## Mission coverage

Email · In-App · Push (future) · SMS placeholder · Real-time · Grouping · Filtering · Archive

## Features

- Inbox + **Channels** views
- Channel filter + per-item channel badges
- Email / In-App preference toggles (`onUpdatePreferences`)
- SMS placeholder + Push future cards (no provider)
- Grouping (Pinned / Today / Yesterday / Earlier / Archived)
- Filtering (status, channel, category, type, priority)
- Search, mark all read, pin, archive / restore
- Real-time via injectable `subscribe` (poll / future socket / SSE)
- Detail pane + deep links

## Import

```ts
import {
  NotificationCenter,
  notificationCenterFixture,
  notificationPreferencesFixture,
  notificationsLazy,
} from "@hamd/ui/notifications";
import "@hamd/ui/notifications.css";
```

## Realtime contract

```ts
subscribe={(push) => {
  const id = setInterval(async () => {
    const latest = await fetchInbox();
    push({ type: "bulk", notifications: latest });
  }, 30_000);
  return () => clearInterval(id);
}}
```

`apps/api` has no websocket yet - do not hardcode sockets in UI.

## Review

See [74-enterprise-notification-center-review.md](./74-enterprise-notification-center-review.md).
