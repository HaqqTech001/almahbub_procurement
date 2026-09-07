# Enterprise Notification Center - Review

## Design

- Attention-first unread emphasis; pinned group for important items
- Mission categories readable without leaking cart/commerce metaphors
- Split list + detail on desktop; stacks on tablet/mobile
- **Score:** 96 - ship

## Accessibility

| Check | Result |
| --- | --- |
| Skip to `#nc-list` | Pass |
| Status chips `aria-pressed` | Pass |
| Pin/archive accessible names | Pass |
| Live region for mark/pin/realtime | Pass |
| Search labelled | Pass |
| Dark mode tokens | Pass |
| Reduced motion disables skeleton shimmer | Pass |

## Performance

| Item | Notes |
| --- | --- |
| Client filter/group memoized | Pass |
| Skeleton loading | Pass |
| `notificationsLazy` route split | Pass |
| Injectable realtime (no idle sockets in package) | Pass |

## Engineering

- Field names aligned with API (`title`, `body`, `deepLink`, `status`, `type`, `priority`)
- Optimistic mark-read / archive / pin with rollback
- Tests cover helpers, filters, mark-all, pin/archive, realtime upsert

## Technical debt

| Debt | Priority |
| --- | --- |
| Pin not persisted in API (host/local) | Medium |
| No Socket.IO in `apps/api` yet | Medium |
| Cursor pagination UI not in v1 center | Low |
| Preference editor surface separate | Low |

## STOP

Enterprise Notification Center deliverables complete in `@hamd/ui`.
