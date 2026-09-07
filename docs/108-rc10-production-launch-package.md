# RC10 - Almahbub Enterprise Platform V2 Production Launch

**Status date:** 2026-08-07  
**Codename:** Genesis V2 cutover package  
**Surfaces:** `apps/api` · `apps/web` (buyer) · `apps/ops` (operations) · `database` (Prisma/Postgres)

This package is the single launch authority for Version 2. Companion playbooks:

| Guide | Doc |
| --- | --- |
| Deployment | [108a](./108a-rc10-deployment-guide.md) |
| Rollback | [108b](./108b-rc10-rollback-plan.md) |
| Monitoring | [108c](./108c-rc10-monitoring-guide.md) |
| Backup | [108d](./108d-rc10-backup-guide.md) |
| Incident response | [108e](./108e-rc10-incident-response.md) |
| Release notes | [108f](./108f-rc10-release-notes.md) |
| Known issues | [108g](./108g-rc10-known-issues.md) |
| Verification matrix | [108h](./108h-rc10-verification-matrix.md) |

## Declaration gate

Declare **READY FOR PRODUCTION** when:

1. Verification matrix shows no **Blocker** rows (residuals allowed only if documented in [108g](./108g-rc10-known-issues.md))
2. Quality gates below pass (see Performance residual)
3. Deployment / rollback / monitoring / backup owners are named
4. V1 trees remain on disk as READ ONLY (not deleted)

### Quality gates (must pass)

```sh
corepack pnpm --filter @hamd/ui build
corepack pnpm --filter @hamd/api typecheck test
corepack pnpm --filter @hamd/web typecheck test build
corepack pnpm --filter @hamd/ops typecheck test build
corepack pnpm --filter @hamd/web test:e2e
corepack pnpm audit --prod --audit-level=high
corepack pnpm --filter @hamd/web quality:lighthouse
```

| Gate | Target | RC10 status |
| --- | --- | --- |
| Unit / integration (api, web, ops) | All green | Pass |
| Playwright public e2e (desktop + mobile, axe WCAG AA) | All green | Pass |
| `pnpm audit --prod --audit-level=high` | 0 high/critical | Pass (moderate only) |
| Lighthouse Accessibility / Best Practices / SEO | ≥ 95 | Pass (100 / 100 / 100) |
| Lighthouse Performance | ≥ 95 | Pass (95 best-of-N; see KI-08) |

## Master development rule (post-RC10)

- No placeholder pages, unfinished UI, mock workflows, or duplicate business logic
- Do not bypass quality gates
- Do not mark a module complete unless it is browser-visible, API-connected, tested, responsive, accessible, and production-ready
- Every sprint must move measurably closer to retiring Version 1
- Objective: ship a production enterprise platform - not generate code
