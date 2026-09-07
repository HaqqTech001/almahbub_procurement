# EMERGENCY - V1 Feature Parity Matrix (Single Source of Truth)

**Mode:** Emergency Migration - Version 1 parity only  
**Status:** ACTIVE - Phase 2 implementation under matrix SSoT  
**Audit date:** 2026-08-07  
**Last parity close:** Create-request attachment E2E (2026-08-07)  
**Supersedes for migration decisions:** `docs/102-rc7-v1-feature-parity-matrix.md` (retained as historical RC7 snapshot; this document is the new SSoT)

### Scope audited

| Legacy | V2 target |
| --- | --- |
| `backend/` | `apps/api` |
| `client-frontend/` | `apps/web` (`apps/client` is identity-only proxy - not a runtime) |
| `admin-dashboard/` | `apps/ops` |

### Column legend

| Column | Values |
| --- | --- |
| **V2 Exists** | `Y` surface/API present · `Partial` incomplete surface · `N` absent |
| **Working** | `Y` usable end-to-end · `Partial` broken/mock/UI-only · `N` not usable · `N/A` |
| **Integrated** | `Live` real API · `Hybrid` API + fixtures · `Content` static/CMS content · `Fixtures` demo only · `Local` client-only · `None` |
| **Tested** | `Y` meaningful automated coverage · `Partial` schema/unit only · `N` none found |
| **Improved** | `Y` V2 exceeds V1 · `N` parity-or-less · `N/A` |
| **Missing** | Concrete gap vs V1 live behavior (or `-` if none) |
| **Priority** | `P0` blocks claimed V1 parity · `P1` core workflow gap · `P2` depth/quality · `P3` orphan/defer/exceeds · `N/A` |

### Scoring rules (strict)

1. **Orphans / commented / broken V1 call sites** do not create P0 debt unless product still depends on them in production.
2. **Fixture-only ops modules** count as **not integrated** for parity of that admin workflow.
3. **API exists but host unwired** = Exists `Y`, Working/Integrated gap → typically **P1**.
4. **V2-only capabilities** (quotations domain, invoices, guidance engine, etc.) are listed as **Improved** / Priority `P3` (do not block V1 parity; do not expand until matrix approved).

---

## Executive scoreboard

| Area | Live V1 workflows (approx.) | V2 at/above parity | Partial / hybrid | Missing / P0–P1 |
| --- | --- | --- | --- | --- |
| Backend API | ~86 HTTP + Socket.IO | Many migrated/improved | Uploads, realtime depth, some route bugs | Marketing newsletter/featured; generic upload story |
| Client (buyer + marketing) | ~25 routed pages | Most marketing + auth + core procure/quote/ship/notify/chat | Dashboard depth; catalog live data; guidance wire-up | Buyer invoices/payments (V1 also weak); file attach on create request |
| Admin (ops) | ~14 routed pages | Requests, users, chat/support, announcements, AI KB, shipments | Settings, analytics, trackers fidelity, products nav, exports | Inventory stub; guidance admin unwired; many Download buttons still noop in V1 |

**Honest verdict:** V2 has **broad coverage** and exceeds V1 in commercial domains, but **is not clean V1 parity** while ops analytics/settings/inventory remain fixtures/stubs, marketing catalog/newsletter miss live endpoints hosts call, guidance API is unwired, and several V1 admin UX details (tracker fidelity, exports, category image upload path, Socket.IO richness) remain partial.

---

## A. Backend (`backend/`) → `apps/api`

| Legacy Feature | Location | Description | V2 Exists | Working | Integrated | Tested | Improved | Missing | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Health check | `GET /api/health` | Liveness | Y | Y | Live | Y | Y | - | P3 |
| JWT register | `POST /api/v1/auth/register` | Create account + verify email | Y | Y | Live | Y | Y | - | P3 |
| JWT login | `POST /api/v1/auth/login` | Login (verified required) | Y | Y | Live | Y | Y | - | P3 |
| Admin login | `POST /api/v1/auth/admin/login` | Admin-only login | Y | Y | Live | Y | Y | Unified login + RBAC (no separate admin login required) | P3 |
| Me / profile | `GET /auth/me`, `PUT updatedetails` | Current user + profile update | Y | Y | Live | Y | Y | - | P3 |
| Change password | `PUT /auth/updatepassword` | Authenticated password change | Y | Y | Live | Partial | Y | - | P2 |
| Forgot / reset password | `forgotpassword`, `resetpassword/:token` | Recovery | Y | Y | Live | Y | Y | - | P3 |
| Verify email | `POST verify-email/:token` | Email verification | Y | Y | Live | Y | Y | - | P3 |
| In-app notifications API | `/auth/notifications*` | List / read / read-all | Y | Y | Live | Partial | Y | Delete-notification parity optional | P2 |
| Procurement requests CRUD | `/api/v1/requests*` | Create/list/get/update/cancel/delete + files | Y | Y | Live | Y | Y | Exact status vocabulary drift | P2 |
| Orders duplicate API | `/api/v1/orders*` | Near-duplicate of requests | Partial | Y | Live | Y | Y | Folded into procurement + POs - confirm product mapping | P1 |
| Admin request stats | `.../admin/stats/overview` | Counts + weekly chart | Y | Partial | Hybrid | Partial | N | V1 route-order bug; ops dashboard often fixture-fallback | P1 |
| Order tracking CRUD | `/api/v1/tracker*` | Tracking entries | Y | Y | Live | Y | Y | Mapped to shipments milestones/timeline | P2 |
| Announcements CRUD + engage | `/api/v1/announcements*` | Public list + admin write + replies/react/view | Y | Y | Live | Partial | Y | Reactions depth / media fan-out parity | P2 |
| Chat REST | `/api/v1/chat*` | Conversations, send, support, unread | Y | Y | Live | Partial | N | Parity via `/support` - confirm feature map | P1 |
| Socket.IO realtime chat | `socket/chat.js` | Typing, presence, forms, calls, AI socket | Partial | Partial | Hybrid | N | N | REST/poll substitute; no Socket.IO forms/calls/typing parity | P1 |
| Categories CRUD + image | `/api/v1/categories*` | Public read + admin write (+ Cloudinary) | Y | Partial | Hybrid | Partial | N | Ops write path Hybrid; Cloudinary/local upload story incomplete | P1 |
| Products CRUD | `/api/v1/products*` | Public list + admin CRUD | Y | Partial | Hybrid | Partial | N | Public web catalog still largely content; ops Hybrid | P1 |
| Services CRUD | `/api/v1/services*` | Active services catalog | Y | Partial | Live API / Content UI | Partial | N | Public Services page does not consume live API | P1 |
| Users admin | `/api/v1/users*` | List/update/delete + dashboard | Y | Partial | Hybrid | Partial | Y | Ops identity Hybrid/fixture-fallback | P1 |
| AI knowledge + auto-respond | `/api/v1/ai*` | KB CRUD, learn, stats, auto-respond | Y | Y | Live | Partial | Y | - | P2 |
| Email (Resend) | `services/emailService.js` | Welcome, reset, status, message | Y | Y | Live | Partial | Y | New-request admin email was console-only in V1 | P3 |
| File uploads / static | multer + `GET /uploads/*` | Request/chat/announcement/category files | Y | Partial | Live (create-request) / Partial (other) | Partial | Y | **Create-request path live** (`POST/GET /api/v1/documents` + `StoredDocument`). Chat/announcement/category upload surfaces still open | P0 |
| Global rate limit | express-rate-limit | 100/15m | Y | Y | Live | Y | Y | - | P3 |
| Payment / webhooks | - | None in V1 | N | N/A | None | N/A | N/A | Not a V1 parity item | N/A |
| CSV/PDF export APIs | - | None in V1 | Partial | Partial | Hybrid | Partial | Y | Ops reports exist but often fixture-backed | P2 |
| Cron / scheduled publish | - | None (scheduled fields data-only) | Partial | Partial | Partial | N | N | Guidance/CMS schedule fields ≠ V1 job | P3 |
| Debug email routes | `ENABLE_DEBUG_EMAIL_ROUTES` | Admin test email | N | N/A | None | N/A | N/A | Defer | P3 |

---

## B. Client (`client-frontend/`) → `apps/web`

| Legacy Feature | Location | Description | V2 Exists | Working | Integrated | Tested | Improved | Missing | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home / marketing landing | `/` `HomePage.tsx` | Categories + announcements CTAs | Y | Y | Hybrid | Y | Y | Featured catalog API miss → content fallback | P1 |
| About | `/about` | Company story | Y | Y | Content | Partial | N | - | P3 |
| Services / categories browse | `/services` `CategoriesPage` | Top-level categories | Y | Partial | Content | Partial | N | Not wired to live `/services` or categories API | P1 |
| Category detail | `/category/:slug` | Category + procure CTA | Partial | Partial | Content | N | N | Slug/detail depth vs V1 | P1 |
| Subcategories | `/category/:slug/subcategories` | Child categories | Partial | Partial | Content | N | N | Tree browse parity | P2 |
| Product detail (commented V1) | commented `/product/:id` | Orphan in V1 | Y | Y | Content | Partial | Y | V2 has `/product/:slug` | P3 |
| FAQ | `/faq` | Hardcoded accordion | Y | Y | Content | Partial | N | FAQ API unused in V1 too | P3 |
| Contact | `/contact` | Form + WhatsApp + map | Y | Y | Live | Partial | Y | Map/WhatsApp depth optional | P2 |
| Privacy / Terms | `/privacy` `/terms` | Legal | Y | Y | Content | N | N | - | P3 |
| Help hub | `/help` | Help topics | Y | Y | Content | N | N | Often redirects/FAQ substitute | P2 |
| Announcements list | `/announcements` | Paginated list | Y | Y | Live | Partial | Y | - | P2 |
| Announcement detail | `/announcement/:id` | Media, react, reply | Y | Partial | Live | N | N | Reply attachments / reactions parity | P1 |
| Login | `/login` | Email/password | Y | Y | Live | Y | Y | - | P3 |
| Register multi-step | `/register` | Personal/company/creds | Y | Y | Live | Y | Y | - | P3 |
| Forgot / reset / verify | auth pages | Recovery + verify | Y | Y | Live | Y | Y | Resend verify was mocked in V1 | P3 |
| Buyer dashboard | `/dashboard` | Stats, recent requests, quick actions | Y | Partial | Live | Partial | N | `/app` welcome/thin vs V1 metrics dashboard | P1 |
| Create procurement request | `/create-request` | Items, budget, address, files UI | Y | Y | Live | Partial | Y | - Evidence 2026-08-07: wizard uploads via `POST /api/v1/documents`, links `documentIds` on create, list/detail show attachments, authenticated download; migration `20260807120000_procurement_request_documents` applied; upload-policy + multipart + route-policy tests green; API typecheck green. Chat/ops media out of this row. | N/A |
| My requests list | `/my-requests` | Search/filter/sort | Y | Y | Live | Y | Y | - | P3 |
| Request detail + progress | `/request/:id` | Timeline, cancel | Y | Y | Live | Y | Y | Status vocabulary alignment | P2 |
| Profile / company | `/profile` | Edit personal + company | Y | Y | Live | Partial | Y | Avatar upload absent both sides | P2 |
| Change password UI | authStore only in V1 | API ready, weak UI | Y | Y | Live | Partial | Y | - | P2 |
| Support chat | `/chat` | Client↔admin chat + files | Y | Y | Live | Partial | N | Typing/presence/calls not parity | P1 |
| Notifications inbox | `/notifications` | All/unread, mark read | Y | Y | Live | Partial | Y | - | P2 |
| Navbar badges + poll | `Navbar.tsx` | 60s poll notifications/chat | Y | Partial | Live | N | N | Realtime transport differs | P2 |
| Toast system | toaster | Action feedback | Y | Y | Local | N | N | - | P3 |
| Onboarding welcome + Joyride | Tutorial* | First-login tours | Y | Partial | Local/Fixtures | Partial | Y | Guidance API unwired; localStorage tours | P1 |
| Contact WhatsApp / map | ContactPage | Deep links + map | Partial | Partial | Content | N | N | Optional marketing fidelity | P2 |
| Newsletter capture | homepage | Email waitlist | Y | Partial | Dead-endpoint→Local | N | N | **`/marketing/newsletter` missing on API** | P1 |
| Quotations (buyer) | - (not V1 client) | V2-only | Y | Y | Live | Y | Y | Exceeds V1 - out of V1-parity scope until approved | P3 |
| Shipments (buyer) | - (not V1 client) | V2-only | Y | Y | Live | Y | Y | Exceeds V1 | P3 |
| Invoices/Payments (buyer) | - | Not in V1 client | Partial | N | None (buyer) | Partial | N | Ops-only in V2; V1 also lacked checkout | P3 |
| My Orders / Order Detail | orphan pages | Unrouted V1 | N | N/A | None | N/A | N/A | Orphan - do not block | P3 |
| ChatPage1 / calls / AI bot | unrouted | Richer chat alternate | N | N/A | None | N/A | N/A | Orphan - do not block | P3 |
| Reports/exports (buyer) | - | None in V1 | N | N/A | None | N/A | N/A | - | N/A |

---

## C. Admin (`admin-dashboard/`) → `apps/ops`

| Legacy Feature | Location | Description | V2 Exists | Working | Integrated | Tested | Improved | Missing | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Admin login | `/login` | Admin JWT gate | Y | Y | Live | Partial | Y | - | P3 |
| Dashboard overview | `/` | Stats, charts, recent requests | Y | Partial | Hybrid | Partial | N | Fixture fallback common; revenue was hardcoded $0 in V1 | P1 |
| Requests list triage | `/requests` | Search, status, delete, paginate | Y | Y | Live | Partial | Y | - | P2 |
| Request detail + notes | `/requests/:id` | Status, admin notes, files | Y | Y | Live | Partial | Y | Attachment download wiring | P1 |
| Users management | `/users` | Role/status/delete/view modal | Y | Partial | Hybrid | Partial | Y | Fixture fallback risk; moderator role story | P1 |
| Categories CMS | `/categories` | Tree CRUD + image upload | Y | Partial | Hybrid | N | N | Image upload / tree UX parity | P1 |
| Products CMS | `/products` (nav hidden) | Product CRUD + featured | Y | Partial | Hybrid | N | N | Nav exposure + write reliability | P1 |
| Announcements CMS | `/announcements*` | CRUD, pin, media, replies view | Y | Y | Live | Partial | Y | Publish/unpublish helpers unused in V1 UI too | P2 |
| Support chat inbox | `/chat` | Conversations, files, forms, calls | Y | Partial | Live | Partial | N | Forms/calls/typing Socket parity | P1 |
| Notifications inbox | `/notifications` | Filter, deep-link | Y | Y | Live | Partial | Y | - | P2 |
| Trackers UI | `/trackers` | Tracking from requests + synthetic events | Y | Partial | Hybrid | N | N | V1 itself fabricated carriers; map to shipments honestly | P1 |
| Trackers Export/Analytics buttons | TrackersPage | **Noop in V1** | Partial | Partial | Hybrid | Partial | Y | Do not treat V1 noop as P0 | P3 |
| AI Assistant page | `/ai-assistant` | **Mock KB in V1 UI** | Y | Y | Live | Partial | Y | V2 ops `/ai` live KB exceeds V1 mock | P3 |
| Settings hub | `/settings` | **Local-only mock in V1** | Y | Partial | Fixtures | Partial | N | Still not live platform config | P1 |
| List Download buttons | many pages | Decorative noop in V1 | Partial | Partial | Hybrid | Partial | N | Real export only where reports API works | P2 |
| Chatbot settings UI | API only / commented | Unused | Partial | N | None | N | N | API may exist; UI optional | P3 |
| Orders legacy page | unrouted `OrdersPage` | Orphan | N | N/A | None | N/A | N/A | Orphan | P3 |
| Inventory | - (not V1) | V2 stub | Y | Stub | None | N | N | V2-only stub - exclude from V1 parity | P3 |
| Analytics workspace | - (not V1 beyond dashboard charts) | V2 fixtures | Y | Fixtures | Fixtures | Partial | N | Not required for V1 if dashboard charts covered | P2 |
| Audit log | - (not V1) | V2 hybrid | Y | Hybrid | Hybrid | Partial | Y | Exceeds V1 | P3 |
| Finance (invoices/payments/POs) | - (not V1 admin) | V2 ops | Y | Hybrid/Live | Hybrid | Partial | Y | Exceeds V1 | P3 |
| Guidance admin | - (not V1) | API exists, host weak | Y | Partial | Fixtures | Partial | Y | Unwired - V2-only until approved | P3 |
| Email center | - | UI package only | Partial | N | None | Y | N | Not V1 | P3 |

---

## D. Cross-cutting (permissions, uploads, notifications, validation)

| Legacy Feature | Location | Description | V2 Exists | Working | Integrated | Tested | Improved | Missing | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Role model user/admin (+ moderator label) | backend + admin Users | Coarse RBAC | Y | Y | Live | Y | Y | Fine-grained permissions exceed V1 | P3 |
| Email-verified gate | auth middleware | Blocks unverified | Y | Y | Live | Y | Y | - | P3 |
| Owner-or-admin checks | requests/orders/users | Resource ownership | Y | Y | Live | Partial | Y | - | P2 |
| Multipart uploads | requests/chat/announcements/categories | File attach | Partial | Partial | Live (procurement create) / Partial (other) | Partial | Y | Create-request multipart E2E done; chat/announcement/category still open | P0 |
| In-app + email notifications | DB + Resend + sockets | Multi-channel | Y | Y | Live | Partial | Y | Socket push vs poll | P2 |
| Client-side validation | HTML required + ad-hoc | Forms | Y | Y | Local | Partial | Y | Zod on API exceeds V1 | P3 |
| Theme toggle | ThemeProvider | Light/dark storage | Partial | Partial | Local | N | N | Optional | P3 |

---

## P0 / P1 backlog (approval gate)

These are the only items eligible for Emergency Migration work under the matrix SSoT.

### P0

1. **File upload / static document parity** for remaining V1 surfaces: chat + announcement (+ category image) media - **create-request path closed 2026-08-07**.  
2. ~~**Create-request attachment end-to-end**~~ - **DONE 2026-08-07** (see Client row + evidence).

### P1

1. Public **services/categories/catalog** live API wiring (hosts still Content/dead-endpoint).  
2. **Newsletter** endpoint or remove/replace client call.  
3. **Socket.IO → support** feature map (typing/presence/forms/calls): accept substitute or implement.  
4. Ops **dashboard / users / categories / products** Hybrid → Live reliability.  
5. Ops **settings** beyond fixtures (or formally declare V1 settings as non-goal because V1 was local mock).  
6. **Buyer dashboard** depth vs V1 metrics.  
7. **Announcement engage** (reply media / reactions) depth.  
8. **Guidance** host↔API wire-up **only if** counted as V1 onboarding replacement; else mark N/A for V1 parity.  
9. **Orders vs procurement-requests** product mapping clarity.  
10. Request **attachment download** in ops detail.

---

## Explicit non-goals until matrix re-opened

- New V2-only roadmap features (enterprise guidance CMS expansion, recommendations host, email-center host, inventory productization, buyer finance suite) **unless** you reclassify them as V1-blocking.  
- Fixing V1 orphans (`MyOrdersPage`, `ChatPage1`, decorative Download buttons, mock AI page) as if they were production requirements.  
- Claiming 100% parity while Hybrid/Fixtures remain on core admin modules.

---

## Approval / gate

| Field | Value |
| --- | --- |
| Document | `docs/109-emergency-v1-parity-matrix.md` |
| Process | One incomplete highest-priority row at a time → verify → update row → commit → **STOP for approval** |
| Latest closed row | Create procurement request attachments (P0) - awaiting approval before next row |
