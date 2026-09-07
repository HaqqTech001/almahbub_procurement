# User Research and Workflow Validation Plan

## Purpose

The redesign assumptions must be tested with the people who will buy, operate,
approve, and deliver the service. This plan defines the research necessary to
validate product priorities before build work starts. It is a research protocol;
no customer or stakeholder interviews have been represented as completed.

## Research objectives

1. Confirm the highest-cost failures in the current sourcing-to-delivery
   process.
2. Validate the terminology, statuses, documents, and decisions that users
   expect at every workflow stage.
3. Test whether buyers understand quote cost components, delivery estimates,
   risks, and payment responsibilities.
4. Identify where operations currently use spreadsheets, email, WhatsApp, or
   untracked calls because the system does not support the task.
5. Prioritize the minimum buyer and operations experience needed to launch a
   credible managed service.

## Participant segments

| Segment | Target participants | Primary questions |
| --- | --- | --- |
| SME buyers | 6–8 | What makes international procurement difficult, costly, or uncertain? |
| Enterprise procurement leads | 5–6 | Which approvals, reports, controls, and integrations are mandatory? |
| Finance approvers/controllers | 4–5 | How should payment release, invoices, reconciliation, and evidence work? |
| Procurement officers | 6–8 | What creates delays, rework, poor handoffs, and supplier-quality risk? |
| Logistics/freight partners | 4–6 | Which milestones, documents, exceptions, and ETA signals are reliable? |
| Suppliers | 5–6 | What information is needed to issue an accurate quote and fulfill it? |

Recruit across low- and high-volume customers, procurement complexity, industry,
and the intended launch corridors. Avoid using only existing power users; the
platform must also be understandable to new buyers.

## Interview format

- 45–60 minute semi-structured interview.
- Use recent real procurement examples, with commercially sensitive details
  redacted.
- Ask participants to narrate current actions, artifacts, handoffs, and
  decisions before asking about desired features.
- Conduct usability sessions with prototype flows after discovery interviews.
- Obtain consent, explain recording/data retention, and store recordings and
  notes under access control.

## Core questions by role

### Buyers

- Tell us about the last international purchase that went wrong or took too
  long. What happened at each stage?
- What data can you provide at request time? What do you usually not know?
- What makes you trust or reject a quote?
- How do you decide among price, delivery time, supplier quality, warranty,
  payment terms, and risk?
- What would you expect to see before paying a deposit?
- Which shipment updates need immediate attention versus a summary?

### Procurement officers

- Walk through the last request from intake to quote. Where did information
  have to be copied between systems?
- How do you qualify suppliers and prove why one was chosen?
- Which request categories need a special checklist or approval?
- Which actions should be private internal notes and which should be
  customer-visible?
- What is a realistic service-level target by request complexity?

### Finance

- Who can request, approve, release, reconcile, refund, or write off a
  payment?
- Which financial documents are mandatory at each milestone?
- What data must flow into the accounting system?
- How are partial payments, FX changes, credit notes, and disputes handled?

### Logistics

- Which milestones can be reliably automated and which require human
  confirmation?
- What are the most common delays and what evidence is needed to resolve them?
- When is an ETA trustworthy enough to display to a buyer?
- Which documents are required before pickup, customs, and final delivery?

## Prototype validation tasks

Each participant should complete realistic tasks without coaching:

1. Create a custom request from an incomplete product description.
2. Clarify a missing specification through a request-specific conversation.
3. Compare two quotes with different price, lead-time, and risk profiles.
4. Approve a quote or explain why it should be returned for revision.
5. Identify the next owner/action on a delayed shipment.
6. Find an invoice and verify what remains payable.
7. For operational users, update a milestone and raise an exception with an
   appropriate buyer message.

## Success criteria

- At least 80% of representative buyers can explain total quote cost,
  exclusions, risk conditions, and the next required action.
- At least 80% can correctly interpret shipment status and ETA confidence.
- Procurement officers can complete a sourcing-to-quote workflow without
  maintaining a parallel spreadsheet for core recordkeeping.
- Finance users can identify the source record and authorization basis for
  every payment event in a test scenario.
- Research identifies a ranked list of recurring pain points and validates or
  rejects each Phase 1 feature hypothesis.

## Research outputs

Each study cycle must produce:

- An anonymized findings report with evidence and severity.
- A journey map showing user actions, pain points, and opportunities.
- A prioritized opportunity backlog with confidence and expected impact.
- Terminology decisions for statuses, documents, and workflow actions.
- Updated acceptance criteria for the MVP.

## Governance

The product lead owns synthesis and prioritization. Operations, finance,
security, and design must review findings that affect their domain. No feature
is considered validated simply because it was requested by one customer;
prioritize by frequency, severity, strategic fit, and operational feasibility.
