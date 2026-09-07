# Sprint 9 Invoice Domain Engineering Review

## Delivered scope

- Accepting a governed quotation now advances its procurement request to
  `purchase_in_progress` and creates an issued purchase order with copied quote
  line items.
- The invoice aggregate is tenant-scoped and can be created only from an issued
  purchase order. Draft changes use optimistic row-version concurrency.
- Invoice lines, UUID-only document references, append-only lifecycle history,
  exchange rate, financial breakdown, void metadata, and update timestamps are
  persisted by the Sprint 9 migration.
- Issue and void commands are audited and outboxed. Issuance also emits
  `invoice.pdf.prepare` and `invoice.email.prepare` integration preparation
  events; delivery itself remains the responsibility of outbox consumers.
- Invoice reads include payment-allocation projections with allocated and
  outstanding balances. List reads support status, PO, search, sorting, and
  bounded pagination.

## API and control surface

`/api/v1/invoices` provides create, list, get, draft update, issue, void, and
history endpoints. All routes require authentication and the corresponding
`invoice:*` permission. Route metadata and OpenAPI describe the access policy.

## Validation focus

Schema tests cover input normalization, UUID document references, bounded query
controls, and mandatory void reasons. The repository and service keep tenant
scope and issued-PO eligibility in database predicates/transactions, making
those controls independent of HTTP validation.
