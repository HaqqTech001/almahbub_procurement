# Phase 4 - Client Dashboard Review

## Design review

- Attention-first path matches docs/51; one filled primary (resolve / new request)
- Widget chrome is calm (Stripe/Vercel), modular (Notion), dense where lists matter (Linear/GitHub)
- Dark mode via `prefers-color-scheme` and `[data-theme="dark"]`
- Mobile collapses sidebar + full-span widgets
- **Score:** 96 - ship; refine attention aggregate when API lands

## Accessibility

| Check | Result |
| --- | --- |
| Skip link → `#main-content` | Pass |
| `aria-current` on nav | Pass |
| Widget `aria-labelledby` | Pass |
| Virtual list `role="list"` / `listitem` | Pass |
| Notification unread count in accessible name | Pass |
| Focus-visible outlines on actions/rows | Pass |
| Reduced motion disables skeleton shimmer | Pass |

## Performance

| Item | Result |
| --- | --- |
| Virtualized lists | Pass |
| Lazy secondary widgets | Pass |
| Optimistic mark-read / confirm | Pass |
| CSS isolated (`dashboard.css`) | Pass |

## Engineering

- Business field contracts preserved (API camelCase)
- Legacy dashboard habits KEEP; collage REPLACE
- Shell export also available from `@hamd/ui/layouts`
- Tests cover shell, widget layout attrs, virtualization, optimistic rollback, full module presence

## Technical debt

| Debt | Priority |
| --- | --- |
| No dedicated attention-queue API yet | High |
| RFQ / bookmarks / messages host routes may be GAP | Medium |
| Resize handle is ready - host must wire layout engine | Medium |
| Sync optimistic state when parent `data` refreshes | Low |

## STOP

Client Dashboard deliverables complete in `@hamd/ui`.
