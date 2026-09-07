# Phase 7 — Three-experience architecture audit

Status: **AUDIT ONLY**. No broad UI implementation in this document.

Experiences to separate:

1. Public / customer marketing site (`apps/web`, unauthenticated)
2. Authenticated customer workspace (`apps/web` `/app/*`)
3. Internal Operations console (`apps/ops`)

V1 (`client-frontend`, `admin-dashboard`) is a **functional reference only**.

---

## Current roles

| Role key | How created | Typical holder | Permissions |
|---|---|---|---|
| `org_admin` | Public registration / Google OAuth / invite accept | Company owner (buyer) | `DEFAULT_BUYER_PERMISSIONS` only |
| `ops_admin` | Explicit `grant-ops-access.ts` (never registration) | Approved staff | `DEFAULT_OPS_PERMISSIONS` (buyer set + ops privileges) |

There are **no finer Ops roles** today (no catalogue-editor vs finance vs logistics). Every `ops_admin` currently receives the full Ops permission set.

`org_admin` is **not** an Ops role. Phase 6A revoked accidental `ops:access` from buyer `org_admin` rows.

---

## Current permissions

### Buyer default (`DEFAULT_BUYER_PERMISSIONS`)

`request:read|create|update|submit|cancel|duplicate`  
`quotation:read`  
`invoice:read`  
`payment:read`  
`shipment:read`  
`notification:read`  
`guidance:read`  
`ai:use`  
`communication:manage` ← **too broad; see insecure paths**

Explicitly **not** granted at registration:

`ops:access`, `cms:manage`, `communication:publish`, `request:manage|assign|archive|restore`, `quotation:create|update|review|issue|approve|revise`, `invoice:create|update|issue|void`, `payment:create|submit|confirm`, `shipment:create|update|manage|confirm`, `notification:manage`, `guidance:manage`, `audit:read`

### Ops (`DEFAULT_OPS_PERMISSIONS`)

All buyer keys **plus** `ops:access` and the privileged keys listed above, including `cms:manage`, `communication:publish`, `audit:read`.

### Session claims

JWT access token carries only `{ sub, org, sid, ver }`.  
**Permissions are not in the JWT.** They are loaded from membership → roles → permissions on every authenticated request (`authenticate.ts`). That is the correct model.

`GET /api/v1/auth/me` returns the live permission list for UI gates. UI gates are advisory; API `requirePermission` / service policies are authoritative.

---

## Current Ops routes

### UI (`apps/ops`) — all behind `RequireAuth` + `RequireOpsAccess` (`ops:access`)

| Path | Module | API reality |
|---|---|---|
| `/` | Dashboard | **Live** `GET /api/v1/ops/dashboard` |
| `/products` | Products CMS | **Live** list/create/update, draft/publish/archive, gallery upload/alt/order |
| `/categories` | Categories | **Live** list/create/update |
| `/requests` | Procurement | **Live** `/api/v1/procurement-requests*` |
| `/quotations` | Quotations | **Live** `/api/v1/quotations*` |
| `/invoices` | Invoices | **Live** list (limited mutation UI) |
| `/payments` | Payments | **Live** list (limited mutation UI) |
| `/shipments` | Shipments | **Live** list + transitions |
| `/notifications` | Notifications | **Live** inbox/preferences |
| `/cms` | Announcements | **Live** draft/publish/archive → public slider |
| `/audit` | Audit | **Live** `GET /api/v1/ops/audit-events` (read) |
| `/support` | Support + guidance admin | **Partial live** (`/api/v1/support*`, `/api/v1/admin/guidance*`) |
| `/users`, `/organizations` | Identity | **Read live** `GET /api/v1/ops/identity`; mutations **501** |
| `/suppliers` | Suppliers | **Read live** list only; UI still fixture-falls-back |
| `/purchase-orders` | POs | **Read live** list only; UI fixture-falls-back; no PO workflow |
| `/reports` | Reports | `POST /api/v1/ops/reports` exists; UI still mixes fixtures |
| `/inventory` | Inventory | **Fixture only** — no inventory API |
| `/analytics` | Analytics | **Fixture only** |
| `/settings` | Platform config | **Fixture only** (local “save”) |
| `/ai` | AI knowledge | Parity `/api/v1/ai/knowledge*` (not in current nav) |

`RegisterPage` exists in Ops source but is **not routed**. Ops login only.

Nav today uses `ClientWorkspaceShell` (customer chrome) and does **not** list Users, Inventory, PO, Analytics, Reports, Settings, AI — but those URLs still resolve if typed.

### API (`createOpsRouter`) — `authenticate` + `ops:access` on **every** `/api/v1/ops/*`

Dashboard, products (+ images upload/delete), categories, brands, manufacturers, identity, suppliers, purchase-orders, audit-events, reports.

Related admin (not under `/ops`, but Ops-only by policy):

- Announcements admin: `cms:manage` **or** `ops:access` **or** `communication:publish`
- Guidance admin: `guidance:manage`
- Communication templates: `communication:manage` / `communication:publish`
- Copilot: `ai:use` or `ops:access`

`route-policy.ts` is **incomplete** vs the live Ops router (missing audit-events, identity, suppliers, purchase-orders, reports, announcement admin). Security still holds on the router; the policy catalog used by tests does not.

---

## Current customer routes

### Public (`apps/web`)

`/`, `/about`, `/group`, `/businesses/almahbub-international`, `/businesses/almahbub-integrated-export` (separate portal), `/products`, `/product/:slug`, `/services`, `/industries`, `/faq`, `/contact`, `/privacy`, `/terms`, `/cookies`, `/announcements`, `/login`, `/register`, …

Footer destinations stay as Phase 6B (do not restore dead links).

### Authenticated workspace (`/app/*`, `RequireAuth` only — **not** `ops:access`)

| Path | Capability |
|---|---|
| `/app` | Buyer dashboard |
| `/app/requests`, `/app/requests/new` | Own procurement requests |
| `/app/quotations*` | Read / compare / history |
| `/app/shipments*` | Own shipments |
| `/app/notifications` | Inbox |
| `/app/chat` | Support thread (own) |
| `/app/profile`, `/app/settings` | Profile / sessions |

**Missing from customer workspace UI (APIs exist):** Invoices, Payments.

Public catalogue remains request-led. No price/cart/checkout/stock.

---

## V1 capabilities (functional reference)

### V1 buyer (`client-frontend`)

Home, auth, services/categories, about/faq/contact/legal, announcements feed, dashboard, create/list/detail request, profile, notifications, chat/help.

### V1 admin (`admin-dashboard`)

Dashboard, procurement requests, users, categories, announcements, client chat, notifications, order tracking (`/trackers`), AI assistant, settings. Product catalog nav was commented out.

V1 admin was a **separate app** with its own login. It did not share the buyer chrome.

---

## V2 capabilities (today)

| Domain | Public | Customer `/app` | Ops |
|---|---|---|---|
| Catalogue browse | Live published | via public site | CMS live |
| Request procurement | CTA → contact / `/app/requests/new` | Live | Live (manage/assign) |
| Quotations | — | Read UI | Create/review/issue live |
| Invoices | — | **API only, no UI** | List live |
| Payments | — | **API only, no UI** | List live |
| Shipments | — | Live | Live |
| Notifications | — | Live | Live |
| Announcements | Slider + pages | — | CMS live |
| Support chat | — | Own thread | Ops inbox partial |
| Users / IAM | — | — | Directory read; no grant UI |
| Audit | — | — | Read live |
| Inventory / wallet / checkout / analytics | — | — | Not real |
| Group / IE portal | Live | — | — |

---

## Missing capabilities (vs requested three-experience split)

1. Dedicated Ops shell (not `ClientWorkspaceShell`).
2. Actionable Ops dashboard (requests needing attention, quote workload, invoice/payment state, active shipments, catalogue status, notifications, activity) — KPI API exists but is count-heavy, not queue-oriented.
3. Permission-filtered Ops nav (Overview / Catalogue / Procurement / Finance / Logistics / Communication / System).
4. Hide non-functional Ops modules from routes **and** nav (inventory, analytics, settings fixtures, PO/supplier mutation theatre).
5. Customer workspace: Invoices + Payments pages.
6. Buyer quotation decide (accept/reject own issued quote): service allows owner, **HTTP route requires `quotation:review`** so buyers are blocked.
7. Finer Ops roles (optional later). Today one `ops_admin` blob.
8. Identity mutations (invite, grant `ops:access`, revoke) — script-only today.
9. Durable catalogue media (Phase 6B still BLOCKED without cloud credentials).
10. `route-policy.ts` parity with live routers.

---

## Insecure / incorrect access paths

| Path | Severity | Notes |
|---|---|---|
| Buyer `communication:manage` | **High** | Registration grants it. `/api/v1/admin/communication/templates` CRUD is allowed. Publish still needs `communication:publish`. **Remove from buyer defaults** and backfill. |
| Ops fixture modules reachable by URL | Medium (integrity) | `/inventory`, `/analytics`, `/settings`, `/purchase-orders` (fixture fallback) look operational. Do not show them. |
| Users page `canManage*` | Medium (integrity) | Checks `identity:manage` / `org:admin` / `user:manage` which **are not in the permission catalog**. Mutations throw 501. Do not present as IAM. |
| Quotation transition middleware | Medium (customer gap) | Buyers cannot accept own quotes via API despite service policy. |
| `route-policy.ts` omissions | Low (test drift) | Ops audit/identity/suppliers/PO/reports + announcement admin missing from catalog. |
| JWT `aud=hamd-client` shared by web + ops | Low | Acceptable while `ops:access` is the gate. Optional later: separate audience. |
| Hiding Ops buttons only | N/A if API stays authoritative | `/api/v1/ops/*` already requires `ops:access`. Keep that. Never rely on nav hiding. |

**Proven (Phase 6A/6B, still true):**

- Fresh buyer / revoked e2e user: `/api/v1/ops/products` → **403**
- Staff `ops_admin`: Ops UI + API allowed
- `org_admin` ≠ Ops
- Announcement CMS requires `assertParityManage` (buyer defaults fail)

**Still required before calling Phase 7 done:** create a **new** ordinary buyer in this phase’s test plan and repeat the proof end-to-end.

---

## Proposed Operations IA

Dedicated internal shell (new chrome, not customer `ClientWorkspaceShell`). Brand: internal “Operations”, not Almahbub International marketing navbar. No HaqqTech in header; footer-only attribution if any.

Nav (show item only if the session has the listed permission; `ops:access` is the console gate):

| Section | Item | Permission to show | Status |
|---|---|---|---|
| **Overview** | Dashboard | `ops:access` | Redesign around queues |
| **Catalogue** | Products | `ops:access` | Full CMS |
| | Categories | `ops:access` | Live |
| **Procurement** | Requests | `request:read` + ops | Live manage |
| | Quotations | `quotation:read` + ops | Live create/review/issue |
| **Finance** | Invoices | `invoice:read` + ops | Live; issue/void if `invoice:issue\|void` |
| | Payments | `payment:read` + ops | Live; confirm if `payment:confirm` |
| **Logistics** | Shipments | `shipment:read` + ops | Live |
| **Communication** | Notifications | `notification:read` | Live |
| | Announcements | `cms:manage` or `communication:publish` | CMS |
| | Support | `ops:access` | Ops inbox only if live |
| **System** | Audit | `audit:read` | Read |
| | Members (read-only) | `ops:access` | Directory only until mutations exist |
| | Reports (optional) | `ops:access` | Only if wired to live `POST /ops/reports` |

**Do not expose:** Inventory, Analytics, Platform settings, PO workflow, Supplier admin, fake IAM grants, wallet, checkout, stock.

Dashboard widgets (live queries, no fixtures):

- Requests requiring attention (submitted / needs_clarification / revision_requested)
- Quotation workload (draft / in_review / issued awaiting buyer)
- Invoice & payment state (issued, partial, overdue if dates exist)
- Active shipments
- Catalogue status (draft vs published vs archived)
- Unread notifications
- Recent audit / activity

Products CMS: search, status + category filters, create/edit, draft/publish/archive, gallery upload, preview, position, alt text. Public catalogue stays request-led.

---

## Proposed customer IA

Public site unchanged: Almahbub International primary identity; Integrated Export separate portal; Phase 6B footer preserved.

`/app` workspace (buyer permissions only):

| Section | Item |
|---|---|
| Overview | My dashboard |
| Procurement | Requests, Quotations |
| Finance | Invoices, Payments (**add**) |
| Logistics | Shipments |
| Communication | Notifications, Support |
| Account | Profile, Settings |

No catalogue CMS, announcements admin, users, audit, or Ops links.

---

## Files that will change (implementation phase)

**Auth / API (must precede UI):**

- `apps/api/src/modules/identity/auth/domain/permission-catalog.ts` — drop `communication:manage` from buyer defaults
- `apps/api/src/scripts/reconcile-ops-access.ts` or new backfill — strip `communication:manage` from buyer `org_admin` unless they are also `ops_admin`
- `apps/api/src/routes/route-policy.ts` — document all Ops + announcement admin routes
- `apps/api/src/modules/procurement/quotation/api/*` — allow buyer-owner decide without `quotation:review`
- `apps/api/test/*` + permission tests

**Ops UI:**

- `apps/ops/src/shell/OpsShell.tsx` (+ new shell styles; stop using `ClientWorkspaceShell`)
- `apps/ops/src/App.tsx` — drop non-functional routes
- `apps/ops/src/modules/DashboardPage.tsx`
- `apps/ops/src/modules/ProductsPage.tsx` — CMS completeness/polish
- `apps/ops/src/modules/CmsPage.tsx` — keep lifecycle, default status draft
- Remove or gate: Inventory, Analytics, Settings, PurchaseOrders (fixture), Users mutation affordances
- e2e: fresh buyer vs ops matrix

**Customer UI:**

- `apps/web/src/auth/onboarding/WorkspaceShell.tsx`
- `apps/web/src/App.tsx` — `/app/invoices`, `/app/payments`
- New thin pages calling existing invoice/payment APIs (read + allowed buyer actions only)

**Do not change:** public footer destinations, IE portal routing, public catalogue request-led model, V1 trees (read-only).

---

## Database / API changes required

| Change | Migration? |
|---|---|
| Remove `communication:manage` from buyer default + backfill role_permissions | **No Prisma schema migration** — data backfill script |
| Optional new Ops sub-roles later | Role rows only, not schema |
| Quotation buyer-decide route permission | Code only |
| Invoice/payment customer UI | Code only |
| Durable catalog media | Env/config only (Phase 6B); no schema |

**No new Prisma migrations required** for the three-experience split.

---

## Risks

- Stripping `communication:manage` from existing `org_admin` buyers if any legitimately used template admin (unlikely; still backfill carefully, keep `ops_admin` intact).
- Ops users currently expect fixture pages; removing them is correct but visible.
- Single `ops_admin` role means permission-filtered nav will still show all real sections until sub-roles exist.
- Shared JWT audience web/ops.
- Catalogue photos still not production-durable without cloud credentials.
- Buyer quote-accept fix must not let buyers `review`/`issue` supplier-side quotes.

---

## Test plan

1. **Fresh ordinary buyer**  
   Register on public web → verify email → `GET /api/v1/auth/me` contains buyer keys only (no `ops:access`, `cms:manage`, `communication:publish`, `communication:manage` after backfill, `audit:read`, `request:manage`).
2. Buyer `GET/POST /api/v1/ops/*` → 401/403.  
   Buyer `POST /api/v1/announcements`, product publish/upload, `/api/v1/ops/identity`, audit → 403.
3. Buyer opens `apps/ops` → `/unauthorized` (or login then unauthorized). Cannot reach dashboard/products/cms by URL.
4. Buyer uses `/app`: create request, list quotations/invoices/payments/shipments/notifications/profile. Cannot see admin actions.
5. **Explicit Ops account** (`ops_admin` via grant script, not registration): login to Ops → only real modules visible → dashboard live → products CMS (draft → image → publish → public) → announcements draft → publish → homepage slider → archive. API mutations allowed only with Ops permissions.
6. Buyer with `org_admin` still has **no** Ops access.
7. Footer / IE portal / public catalogue / theme / axe / responsive regression (Phase 6B suite).
8. Unit: permission catalog, route-policy completeness, quotation buyer-decide, announcement `assertParityManage`.

Critical acceptance: a newly registered buyer can use the customer application and **cannot** access any Ops route or administrative API. A provisioned Ops account can access **only** modules/actions permitted by its role.
