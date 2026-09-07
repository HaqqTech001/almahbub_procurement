# RC10 - Deployment Guide

## Topology

| Service | Artifact | Default port | Notes |
| --- | --- | --- | --- |
| API | `apps/api` Docker image / Node | 4000 | Stateless; Redis optional for rate limits |
| Buyer web | `apps/web` static (`dist/`) | CDN / static host | SPA; `_headers` for cache |
| Ops console | `apps/ops` static (`dist/`) | CDN / static host | Requires `ops:access` (or equivalent) |
| Postgres | Managed / Docker | 5432 | Source of truth |
| Redis | Managed / Docker | 6379 | Rate limit / cache; loss-safe |
| Worker | `apps/api` notification dispatcher | - | Same image, different entry if split |

## Prerequisites

1. Node `>=24.11 <25`, `pnpm` via Corepack (`packageManager` field)
2. Postgres 17+ with migrations applied (`database/prisma/migrations`)
3. Secrets provisioned (never commit): `JWT_ACCESS_SECRET` (≥32 chars), `DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_PUBLIC_URL`, `CORS_ORIGINS`
4. Production CORS includes buyer + ops origins only
5. `TRUST_PROXY=1` (or higher) behind load balancer
6. Optional AI: provider keys (`OPENAI_API_KEY` / Anthropic / Gemini / Azure). Unconfigured → `503 AI_NOT_CONFIGURED` (no mock LLM)

## Build

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @hamd/database generate
corepack pnpm --filter @hamd/database migrate:deploy
corepack pnpm --filter @hamd/ui build
corepack pnpm --filter @hamd/api... build
corepack pnpm --filter @hamd/web build
corepack pnpm --filter @hamd/ops build
```

API container: `apps/api/Dockerfile` (multi-stage, non-root).

Frontend env (build-time):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Absolute API origin |
| `VITE_SITE_URL` | Canonical public site URL |
| `VITE_CAMPAIGNS_ENABLED` | Announcement master switch |

## Migrate

```sh
corepack pnpm --filter @hamd/database migrate:deploy
```

Run migrations **before** flipping traffic to a build that requires new schema. Prefer expand → deploy → contract for breaking changes.

## Release sequence

1. Announce maintenance window (if DNS cutover)
2. Backup Postgres (see [108d](./108d-rc10-backup-guide.md))
3. Deploy API (health `/health/live` + `/health/ready`)
4. Deploy web + ops static assets
5. Smoke (see [108h](./108h-rc10-verification-matrix.md) smoke column)
6. Switch DNS / reverse proxy to Genesis
7. Confirm V1 no longer receives primary traffic; leave V1 READ ONLY on disk

## Smoke checklist (post-deploy)

- [ ] `GET /health/ready` → 200
- [ ] Buyer: register/login → `/app/requests` → create request
- [ ] Buyer: quotations list, shipments list, notifications, support chat
- [ ] Ops: login with `ops:access` → dashboard → products → audit
- [ ] Marketing contact form rate-limited and delivers
- [ ] Copilot returns either completion or explicit `AI_NOT_CONFIGURED`

## Owners

| Role | Name |
| --- | --- |
| Release engineer | |
| DB owner | |
| On-call | |
