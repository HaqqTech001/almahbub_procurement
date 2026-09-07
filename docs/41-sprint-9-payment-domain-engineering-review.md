# Sprint 9 - Payment Domain Engineering Review

## Delivered

The Payment Domain provides provider-neutral, manual payment processing with
finance dual control. A payment creator cannot confirm the same payment.
Confirmed payments allocate only to eligible invoices in the same organization
and currency; allocation and invoice-status projection occur in one
transaction.

The domain includes payment history, evidence metadata, row-version concurrency,
receipt projection, audit records, and outbox events. The provider boundary is a
manual `PaymentGateway`; no live provider SDK or webhook endpoint is present.

## Financial controls

- Allocation cannot exceed the confirmed payment amount.
- Allocation cannot exceed the invoice outstanding balance.
- Invoice status is projected as `partially_paid` or `paid` from confirmed
  allocations.
- Invoices with allocations cannot be voided.
- The creator-to-confirmer separation of duties is enforced by policy.
- Request and payment records are organization-scoped from JWT context.

## Deferred integration work

Paystack, Flutterwave, Stripe, Wise, and bank-transfer connectors remain future
adapters behind the provider-neutral port. Webhook ingestion, refund execution,
dispute workflows, reconciliation, receipt PDF generation, and email delivery
remain asynchronous integration/platform work. The Payment Domain emits durable
outbox events rather than calling providers or mail services in controllers.

## Migration safety

The payment migration intentionally halts when historic payment rows exist.
Those records need an explicit identity backfill for `created_by_id`; inventing
creators would invalidate the dual-control guarantee.

## Verification

The implementation was validated with Prisma schema generation, database/API
builds, linting, typechecking, and the API test suite. The suite includes
payment lifecycle, validation, allocation-control, and route-policy coverage.

## Sprint summary

Sprint 9 establishes a controlled payment ledger and invoice settlement path
without coupling the domain to a gateway provider. The next safe finance step is
provider webhook/inbox integration and reconciliation, not direct SDK calls
from payment controllers.
