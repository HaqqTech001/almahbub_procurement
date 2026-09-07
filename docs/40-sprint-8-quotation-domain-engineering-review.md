# Sprint 8 quotation domain engineering review

## Delivered scope

The Quotation aggregate is tenant-scoped and exposes draft CRUD, read/list,
review, issue, accept, decline, revise, and append-only history endpoints.
Every mutation uses `rowVersion` optimistic concurrency and emits an audit
event plus an outbox event.

## Data controls

- `quotation_families` owns immutable quotation lineage.
- Each version has a unique `(family_id, version_number)` pair and only one
  successor via `supersedes_id`.
- Issued quotations cannot be patched. Revision supersedes the issued version
  and copies it to a new draft version in the same family.
- Price components (subtotal, discount, tax, shipping, duty, other, total),
  delivery lead time, MOQ, payment terms, and commercial terms are persisted.
- `quotation_documents` stores UUID references only. It intentionally has no
  document-domain foreign key.
- `quotation_history` records lifecycle state, actor, reason, and row version.

## Authorization and workflow

`quotation:create`, `quotation:update`, `quotation:review`,
`quotation:issue`, `quotation:read`, and `quotation:revise` govern staff
operations. Acceptance and decline require either the procurement request
buyer or `quotation:approve`; expired quotations cannot be accepted. Issuing
requires a supplier, validity date, payment terms, and at least one item.

Drafts may be created only for active sourcing requests. Issuing a quotation
atomically advances its parent request from `sourcing` to `quote_issued`, with
the matching request status event, audit record, and outbox event.

## Verification

Run `pnpm --filter @hamd/database validate`, then generate the Prisma client
before API type checking. The API test suite contains quotation lifecycle and
schema coverage; route policy and OpenAPI metadata describe all endpoints.
