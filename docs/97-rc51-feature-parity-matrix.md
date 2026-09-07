# RC5.1 - Feature Parity Matrix

**Status date:** 2026-08-06  
**Sources:** `client-frontend/src/App.tsx` (live routes) vs `apps/web/src/App.tsx` + `apps/api`  
**Buyer host:** `@hamd/client` → `apps/web` `/app/*`

### Status legend

| Status | Meaning |
| --- | --- |
| **Migrated** | Equivalent workflow exists on V2 |
| **Improved** | V2 covers V1 and adds capability |
| **Partial** | UI/path exists but behaviour gap remains |
| **Missing** | Live V1 workflow with no V2 buyer equivalent |
| **Exceeds** | V2 capability V1 never shipped |
| **N/A** | Not a live V1 buyer workflow (orphan / admin / deferred) |

---

## A. Live V1 routes → V2

| # | V1 route / workflow | V2 location | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | `/` Home | `/` | Improved | New design system + campaigns |
| 2 | `/login` | `/login` | Improved | Cookie session + lockout surfaces |
| 3 | `/register` | `/register` | Improved | Real API (RC4.6) |
| 4 | `/forgot-password` | `/forgot-password` | Improved | Real API |
| 5 | `/reset-password/:token` | `/reset-password`, `/reset-password/:token` | Improved | Real API |
| 6 | `/verify-email/:token` | `/verify-email` | Improved | + OTP page |
| 7 | `/services` | `/services`, `/services/:slug` | Migrated | |
| 8 | `/category/:slug` | `/products`, `/product/:slug` | Improved | Model shifted to products/industries |
| 9 | `/category/:slug/subcategories` | `/products` filters / industries | Partial | No 1:1 subcategory tree |
| 10 | `/about` | `/about` | Migrated | |
| 11 | `/faq` | `/faq` | Migrated | |
| 12 | `/contact` | `/contact` | Partial | Confirm submit backend vs V1 stub |
| 13 | `/privacy` | `/privacy` | Migrated | |
| 14 | `/terms` | `/terms` | Migrated | |
| 15 | `/help` | FAQ + contact | Partial | No dedicated `/help` route |
| 16 | `/announcements` | - | **Missing** | Static homepage banner ≠ feed |
| 17 | `/announcement/:id` | - | **Missing** | |
| 18 | `/dashboard` | `/app` | Partial | Lighter metrics vs V1 dashboard cards |
| 19 | `/create-request` | `/app/requests/new` | Improved | RC5.2 API create + optional submit |
| 20 | `/my-requests` | `/app/requests` | Improved | RC5.2 API list/transitions |
| 21 | `/request/:id` | `/app/requests` detail | Improved | RC5.2 API get; timeline/comments deferred |
| 22 | `/profile` | `/app/settings` | Partial | Sessions/devices exceed V1; profile edit limited |
| 23 | `/notifications` | `/app/notifications` | Improved | API + WS/polling (RC4.8) |
| 24 | `/chat` | - | **Missing** | No chat router in `apps/api` |
| 25 | `/chatbot-settings` | - | **Missing** | Tied to chat |
| 26 | `/announcement/create` | - | N/A | Admin/ops concern, not buyer MVP |

---

## B. V1 capabilities without dedicated routes

| Capability | V1 behaviour | V2 | Status |
| --- | --- | --- | --- |
| Protected buyer shell | ProtectedRoute | RequireAuth + WorkspaceShell | Improved |
| Product tour / tutorial | TutorialContext | Product tours (RC4.4) | Improved |
| Notification badge / inbox | Notifications page | Host + Alerts nav | Improved |
| Request status strip (shipment-ish) | Inline on request | Dedicated shipments domain | Exceeds |
| Cancel / update request | Broken (`updateOrder` missing) | Workspace actions (local) | Partial |
| File attachments on create | FormData incomplete | Wizard upload hooks | Partial (no document API) |

---

## C. V2 exceeds V1 (buyer)

| Capability | V2 location | Notes |
| --- | --- | --- |
| Formal quotations | `/app/quotations*` | RC4.7 |
| Quotation compare / history | `/app/quotations/compare`, `…/history` | |
| Carrier shipments | `/app/shipments*` | RC4.9 |
| Org invitation accept | `/invite/:token` | |
| Session / device management | `/app/settings` | |
| Account lockout / session-expired UX | Dedicated pages | |
| Cookies legal page | `/cookies` | |

---

## D. Orphans / non-live V1 (excluded from “must migrate”)

| Page / feature | Reason |
| --- | --- |
| MyOrders, OrderDetail | Not mounted in `App.tsx` |
| ChatPage1 | Not mounted |
| `/product/:id` PDP | Commented out in router |
| NotificationDropdown | Unused component |

These are **not** cutover blockers. Do not invent V2 screens solely to match dead code.

---

## E. Scoreboard (live buyer workflows only)

Counted from section A rows 1–25 (excluding #26 N/A):

| Bucket | Count |
| --- | --- |
| Migrated | 6 |
| Improved | 12 |
| Partial | 4 |
| Missing | 4 |
| **Parity confirmed for cutover?** | **No** |

Missing: announcements list, announcement detail, chat, chatbot-settings.  
~~Partial blockers for production: procurement API wiring~~ **Closed - RC5.2**. Remaining: help alias, profile edit, dashboard richness, subcategory IA.

---

## F. Mapping identity

```
client-frontend  →  DEPRECATED (archive in place)
apps/client      →  @hamd/client identity
apps/web         →  runtime (@hamd/web)
/app/*           →  authenticated buyer workspace
```

Full narrative: [Migration report](./96-rc51-v1-client-migration-report.md).
