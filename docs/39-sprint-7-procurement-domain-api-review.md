# Sprint 7 - Procurement Domain API Engineering Review

## Scope

Sprint 7 introduces the first HAMD production business domain: authenticated,
organization-scoped Procurement Requests. The legacy MySQL request routes remain
untouched.

## Delivered

- JWT access-token verification against active sessions, token version, and
  active organization membership.
- Permission-based request context and a central route-policy registry.
- Versioned API mount at `/api/v1`.
- Procurement Request draft CRUD, governed lifecycle commands, assignment,
  archive, restore, and duplicate operations.
- Optimistic concurrency through `rowVersion`.
- Append-only request transition events, audit events, and transactional-outbox
  records for material lifecycle and assignment changes.
- Validated Zod inputs, structured errors, health/readiness dependencies, and
  a baseline OpenAPI 3.1 endpoint.

## Security review

Business routes are mounted only when database dependencies are configured and
all use active session and organization membership validation. Authorization is
evaluated both at the route metadata level and in the application service,
including requester relationship checks. The API never trusts an organization
identifier supplied in a request body.

Open item: production deployment must supply `DATABASE_URL`, `REDIS_URL`, and
`JWT_ACCESS_SECRET`; environment validation rejects a production process
without them.

## Performance review

Collections are organization scoped, soft-delete aware, limited to 100
records, and indexed for organization/status/owner access. No broad shared
cache is used for commercial records. Readiness checks make one bounded
database and Redis operation.

Open item: cursor decoding and scope-bound cursor tokens should replace the
initial bounded page response before the client workspace consumes long
procurement queues.

## Architecture and maintainability review

The module follows the modular-monolith structure:

```text
apps/api/src/modules/procurement/
  api/
  application/
  domain/
  infrastructure/
  tests/
```

Controllers validate/serialize, services own policy and workflow orchestration,
and repositories own persistence queries. Direct status PATCHes are prohibited;
all lifecycle changes use named commands.

## Database migration safety

The Sprint 7 migration is expand-only for an empty HAMD database. It contains a
clear preflight failure if existing unowned Procurement Requests are found.
Any environment with pre-existing records requires an explicit backfill
migration that assigns a valid requester before this migration is deployed.

## Verification

- Prisma schema validation and client generation.
- API typecheck.
- API unit tests for authentication/session rejection, permission denial, route
  policy metadata, request DTOs, and state transition rules.

## Deferred follow-on work

- RFQ creation and supplier sourcing in Sprint 8.
- Persistent idempotency-key records and Redis-backed write limits.
- Full OpenAPI schema generation from Zod rather than the initial documented
  baseline.
- Integration tests against ephemeral PostgreSQL/Redis in CI.
- Outbox publisher/notification consumer; Sprint 7 writes durable event hooks
  only and does not send notifications inline.
