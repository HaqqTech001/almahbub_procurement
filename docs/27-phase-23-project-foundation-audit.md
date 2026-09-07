# Phase 23 - Project Foundation Engineering Audit

**Project:** HAMD Genesis  
**Scope:** Repository architecture and implementation readiness  
**Date:** 2026-07-29  
**Status:** Foundation accepted on disk; version-control and legacy-security
actions remain before any production cutover.

## Executive summary

HAMD Genesis has a valid parallel-build foundation: a strict TypeScript
pnpm/Turborepo workspace exists beside the legacy JavaScript/MySQL system. The
new code does not depend on the legacy backend and intentionally contains only
the API, configuration, types, contracts, and design-token foundations.

The target does not yet have product implementations. That is correct at this
stage: Prisma, service adapters, domain APIs, shared UI, client, operations,
and public applications are all explicitly deferred to their respective
modules. Creating empty replacements would introduce placeholder code and blur
ownership boundaries.

The material risks are in the legacy application, not the new foundation:

- all new foundation files are untracked by Git;
- legacy authentication accepts a fallback JWT secret;
- legacy test-email endpoints are publicly reachable;
- legacy HTTP and Socket.IO origins are permissive;
- legacy frontend applications duplicate UI, store, utility, and API-client
  implementations.

## Current repository shape

```text
apps/
  api/                    New TypeScript Express foundation
packages/
  config-eslint/          Shared flat ESLint policy
  config-typescript/      Shared strict TypeScript presets
  contracts/              API primitives and validation foundation
  design-tokens/          Semantic design-token primitives
  types/                  Shared UUID, pagination, and API error types
backend/                  Legacy JavaScript/Express/MySQL reference
client-frontend/          Legacy React/Vite client reference
admin-dashboard/          Legacy React/Vite operations reference
docs/                     Architecture and implementation documentation
.github/workflows/        Quality, secret, and container scanning
```

`services/`, `database/`, `scripts/`, `packages/ui/`, `packages/utils/`,
`packages/constants/`, and `packages/api-client/` have no physical directory
yet. They are reserved rather than scaffolded because their concrete interfaces
depend on forthcoming Database/Prisma, Design System, and domain API modules.

## Findings

### Critical

1. **Foundation is not version-controlled.** `apps/`, `packages/`, `.github/`,
   root workspace configuration, lockfile, and documentation are untracked.
   The remote repository and CI cannot use the foundation until it is committed.
2. **Legacy JWT secret has an insecure fallback.**
   `backend/middleware/auth.js`, `backend/routes/auth.js`, and
   `backend/socket/chat.js` use `fallback_secret_key` when `JWT_SECRET` is
   absent.
3. **Legacy debug email routes are unauthenticated.**
   `backend/server.js` exposes `/api/test-email` and `/api/test-email-send`.
4. **Legacy cross-origin policy is permissive.** `backend/server.js` permits
   unrestricted HTTP and Socket.IO origins.
5. **Two independent runtime stacks remain.** Legacy npm lockfiles coexist
   with the new pnpm lockfile. This is acceptable only while the legacy apps
   remain explicitly outside the workspace.

### High

1. **Duplicated frontend foundations.** Both legacy apps contain parallel UI
   primitives, uploads, rich-input controls, API clients, auth/socket contexts,
   and stores.
2. **Legacy dead or duplicate code exists.** Examples include
   `client-frontend/src/components/ui/input (1).tsx`, duplicate WelcomeModal
   implementations, duplicate admin auth stores, unused admin API and
   notification stores, and unrouted order/chat/category pages.
3. **API defaults are inconsistent in legacy clients.** Their production API
   hostnames differ by underscore versus hyphen.
4. **The new CI does not test legacy applications.** It correctly governs only
   the new workspace, which means deployed legacy code has no shared gate.
5. **The foundation API has no `/api/v1` domain router yet.** This is
   intentional, but the first domain module must establish the documented
   versioned API contract before clients adopt it.

### Medium

1. The new design-token package has no consumer until the Design System module.
2. Root database commands intentionally delegate to Prisma placeholders until
   the Prisma module supplies a real schema.
3. The foundation uses `hamd` while Docker tags and volumes use `hmd`; new
   names must standardize on `hamd`.
4. The health readiness endpoint reports `ready` with unconfigured dependencies;
   real dependency checks are required when Prisma and Redis are introduced.
5. Formatting and CI intentionally exclude legacy paths to avoid accidental
   migration-by-tooling.

### Low

1. Legacy fallback/test scripts and commented-out routes should be retired only
   after their operational use has been verified.
2. Test runners in foundation-only packages allow zero tests; this is temporary
   until those packages expose behavior that needs testing.

## Target architecture decisions

- Keep the root `apps/` and `packages/` workspace as the only new-development
  boundary.
- Keep legacy applications outside pnpm/Turbo until each replacement has
  migration parity and cutover approval.
- Put cross-domain reusable source in packages only when it has at least two
  real consumers. Avoid speculative utility or UI packages.
- Add `packages/ui` only in the Design System module and make it consume
  `@hamd/design-tokens`.
- Add `database/` only with Prisma schema, migrations, seed data, and ownership
  rules in the Database and Prisma modules.
- Add `services/` only when an external adapter or worker has a deployable,
  observable responsibility.
- Add `scripts/` only for repeatable repository operations such as data
  migration, fixture generation, or release verification.
- Centralize shared environment validation, constants, utilities, and API
  client only after their first concrete consumers are defined; otherwise their
  contracts would be placeholders.

## Migration strategy

1. Commit the complete foundation as one reviewable change; do not mix it with
   legacy cleanup or product features.
2. Preserve legacy source and MySQL as read-only migration references.
3. Build the Design System and shared UI from the new tokens instead of copying
   legacy UI files.
4. Implement PostgreSQL and Prisma from
   `docs/12-enterprise-database-architecture.md`; do not mechanically translate
   legacy MySQL bootstrap code.
5. Implement authentication and RBAC from the new security architecture, then
   add domain APIs under the documented `/api/v1` contract.
6. Build new client, operations, and public applications incrementally against
   those APIs.
7. Establish feature-parity, security, data-migration, and rollback criteria
   before retiring each legacy surface.

## Risk assessment

- **Production security risk:** Critical if the legacy backend remains publicly
  deployed without its JWT, email-route, and CORS issues being remediated.
- **Migration risk:** High if legacy files are copied into new packages instead
  of rebuilt against the shared contracts and design system.
- **Data risk:** High if MySQL schema is auto-converted rather than migrated
  from the approved PostgreSQL design.
- **Delivery risk:** High until the untracked foundation is committed and CI
  executes on a Node 24/Docker-enabled runner.
- **Operational risk:** Medium while npm and pnpm coexist; do not merge their
  lockfiles or package graphs during transition.

## Legacy hardening completed

The selected legacy hardening path has been applied without incorporating legacy
code into the new workspace:

- `JWT_SECRET` is now mandatory, rejects known fallback values, and requires a
  minimum 32-character secret.
- HTTP CORS and Socket.IO now use an explicit `ALLOWED_ORIGINS` allow-list
  (with `CLIENT_URL` retained as a one-origin compatibility fallback).
- Debug email routes are disabled by default. When explicitly enabled, both
  require authenticated administrator access.
- Startup logs no longer print default administrator credentials.
- `backend/.env.example` documents the required non-secret configuration.

Deploying this hardening requires setting `JWT_SECRET` and `ALLOWED_ORIGINS` in
every legacy environment before restarting the service. Existing JWTs signed
with the old fallback are intentionally invalidated.

## Completion checklist

- [x] pnpm workspace and Turbo task graph
- [x] Strict TypeScript, shared ESLint, and Prettier policy
- [x] Shared contracts, types, and semantic design tokens
- [x] Validated API environment, logging, error envelope, and health tests
- [x] Local PostgreSQL/Redis topology and API Dockerfile
- [x] CI quality, secret, and container scanning configuration
- [x] Foundation engineering review
- [ ] Commit foundation files to version control
- [ ] Confirm CI, Docker build, and Compose health under Node 24
- [x] Implement legacy security hardening while it remains deployed
- [ ] Begin the Design System module before adding shared UI or application
      surfaces

## Self-review

The foundation meets its approved purpose without creating empty applications,
fake service layers, or a premature database package. The next structural
addition should be `packages/ui` as part of the Design System module. The
legacy security concerns are urgent operational work but must be handled as a
controlled compatibility change, not silently folded into the new platform.
