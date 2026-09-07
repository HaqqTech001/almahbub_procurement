# Phase 4 - Client Dashboard

**Package:** `@hamd/ui/dashboard` (+ `@hamd/ui/dashboard.css`)  
**Doctrine:** Attention → Statistics → Recent corridors (docs/51). Preserve business logic; modernize UX.

## Audit (KEEP / REFACTOR / REPLACE)

| Item | Decision | Notes |
| --- | --- | --- |
| Pending items, recent requests, unread, create-request habit | **KEEP** | Buyer job |
| Deep links into source records | **KEEP** | Product DNA |
| API field names (`publicCode`, statuses, money strings) | **KEEP** | Align with `apps/api` |
| Equal-weight card collage + vanity completion % | **REPLACE** | Violates attention laws |
| Orders vocabulary on requests | **REPLACE** | Procurement vocabulary |
| Chart-first admin pattern on client | **REPLACE** | Queues / attention first |
| Quotes, invoices, payments, shipments, RFQs, docs, bookmarks | **REFACTOR → NEW UI** | APIs/schema ahead of legacy UI |
| `ClientWorkspaceShell` | **NEW** | Documented GAP closed in `@hamd/ui` |

## Principles extracted (not copied)

| Source | Extracted principle |
| --- | --- |
| Linear | Dense queues; one clear next issue |
| Stripe | Calm status + money surfaces |
| GitHub | Unread signals; list affordances |
| Vercel | Sparse chrome; quiet empty states |
| Notion | Modular widgets that compose |

## Import

```ts
import { ClientDashboard, dashboardFixture, dashboardLazy } from "@hamd/ui/dashboard";
import "@hamd/ui/dashboard.css";
```

## Composition

1. **Overview** - greeting + single primary action (resolve top attention, else new request)
2. **Needs your attention** - primary focal widget
3. **Quick actions** - secondary only
4. **Statistics** - supporting KPIs
5. **Corridor modules** - Recent requests, Active RFQs, Quotations, Orders, Shipments, Invoices, Payments, Notifications, Messages, Documents, Bookmarks, Recently viewed, Recommendations

## Performance

- Virtualized lists (`VirtualizedList`) for dense queues
- Lazy-loaded secondary widgets (`React.lazy` + Suspense skeletons)
- Optimistic updates (`useOptimisticItems`) for mark-read / confirm payment
- Widgets expose `data-col-span` / resize handle (**resizable-ready**)

## Host contract

Presentational only - inject `data` + optional `onMarkNotificationRead` / `onConfirmPayment`.  
Wire lists from existing API modules; optional future attention-queue aggregate recommended.

## Review

See [71-phase-4-client-dashboard-review.md](./71-phase-4-client-dashboard-review.md).
