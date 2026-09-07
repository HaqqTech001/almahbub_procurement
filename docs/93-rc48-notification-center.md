# RC4.8 - Notification Center

**Status:** COMPLETE (hosted in `apps/web` - `/app` is the buyer client workspace)  
**Date:** 2026-08-06

## Page

| Route | Experience |
| --- | --- |
| `/app/notifications` | Full Notification Center (inbox + settings) |

Nav: Workspace → Notifications.

## Types

API `NotificationType` (and UI filters/settings): Procurement, Quotation, Shipment, Invoice, Payment, System, Announcement, Security (plus Account / Support for account-domain events).

## Features

| Feature | Implementation |
| --- | --- |
| Read / Unread | `POST /notifications/read`, `POST /notifications/:id/unread` |
| Mark all read | `POST /notifications/read-all` |
| Delete | `DELETE /notifications/:id` (soft delete) |
| Filters | Client facets: status, type, priority, kind, channel |
| Priority | API + UI priority chips |
| Search | Client search + optional API `q` |
| Archive / restore | `POST .../archive` / `.../unarchive` |
| Notification settings | Settings view → `GET|PATCH /notification-preferences` |
| Dismiss | Maps to archive (no separate dismiss status in API) |
| Pin | Client `localStorage` only |
| Schedule | Honest `501` - no server schedule API yet |

## Realtime architecture

Host transport: `apps/web/src/notifications/notification-realtime.ts`

1. If `VITE_NOTIFICATIONS_WS_URL` is set, open WebSocket and expect JSON frames matching `NotificationRealtimeEvent` (`upsert` | `remove` | `bulk`).
2. On missing URL, connect error, or close → fall back to polling `GET /api/v1/notifications` (default 30s) and emit `{ type: "bulk", notifications }`.
3. UI (`NotificationCenter.subscribe`) stays transport-agnostic - no mocks.

Server WS fan-out is not shipped in this sprint; the contract is ready for a future `/ws/notifications` gateway to push the same event shapes.

## API surface used

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count` (available; center uses list status)
- `POST /api/v1/notifications/read`
- `POST /api/v1/notifications/read-all`
- `POST /api/v1/notifications/:id/unread`
- `POST /api/v1/notifications/:id/archive`
- `POST /api/v1/notifications/:id/unarchive`
- `DELETE /api/v1/notifications/:id`
- `GET|PATCH /api/v1/notification-preferences`

## Migration

`database/prisma/migrations/20260806220000_notification_security_type` adds enum value `security`.

## Remaining

1. Wire production WebSocket gateway + auth handshake for live fan-out.
2. Server-side schedule delivery when product requires it.
3. SMS / Push gateways remain placeholders in channel settings.
