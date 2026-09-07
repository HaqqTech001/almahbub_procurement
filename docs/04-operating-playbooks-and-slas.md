# Phase 1 Operating Playbooks and Service Levels

## Purpose

The product alone cannot create a reliable procurement service. This document
defines the minimum operating playbooks, ownership model, and service-level
structure required for a controlled Phase 1 pilot.

These targets are proposed baselines. Operations leadership must calibrate them
by category, supplier market, customer tier, and launch corridor before making
them contractual.

## Ownership model

| Role | Primary responsibility | Escalates to |
| --- | --- | --- |
| Requester | Supplies requirements, reviews clarifications, decides on quote | Organization approver |
| Organization approver | Approves commercial commitments under policy | Organization administrator |
| Procurement officer | Validates request, sources suppliers, builds quote, manages buyer communication | Procurement lead |
| Procurement lead | Quality review, allocation, supplier exception, commercial escalation | Operations lead |
| Finance operator | Validates payment evidence, allocates payment, issues financial documents | Finance controller |
| Finance controller | Approves controlled releases, refunds, write-offs, reconciliation exceptions | Finance lead |
| Logistics coordinator | Plans shipment, records milestones, manages documents and exceptions | Logistics lead |
| Account/support lead | Manages customer escalation and service recovery | Operations lead |

## Service-level model

### Priority classification

- **P1 - urgent exception:** an event is likely to cause material financial
  loss, delivery failure, compliance exposure, or a high-value customer
  escalation. An owner must acknowledge immediately during operating hours and
  provide a customer-facing update within the agreed urgent communication
  window.
- **P2 - time-sensitive:** a request has a near deadline, expiring quote,
  payment deadline, or shipment delay requiring action before the next
  business day.
- **P3 - standard:** normal sourcing, quote, payment, or tracking work under
  the service tier target.

### Proposed baseline targets

| Activity | Standard | Priority | Measurement |
| --- | --- | --- |
| Submitted request acknowledgement | 1 business day | 4 business hours | Submission to owner acknowledgement |
| Clarification response | 1 business day | 4 business hours | Buyer question to meaningful response |
| Initial sourcing update | 3 business days | 1 business day | Accepted request to evidence-backed update |
| Quote issue | Category-specific target | Category-specific expedited target | Accepted request to issued quote |
| Quote revision acknowledgement | 1 business day | 4 business hours | Buyer revision request to owner acknowledgement |
| Payment confirmation update | 1 business day | 4 business hours | Valid evidence/provider event to status update |
| Shipment exception acknowledgement | 4 business hours | 1 business hour | Detection to named owner |
| Buyer exception notice | 1 business day | 4 business hours | Confirmed impact to buyer communication |

Never use a generic quote SLA for products requiring design confirmation,
regulatory review, specialized inspection, or volatile freight. The request
must communicate the applicable target and dependencies.

## Request intake playbook

1. The requester submits a structured request or saves a draft.
2. The system validates minimum data: item/need, quantity, destination, and
   contactable organization context.
3. A triage owner classifies category, urgency, value band, restricted-item
   indicators, service tier, and complexity.
4. The officer either accepts for sourcing or requests clarification through
   the request thread.
5. The system records ownership, due date, source details, and every state
   transition.

**Do not accept a request for sourcing** when it lacks the information required
to obtain a meaningful supplier response. Instead, use a visible clarification
state and an explicit requested-data checklist.

## Supplier sourcing and qualification playbook

1. Select supplier candidates from approved sources or create a provisional
   candidate record.
2. Collect supplier identity, contact, location, product capability, quotation,
   MOQ, lead time, payment terms, trade terms, quality evidence, and relevant
   compliance documents.
3. Score supplier confidence using documented factors: verification status,
   product/category fit, historical performance, price reasonableness, lead
   time, documentation freshness, and risk flags.
4. Record sourcing evidence and constraints in the request record.
5. Escalate restricted goods, unusually high values, unverified bank details,
   or material quality/compliance concerns before quote issue.

For Phase 1, a procurement lead must review supplier selection for new or
high-risk suppliers before the buyer receives an offer.

## Quote playbook

1. Build one or more sourced options from verified evidence.
2. Separate product cost, freight, insurance, tax/duty estimate, service fee,
   FX assumptions, contingency if applicable, and exclusions.
3. State quote currency, validity, Incoterms, expected delivery range, payment
   milestones, warranty/quality assumptions, and risks.
4. Obtain internal review according to value/risk policy.
5. Issue a versioned quote. Do not edit an issued version.
6. If the buyer asks for a change, create a revision and clearly state the
   differences from the previous version.

## Payment and finance playbook

1. Create a payment request only from the approved commercial record.
2. Verify the payment recipient, amount, currency, due date, and authorized
   approver before issue.
3. Collect provider confirmation or validated bank-transfer evidence.
4. A finance operator allocates confirmed payment to the relevant invoice and
   order. A separate authorized role approves any controlled release where the
   policy requires it.
5. Issue receipts, tax documents, credits, and refunds from a controlled
   finance workflow; preserve all historical versions.
6. Reconcile provider/bank settlement data against internal allocations on a
   defined schedule.

Customer-uploaded proof is evidence for review, not automatic payment
confirmation. The platform must distinguish `pending_confirmation` from
`confirmed`.

## Logistics playbook

1. Confirm purchase readiness, supplier handoff, packaging, shipping mode,
   route, partner, documents, insurance responsibility, and Incoterms.
2. Create the shipment and link it to order lines, packages, and documents.
3. Record milestones using carrier/forwarder information or authorized manual
   updates; store source, timestamp, evidence, and ETA confidence.
4. Monitor departures, customs, delivery commitments, and stale milestones.
5. Open an exception when delay, documentation failure, damage, customs hold,
   routing issue, or delivery failure has material impact.
6. Assign an owner, assess buyer impact, define resolution next action, and
   notify the buyer according to severity.
7. Capture proof of delivery and close the shipment only after delivery
   confirmation and required documentation.

## Customer communication playbook

- Keep buyer-visible messages inside the request/order context.
- Use clear factual language: current fact, impact, next action, owner, and
  next update time.
- Do not promise a future event controlled by a supplier, carrier, customs
  authority, or payment provider without qualifying language.
- Keep internal negotiation, risk assessment, and staff performance notes
  private and visibly separated from customer messages.
- Use approved templates for payment, quote expiry, shipment exception,
  document request, and service recovery communications.

## Exception and dispute playbook

### Exceptions

Open an exception for material delay, customs hold, damaged goods, missing or
incorrect documents, delivery failure, price variance, or payment discrepancy.
Every exception requires category, severity, owner, customer impact, next
action, target resolution time, and closure evidence.

### Disputes

Disputes require a case record linked to the request/order, asserted facts,
supporting documents, financial amount where applicable, communications,
decision authority, and resolution. Never delete or rewrite the underlying
commercial, financial, or tracking events.

## Pilot review cadence

- Daily: operational queue, P1/P2 exceptions, overdue customer actions,
  payment/reconciliation exceptions.
- Weekly: request and quote cycle time, workload, supplier performance,
  shipment exceptions, complaint themes, and process rework.
- Monthly: service-level performance, customer satisfaction, cost variance,
  supplier risk, security/audit exceptions, and product backlog decisions.

Each pilot review must produce owners and due dates for operational and product
improvements. Repeated manual workarounds are product requirements, not merely
training issues.
