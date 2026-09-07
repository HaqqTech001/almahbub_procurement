# RC7 - Controlled Migration Report

**Date:** 2026-08-07  
**Mission:** Retire Version 1 safely without deletion.

## What moved

| V1 | Genesis |
| --- | --- |
| `backend/` | `apps/api` |
| `client-frontend/` | `apps/web` (`@hamd/client`) |
| `admin-dashboard/` | `apps/ops` |

## RC7 implementations closing prior gaps

1. **Announcements** - Prisma + `/api/v1/announcements` + web `/announcements*`
2. **Support chat** - Prisma threads/messages + `/api/v1/support` + web `/app/chat` (poll)
3. **AI knowledge / auto-respond** - `/api/v1/ai/*`
4. **Services API** - `/api/v1/services`
5. **Marketing contact** - `POST /api/v1/marketing/contact`
6. **Change password** - `PATCH /api/v1/auth/password` + settings UI
7. **Help alias** - `/help` → `/faq`
8. **Ops access** - `ops:access` + `communication:manage` on register defaults
9. **Ops support threads** - `/support` live list/detail/reply (no fixtures for tickets)
10. **Ops announcements CMS** - `/cms` announcements tab → `/announcements/admin` + CRUD
11. **Ops AI knowledge** - `/ai` host against `/api/v1/ai/knowledge`

## Migration SQL

`database/prisma/migrations/20260807001500_rc7_v1_parity_domains/`

Apply with: `corepack pnpm db:migrate` (Postgres up).

## Archive actions (no delete)

- `backend/READ_ONLY.md`
- `client-frontend/READ_ONLY.md` (+ existing `DEPRECATED.md`)
- `admin-dashboard/READ_ONLY.md`
- `legacy/README.md` updated to RC7 READ ONLY

## Honest Partial residues

| Item | Substitute |
| --- | --- |
| Socket.IO typing/forms | REST support chat + knowledge auto-respond |
| Public upload CDN | Document platform (later RC) |
| Platform settings persistence | Ops PlatformConfig UI (fixtures + live ops elsewhere) |
| Catalog write UX depth | Ops product/category lists; Prisma models exist |

These do **not** block READ ONLY archival of V1.

## Related

- [Parity matrix](./102-rc7-v1-feature-parity-matrix.md)
- [Rollback plan](./104-rc7-rollback-plan.md)
- [Deployment checklist](./105-rc7-deployment-checklist.md)
