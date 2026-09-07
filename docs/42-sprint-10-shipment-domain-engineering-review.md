# Sprint 10 Shipment Domain Engineering Review

## Delivered scope

- Migration extends shipment identifiers with carrier/tracking data, containers,
  UUID-only document links, inspections, immutable history, delivery evidence,
  confirmation actor/time, row-version concurrency, and supporting indexes.
- `modules/logistics/shipment` provides tenant-scoped create/read/update/list,
  governed lifecycle commands, append-only milestones, containers, tracking,
  document links, inspections, delivery confirmation, and history endpoints.
- Each material change writes an audit event and transactional outbox event.
  Carrier integration is represented by `CarrierTrackingGateway`; Sprint 10
  intentionally supplies no external provider adapter.

## Controls

- Status is never accepted in create/update payloads. Lifecycle state changes
  only through `/commands`, and `shipment:transition` is required.
- `/confirm` requires `shipment:confirm`, a delivered shipment, matching row
  version, recipient identity, and at least one UUID evidence reference. It
  completes the shipment atomically and is not a client confirmation endpoint.
- Evidence and document fields accept UUID references only; no asset URL,
  signature value, or sensitive document payload is persisted by the API.
- Container/document uniqueness, tenant scoping, foreign keys, history,
  optimistic locking, audit records, and outbox events are enforced.

## API surface

`/api/v1/shipments` supports GET/POST, with GET/PATCH at `/{shipmentId}` and
additional `transitions`, `timeline`, `milestones`, `containers`, `tracking`,
`documents`, `evidence`, `inspections`, `confirm-delivery`, and `history`
resources. OpenAPI and the route-policy registry describe each route and its
permission-bound purpose.

## Validation

Unit tests cover governed transitions plus milestone, tracking, and confirmation
validation. Run `pnpm --filter @hamd/database generate`, then
`pnpm --filter @hamd/api typecheck`, `lint`, and `test` after applying the
shipment migration in a PostgreSQL environment.
