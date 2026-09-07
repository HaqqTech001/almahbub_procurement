# Domain Architecture and Controls

## Architecture principles

- Start as a modular monolith with clear domain boundaries. This reduces
  operational overhead while avoiding a future monolith organized around pages
  or database tables.
- Treat the procurement lifecycle as a set of controlled business records, not
  an accumulation of chat messages and mutable status fields.
- Keep transactional truth in a relational system, files in private object
  storage, and long-running/integrated work in background jobs.
- Authorize every action through tenant, role, permission, relationship, and
  record-state checks.
- Publish important record changes through a durable outbox so notifications,
  integrations, analytics, and audit projections are reliable and do not
  duplicate financial or operational events.

## Bounded domains

| Domain | Owns | Must not own |
| --- | --- | --- |
| Identity and access | users, credentials, sessions, MFA, roles, permissions | business approval decisions |
| Organization | tenants, workspaces, teams, cost centers, approval policies | global user authentication |
| Catalog | categories, attributes, products, lists, indicative prices | negotiated quote price |
| Procurement | requests, line items, assignment, sourcing tasks, supplier evaluations | payment settlement |
| Commercial | RFQs, quote versions, approvals, purchase orders, change orders | shipment tracking events |
| Finance | payment requests, allocations, invoices, receipts, credits, reconciliation | supplier discovery |
| Logistics | shipments, packages, routing, milestones, exceptions, proof of delivery | quote approval |
| Communication | conversations, messages, internal notes, mentions, templates | formal state transitions |
| Documents | file metadata, access policy, signatures, retention, document requests | business-record rules |
| Notifications | preferences, deliveries, digests, templates, channel routing | source-of-truth business data |
| Reporting | read-optimized metrics, exports, saved reports | transaction mutation |
| Platform administration | global configuration, risk policy, feature controls, support escalation | ordinary buyer operations |

## Core records and relationships

```text
Organization
  └─ Workspace membership and policy
       └─ Procurement request
            ├─ Request line items and documents
            ├─ Sourcing tasks and supplier evaluations
            ├─ Quote versions and approval decisions
            ├─ Purchase order and change orders
            ├─ Payment requests, allocations, and invoices
            ├─ Shipments, packages, milestones, and exceptions
            └─ Contextual conversation and activity timeline
```

Every record has a stable identifier, organization boundary, creator, created
timestamp, updated timestamp, lifecycle state, and activity/audit references.
Financial, commercial, and delivery events retain a historical version instead
of being silently overwritten.

## Lifecycle state machines

### Procurement request

`draft → submitted → needs_clarification → accepted_for_sourcing → sourcing →
quote_issued → revision_requested → approved | declined | expired →
purchase_in_progress → fulfilled | cancelled | closed`

The transition service validates actor permission, prerequisite data, prior
state, reason where required, audit event, and notifications. A status change
is never a direct unrestricted field edit.

### Quote

`draft → internally_reviewed → issued → accepted | declined | expired |
superseded`

An issued or accepted quote is immutable. A revision becomes a new version
linked to the previous version and renders a buyer-visible delta.

### Payment

`draft → requested → initiated → pending_confirmation → confirmed → allocated →
settled`

Terminal exception states include `failed`, `refunded`, `voided`, and
`disputed`. Payment initiation must not unlock purchase execution; only the
configured confirmed/allocated condition can do so.

### Shipment

`planned → supplier_ready → picked_up → export_cleared → departed →
in_transit → arrived → import_cleared → out_for_delivery → delivered`

`exception_open` is a parallel operational condition, not a replacement for the
physical state. It stores category, owner, severity, customer impact, next
action, resolution target, and closure evidence.

## Authorization model

Role assignment is organization-scoped. Permission checks combine:

1. **Tenant boundary:** user belongs to the organization that owns the record.
2. **Role permission:** e.g., buyer, requester, approver, finance controller,
   procurement officer, logistics coordinator, organization administrator,
   platform administrator.
3. **Relationship:** requester, assigned officer, manager, approval chain, or
   support escalation relationship where required.
4. **Record state:** some actions are legal only in a defined state.
5. **Segregation of duties:** a user who creates or edits a payment request
   cannot approve/release it where control policy applies.

Internal notes are separate data objects with an explicit visibility policy.
They must never be exposed by a generic conversation query.

## Event and audit model

Every business action creates an audit event with actor, actor type, timestamp,
organization, record reference, action, before/after metadata where safe,
request/correlation ID, and reason when required.

Important domain events are written atomically with the source transaction:

- `request.submitted`
- `request.assigned`
- `quote.issued`
- `quote.approved`
- `payment.confirmed`
- `purchase_order.issued`
- `shipment.milestone_recorded`
- `shipment.exception_opened`
- `invoice.issued`

An outbox worker delivers these idempotently to notification, analytics,
integration, and search projections. Consumers record event identifiers to
prevent duplicate effects.

## Integration map

| Integration class | Pattern | Controls |
| --- | --- | --- |
| Payment providers | provider-hosted collection, webhooks, reconciliation jobs | verify signatures, idempotency, retry safely, store provider references |
| Carrier/forwarder feeds | polling/webhooks plus manual override | retain source, timestamp, confidence, raw payload reference, and human correction history |
| Accounting | asynchronous export/webhook | chart-of-accounts mapping, immutable journal references, reconciliation status |
| Email/SMS/WhatsApp | queued notifications | consent, templates, preference enforcement, delivery status, rate limits |
| Identity/SSO | standards-based federation | organization domain controls, MFA policy, deprovisioning |
| File scanning/storage | private upload pipeline | malware scan, content type/size validation, signed access, retention and deletion policy |

## Non-functional requirements

### Reliability

- Idempotent commands for payment, import, export, document, and integration
  operations.
- Transactional data changes and durable background processing.
- Retry policies with dead-letter review for failed jobs.
- Backups, restore testing, incident response, and record-level auditability.

### Security

- Encrypted traffic and storage, private documents, signed URLs, secrets
  manager, dependency monitoring, rate limiting, secure headers, and
  centralized logs.
- Least privilege, MFA for privileged roles, session controls, and security
  alerts.
- No production fallback secrets, public testing endpoints, or unrestricted
  cross-origin access.

### Performance

- Paginated/filterable operational lists and virtualized dense tables.
- Async document conversion, exports, email, analytics, and integration calls.
- Optimized media, CDN delivery, cacheable reference data, and performance
  budgets for buyer mobile flows.

### Accessibility and privacy

- WCAG 2.2 AA baseline, keyboard operation, semantic UI, contrast, meaningful
  errors, reduced motion, and assistive-technology testing.
- Data minimization, retention/deletion workflows, consent/preferences,
  tenant-scoped AI retrieval, and documented processing purposes.
