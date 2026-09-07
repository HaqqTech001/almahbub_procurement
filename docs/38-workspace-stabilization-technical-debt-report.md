# HAMD Genesis Workspace Stabilization Report

**Review date:** 2026-07-29  
**Scope:** The HAMD pnpm workspace (`apps/api`, `database`, `packages`, root
tooling, and CI). Legacy `backend`, `client-frontend`, and `admin-dashboard`
remain isolated migration references and were not refactored in this pass.

## Outcome

The foundation workspace now passes package-level linting, typechecking,
testing, building, and Prisma schema validation. This was a foundation
stabilization pass; it does not represent completion of the authentication,
RBAC, catalog, procurement, finance, or shipment product modules.

## Resolved

| Area | Resolution |
| --- | --- |
| Prisma schema drift | Added an expand-only forward migration for `users.token_version` and the session family, rotation, MFA, step-up, and remembered-device fields already defined in Prisma. |
| Database package | Added a valid public entry point, fixed its build/typecheck configuration, and added standard lint, typecheck, and test scripts. |
| Database commands | Root `db:generate`, `db:migrate`, and `db:studio` now execute the database workspace rather than API placeholders. |
| Container build | The API Docker dependency layer now includes every workspace manifest required to resolve workspace dependencies. |
| Shared naming | Standardized the Docker/CI image and compose-volume prefix to `hamd-`; centralized the API service identifier in shared contracts. |
| Request correlation | Incoming request IDs are accepted only when they are RFC 4122 UUIDs; malformed values are replaced server-side. |
| CORS behavior | Disallowed origins are denied without creating an internal-server-error response. |
| Test coverage | Added CORS-denial and request-ID contract coverage; API tests are now included in API TypeScript checking. |
| Generated artifacts | Prisma generated output is ignored by Git and regenerated through the database package. |
| CI baseline | Added Prisma schema validation before quality gates and example environment files for root, API, and database setup. |

## Current Verification

| Check | Result |
| --- | --- |
| `pnpm --filter @hamd/database validate` | Pass |
| Recursive workspace lint | Pass |
| Recursive workspace typecheck | Pass |
| Recursive workspace build | Pass |
| Recursive workspace test | Pass |
| API tests | 5 passing |
| Root Turbo commands on this Windows host | Blocked because the Corepack pnpm shim is not present on `PATH`; package-level equivalent checks passed. CI installs pnpm explicitly. |

## RBAC Verification

The new API currently exposes only:

- `GET /health/live`
- `GET /health/ready`

They are infrastructure endpoints and intentionally unauthenticated. There
are no business endpoints to authorize, therefore no claim of RBAC coverage is
appropriate yet. The Prisma RBAC records (`Role`, `Permission`,
`RolePermission`, `MembershipRole`) exist, but authentication middleware,
permission evaluation, and protected route registration are still work for the
Authentication and RBAC modules.

**Required gate:** once business routes are introduced, every route must
declare an authentication requirement and permission policy; add a route-policy
coverage test so new endpoints fail CI if they bypass that declaration.

## Remaining Technical Debt

### High priority

1. **Implement authentication and RBAC runtime.** Add session/JWT validation,
   rotating refresh-token handling, organization scoping, permission guards,
   audit events, rate limiting, and corresponding integration tests.
2. **Resolve the platform-role unique-key edge case.** PostgreSQL treats
   `NULL` values as distinct, so the present role uniqueness constraint cannot
   prevent duplicate platform role keys. Implement documented partial unique
   indexes in a reviewed migration together with application-level validation.
3. **Add migration integration CI.** Schema validation prevents syntax errors
   but not migration/runtime drift. Run `migrate deploy` against ephemeral
   PostgreSQL and verify a smoke query in CI.
4. **Complete seed data.** Development seeding is idempotent but currently
   lacks role templates and role-permission grants. Use it only for synthetic
   development data.

### Medium priority

1. Align the API architecture document with the approved `error.details`
   contract and health-route exception to the `/api/v1` prefix.
2. Add runtime dependency checks so readiness becomes `503` when database or
   Redis is unavailable after those integrations are implemented.
3. Add tests for shared packages as they acquire behavior; current
   `passWithNoTests` is acceptable only for small primitives.
4. Complete the documented schema in deliberate domain migrations. Countries,
   currencies, audit events, documents, CMS, AI, analytics, and integrations
   are designed but not implemented.
5. Review unused dependencies when the authentication module is completed.
   Redis, JOSE, TOTP, Resend, and cookie parsing are intentional planned
   dependencies; removing them before that implementation would create churn.

### Low priority

1. Update `@types/node` to the Node 24 type line at the next controlled
   dependency update.
2. Configure a real browser-test matrix, coverage thresholds, and
   accessibility automation once UI applications enter the workspace.
3. Configure Corepack pnpm shims on local Windows development machines, or
   invoke workspace scripts through Corepack until the shim is available.

## Engineering Recommendation

Do not begin quotation, purchase-order, finance, shipment, or portal
implementation on the new API until Authentication and RBAC are production
ready. Their lifecycle transitions require tenant-scoped authorization,
auditable actors, and session security. The next safe implementation unit is
the already planned Authentication & Identity module, followed by RBAC.
