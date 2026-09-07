# Version 1 → Version 2 Migration Map

This document maps every Version 1 application and major surface to its
HAMD Genesis (Version 2) replacement. **Migration has not started as a cutover**
under Phase RC2; this map is the planned replacement topology.

## Application map

```
Legacy Backend          (backend/)
        ↓
Version 2 API           (apps/api)          - EXISTS (partial domain coverage)

Legacy Client           (client-frontend/)
        ↓
Version 2 Client        (apps/client)       - MISSING (GAP)
        +
Version 2 Public Web    (apps/web)          - MISSING (GAP)
        +
UI library              (packages/ui)       - EXISTS (fixture-driven)

Legacy Admin            (admin-dashboard/)
        ↓
Version 2 Ops Console   (apps/ops)          - MISSING (GAP)
        +
UI library              (packages/ui)       - EXISTS (partial workspaces)

Legacy MySQL            (Railway / local)
        ↓
Version 2 PostgreSQL    (database/ + Supabase) - EXISTS (schema + migrations)
```

## Detailed mapping

| Version 1 | Path | Version 2 target | Path | Status |
| --- | --- | --- | --- | --- |
| v1-backend | `backend/` | HAMD API | `apps/api` | Partially implemented |
| v1-client (buyer) | `client-frontend/` | Client Workspace host | `apps/client` | Not created |
| v1-client (marketing) | `client-frontend/` public routes | Public Website host | `apps/web` | Not created |
| v1-admin | `admin-dashboard/` | Operations Console host | `apps/ops` | Not created |
| Shared UI (forked) | shadcn forks in both SPAs | Design system | `packages/ui`, `packages/design-tokens` | Library exists |
| MySQL schema | `backend/config/database.js` | Prisma schema | `database/prisma/` | Schema exists; data cutover not done |
| Socket.IO chat | `backend/socket/` | Collaboration platform (future) | TBD / docs architecture | Not in `apps/api` |
| Render deploy | External | Future DevOps module | docs/25+ | Deferred |

## Domain map

| Version 1 domain | Version 1 location | Version 2 replacement | Notes |
| --- | --- | --- | --- |
| Auth | `/api/v1/auth` | `/api/v1/auth` in `apps/api` | Login/refresh/logout/me/profile exist; register/verify/forgot/admin-login parity incomplete |
| Procurement requests / orders | `/requests`, `/orders` | `/api/v1/procurement-requests` | Renamed; state machine enforced |
| Order tracking | `/tracker` | `/api/v1/shipments` | Richer shipment domain |
| Categories / products / services | `/categories`, `/products`, `/services` | Catalog API + `apps/web` / ops catalog | Prisma models exist; **HTTP API missing** |
| Announcements | `/announcements` | CMS / Experience family | Docs + UI library; **API missing** |
| Chat | `/chat` + Socket.IO | Collaboration platform | **Not migrated** |
| Users admin | `/users` | Identity / org RBAC | Schema ahead; **admin API missing** |
| Notifications | nested under auth/users | `/api/v1/notifications` | Exists in V2 |
| AI knowledge | `/ai` | AI governance / assistant | Architecture docs; **API missing** |
| Quotations | (none first-class) | `/api/v1/quotations` | New in V2 |
| Invoices | (none) | `/api/v1/invoices` | New in V2 |
| Payments | (none) | `/api/v1/payments` | New in V2 |

## Host shell doctrine (Version 2)

Version 1 combined marketing + buyer in one SPA and ops in another. Version 2
requires three hosts (documented in `docs/68`):

| Shell | App | Replaces |
| --- | --- | --- |
| Public Website | `apps/web` | Marketing/catalog routes from `client-frontend` |
| Client Workspace | `apps/client` | Authenticated buyer routes from `client-frontend` |
| Operations Console | `apps/ops` | `admin-dashboard` |

Until those hosts exist, Version 1 remains the only runnable product UI.

## Explicit non-goals for this archive phase

- Do not delete Version 1 folders.
- Do not relocate Version 1 folders (see [`legacy/README.md`](../../legacy/README.md)).
- Do not begin traffic cutover.
- Do not add new Version 1 features.
