# Zero-Omission Platform Modernization Audit

**Policy:** Nothing is exempt. Existing code is not kept merely because it exists.  
**Rule:** Preserve business logic and recognizable workflows. Modernize experience to enterprise production standards.  
**Shells:** Public Website · Client Workspace · Operations Console  
**Sources:** Legacy `client-frontend/`, `admin-dashboard/`, `backend/`; Phase 3 `apps/api`, `packages/ui`, `docs/*`

---

## Classification legend

| Class | Meaning |
| --- | --- |
| **KEEP** | Retain intent, data model, or workflow outcome; do not discard capability |
| **REFACTOR** | Rebuild UX/architecture on HAMD + new API; keep parity of fields and outcomes |
| **REPLACE** | Remove from product surface; supersede with Phase 3 equivalent (or delete orphans) |

**Status codes:** `DONE` (Phase 3 production code), `PARTIAL`, `GAP` (not built), `LEGACY` (reference only).

---

## 0. Host apps & shells

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Legacy `client-frontend` as product UI | **REPLACE** | Mashup of marketing + buyer; wrong architecture | LEGACY |
| Legacy `admin-dashboard` as product UI | **REPLACE** | Chart-first, free status edits, duplicated UI forks | LEGACY |
| Legacy `backend` Express/MySQL stack | **REPLACE** | Superseded by `apps/api` + Prisma; keep as field/workflow reference | LEGACY |
| `apps/web` (Public Website host) | **REPLACE** gap → **NEW** | Required to serve `@hamd/ui` Homepage and public routes | GAP |
| `apps/client` (Client Workspace host) | **REPLACE** gap → **NEW** | Buyer shell cannot live inside marketing SPA | GAP |
| `apps/ops` (Operations Console host) | **REPLACE** gap → **NEW** | Ops needs queue-first console, not legacy admin skin | GAP |
| `PublicWebsiteShell` | **KEEP** | Implemented; harden as public chrome | DONE |
| `ClientWorkspaceShell` | **REFACTOR** gap → **NEW** | Documented; must ship before marking client module complete | GAP |
| `OperationsConsoleShell` | **REFACTOR** gap → **NEW** | Documented Record Workbench / family nav | GAP |
| Three-shell doctrine (D1) | **KEEP** | Non-negotiable product architecture | DONE (docs) |

---

## 1. Public Website - pages & routes

| Route / page | Decision | Why | Status |
| --- | --- | --- | --- |
| Homepage `/` | **REFACTOR** (complete composition) | `@hamd/ui` Homepage DONE; host `apps/web` still GAP | PARTIAL |
| Hero / visual system | **KEEP** | Accountable Corridor + layered SVG - production | DONE |
| Global Header | **KEEP** | Enterprise nav implemented | DONE |
| Global Footer | **KEEP** | Enterprise footer implemented | DONE |
| Trust / Services / Categories / Featured / Industries / Timeline / Stats / Testimonials / FAQ / Newsletter / CTA | **KEEP** | Homepage sections production | DONE |
| About `/about` | **REFACTOR** | Legacy About exists; rebuild editorial page on HAMD | GAP |
| Services hub `/services` (+ children) | **REFACTOR** | Preserve capability story; match masterplan IA | GAP |
| Industries hub `/industries` (+ verticals) | **REFACTOR** | Preserve sector discovery | GAP |
| Catalog `/catalog` | **REFACTOR** | Evidence-led browse; no cart | GAP |
| Category detail | **REFACTOR** | Keep category→request handoff | GAP |
| Product detail | **REFACTOR** | Product card system (docs/49); Request CTA | GAP |
| Supplier Network | **REFACTOR** | Section on homepage DONE; full page GAP | PARTIAL |
| Track Shipment `/track` | **REFACTOR** | Preserve track habit; bind to shipment API | GAP |
| Request Procurement `/request` | **REFACTOR** | Preserve create-request fields; wizard UX | GAP |
| Search `/search` | **REFACTOR** | Universal search blueprint; not ecommerce search | GAP |
| FAQ `/faq` | **REFACTOR** | Homepage FAQ DONE; dedicated page + CMS later | PARTIAL |
| Help `/help` | **REFACTOR** | Keep help hub intent | GAP |
| Contact `/contact` | **REFACTOR** | Keep contact/inquiry outcome | GAP |
| Knowledge / Case Studies | **REFACTOR** | Trust evidence pages | GAP |
| Privacy / Terms / Cookies | **REFACTOR** | Legal required; rebuild templates | GAP |
| Cookie banner / CMP | **REPLACE** gap → **NEW** | Required for compliance UX | GAP |
| Careers / News | **KEEP** (future) | Masterplan future-ready; do not fake content | GAP |
| Login entry `/login` (public) | **REFACTOR** | Entry to Client Workspace auth | GAP |
| Legacy Home collage / weak CTAs | **REPLACE** | Superseded by Homepage composer | LEGACY |
| Legacy Services = CategoriesPage naming | **REFACTOR** | Rename/clarify IA to Services vs Catalog | LEGACY→GAP |

---

## 2. Client Workspace - screens

| Screen | Decision | Why | Status |
| --- | --- | --- | --- |
| Dashboard | **REFACTOR** | Keep stats + recent requests; attention laws; no vanity | GAP |
| My Products / Saved | **REFACTOR** | Discovery continuity without cart | GAP |
| Procurement Requests list | **REFACTOR** | Preserve My Requests filters/outcomes | GAP |
| Request detail + timeline | **REFACTOR** | Keep progress expectation; bind to state machine | GAP |
| Create / edit request wizard | **REFACTOR** | Keep field model (items, budget, delivery, files) | GAP |
| Quotations | **REFACTOR** | API EXISTS; UI GAP - buyer quote review | PARTIAL |
| Invoices | **REFACTOR** | API EXISTS; UI GAP | PARTIAL |
| Payments | **REFACTOR** | API EXISTS; UI GAP - not checkout | PARTIAL |
| Tracking / shipments | **REFACTOR** | API EXISTS; UI GAP | PARTIAL |
| Documents vault | **REFACTOR** | Keep document habit; secure vault UX | GAP |
| Chat / Support | **REFACTOR** | Keep reachability; chat ≠ system of record | GAP |
| Notifications inbox | **REFACTOR** | Keep unread habit; deep links | GAP |
| AI Assistant | **REFACTOR** | Optional aid; never override approvals | GAP |
| Knowledge Center | **REFACTOR** | Self-serve continuity | GAP |
| Profile | **REFACTOR** | Keep personal/company fields | GAP |
| Settings / preferences | **REFACTOR** | Notification prefs API EXISTS | PARTIAL |
| Activity / audit for buyer | **REFACTOR** | Transparency without ops noise | GAP |
| Legacy Dashboard / MyRequests / CreateRequest / RequestDetail / Profile / Chat / Notifications | **REPLACE** (UI) | Rebuild in `apps/client` | LEGACY |
| Legacy MyOrders / OrderDetail | **REPLACE** | Orders metaphor → procurement vocabulary | LEGACY orphan |

---

## 3. Operations Console - screens

| Screen / family | Decision | Why | Status |
| --- | --- | --- | --- |
| Executive / queue home | **REFACTOR** | Replace chart-first with attention queues | GAP |
| Procurement requests list/detail | **REFACTOR** | Keep triage; **policy-gated transitions only** | PARTIAL (API) |
| Quotations ops | **REFACTOR** | API EXISTS | PARTIAL |
| Purchase orders | **REFACTOR** | DB/docs; API/UI GAP | GAP |
| Customers / orgs | **REFACTOR** | Keep user/org admin need | GAP |
| Products / categories / brands / manufacturers | **REFACTOR** | Keep catalog ops; no free-form chaos | GAP |
| Suppliers | **REFACTOR** | Network accountability | GAP |
| Invoices / payments ops | **REFACTOR** | API EXISTS | PARTIAL |
| Shipments / warehouses / tracking | **REFACTOR** | Shipment API EXISTS | PARTIAL |
| Documents / media | **REFACTOR** | Keep file ops | GAP |
| CMS / announcements / blogs / FAQs / testimonials / cases / careers | **REFACTOR** | Keep publish habit; Experience family | GAP |
| Reports / analytics | **REFACTOR** | Evidence dashboards, not vanity | GAP |
| AI management | **REFACTOR** | Keep KB ops; governed | GAP |
| Users / roles / permissions | **REFACTOR** | Auth me/profile EXISTS; admin RBAC UI GAP | PARTIAL |
| Settings / feature flags / system health / API monitoring / audit | **REFACTOR** | Keep settings intent; enterprise ops | GAP |
| Legacy admin pages (Dashboard, Requests, Users, Categories, Products, Chat, Announcements, Trackers, Settings, AI, Notifications) | **REPLACE** (UI) | New ops shell | LEGACY |
| Legacy OrdersPage / CategoriesPage4 orphans | **REPLACE** | Delete from product surface | LEGACY orphan |
| Unrestricted status `<select>` | **REPLACE** | Policy-gated actions only | LEGACY |

---

## 4. Authentication flows

| Flow | Decision | Why | Status |
| --- | --- | --- | --- |
| Login | **REFACTOR** | Keep journey; httpOnly refresh + CSRF | PARTIAL (API login/refresh/logout/me) |
| Register | **REFACTOR** | Keep multi-step outcome; API GAP | GAP |
| Verify email | **REFACTOR** | Keep token journey; API GAP | GAP |
| Forgot password | **REFACTOR** | Keep; API GAP | GAP |
| Reset password | **REFACTOR** | Keep; API GAP | GAP |
| Profile update | **REFACTOR** | PATCH profile EXISTS | PARTIAL |
| Session refresh / logout | **KEEP** | Implemented in API | DONE |
| MFA / invitations | **REFACTOR** gap → **NEW** | Enterprise auth; schema/docs ahead of UI | GAP |
| Admin login-only | **REFACTOR** | Ops auth into same identity system | GAP |
| Legacy AuthSlider / localStorage JWT | **REPLACE** | Security + design system | LEGACY |
| Protected / public route guards | **REFACTOR** | Same intent; new shells | GAP |

---

## 5. Procurement flow (end-to-end)

| Stage / capability | Decision | Why | Status |
| --- | --- | --- | --- |
| Discover / browse catalog | **REFACTOR** | Keep discovery→request handoff | GAP (UI) |
| Create request | **REFACTOR** | Preserve fields; wizard | PARTIAL (API requests) |
| Review / clarify / assign | **REFACTOR** | API transitions/assignments | PARTIAL |
| Quotation | **REFACTOR** | API DONE; buyer/ops UI GAP | PARTIAL |
| Approval | **REFACTOR** | Evidence on record; gated | PARTIAL |
| Payment | **REFACTOR** | API DONE; not checkout UX | PARTIAL |
| Shipment / milestones / delivery | **REFACTOR** | API DONE; UI GAP | PARTIAL |
| Interactive timeline (marketing) | **KEEP** | Educational journey UI DONE | DONE |
| Domain state machines (request/quote/invoice/payment/shipment) | **KEEP** | Core business logic | DONE (API) |
| Cart / checkout / live stock pricing | **REPLACE** | Wrong category model | LEGACY/reject |
| Duplicate request / archive / restore | **KEEP** | API capabilities | DONE |

---

## 6. Components, tables, cards, forms

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| `@hamd/ui` primitives (Section, Container, ButtonLink, Newsletter, OptimizedImage) | **KEEP** | Production design system seed | DONE |
| GlobalHeader / Footer / Homepage* / Timeline / HeroVisual | **KEEP** | Harden; do not redesign casually | DONE |
| Product card system | **REFACTOR** gap → **NEW** | Blueprint docs/49 | GAP |
| Data table / Record Workbench | **REFACTOR** gap → **NEW** | Ops lists need enterprise tables | GAP |
| Form system (Field, Wizard, Validation) | **REFACTOR** gap → **NEW** | Shared forms across shells | GAP |
| Dialog / Drawer / Modal kit | **REFACTOR** gap → **NEW** | Admin has Radix forks; unify on HAMD | GAP |
| Toast / banner system | **REFACTOR** | Keep feedback habit; accessible live regions | GAP |
| Legacy shadcn forks (both apps) | **REPLACE** | Tokenized HAMD only (D10) | LEGACY |
| Card-as-list instead of tables (legacy) | **REFACTOR** | Cards OK for marketing; ops needs tables | LEGACY |
| FileUpload / MediaUpload / RichInput | **REFACTOR** | Keep capability; a11y + virus-scan path | LEGACY→GAP |
| EmojiPicker | **REFACTOR** or **REPLACE** | Optional chat affordance; not critical path | LEGACY |
| ImageViewer lightbox | **REFACTOR** | Keep media review | LEGACY→GAP |

---

## 7. Modals, dialogs, drawers

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| WelcomeModal / Joyride tutorials | **REPLACE** | Inline empty states first (D docs); optional tours later | LEGACY |
| Notification dropdown | **REFACTOR** | Keep unread habit in header | PARTIAL (header link) |
| Mobile nav drawer (header) | **KEEP** | Implemented in GlobalHeader | DONE |
| Mega menus | **KEEP** | Click/keyboard; not hover-only | DONE |
| Admin create/edit modals (category, product, user, AI, announcement) | **REFACTOR** | Same CRUD outcomes; Record Workbench patterns | GAP |
| Chat call modal | **REPLACE** or defer | Voice not system of record; out of Phase 3 critical path | LEGACY |
| `window.confirm` deletes | **REPLACE** | Accessible confirm dialogs | LEGACY |
| Cookie settings dialog | **REFACTOR** gap → **NEW** | Legal footer link needs CMP | GAP |

---

## 8. Notifications

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| In-app notification inbox | **REFACTOR** | API EXISTS; Client/Ops UI GAP | PARTIAL |
| Unread count / mark read/archive | **KEEP** | API DONE | DONE |
| Notification preferences | **KEEP** | API DONE | DONE |
| Header bell entry | **REFACTOR** | GlobalHeader has hook; wire real data | PARTIAL |
| Event-driven dispatcher worker | **KEEP** | Backend path EXISTS | DONE |
| Legacy NotificationContext / stores | **REPLACE** | Typed client + new API | LEGACY |

---

## 9. Email templates

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Template CRUD / publish API | **KEEP** | Admin communication templates EXISTS | DONE |
| Branded HTML email layouts | **REFACTOR** gap → **NEW** | Gateway currently wraps plain `<p>`; not enterprise | GAP |
| Auth emails (verify, reset) | **REFACTOR** | Keep journeys; proper templates required | GAP |
| Procurement emails (quote, payment, shipment) | **REFACTOR** | Event-driven; branded | GAP |
| Settings “test email” | **REFACTOR** | Keep ops ability | GAP |
| Legacy emailService | **REPLACE** | New notification gateways | LEGACY |

---

## 10. Error, loading, empty, success states

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Public 404 / 500 / Maintenance | **REFACTOR** gap → **NEW** | Documented; not in `@hamd/ui` | GAP |
| API error envelope / notFoundHandler | **KEEP** | Production API | DONE |
| Auth loading gates | **REFACTOR** | Keep spinner/skeleton standards | GAP |
| Empty states (no requests, no notifications, no catalog) | **REFACTOR** | Inline guidance + one primary action | GAP |
| Success states (request submitted, payment confirmed, delivery) | **REFACTOR** | Celebration without gimmicks; record deep link | GAP |
| Skeleton primitive | **REFACTOR** | Bring into HAMD | LEGACY→GAP |
| Legacy NotFound pages | **REPLACE** | New branded error pages | LEGACY |
| `alert()` success in admin settings | **REPLACE** | Toast/banner system | LEGACY |

---

## 11. Mobile experience

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Responsive public header/footer/homepage | **KEEP** | Implemented breakpoints | DONE |
| Dedicated native apps | **KEEP** (out of scope) | Web-responsive first unless charter changes | - |
| Legacy hamburger overlays / mobile CSS utilities | **REPLACE** | New shells’ responsive systems | LEGACY |
| Client/Ops mobile layouts | **REFACTOR** gap → **NEW** | Touch targets, drawers, priority actions | GAP |
| Chat mobile split view | **REFACTOR** | Preserve usability | GAP |

---

## 12. Accessibility interactions

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Skip link, landmarks, focus rings (header/footer/homepage) | **KEEP** | AA floor started | DONE |
| Reduced motion support | **KEEP** | Hero, footer, timeline, critical CSS | DONE |
| Full axe/WCAG audit on Client/Ops | **REFACTOR** gap | Not complete until shells exist | GAP |
| Legacy Joyride / icon-only controls / confirm() | **REPLACE** | Fail a11y bar | LEGACY |
| Form errors as `role="alert"` / labels | **REFACTOR** | Newsletter DONE; all forms must match | PARTIAL |
| Keyboard mega menus / timeline / FAQ | **KEEP** | Patterns established | DONE |

---

## 13. Dashboards & settings

| Item | Decision | Why | Status |
| --- | --- | --- | --- |
| Client dashboard | **REFACTOR** | Keep overview; attention laws | GAP |
| Ops dashboard | **REFACTOR** | Queues first, not charts first | GAP |
| Client profile/settings | **REFACTOR** | Keep fields | GAP |
| Ops settings (general, security, email, API, backup) | **REFACTOR** | Keep capabilities; safe controls | GAP |
| Legacy Dashboard charts as primary | **REPLACE** | Wrong attention model | LEGACY |

---

## 14. API / data modules (logic preservation)

| Module | Decision | Why | Status |
| --- | --- | --- | --- |
| Auth (login/refresh/logout/me/profile) | **KEEP** | Extend, don’t rewrite casually | DONE |
| Procurement requests | **KEEP** | Core logic | DONE |
| Quotations | **KEEP** | Core logic | DONE |
| Invoices / payments | **KEEP** | Core logic | DONE |
| Shipments | **KEEP** | Core logic | DONE |
| Notifications + templates API | **KEEP** | Core logic | DONE |
| Catalog / products / categories / suppliers | **REFACTOR** gap → **NEW** API | DB/docs exist; routes GAP | GAP |
| Chat / CMS / documents / warehouses / RFQ / PO / analytics | **REFACTOR** gap → **NEW** | Preserve ops/buyer needs | GAP |
| Register/verify/reset auth routes | **REFACTOR** gap → **NEW** | Tokens in schema; routes missing | GAP |
| `packages/api-client` stub | **REFACTOR** | Domain methods required | PARTIAL |
| OpenAPI completeness | **REFACTOR** | Document all routes for FE GO | PARTIAL |

---

## 15. Cross-cutting experience checklist

Before any module is marked **complete**, every related row below must be **reviewed** and either DONE or explicitly deferred with owner:

| Concern | Public | Client | Ops |
| --- | --- | --- | --- |
| Page/screen for happy path | ☐ | ☐ | ☐ |
| Loading state | ☐ | ☐ | ☐ |
| Empty state | ☐ | ☐ | ☐ |
| Error state | ☐ | ☐ | ☐ |
| Success state | ☐ | ☐ | ☐ |
| Mobile layout | ☐ | ☐ | ☐ |
| Keyboard / SR path | ☐ | ☐ | ☐ |
| Authz / policy gates | ☐ | ☐ | ☐ |
| Notification deep link | ☐ | ☐ | ☐ |
| Email (if user-notified) | ☐ | ☐ | ☐ |
| API contract + tests | ☐ | ☐ | ☐ |

**Homepage module:** Public happy path PARTIAL (library DONE, host GAP). Related legal/error/cookie still open - **not platform-complete**.

---

## 16. Priority modernization waves (no omissions, sequenced)

| Wave | Scope | Principle |
| --- | --- | --- |
| **W0** | This audit + parity matrix | Zero omission visibility |
| **W1** | `apps/web` + public routes (About→Request→Track→Legal→Errors) | Finish public shell |
| **W2** | Auth complete (register→reset) + `apps/client` shell | Preserve auth + request workflows |
| **W3** | Request wizard + list/detail wired to API | Core procurement UX |
| **W4** | Quotes / pay / ship buyer views | Close money & logistics loop |
| **W5** | `apps/ops` queues + gated transitions | Safe triage |
| **W6** | Catalog/CMS/chat/documents/email HTML | Full enterprise surface |
| **W7** | A11y/perf audits per shell; delete legacy apps from product path | Production bar |

---

## 17. Explicit non-touch ban

The following must **not** remain “as-is” in the long-term product:

- Legacy SPAs as customer-facing UI  
- Orders/cart vocabulary  
- Free-form admin status edits  
- localStorage JWT as primary session  
- Unbranded `<p>` email bodies  
- Orphan pages (`ChatPage1`, unused Orders, CategoriesPage4)  
- Missing empty/error/success states on any shipped screen  
- WCAG failures excused because “legacy already shipped”

---

## STOP

Zero-omission audit complete. Every inventoried page, flow, state, and component class has a **KEEP / REFACTOR / REPLACE** decision with rationale. Phase 3 implementation continues wave-by-wave without silent exemptions.
