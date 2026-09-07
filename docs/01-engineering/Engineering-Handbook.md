# Almahbub International Procurement Platform  
# Engineering Handbook - Version 2

**Product:** HAMD Genesis  
**Brand:** Almahbub International  
**Technology partner:** HAQQ TECH (footer-level attribution only - see Brand Handbook §7.5)  
**Status:** Official engineering source of truth  
**Audience:** Engineers, AI assistants, reviewers, release owners  
**Authority:** This handbook consolidates normative decisions already adopted for Version 2. Where a lower-level blueprint conflicts with the [HAMD Engineering Constitution](../33-hamd-engineering-constitution.md), the constitution prevails. Where this handbook records **current enforcement** versus **target capability**, both are labeled explicitly.

---

## 1. Architecture

### 1.1 Product shape

HAMD is **managed procurement software**, not an uncontrolled marketplace. Business truth (status, money, identity, approval, physical milestones) lives in governed records-not chat or presentation state.

Version 2 ships as a **modular monolith** by default. Extract separate services only when measured constraints require it.

### 1.2 Three-shell doctrine

User-facing Version 2 is three deployable hosts (non-negotiable product architecture):

| Shell | Application | Responsibility |
| --- | --- | --- |
| Public Website | `apps/web` | Marketing, catalog discovery, public content |
| Client Workspace | `apps/client` | Authenticated buyer workflows |
| Operations Console | `apps/ops` | Queue-first ops / Record Workbench |

**Current state:** only `apps/api` exists under `apps/`. UI building blocks live in `packages/ui`. Hosts are planned; until they ship, Version 1 SPAs remain the runnable product UI (see §6).

### 1.3 Workspace

| Path | Role | In pnpm workspace? |
| --- | --- | --- |
| `apps/` | Deployable surfaces | Yes (`apps/*`) |
| `packages/` | Shared libraries and UI | Yes (`packages/*`) |
| `database/` | Prisma schema, migrations, seeds | Yes |
| `docs/` | Decisions, specifications, runbooks | No |
| `.github/` | CI and security automation | No |
| `legacy/` | Archive **index** for Version 1 (paths not relocated) | No |
| `backend/`, `client-frontend/`, `admin-dashboard/` | Version 1 reference apps | **No** |

**Rule:** New Version 2 work must not import Version 1 source. Version 1 remains outside the workspace until approved cutover.

Tooling: **pnpm** workspaces + **Turborepo**. Root package name: `hamd-genesis`.

### 1.4 Applications (Version 2)

| App | Package | Status | Default local port |
| --- | --- | --- | --- |
| API | `@hamd/api` | Active foundation | `127.0.0.1:4000` |
| Public web | `apps/web` | Planned | TBD |
| Client | `apps/client` | Planned | TBD |
| Ops | `apps/ops` | Planned | TBD |
| Notification dispatcher | worker via `apps/api` script | Exists | N/A (worker) |

Root `pnpm dev` → `turbo dev` starts workspace packages that define `dev` (today: **`@hamd/api` only**).

### 1.5 Packages and shared libraries

| Package | Purpose |
| --- | --- |
| `@hamd/ui` | Design-system components, shells, Storybook |
| `@hamd/design-tokens` | Semantic design tokens |
| `@hamd/contracts` | Shared API/event contract schemas |
| `@hamd/constants` | Stable shared constants |
| `@hamd/types` | Shared TypeScript types |
| `@hamd/utils` | Small pure utilities |
| `@hamd/env` | Environment parsing helpers |
| `@hamd/api-client` | Thin typed HTTP client helper |
| `@hamd/config-eslint` | Shared ESLint baseline |
| `@hamd/config-typescript` | Shared TypeScript configs |
| `@hamd/database` | Prisma client, migrations, seeds |

### 1.6 Backend folder structure

API domain modules follow:

```text
apps/api/src/modules/<domain>/
  api/              # routes, controllers, Zod schemas
  application/      # services, policies, gateways
  domain/           # state machines / pure domain rules
  infrastructure/   # repositories, adapters
  tests/            # domain-focused tests
```

Cross-cutting code lives under `apps/api/src/shared/`, `middleware/`, `routes/`, `composition/`, `config/`.

**Layer rules**

| Layer | May do | Must not do |
| --- | --- | --- |
| Controller | Transport, auth context, invoke validation, map response | Domain rules, query composition, direct status writes |
| Service | Transactions, orchestration, policy, domain events | Accept unvalidated `unknown` |
| Repository | Persistence only | HTTP, presentation, cross-domain policy |
| Policy | Permissions, SoD, state legality | Persist or render |
| Worker/job | Idempotent async work with retry/DLQ/trace | Bypass domain policy |

State changes use **named domain commands**, not free-form status field writes from controllers.

### 1.7 Folder structure (repository)

```text
apps/api/                 # Version 2 API
packages/*                # Shared libraries + @hamd/ui
database/prisma/          # Schema + migrations
docs/                     # Specs, ADRs, legacy archive docs
docs/01-engineering/      # This handbook
docs/legacy/              # Version 1 preservation
legacy/README.md          # Version 1 path index
backend/                  # V1 API (reference)
client-frontend/          # V1 client (reference)
admin-dashboard/          # V1 admin (reference)
docker-compose.yml        # Local Postgres + Redis
.github/workflows/        # Quality / secrets / container scan
```

---

## 2. Technology Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| **Runtime** | Node.js `24.11.x` (engines `>=24.11.0 <25`) | `.nvmrc`; `engine-strict` |
| **Package manager** | pnpm `10.14.x` (engines `>=10.14.0 <11`) | Corepack |
| **Monorepo tasks** | Turborepo | `build`, `dev`, `lint`, `typecheck`, `test` |
| **Language** | TypeScript (strict) | No implicit `any`; ESLint bans `any`; keep `exactOptionalPropertyTypes` - fix optional props properly (`prop?: T \| undefined`); never relax compiler flags to bypass builds |
| **Backend** | Express 5 | Helmet, CORS, cookie-parser, compression, Pino |
| **Validation** | Zod | At API / event / job boundaries |
| **Database** | PostgreSQL 17 + Prisma | Authoritative transactional store |
| **DB hosting (V2)** | Supabase (pooler) in configured envs; local Docker for compose | See §7 |
| **Cache / jobs** | Redis 7 + ioredis | Optional in local API env until configured |
| **Auth** | `jose` (JWT), Argon2id passwords, HttpOnly refresh cookies | Deny-by-default permissions |
| **Email** | Resend | Required in production env contract |
| **Frontend (V2)** | React + `@hamd/ui` + design tokens | Hosts planned; Storybook on `:6006` |
| **State (V2 UI)** | Hooks for reusable client behavior; server state via query/cache layer; shareable URL state | No parallel design systems |
| **Testing** | Vitest; Testing Library; Supertest | Playwright/axe are target layers (§5) |
| **Containers** | Docker Compose (dev); `apps/api/Dockerfile` (CI image) | |
| **CI** | GitHub Actions | Quality, Gitleaks, Trivy |

Version 1 stack (reference only): Express 4, MySQL (`mysql2`), Socket.IO, React/Vite SPAs, JWT in `localStorage`. Do not extend it for platform features.

---

## 3. Development Standards

### 3.1 Naming

| Kind | Convention |
| --- | --- |
| Folders | lowercase `kebab-case` |
| TypeScript modules | `kebab-case.ts` |
| React components | `PascalCase` |
| Hooks | `use*` |
| Booleans | `is` / `has` / `can` / `should` |
| DB tables / columns | `snake_case`; FKs `{related}_id`; events `{event}_at` (UTC `timestamptz`) |
| Permissions | `resource:action` |
| Money | decimal amount + ISO currency (never float) |

### 3.2 Folder rules

- Domain code belongs in the matching `modules/<domain>/…` layers (§1.6).
- Shared transport concerns → `middleware/` / `shared/`.
- Database schema and migrations → **only** `database/`.
- Do not add Version 2 features under `backend/`, `client-frontend/`, or `admin-dashboard/`.
- Do not create a second design system beside `@hamd/ui` / `@hamd/design-tokens`.

### 3.3 Code style

| Tool | Policy |
| --- | --- |
| EditorConfig | UTF-8, LF, 2-space indent, final newline |
| Prettier | Root `pnpm format` / `format:check` |
| ESLint | Shared `@hamd/config-eslint`: recommended + `consistent-type-imports` + `no-explicit-any` |
| TypeScript | Strict including `exactOptionalPropertyTypes`; no ignored compiler errors; no unbounded casts; do not disable strict flags to green-build |

### 3.4 Component standards

- Use semantic HAMD tokens only (no arbitrary palette values in product UI).
- One primary action per local context; no icon-only consequential actions.
- Release surfaces must cover: default, hover, focus-visible, active, disabled, loading, empty, error, success, dark, responsive, and accessibility states.
- Cards have one bounded purpose; avoid “card walls.”
- Motion communicates hierarchy/progress/confirmation only; respect `prefers-reduced-motion`.

### 3.5 API standards

- Versioned under **`/api/v1`**.
- Resource-oriented; paginated, filterable, sortable, searchable where lists exist.
- Controllers invoke Zod schemas; never expose raw DB records.
- Mutating commands that can duplicate value require **idempotency** keys.
- Structured logging with request/correlation IDs; redacted PII/secrets.
- Operational health: `GET /health/live`, `GET /health/ready` (not under `/api/v1`).
- OpenAPI available from the API app (`/openapi.json`, `/docs`).

**Response envelope (implemented for `/api/v1`):**

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {},
  "errors": [],
  "requestId": "...",
  "timestamp": "..."
}
```

Errors use the same envelope with an `error` object (`code`, `message`, `requestId`, optional `details`). Always include a request ID.

### 3.6 Database standards

- PostgreSQL + Prisma are authoritative for Version 2.
- Prefer UUIDv7 identifiers, explicit FKs, indexes on filtered/FK access paths, unique business constraints, audit fields, documented soft-delete (no global ORM “hide deleted” magic).
- Connection roles:
  - `DATABASE_URL` - application runtime
  - `MIGRATION_DATABASE_URL` - Prisma migrate / seed
  - `SHADOW_DATABASE_URL` - migration diffs only; **never** the primary database
- Migrations are **expand → backfill → dual-read/write → cut over → contract**.
- Production rollback is a **forward repair**, not unsafe down SQL.
- Production seeds: idempotent reference data only-never passwords, API keys, or customer data.

### 3.7 Security standards

- Deny by default; validate at every trust boundary.
- Least privilege; encrypt in transit and at rest; rotate secrets.
- No secrets, tokens, connection strings, or personal data in source, logs, tests, screenshots, or AI prompts.
- Authorization is server-side (`authenticate` + `requirePermission`). UI role checks are never authorization truth.
- Short-lived access tokens; rotating refresh tokens (HttpOnly cookies); reuse detection where implemented.
- File uploads must be quarantined/validated; never trust client MIME alone.
- AI assists; it must not autonomously approve, pay, publish, or assert unverified logistics facts.

### 3.8 Performance standards

| Budget | Target |
| --- | --- |
| Public LCP | ≤ 2.5s at p75 (supported mobile networks) |
| Interaction | Acknowledge within ~100ms; INP ≤ 200ms |
| CLS | < 0.1 |
| API reads | Explicit pagination/query-cost bounds; p95 targets set per endpoint (guideline ≤ 500ms for typical reads) |
| Critical writes | Acknowledge within documented p95 (guideline ≤ 800ms) |

No unbounded lists, file reads, event replays, or database queries. Measure before optimizing; eliminate work before caching. Cache is never authorization truth.

### 3.9 Accessibility standards

- **WCAG 2.2 AA** minimum.
- Semantic HTML; full keyboard operation; visible focus (≈2px, 3:1); screen-reader names/statuses.
- Contrast: 4.5:1 normal text; 3:1 UI/focus.
- Touch targets appropriate to context (≈44×44 where applicable).
- No workflow may require color, hover, pointer precision, sound, or CAPTCHA alone.
- Zero known critical/serious automated a11y violations on changed surfaces without documented exception.

### 3.10 Documentation standards

- Decisions are recorded where work happens (ADRs / handbook updates / module reviews).
- This handbook is the **single engineering SoT** for day-to-day standards; deep blueprints remain under `docs/` for history and detail-do not fork conflicting rules into new parallel “standards” docs.
- Version 1 preservation lives only under `docs/legacy/` + `legacy/README.md`.
- Public/user content: factual, concise, inclusive; i18n-ready (locale, timezone, currency, Unicode, RTL readiness in domain data).

---

## 4. Git Workflow

### 4.1 Branch strategy

| Branch | Purpose |
| --- | --- |
| `main` | Protected integration line; CI required |
| `feat/<short-name>` | Features |
| `fix/<short-name>` | Bug fixes |
| `chore/<short-name>` | Tooling, deps, non-product chores |
| `docs/<short-name>` | Documentation-only |
| `hotfix/<short-name>` | Urgent production fixes from `main` |

Prefer short-lived branches. Do not commit directly to `main` when PR flow is available.

### 4.2 Commit convention

Use concise, imperative subjects that explain **why**:

```text
feat(api): enforce procurement transition policy
fix(auth): rotate refresh token on reuse detection
chore(ci): fail Trivy on HIGH severity
docs(handbook): clarify migration verification gates
```

Rules:

- One logical change per commit when practical.
- Never commit secrets or `.env` files.
- Do not use `--no-verify` to bypass hooks unless explicitly approved for an emergency with follow-up.

### 4.3 Pull request checklist

Before requesting review:

- [ ] Scope matches an agreed outcome (Definition of Ready).
- [ ] No Version 1 source imported into Version 2 packages.
- [ ] Types, validation, authorization, and error envelope correct.
- [ ] Tests added/updated at the right pyramid layer(s).
- [ ] No N+1, unbounded work, or secret/PII leakage.
- [ ] UI (if any): semantic structure, states, keyboard, contrast, reduced motion.
- [ ] Migrations are expand-safe; rollback strategy stated.
- [ ] Docs/OpenAPI updated when contracts change.
- [ ] CI `Quality` workflow is green.

Reviewers verify constitution boundaries (§1.6), security, and test adequacy.

### 4.4 Release process

1. `main` green: format, lint, typecheck, test, build, Prisma validate, Gitleaks, API image Trivy (CRITICAL/HIGH).
2. Migration rehearsed against a non-production database; PITR/backup checkpoint for production.
3. Immutable artifact (container/image) promoted; config/secrets validated in target env.
4. Rollout owner + rollback owner named; feature flags where relevant.
5. Smoke: health endpoints, auth, and critical workflow checks.
6. Observe dashboards/alerts; communicate known impact.

Hotfixes follow the same gates with compressed review, then immediate follow-up hardening.

---

## 5. Testing Strategy

### 5.1 Pyramid

| Layer | Tooling | Intent |
| --- | --- | --- |
| Unit | Vitest | Domain rules, policies, pure utils |
| Component | Vitest + Testing Library (+ axe target) | `@hamd/ui` behavior and a11y |
| Integration | Vitest + ephemeral PG/Redis (target) | Repositories, transactions, outbox |
| API / contract | Supertest + OpenAPI | Authz, envelopes, route policy |
| E2E | Playwright (target) | Cross-shell critical journeys |
| Security | Gitleaks, Trivy; DAST target | Secrets and image CVEs |
| Performance | Budgets in §3.8; CI bundle budgets when hosts exist | Real-user journeys |

### 5.2 Module expectations

Every domain module should cover: happy path, negative path, edge cases, permissions, state illegality, idempotency/retry where relevant, and observability hooks. Higher assurance for payment, approval, identity, and shipment paths.

### 5.3 Current enforcement vs target

**Enforced in CI today:** `pnpm format:check`, `lint`, `typecheck`, `test`, `build`, Prisma `validate`, Gitleaks, Trivy on `apps/api` image.

**Target (documented QA/DevOps, not all wired yet):** Playwright E2E, automated axe gates on hosts, ephemeral integration services, broader DAST.

### 5.4 Regression

- Protect state machines and permission matrices with unit tests.
- Re-run critical API/route-policy suites on every PR.
- After migration waves, re-verify mapped V1 workflows against V2 parity checklists (`docs/legacy`).

---

## 6. Migration Strategy

### 6.1 Legacy (Version 1)

| Archive name | Path | Role |
| --- | --- | --- |
| v1-backend | `backend/` | Express 4 + MySQL + Socket.IO (`:5000`) |
| v1-client | `client-frontend/` | Buyer + marketing SPA (`:5173`) |
| v1-admin | `admin-dashboard/` | Ops SPA (`:5174`) |

Index: `legacy/README.md`. Preservation docs: `docs/legacy/`.  
**Policy:** do not delete; do not add platform features; do not treat as Genesis runtime.

### 6.2 Version 2 replacements

| Version 1 | Version 2 |
| --- | --- |
| `backend/` | `apps/api` + `@hamd/database` |
| `client-frontend/` (marketing) | `apps/web` + `@hamd/ui` |
| `client-frontend/` (buyer) | `apps/client` + `@hamd/ui` |
| `admin-dashboard/` | `apps/ops` + `@hamd/ui` |
| Railway MySQL | Supabase PostgreSQL (Prisma) |

### 6.3 Migration order

1. Identity / sessions / RBAC foundations  
2. Organizations and permissions  
3. Catalog (when API + hosts ready)  
4. Procurement requests (API largely present)  
5. Quotations → invoices → payments  
6. Shipments  
7. Notifications / templates  
8. CMS, chat, AI (explicitly later or replaced)  
9. Host cutover: `web` → `client` → `ops`  
10. Version 1 DB read-only soak → decommission  

Data migration is a **parallel rebuild**, not a blind MySQL 1:1 copy. Logical mappings (e.g. `orders` → `ProcurementRequest` + items) are in `docs/legacy/05-database-migration-plan.md`.

### 6.4 Rollback

- Prefer traffic, flag, and application rollback compatible with expand-only schema.
- Never run destructive “down” SQL under pressure.
- Payment/identity/shipment corrections use reconciled **forward** actions with audit evidence.
- Pre-cutover: Version 1 remains system of record; discard failed load environments.

### 6.5 Verification

- Row-count and referential checks for migrated domains.
- Auth login and permission spot-checks.
- Open procurement / shipment records sample validation.
- API health ready (database dependency).
- Parity against `docs/legacy/03-feature-inventory.md` and `04-api-inventory.md`.
- No cutover marked complete while critical features remain **Missing** without an explicit product retirement decision.

---

## 7. Deployment

### 7.1 Environments

| Environment | Purpose |
| --- | --- |
| Development | Local Docker + `pnpm dev`; optional Supabase for shared DB |
| CI | Ephemeral GitHub Actions runners; schema validate; tests; image scan |
| Preview | Per-PR optional (target) |
| Staging | Production-like secrets, migrations, smoke |
| Production | Managed Postgres, managed Redis, immutable API image, PITR |

Initial portability target historically includes Render-class hosting; contracts remain Docker/health/env based.

### 7.2 Development

```sh
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp database/.env.example database/.env
pnpm docker:up
pnpm dev
```

- API: `http://127.0.0.1:4000`  
- Compose: Postgres `127.0.0.1:5432`, Redis `127.0.0.1:6379`  
- `pnpm docker:reset` destroys local volumes - **never** against production  

Version 1 (reference): separate `npm run dev` in `backend`, `client-frontend`, `admin-dashboard`.

### 7.3 Staging / production

- Typed environment validation at process start.
- Separate runtime vs migration credentials.
- Run `migrate:deploy` with `MIGRATION_DATABASE_URL` against the target, after backup/PITR checkpoint.
- Promote scanned API image; configure CORS allow-list; enable Resend and Redis as required.
- Workers (e.g. notification dispatcher) run as separate processes with the same image/env family.

### 7.4 Environment variables (Version 2)

**Root (compose):** `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `REDIS_PORT`

**`apps/api`:** `NODE_ENV`, `API_HOST`, `API_PORT`, `LOG_LEVEL`, `CORS_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`, `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `RESEND_API_KEY`, `EMAIL_FROM`

**`database`:** `DATABASE_URL`, `MIGRATION_DATABASE_URL`, `SHADOW_DATABASE_URL`

Production requires database, Redis, JWT secret, and email configuration (enforced by env schema when `NODE_ENV=production`).

### 7.5 Secrets

- Never commit `.env` or credentials.
- Store secrets in the host secret manager / platform env vault.
- Rotate on leak or staff change; scan with Gitleaks in CI.
- Shadow DB credentials are isolated and must not point at primary.

---

## 8. Definition of Done

### 8.1 Definition of Ready

Work may start only when it has:

- User/business outcome and owner  
- Scope boundaries and acceptance criteria  
- Permissions and state/transition impacts  
- API/database impact and failure cases  
- Accessibility requirements and security classification  
- Test approach  

Ambiguous destructive behavior requires an explicit decision first.

### 8.2 Definition of Done (every feature)

A feature is **Done** only when all of the following hold:

1. **Reviewed** - code and (when needed) architecture review complete.  
2. **Correct boundaries** - controller/service/repository/policy respected; no V1 imports.  
3. **Validated** - Zod (or equivalent) at trust boundaries; OpenAPI updated if public contract changed.  
4. **Authorized** - server-side permission tests for success and denial.  
5. **Tested** - unit/domain and appropriate higher layers; CI green.  
6. **States** - loading, empty, error, success (and offline/reduced-motion where UI).  
7. **Accessible** - WCAG 2.2 AA expectations for changed UI.  
8. **Performant** - no unbounded work; budgets considered.  
9. **Secure** - no secret/PII leakage; uploads/inputs safe; dependency policy respected.  
10. **Observable** - structured logs/metrics/traces hooks; request IDs on errors.  
11. **Auditable** - consequential actions emit audit/outbox facts where required.  
12. **Migration-safe** - expand-only compatible; rollback strategy recorded.  
13. **Documented** - operator/user-facing notes as needed; handbook/ADR updated if standards change.  
14. **Deployable** - builds in CI; env flags/secrets identified; owner for rollout/rollback.  

No unresolved **S0/S1** defects. High-risk domains (identity, payment, approval, shipment) require explicit sign-off.

### 8.3 Quality gates (merge to `main`)

| Gate | Mechanism |
| --- | --- |
| Format | `pnpm format:check` |
| Lint | `pnpm lint` |
| Types | `pnpm typecheck` |
| Tests | `pnpm test` |
| Build | `pnpm build` |
| Schema | `pnpm --filter @hamd/database validate` |
| Secrets | Gitleaks |
| Container | Trivy CRITICAL/HIGH on `apps/api` image |

---

## Appendix A - Local command cheat sheet

| Command | Effect |
| --- | --- |
| `pnpm dev` | Turbo dev → `@hamd/api` `:4000` |
| `pnpm build` / `lint` / `typecheck` / `test` | Workspace quality |
| `pnpm docker:up` / `down` / `reset` | Local Postgres + Redis |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Prisma workflows |
| `pnpm --filter @hamd/ui storybook` | UI lab `:6006` |

---

## Appendix B - Related deep references

Use these for detail; do not fork conflicting standards:

| Topic | Document |
| --- | --- |
| Highest policy | `docs/33-hamd-engineering-constitution.md` |
| API architecture | `docs/14-enterprise-api-architecture.md` |
| Auth/security | `docs/13-authentication-and-security-architecture.md` |
| Database | `docs/12-enterprise-database-architecture.md`, `database/README.md` |
| QA | `docs/24-enterprise-quality-assurance-framework.md` |
| DevOps | `docs/25-enterprise-devops-architecture.md` |
| Perf/security guidelines | `docs/26-enterprise-performance-security-guidelines.md` |
| Design system | `docs/10-enterprise-design-system-specification.md` |
| Modernization status | `docs/68-zero-omission-platform-modernization-audit.md` |
| V1 archive | `docs/legacy/*`, `legacy/README.md` |

---

**End of Engineering Handbook.**  
Changes to normative rules require an Architecture Decision Record, named owner, impact assessment, and approval by product, engineering, security, and operations owners.
