# Almahbub Procurement - Version 1 Archive Index

This directory is the **permanent archival index** for Almahbub Procurement
Platform **Version 1**. It does not relocate runtime source.

## Why the apps were not moved

Physically relocating `backend/`, `client-frontend/`, and `admin-dashboard/` into
`legacy/` would break:

- Root `README.md` path table
- `.prettierignore` legacy path exclusions
- Dozens of documentation path citations under `docs/`
- External deploy root-directory settings (e.g. Render) that point at `backend/`

Per Phase RC2 archival policy: **preserve runnability**. Source remains at the
historical top-level paths below. This index is the canonical map.

## Version 1 applications (canonical locations)

| Archive name | Live path | Role | Stack | Default port |
| --- | --- | --- | --- | --- |
| **v1-backend** | [`../backend/`](../backend/) | Express API + Socket.IO | Node.js · Express 4 · MySQL (`mysql2`) | `5000` |
| **v1-client** | [`../client-frontend/`](../client-frontend/) (**DEPRECATED** - see [`DEPRECATED.md`](../client-frontend/DEPRECATED.md)) | Buyer / marketing SPA | React 18 · Vite · Tailwind | `5173` |
| **v1-admin** | [`../admin-dashboard/`](../admin-dashboard/) | Operations SPA | React 18 · Vite · Tailwind | `5174` |

No additional top-level legacy application folders were found. Supporting V1
assets live inside `backend/` (`migrations/`, `scripts/`, `uploads/`).

## How to run Version 1 (reference only)

Version 1 is **outside** the pnpm/Turborepo workspace. Do not use `pnpm dev` for
these apps.

```sh
# Terminal 1 - API (Railway MySQL via backend/.env)
cd backend
npm install
npm run dev

# Terminal 2 - Client
cd client-frontend
npm install
npm run dev

# Terminal 3 - Admin
cd admin-dashboard
npm install
npm run dev
```

| App | Env pointer | Database |
| --- | --- | --- |
| v1-backend | `backend/.env` → `DB_*` | Railway MySQL (or local MySQL) |
| v1-client | `client-frontend/.env` → `VITE_API_URL` | None (calls v1-backend) |
| v1-admin | `admin-dashboard/.env` → `VITE_API_URL` | None (calls v1-backend) |

## Archival documentation

Full preservation docs live in [`../docs/legacy/`](../docs/legacy/):

| Doc | Purpose |
| --- | --- |
| [01-version-1-overview.md](../docs/legacy/01-version-1-overview.md) | Architecture, stack, features |
| [02-migration-map.md](../docs/legacy/02-migration-map.md) | V1 → V2 replacement map |
| [03-feature-inventory.md](../docs/legacy/03-feature-inventory.md) | Feature migration status |
| [04-api-inventory.md](../docs/legacy/04-api-inventory.md) | Endpoint mapping |
| [05-database-migration-plan.md](../docs/legacy/05-database-migration-plan.md) | MySQL → Supabase Postgres |
| [06-version-1-release-notes.md](../docs/legacy/06-version-1-release-notes.md) | Final V1 release notes |
| [07-version-1-known-issues.md](../docs/legacy/07-version-1-known-issues.md) | Debt that drove V2 |
| [08-version-1-preservation-checklist.md](../docs/legacy/08-version-1-preservation-checklist.md) | Archive verification |

## Policy

## Policy

- **Do not delete** Version 1 source.
- **RC7:** `backend/`, `client-frontend/`, and `admin-dashboard/` are **READ ONLY** archives (see each app’s `READ_ONLY.md`).
- **Do not** add new platform features to Version 1.
- **Do not** treat Version 1 as the HAMD Genesis runtime (`pnpm dev` → `apps/api` / `apps/web` / `apps/ops`).
- Buyer runtime: `@hamd/client` → `apps/web`. Ops runtime: `apps/ops`.
- Cutover + rollback: [docs/102](../docs/102-rc7-v1-feature-parity-matrix.md)–[docs/105](../docs/105-rc7-deployment-checklist.md).

Archived Phase RC2; client deprecated RC5.1; **all V1 apps READ ONLY as of RC7**.
