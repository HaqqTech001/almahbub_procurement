# Legacy request / announcement authority audit

**Date:** 2026-08-17  
**Scope:** V1 (`client-frontend`, `admin-dashboard`, `backend`) vs V2 (`apps/web`, `apps/ops`, `apps/api`)  
**Rule:** Behaviour below is from source. Gaps are labelled **NOT ESTABLISHED IN LEGACY** rather than invented.

Related V2 sources of truth:

- Permissions: `apps/api/src/modules/identity/auth/domain/permission-catalog.ts`
- Request machine: `apps/api/src/modules/procurement/domain/procurement-request-state.ts`
- LOB: `apps/api/src/modules/procurement/domain/procurement-request-lob.ts`
- Audience serialize: `apps/api/src/modules/procurement/api/procurement-request-serialize.ts`
- `#Hamd'26` copy: `apps/web/src/content/campaigns.ts` (authoritative wedding lines)

---

## A. Legacy buyer / user capabilities

**App:** `client-frontend/`  
**Auth:** JWT + `ProtectedRoute`. Request create also required `requireVerified` on the API.

| Area | Capability | Evidence |
|------|------------|----------|
| Create request | Authenticated create via `POST /orders` (FormData), not `/requests` | `CreateRequestPage` → `apiClient.createOrder` |
| List own requests | `GET /requests` filtered server-side to `user_id` | `MyRequestsPage`, `backend/routes/requests.js` |
| View own detail | `/request/:id` | `RequestDetailPage` |
| Cancel | UI if status `received`; API `PUT /:id/cancel` only if `pending` or `received` | Buyer page calls **missing** `updateOrder` — **broken client** |
| Edit submitted request | **No** | No handlers |
| Comment | **No** | No handlers |
| Upload on detail | **No** (create-only, max 5 files, 10MB) | Create form accept pdf/doc/images |
| Quotations | **None** — marketing copy only | No quotation routes/API in V1 |
| Announcements | Public list + detail; replies + reactions if logged in | `AnnouncementsPage`, `AnnouncementDetailPage` |
| Announcement management | Routes **commented out** | `client-frontend/src/App.tsx` |
| Notifications | `/notifications` | `NotificationsPage` |
| Chat | `/chat` | Support |

Buyer **must not** change status, assign, delete, publish announcements, or see other users’ requests (API: owner or admin).

**Buyer detail sections:** header, progress bar, items, timeline, summary/budget, delivery, assigned-to, special instructions, **Internal Notes** (mapped from `admin_notes` — **buyer leak of admin notes**). Files were **not** shown on buyer detail.

---

## B. Legacy admin / Ops capabilities

**App:** `admin-dashboard/`  
**Auth:** `role === 'admin'` (`requireAdmin`). No permission catalog.

| Area | Capability | Evidence |
|------|------------|----------|
| Request list | `/requests` — search, status filter, status dropdown, **delete** | `RequestsPage` |
| Request detail | `/requests/:id` — client card, files, admin notes, free-form status save | `RequestDetailPage` |
| Status | Any of `pending \| received \| reviewing \| discussion \| sourcing \| processing \| approved \| rejected \| completed \| cancelled` | **No transition graph** |
| Assign | Display only; **no assign picker** | Detail “Assigned To” |
| Quotations | **None** | — |
| Announcements | List, create, edit, pin, status, schedule/expire fields, delete | `/announcements`, `/create`, `/edit/:id` |
| Products/categories | Routed; product nav commented | `App.tsx`, `Layout.tsx` |
| Users, chat, notifications, trackers, AI, settings | Present | Layout nav |

Admin announcement form fields (legacy): `title, content, summary, type, status (draft\|published\|scheduled), priority, target_audience, scheduled_for, expires_at, pinned, tags`, media (max 5). **No CTA, no slide builder.**

`publishAnnouncement()` / `unpublishAnnouncement()` called `/publish` and `/unpublish` — **those routes do not exist**. Live mutate is `PUT /:id`.

---

## C. Shared capabilities

- View a request the actor is authorised to see (buyer: own; admin: any).
- View published announcements (public GET).
- Authenticated notification inbox (separate implementations).
- File upload on **create** (V1) / wizard documents step (V2).

---

## D. Admin-only actions (legacy)

- Change request status arbitrarily
- Write `admin_notes`
- Delete request
- See all organisations’ requests
- See Files & Attachments on detail
- Create / edit / delete / pin announcements
- Admin user/category/product/tracker routes

---

## E. Buyer-only actions (legacy)

- Create a request for themselves (`POST /orders`)
- Cancel early-status own request (API; UI broken)
- Reply/react to announcements (authenticated)
- Contact support / call (hardcoded phone)

Buyers did **not** have a quotation accept/reject flow in V1.

---

## F. Status transitions

### V1

**No state machine.** Admin PUT accepted any listed status. Buyer cancel only from `pending`/`received`.

Buyer UI vocabulary: `received | reviewing | in_discussion | sourcing | completed | cancelled`.  
Admin list used `discussion` (not `in_discussion`). Vocabularies were already inconsistent.

### V2 (authoritative for Genesis — do not revert to V1 free-form)

| Command | From | To | Who |
|---------|------|----|-----|
| `submit` | draft, needs_clarification | submitted | requester or `request:submit` |
| `request_clarification` | submitted | needs_clarification | `request:manage` |
| `accept_for_sourcing` | submitted | accepted_for_sourcing | `request:manage` |
| `start_sourcing` | accepted_for_sourcing | sourcing | `request:manage` |
| `request_revision` | quote_issued | revision_requested | requester or `request:submit` |
| `approve` / `decline` | quote_issued | approved / declined | (quotation + request machine) |
| `start_purchase` | approved | purchase_in_progress | `request:manage` |
| `fulfill` | purchase_in_progress | fulfilled | `request:manage` |
| `close` | fulfilled | closed | `request:manage` |
| `cancel` | draft…sourcing | cancelled | requester or `request:cancel` |

Quotations (V2-only): `draft → internally_reviewed → issued → accepted|declined`.

---

## G. Announcement lifecycle

### V1

- Public GET lists `is_active = TRUE`
- Admin create with `status` draft/published/scheduled
- Replies, reactions, view tracking
- Hard delete

### V2

- Dated **campaign register** (`siteCampaigns`) including `#Hamd'26` slides — **not** CMS rows
- CMS `Announcement` via `GET /api/v1/announcements` (public published) and `/announcements/admin` (manage)
- Status: `draft | published | archived`
- Manage permission: `ops:access` **or** `cms:manage` **or** `communication:publish` (`PARITY_MANAGE_PERMISSIONS`)
- Ops UI: `/cms` (`CmsPage`) — title, slug, summary, body, status. Copy states it **does not replace `#Hamd'26`**
- Public slider: campaigns + CMS slides (`loadPublicAnnouncementSlides`)
- **Not restored (would be invention):** schedule, expire, pin, type, audience, tags, replies, reactions, media gallery

`#Hamd'26` is **global** on the public shell. Ops has a separate dismissible wedding banner **without** the hashtag slide sequence (`apps/ops/src/content/campaigns.ts`). IE portal must **not** duplicate the wedding campaign.

---

## H. Existing permissions (V2)

**Buyer (`DEFAULT_BUYER_PERMISSIONS`):**  
`request:read|create|update|submit|cancel|archive|duplicate`, `quotation:read`, `invoice:read`, `payment:read`, `shipment:read`, `notification:read`, `guidance:read`, `ai:use`

**Buyer does not get:** `request:manage`, `request:assign`, `request:restore`, quotation write/review/issue, `ops:access`, `cms:manage`, `communication:publish`, `audit:read`, …

**Ops (`DEFAULT_OPS_PERMISSIONS`):** buyer set plus those privileged keys. Public registration must never grant `ops:access`.

Serialize audience: `request:manage` → `"ops"` else `"buyer"`. Buyer payload omits assignee and history actor names.

Commodity writes: `ops:access` (`IeCommodityService` + routes).

---

## I. Existing APIs (V2)

| Resource | Public / buyer | Ops |
|----------|----------------|-----|
| Products | `GET /api/v1/products` published | `/api/v1/ops/products` |
| IE commodities | `GET /api/v1/integrated-export/commodities` published | POST/PATCH/DELETE same namespace + `ops:access` |
| Procurement | `/api/v1/procurement-requests` authenticated | same + `request:manage` for queue/`lob=all` |
| Announcements | `GET /api/v1/announcements` | POST/PATCH/DELETE + `GET .../admin` |
| Documents | `/api/v1/documents` | same |

V1 dual write (`/orders` vs `/requests`) is **retired**. Do not recreate.

---

## J. Existing frontend routes

### V1 buyer

`/create-request`, `/my-requests`, `/request/:id`, `/announcements`, `/announcement/:id`, `/notifications`, `/chat`

### V1 admin

`/requests`, `/requests/:id`, `/announcements`, `/announcements/create`, `/announcements/edit/:id`, `/products`, `/categories`, …

### V2 buyer (`apps/web`)

`/app/requests`, `/app/requests/new`, `/app/requests/:id`, `/app/quotations`, `/announcements`, `/announcements/:id`  
IE: `/businesses/almahbub-integrated-export/request` (mailto until this phase)

### V2 ops (`apps/ops`) — app is already the ops host (no `/ops` prefix)

`/requests`, `/requests/:id`, `/quotations`, `/cms`, `/products`, `/categories`  
Suggested IE CMS: `/integrated-export/commodities` (same convention as `/products`)

---

## K. Features lost during V2 migration

| Lost vs V1 | Recommendation |
|------------|----------------|
| Announcement replies/reactions/pin/schedule/media | **Do not invent** unless a later CMS phase restores them from V1 API |
| Admin free-form status | **Do not restore** — V2 machine is the product |
| Admin delete request | V2 uses archive (`request:archive` / manage) — keep archive |
| Buyer seeing `admin_notes` | **Do not restore** (was a leak) |
| V1 order trackers | V2 shipments module |
| IE enquiry persistence | Wire to `ProcurementRequest` + `lob=integrated_export` |
| Ops IE commodity UI | Build CMS against existing IE-11A API |

**New in V2 (not legacy):** quotations, LOB, permission catalog, command machine, `#Hamd'26` compact slides.

---

## L. Features currently duplicated incorrectly

1. **Buyer and Ops request pages wrap the same `RequestHub` / `RequestDetailView`.** Audience already branches (cards vs table; customer vs assignment panels; different commands). Visually they still share chrome — that is the reported loophole.
2. **`procurement-api.ts` copied** in web and ops.
3. **`campaigns.ts` copied** — web has `#Hamd'26` slides; ops banner does not. Do not put wedding slides inside IE.
4. **IE `/request` vs `/app/requests/new`** — two request products (mailto vs API). Production must use one engine. **IE-11B:** authenticated IE create uses the same `ProcurementRequest` engine with `lob: "integrated_export"`; mailto remains a contact fallback only.
5. **Buyer list hardcodes `lob: "international"`** so IE-created requests would be invisible on “My requests”. **IE-11B:** omitted `lob` lists the caller’s authorised requests across LOBs (buyers remain owner-scoped).

---

## M. Recommended V2 mapping

| Concern | Mapping |
|---------|---------|
| Buyer vs Ops request UX | Keep **separate host apps**. Keep shared **types/commands**. Strengthen presentation: buyer = “what is happening with MY request”; ops = “what do I DO”. Never mount `adminRequestCommands` on buyer. Never show assignment/org queue to buyers. |
| Status | Keep V2 command machine. Do not import V1 free-form dropdown. |
| Quotations | V2-only. Buyer: accept/decline issued quotes. Ops: create/review/issue. |
| Announcements | Public display vs `/cms` management. Do not restore V1 social thread without a dedicated phase. **Do not duplicate `#Hamd'26` in IE.** |
| Commodities | Dedicated `IntegratedExportCommodity` API + Ops CMS. Never `Product`. |
| IE request | Authenticated `POST` with `lob: "integrated_export"`. Unauthenticated: sign-in (`returnTo`), matching V1 `authenticateToken` on create. |
| Buyer list LOB | Owner-scoped buyers should see **their** requests across LOBs when `lob` is omitted. Explicit `lob=` still filters. `lob=all` remains `request:manage` only. |
| Ops list LOB | Keep All / International / Integrated Export filters (already on `RequestsPage`). Default `all` for ops. |

### Capability matrix (V2 target)

| Action | Buyer | Ops |
|--------|-------|-----|
| Create own request | yes (`request:create`) | not on ops UI (V1 admin “New Request” was non-functional) |
| List | own org + own requester | org queue with `request:manage` |
| Detail | own; no assignee/actor names | customer, LOB, assign, history actors |
| Submit / cancel / request revision | own | manage/cancel per machine |
| Clarification / sourcing / fulfill / close | **no** | `request:manage` |
| Quote accept/decline | yes if issued | review/issue/create |
| Commodity CMS | **no** | `ops:access` |
| Announcement CMS | **no** | `ops:access` \| `cms:manage` \| `communication:publish` |
| See `#Hamd'26` | public shell | ops has own campaign banner; IE must not duplicate |

### Announcement public vs admin

| | Public | Admin |
|--|--------|-------|
| See published / campaign slides | yes | yes |
| Navigate slides / dismiss if dismissible | yes | n/a on public strip |
| Create/edit/publish/archive CMS rows | **no** | `/cms` |
| Change `#Hamd'26` copy | **no** (code/config) | **no** via CMS — campaign register is authoritative |

---

## Decisions recorded (not guesses)

1. V1 had **no quotation module** — V2 quotation verbs stay.
2. V1 admin status was **unconstrained** — V2 machine stays.
3. V1 buyer announcement create UI was **disabled** — do not give buyers CMS.
4. V1 `admin_notes` on buyer detail was a **leak** — do not reintroduce.
5. Wedding slide copy in `apps/web/src/content/campaigns.ts` is **authoritative** — do not replace with invented lines.
6. Ops app routes are `/requests` not `/ops/procurement` — follow existing V2 host.
