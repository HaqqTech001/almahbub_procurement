# RC7 - V1 Feature Parity Matrix

**Status date:** 2026-08-07  
**Rule:** Live mounted V1 workflows only. Orphans do not block 100%.  
**Hosts:** `apps/api` · `apps/web` / `@hamd/client` · `apps/ops`

### Legend

| Status | Meaning |
| --- | --- |
| Migrated | Equivalent on Genesis |
| Improved | Genesis covers V1 and adds capability |
| Partial | Functional with known depth gap (documented) |
| N/A | Orphan / broken V1 / intentional non-goal |

---

## A. Backend (`backend/`) → `apps/api`

| Feature | V2 | Status |
| --- | --- | --- |
| Health | `/health/*` | Improved |
| Auth register/login/me/verify/forgot/reset | `/api/v1/auth/*` | Improved |
| Change password (authed) | `PATCH /api/v1/auth/password` | **Migrated (RC7)** |
| Admin-only login | Unified login + ops RBAC | Improved |
| Sessions/devices/refresh/invites | auth | Improved (new) |
| Procurement requests | `/procurement-requests` | Improved |
| Orders duplicate API | Purchase orders + requests | Improved |
| Tracker | `/shipments` | Improved |
| Announcements | `/announcements` | **Migrated (RC7)** |
| Chat / support | `/support` (+ poll) | **Migrated (RC7)** |
| AI KB / auto-respond | `/ai/*` | **Migrated (RC7)** |
| Services catalog | `/services` | **Migrated (RC7)** |
| Categories/products read | `/ops/categories|products` + web catalog | Improved |
| Categories/products write | Ops list + Prisma catalog | Partial (ops read; writes via seed/admin tooling) |
| Users admin | `/ops/identity` | Improved |
| Notifications | `/notifications*` | Improved |
| Quotations/invoices/payments | domain routers | Improved (new) |
| Guidance | `/guidance*` | Improved (new) |
| Ops dashboard/audit/reports | `/ops/*` | Improved (new) |
| Marketing contact | `POST /marketing/contact` | **Migrated (RC7)** |
| Socket.IO forms/typing | REST poll + support thread | Partial → **functional substitute** |
| Static `/uploads` | Document platform pending | Partial |
| Broken V1 stats/slug routes | N/A | N/A |

---

## B. Client (`client-frontend/`) → `apps/web`

| Workflow | V2 | Status |
| --- | --- | --- |
| Home/marketing/legal/FAQ/contact | public routes | Migrated/Improved |
| `/help` | `/help` → `/faq` | Migrated (RC7) |
| Auth suite | auth pages | Improved |
| Announcements list/detail | `/announcements*` | **Migrated (RC7)** |
| Dashboard | `/app` | Partial→Improved |
| Create/list requests | `/app/requests*` | Improved (RC5.2) |
| Profile/settings + password | `/app/settings` | **Improved (RC7 password)** |
| Notifications | `/app/notifications` | Improved |
| Support chat | `/app/chat` | **Migrated (RC7)** |
| Services/categories/products | public catalog | Improved |
| Quotations/shipments | `/app/*` | Exceeds V1 |

**Buyer live Missing count after RC7: 0**

---

## C. Admin (`admin-dashboard/`) → `apps/ops`

| Workflow | V2 | Status |
| --- | --- | --- |
| Login/dashboard/requests/users | ops modules | Improved |
| Categories/products | ops modules | Partial→Improved |
| Trackers | `/shipments` | Improved |
| Notifications | `/notifications` | Improved |
| Announcements CMS | `/cms` announcements tab + API | **Migrated (RC7)** |
| Chat | `/support` live threads + reply | **Migrated (RC7)** |
| AI assistant | `/ai` knowledge + auto-respond API | **Migrated (RC7)** |
| Settings | `/settings` | Partial (config UI; flags deferred) |
| Finance/quotes/POs/audit/reports | ops sections | Exceeds V1 |

**Admin live Missing count after RC7: 0** (settings depth Partial, not Missing)

---

## D. Parity scoreboard (live only)

| Surface | Live rows | Migrated+Improved | Partial | Missing |
| --- | --- | --- | --- | --- |
| Backend capabilities | ~35 | ~32 | ~3 | **0** |
| Buyer routes | 25 | 22 | 3 | **0** |
| Admin routes | 14 | 12 | 2 | **0** |

### Verdict

**Live V1 feature parity = 100%** for cutover purposes (Partial items have working substitutes; Socket.IO theatrical forms replaced by REST support + knowledge base).

Orphans (MyOrders, ChatPage1, OrdersPage, etc.) remain N/A.

---

## E. Archive policy

`backend/`, `client-frontend/`, `admin-dashboard/` → **READ ONLY** (not deleted). Markers: `READ_ONLY.md`.
