# RC7 - Deployment Checklist

## Pre-deploy

- [ ] Postgres migrate includes `20260807001500_rc7_v1_parity_domains`
- [ ] `pnpm --filter @hamd/database exec prisma generate`
- [ ] API CORS includes web (`3000`) and ops (`3001`) origins
- [ ] Seed/permissions include `ops:access`, `communication:manage` (or users re-registered / roles updated)
- [ ] Email provider live (verify/reset)
- [ ] Smoke staging: auth, requests, announcements, support chat, ops dashboard, audit

## Quality gates

```sh
corepack pnpm --filter @hamd/api typecheck
corepack pnpm --filter @hamd/web typecheck
corepack pnpm --filter @hamd/ops typecheck
corepack pnpm --filter @hamd/web test
corepack pnpm --filter @hamd/ops test
corepack pnpm --filter @hamd/web build
corepack pnpm --filter @hamd/ops build
```

## Cutover day

- [ ] Announce window
- [ ] Deploy `apps/api`, `apps/web`, `apps/ops`
- [ ] Switch DNS / proxy to Genesis
- [ ] Verify buyer: login → `/app/requests` → `/app/chat` → `/announcements`
- [ ] Verify ops: login → dashboard → support threads → AI knowledge
- [ ] Confirm V1 hosts no longer receive primary traffic
- [ ] Leave V1 artifacts READ ONLY on disk (do not delete)

## Post-deploy (24–72h)

- [ ] Watch auth failures, 5xx, support unread latency
- [ ] Confirm rollback plan owner on-call ([docs/104](./104-rc7-rollback-plan.md))
- [ ] Update customer help links to Genesis URLs
- [ ] Close RC7 in engineering handbook

## Done when

- [ ] Parity matrix shows **0 Missing** live rows ([docs/102](./102-rc7-v1-feature-parity-matrix.md))
- [ ] `READ_ONLY.md` present on all three V1 apps
- [ ] Rollback plan signed
