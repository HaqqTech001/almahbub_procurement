# Almahbub International

Almahbub International is a managed procurement platform. This repository is a
TypeScript pnpm/Turborepo workspace for the active V2 applications.

## Architecture boundary

| Location           | Status       | Responsibility                                                                                |
| ------------------ | ------------ | --------------------------------------------------------------------------------------------- |
| `apps/api`         | Active       | Express API (PostgreSQL + Redis). Domain modules + `/api/v1/ops`.                             |
| `apps/web`         | Active       | Public marketing + auth + buyer workspace (`/app/*`).                                         |
| `apps/ops`         | Active       | Operations Console (`@hamd/ops`) on port 3001.                                                |
| `packages/*`       | Active       | Shared TypeScript, linting, contracts, types, and design-token primitives.                    |
| `database/`        | Active       | Prisma schema, migrations, and seeds.                                                         |
| `backend/`         | **READ ONLY** | V1 API - archived in place (`READ_ONLY.md`). Do not delete.                                  |
| `client-frontend/` | **READ ONLY** | V1 buyer SPA - archived (`READ_ONLY.md`, `DEPRECATED.md`).                                   |
| `admin-dashboard/` | **READ ONLY** | V1 admin SPA - archived (`READ_ONLY.md`). Replaced by `apps/ops`.                            |

Do not add new platform functionality to the legacy applications. V1
`client-frontend` is deprecated as of RC5.1; keep it for migration reference and
rollback only. Cutover gates: `docs/99-rc51-cutover-checklist.md`.

The buyer runtime is `apps/web`. `apps/client` is not part of the active
workspace.

## Prerequisites

- Node `24.11.1` (see `.nvmrc`)
- Corepack-enabled pnpm `10`
- Docker Desktop for PostgreSQL and Redis

The current local Node runtime is rejected by `engine-strict` if it is not Node
24, ensuring CI and developer machines use the supported runtime line.

## Setup

```sh
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env
cp apps/api/.env.example apps/api/.env
pnpm docker:up
pnpm dev
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

The API listens at `http://127.0.0.1:4000`. Its unauthenticated operational
endpoints are:

- `GET /health/live` - process liveness
- `GET /health/ready` - foundation readiness; database and Redis are marked
  `not-configured` until the Prisma and Redis integration modules.

## Common commands

```sh
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
pnpm docker:down
pnpm docker:reset
```

`pnpm docker:reset` deletes the local named PostgreSQL and Redis volumes. It is
irreversible and must never be used against a production environment.

## Local services

Docker Compose binds PostgreSQL (`5432`) and Redis (`6379`) to `127.0.0.1`
only. The credentials in `.env.example` are deliberately non-production
defaults; `.env` is ignored and must contain unique local values when the
default is unsuitable.

The Docker Compose stack is development infrastructure only. Production
databases, caches, credentials, backups, and deployment are deferred to the
Deployment module.

## Extension rules

- Add PostgreSQL schema and Prisma only in the Database and Prisma modules.
- Add authentication, RBAC, and domain APIs only in their designated modules.
- Add shared UI components and web applications only with the Design System,
  Client Portal, Operations Console, and Public Website modules.
- Put reusable request/response validation in `@hamd/contracts`; keep
  domain-specific contracts owned by the domain that introduces them.

## Payment domain engineering review

The payment module accepts only `manual_bank_transfer` records through the
`ManualPaymentGateway`; it contains no live processor SDK, credentials, or
network settlement path. Creation is tenant-scoped and requires an
`Idempotency-Key`. Payment evidence is retained as structured receipt metadata,
and every material action produces audit and outbox events.

Manual finance dual control is enforced in the service layer: the creator may
submit a payment but may not confirm it. Confirmation runs serializably with
optimistic row-version checks. It permits allocations only when every target
invoice belongs to the payment organization, has the same currency, and is
`issued` or `partially_paid`. The allocation sum must equal the payment amount,
cannot exceed any invoice outstanding balance, and updates each invoice to
`partially_paid` or `paid` in the same transaction. Allocated invoices cannot
subsequently be voided.

Payment receipt projections are available from `/api/v1/payments/{paymentId}`;
use `/submit` then `/confirm` with the current `rowVersion`. The confirmation
actor needs `payment:confirm`, distinct from the creator, while creation,
submission, and reading require `payment:create`, `payment:submit`, and
`payment:read` respectively.
