# Version 1 Preservation Checklist

Phase RC2 archival verification. Check items confirm **preservation and
documentation**, not migration completion.

## Source code

| Check | Status | Evidence |
| --- | --- | --- |
| `backend/` preserved at historical path | Done | Top-level `backend/` intact; not deleted |
| `client-frontend/` preserved | Done | Top-level `client-frontend/` intact |
| `admin-dashboard/` preserved | Done | Top-level `admin-dashboard/` intact |
| No additional legacy apps overlooked | Done | Audit found only these three top-level apps |
| Permanent archive index created | Done | `legacy/README.md` maps v1-backend / v1-client / v1-admin |
| Apps remain runnable in place | Done | Move deferred to avoid breaking README, Prettier ignores, docs paths, deploy roots |
| Business logic unmodified by archival | Done | Documentation-only change set |

## Configuration

| Check | Status | Evidence |
| --- | --- | --- |
| Backend env template documented | Done | `backend/.env.example` + overview/deploy sections |
| Live env pattern documented (no secrets in docs) | Done | `DB_*`, `JWT_SECRET`, email, Cloudinary keys listed by name |
| Client `VITE_API_URL` pattern documented | Done | Overview + API inventory |
| Admin `VITE_API_URL` pattern documented | Done | Overview + API inventory |
| CORS / origins behavior documented | Done | Overview deployment section |

## Database

| Check | Status | Evidence |
| --- | --- | --- |
| Legacy MySQL tables listed | Done | `05-database-migration-plan.md` |
| Bootstrap/migration mechanism documented | Done | `database.js` + `backend/migrations/` |
| V2 Postgres/Prisma targets listed | Done | Model groups + mapping table |
| Migration + rollback strategy documented | Done | Same plan doc |
| Data cutover **not** executed in RC2 | Done | Explicit non-goal |

## APIs

| Check | Status | Evidence |
| --- | --- | --- |
| Legacy mounts inventoried | Done | `04-api-inventory.md` |
| Endpoint → V2 mapping | Done | Mapped / Partial / Missing tags |
| Missing APIs highlighted | Done | Summary section in API inventory |
| Socket.IO called out | Done | Overview + API inventory |

## Authentication

| Check | Status | Evidence |
| --- | --- | --- |
| JWT + Bearer documented | Done | Overview |
| localStorage client/admin tokens documented | Done | Overview |
| Role model documented | Done | `user` \| `admin` |
| V2 auth parity gaps listed | Done | Feature + API inventories |

## Deployment

| Check | Status | Evidence |
| --- | --- | --- |
| Ports documented (5000 / 5173 / 5174) | Done | Overview + legacy index |
| Historical Render hosting noted | Done | Overview / release notes |
| How to run V1 vs `pnpm dev` clarified | Done | `legacy/README.md` |
| Railway MySQL vs Supabase distinction clear | Done | DB plan + runtime audits |

## Documentation set

| Document | Present |
| --- | --- |
| `docs/legacy/01-version-1-overview.md` | Yes |
| `docs/legacy/02-migration-map.md` | Yes |
| `docs/legacy/03-feature-inventory.md` | Yes |
| `docs/legacy/04-api-inventory.md` | Yes |
| `docs/legacy/05-database-migration-plan.md` | Yes |
| `docs/legacy/06-version-1-release-notes.md` | Yes |
| `docs/legacy/07-version-1-known-issues.md` | Yes |
| `docs/legacy/08-version-1-preservation-checklist.md` | Yes (this file) |
| `legacy/README.md` | Yes |

## Explicit RC2 non-actions (verified)

| Action | Status |
| --- | --- |
| Did not delete legacy code | Confirmed |
| Did not refactor legacy business logic | Confirmed |
| Did not begin migration cutover | Confirmed |
| Did not modify Version 1 runtime entrypoints | Confirmed |

## Sign-off

Version 1 is prepared as a **permanent reference implementation**. Migration may
proceed in a later phase using this archive as the source of truth for parity
checks.
