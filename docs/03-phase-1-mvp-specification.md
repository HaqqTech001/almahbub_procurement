# Phase 1 Managed Procurement MVP Specification

## Objective

Deliver a usable managed-procurement workspace that replaces fragmented request
intake, sourcing notes, quotes, customer communication, payment follow-up, and
shipment status updates with one governed operating flow.

Phase 1 intentionally optimizes for trustworthy human operations. It does not
launch an open marketplace, autonomous purchasing, real-time carrier coverage
for every route, or financial services that have not passed launch gates.

## In-scope capabilities

### Buyer workspace

- Organization profile, users, roles, and notification preferences.
- New request and request drafts with custom line items, specification,
  quantity, budget, delivery location, required-by date, and attachments.
- Request detail with current status, assigned owner, next action, timeline,
  documents, and buyer-visible messages.
- Quote comparison, structured acceptance/decline/revision request, and
  approval history.
- Payment-request view with payment instructions, evidence, amount, currency,
  due date, and status.
- Shipment timeline with latest ETA range, next milestone, exception notice,
  documents, and delivery confirmation.

### Procurement officer workbench

- Assigned queue with SLA due date, customer priority, request complexity,
  current stage, and exception flag.
- Request validation checklist, internal tasks, customer-visible messages, and
  internal notes.
- Supplier candidate evaluation, sourcing notes, and supporting documents.
- Versioned quote creation with option comparison and explicit cost
  components.
- Controlled request/quote state changes and escalation handoff.

### Finance and logistics operations

- Finance view of payment requests, confirmations, allocations, invoices, and
  reconciliation exceptions.
- Logistics view of purchase-ready orders, shipment creation, milestone
  recording, document collection, and exception ownership.
- Manual operational updates are allowed in Phase 1, but each update must show
  source, timestamp, and responsible user.

### Platform controls

- Organization-scoped authorization and high-risk role permissions.
- Audit trail for commercial, payment, logistics, and access events.
- Notification routing for assignments, mentions, quote actions, payment
  events, shipment updates, and exceptions.
- Private document storage with access policy and upload validation.
- Core operational reports and downloadable, permissioned exports.

## Explicitly out of scope

- Open supplier self-registration or public marketplace listings.
- Autonomous AI decisions, unreviewed supplier outreach, or unreviewed
  customer financial commitments.
- Escrow-like money holding, credit, trade finance, or payment guarantees
  unless legal and provider validations approve them.
- Broad customs automation without corridor-specific partners and data.
- Voice/video calling as a substitute for request-scoped records.
- Complex ERP integrations before core workflow reliability is demonstrated.

## Key UX requirements

### Buyer experience

- Start from a guided request, a saved template, or a curated catalog item.
- Use plain language before asking for trade terminology.
- Make incomplete information visible without blocking a useful initial
  request; route it to clarification where necessary.
- Present quotes as a decision: total landed cost, alternatives, delivery
  range, inclusions, exclusions, supplier confidence, and risks.
- Always show the next action, who owns it, and when it is expected.

### Operator experience

- Use dense but readable queues on desktop, with saved filters and bulk-safe
  actions.
- Keep request records, supplier work, internal notes, customer messages,
  documents, and formal decisions in one contextual workspace.
- Surface overdue items and exceptions before general activity.
- Prevent accidental changes to issued quotes, approved purchase orders, and
  confirmed financial events.

### Mobile experience

- Buyers can submit a request, respond to a clarification, review/approve a
  quote, upload a document, confirm payment, and check tracking from mobile.
- Prioritize camera upload, slow-network resilience, large tap targets, and
  mobile-friendly quote summaries.
- Preserve desktop operations density through responsive detail views instead
  of shrinking complex tables until unusable.

## Acceptance criteria

### Request

- A buyer can save a draft and submit a request with at least one line item.
- Submission creates a durable activity event and alerts the assigned queue.
- Officers can request clarification without exposing internal notes.
- Every displayed status maps to a valid lifecycle transition and has
  explanatory next-action text.

### Quote and approval

- An officer can create a draft quote containing one or more options and a
  complete cost breakdown.
- Issuing a quote creates a locked version with an expiry date and buyer
  notification.
- The buyer can approve, decline, or request revision; each choice stores
  actor, time, and reason/comment.
- Any commercial modification after issuance creates a new version and
  displays a change summary.

### Payment and invoice

- A payment request identifies its related quote/order, amount, currency,
  due date, instructions, and current state.
- Finance confirmation requires an authorized user and leaves an audit event.
- The system never marks a payment paid solely because a user uploaded a file
  or initiated a transaction.
- Generated financial documents retain immutable issued versions and safe
  access controls.

### Tracking and exceptions

- Logistics can add a milestone with time, source, evidence, and optional ETA.
- Buyers see current stage, latest ETA range, next expected event, and
  customer-visible exception guidance.
- An exception requires owner, severity, impact, next action, and resolution
  target before it is marked open.

### Security and quality

- Every API and UI action is organization-scoped and permission-checked.
- High-risk operations have explicit authorization and audit events.
- Core flows are accessible by keyboard and meet agreed WCAG 2.2 AA checks.
- Core buyer workflows remain practical on common mobile screen sizes and
  constrained networks.

## Launch metrics

| Metric | Phase 1 objective |
| --- | --- |
| Request-to-first-response time | Measure by service tier and reduce each release |
| Quote cycle time | Measure from accepted request to issued quote by category |
| Quote acceptance | Explainable by value, category, supplier option, and decision reason |
| On-time-in-full delivery | Measured against buyer-confirmed delivery commitment |
| Landed-cost variance | Compare approved quote to final charge with categorized explanation |
| Shipment exception response | Measure time from detection to assigned owner and customer notice |
| Buyer satisfaction | Collect after closure and analyze by workflow stage |
| Operational rework | Track clarification loops, quote revisions, and manual duplicate entry |

## Release readiness

Phase 1 can move to a controlled pilot only when the launch gates in
`00-launch-validation-and-operating-model.md` are approved, role permissions
and audit trails are tested, end-to-end pilot cases pass, and operations has
documented playbooks for sourcing, payments, shipping, exceptions, support,
and incident handling.
