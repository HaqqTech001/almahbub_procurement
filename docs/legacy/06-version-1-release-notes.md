# Version 1 Release Notes

## Almahbub Procurement Platform - Version 1.0.0

**Classification:** Final stable legacy release  
**Archive date:** Phase RC2  
**Support posture:** Reference implementation only - no new platform features

This document freezes Version 1 as the permanent behavioral reference for
migration and historical audits.

## What’s included

### Applications

| Package name | Path | Version field |
| --- | --- | --- |
| `almahbub-procurement-backend` | `backend/` | 1.0.0 |
| `almahbub-client-frontend` | `client-frontend/` | (app package) |
| `almahbub-admin-dashboard` | `admin-dashboard/` | (app package) |

### Capabilities delivered in Version 1

- Buyer registration, email verification, login, password reset  
- Buyer dashboard, procurement request create/list/detail  
- Marketing site pages (home, about, FAQ, contact, legal, announcements)  
- Category / service / product browsing  
- Admin login and operations dashboard  
- Request triage, user management, catalog CRUD  
- Announcement CMS with views, reactions, replies  
- Realtime chat (Socket.IO) and REST chat helpers  
- Order tracking records  
- In-app notifications  
- AI knowledge base and auto-respond hooks  
- Email delivery via Gmail SMTP and/or Resend  
- File uploads via Multer / Cloudinary  
- MySQL persistence (Railway or local)

### Runtime topology (as archived)

- API: Express on port **5000**  
- Client: Vite on port **5173**  
- Admin: Vite on port **5174**  
- Database: MySQL (`DB_*` env)

## Explicitly out of Version 1 scope

These appear in Version 2 foundations but were not first-class Version 1 product APIs:

- Policy-gated domain state machines for quotations, invoices, payments, shipments  
- Organization memberships and fine-grained RBAC  
- httpOnly refresh-token cookie session model  
- Prisma/PostgreSQL enterprise schema  
- Three-shell public / client / ops host architecture  
- OpenAPI-documented HAMD API (`apps/api`)

## Compatibility notes

- Frontends expect JWT in `localStorage` and `Authorization: Bearer`.  
- Client appends `/api/v1` to `VITE_API_URL`; admin often stores a URL that already includes `/api/v1`.  
- `/api/v1/requests` and `/api/v1/orders` both target the procurement/order MySQL model - treat as dual surface, not two databases.  
- Production defaults in frontend source may still reference Render hostnames.

## Upgrade path

Version 1 is superseded by **HAMD Genesis (Version 2)**:

- API → `apps/api`  
- Data → `database/` + Supabase PostgreSQL  
- UI → `packages/ui` + future `apps/web`, `apps/client`, `apps/ops`

Cutover is **not** part of this archival release. See
[`02-migration-map.md`](./02-migration-map.md).

## Preservation

Source remains at historical paths. Index: [`legacy/README.md`](../../legacy/README.md).  
Known issues: [`07-version-1-known-issues.md`](./07-version-1-known-issues.md).
