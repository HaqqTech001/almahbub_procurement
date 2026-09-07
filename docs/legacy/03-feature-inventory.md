# Version 1 Feature Inventory

Status vocabulary (Phase RC2):

| Status | Meaning |
| --- | --- |
| **Not Started** | No Version 2 host/API surface for this product capability |
| **Planned** | Documented / schema exists; no usable cutover path yet |
| **Migrating** | Version 2 implementation exists in part (API and/or UI library) but not product-complete |
| **Completed** | Version 2 replaces Version 1 for this feature in production use |

Overall: **no feature is Completed** for end-user cutover. Host apps `apps/web`,
`apps/client`, and `apps/ops` are missing.

## Inventory

| Feature | Version 1 evidence | Version 2 evidence | Status |
| --- | --- | --- | --- |
| **Authentication** | Client/admin login; register; verify; forgot/reset; JWT localStorage; admin login | `apps/api` login/refresh/logout/me/profile/validate; `@hamd/ui` auth screens; no host; register/forgot/MFA incomplete | Migrating |
| **Dashboard** | `DashboardPage` (client + admin) | `@hamd/ui` ClientDashboard / ExecutiveDashboard (fixtures); hosts missing | Planned |
| **Products** | Client browse; admin CRUD; `/products`, `/categories`, `/services` | Prisma catalog models; `@hamd/ui` catalog components; **no catalog HTTP API**; hosts missing | Planned |
| **Procurement** | Create/list/detail requests; admin triage; `/requests`, `/orders` | `/api/v1/procurement-requests` + state machine; UI workspaces in `@hamd/ui`; hosts missing | Migrating |
| **Quotations** | Not first-class in V1 | `/api/v1/quotations`; UI workspace library | Migrating |
| **Orders** | `/orders` + MySQL `orders` (overlaps “requests”) | Replaced conceptually by procurement-requests (+ future purchase orders) | Migrating |
| **Shipments** | `/tracker` + order tracking | `/api/v1/shipments` (+ milestones, documents, etc.); UI library; hosts missing | Migrating |
| **Invoices** | Not first-class in V1 | `/api/v1/invoices`; UI not host-wired | Migrating |
| **Payments** | Not first-class in V1 | `/api/v1/payments` (manual gateway); UI not host-wired | Migrating |
| **Notifications** | Client/admin inboxes; auth/users nested routes | `/api/v1/notifications` + preferences + templates | Migrating |
| **Messages** | REST chat + Socket.IO realtime | No V2 chat/collab API mounted | Not Started |
| **Analytics** | Admin stats overview endpoints; chart-first admin home | Architecture docs; no analytics API product | Not Started |
| **Settings** | Client profile; admin settings page | Profile PATCH exists; prefs API exists; ops settings host missing | Planned |
| **Admin** | Full `admin-dashboard` SPA | `@hamd/ui` ops workspaces; `apps/ops` missing; users/CMS/AI APIs missing | Planned |

## Sub-feature notes

### Authentication

| Sub-feature | V1 | V2 | Status |
| --- | --- | --- | --- |
| Login | Yes | Yes | Migrating |
| Refresh / logout (httpOnly cookie model) | No (localStorage JWT) | Yes (API) | Migrating |
| Register / email verify | Yes | API GAP | Planned |
| Forgot / reset password | Yes | API GAP (schema tokens exist) | Planned |
| MFA | No | Schema/docs; API/UI GAP | Planned |
| Admin-only login route | Yes | Use unified identity | Planned |

### Catalog & CMS

| Sub-feature | V1 | V2 | Status |
| --- | --- | --- | --- |
| Categories / products CRUD | Yes | Schema only | Planned |
| Announcements CMS | Yes | UI library + docs; API GAP | Planned |
| FAQs | Partial | Planned via CMS | Planned |

### Collaboration

| Sub-feature | V1 | V2 | Status |
| --- | --- | --- | --- |
| Buyer ↔ ops chat | Yes | Not Started | Not Started |
| AI knowledge base | Yes (admin) | Not Started (API) | Not Started |

## Legend for program tracking

- Prefer updating this file when a Version 2 host ships a feature to production parity.
- Mark **Completed** only after cutover criteria in
  [`08-version-1-preservation-checklist.md`](./08-version-1-preservation-checklist.md)
  and an approved retirement decision - not when a library component lands.
