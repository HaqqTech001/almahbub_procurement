# Sprint 10 - Domain Events Engineering Review

## Delivered

HAMD now has a shared, versioned domain-event envelope in `@hamd/contracts`,
a durable outbox lifecycle, and a generic relay with consumer-level
idempotency and bounded retry/dead-letter handling.

The outbox remains transactionally written alongside the business record and
audit event. No delivery worker participates in the source command
transaction.

## Contract

The registry defines the requested facts:

- identity user registration and email verification;
- procurement submission and RFQ creation;
- quotation submission/approval and purchase-order approval;
- invoice issuance and payment recording;
- shipment creation and delivery.

Identity, RFQ, and standalone Purchase Order services are not yet implemented.
Their event contracts are present and validated, but this sprint deliberately
does not introduce incomplete publisher services.

## Reliability controls

- Events carry a canonical name, version, aggregate, organization, optional
  actor/correlation/causation identifiers, payload, and schema metadata.
- Consumers record `(outbox_event_id, consumer_name)` before considering a
  delivered result complete, enabling at-least-once delivery without duplicate
  side effects.
- Lease status, availability time, attempts, and bounded exponential retry are
  stored on the outbox row.
- Failed events after eight attempts are captured in `dead_letter_events` and
  are no longer repeatedly processed.
- The relay has a queue-adapter port so a future Kafka, RabbitMQ, or managed
  queue bridge can replace polling without changing publishers.

## Current integration

Payment and shipment lifecycle facts now use the shared publisher for the
requested canonical events. The notification worker is registered as a relay
consumer. Existing legacy-shaped outbox rows remain readable during the
migration period.

## Verification

The schema validates and generated database client builds. API typechecking,
tests, linting, and production build are run as the sprint quality gate.

## Remaining follow-up

The remaining Procurement, Quotation, and Invoice publishers should be
migrated in their next lifecycle-touching sprint; their existing event rows
remain compatible with the relay but are not canonical typed envelope events.
Recipient resolution is intentionally domain-owned and should not be inferred
from arbitrary event payloads.
