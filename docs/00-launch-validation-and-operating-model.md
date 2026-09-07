# Launch Validation and Operating Model

## Status and purpose

This is a pre-development decision record, not legal advice or evidence of
regulatory approval. It defines the proposed launch model and the evidence
required to approve it before payments, shipping, or supplier onboarding are
enabled in production.

## Proposed launch model

Almahbub will launch as a **managed international procurement and logistics
service** for organizations in Nigeria and West Africa sourcing goods from
approved global corridors. Almahbub owns the customer service experience,
procurement workflow, quote assembly, and shipment coordination. It does not
launch as an unrestricted buyer-to-supplier marketplace.

This model is preferred because the customer receives an accountable service
owner while Almahbub establishes supplier-quality controls, operational
playbooks, and reliable cost/lead-time data.

### Operating boundaries

- The buyer submits a procurement requirement and approves a quote.
- A procurement officer sources and verifies supplier options.
- A finance operator controls payment evidence and allocation.
- A logistics coordinator manages shipping milestones and exceptions.
- The platform records each commercial decision and customer-visible update.
- Supplier access remains invite-only until the supplier verification,
  performance, document, and dispute workflows are operating reliably.

## Commercial-model decisions required

These choices must be made by executive leadership and legal counsel before
implementation of payment collection or supplier contracting:

1. **Legal role per corridor:** establish whether Almahbub is a disclosed
   procurement agent, reseller/merchant of record, or another explicitly
   contracted role. The platform must not present an ambiguous role to buyers
   or suppliers.
2. **Money movement:** decide whether customers pay Almahbub, a licensed
   payment partner, or suppliers directly. Avoid holding customer funds in a
   way that creates unlicensed escrow, money-transmission, or safeguarding
   obligations.
3. **Fee model:** choose a transparent service fee, a quote-inclusive margin,
   or a defined hybrid. Quote presentation must disclose which costs are
   estimates, fixed charges, taxes/duties, freight, supplier prices, and
   Almahbub fees.
4. **Payment milestones:** define eligible deposit, supplier-balance, freight,
   customs, and final-release milestones; determine refund and dispute rules
   for each.
5. **Incoterms and liability:** standardize which Incoterms Almahbub supports
   and who bears risk, insurance responsibility, and customs obligations at
   each transfer point.
6. **Service tiers:** define standard, priority, and enterprise tiers with
   published response, sourcing, quote, and exception-management targets.

## Launch service tiers

### Standard

For ordinary custom sourcing with a defined request. The service target is a
qualified first response within one business day and a quote target determined
by category complexity. This tier includes request validation, sourcing,
quote assembly, payment coordination, tracking, and request-scoped support.

### Priority

For time-sensitive sourcing. It receives a faster triage target, an assigned
officer, proactive exception communication, and a documented escalation path.
Priority does not promise a supplier, stock, customs release, or delivery date
that cannot be operationally supported.

### Enterprise

For organizations with approval controls, cost centers, multiple users,
recurring procurement, reporting, and agreed service governance. It may add
account management, configured approval policies, integrations, and scheduled
business reviews.

## Required external validation

The following items are mandatory launch gates, with results stored in the
company compliance register rather than assumed by product teams:

| Gate | Accountable owner | Required evidence |
| --- | --- | --- |
| Country/corridor legal review | Legal counsel | Written view on agency, reseller, payments, tax, customs, privacy, trade-control, and consumer/B2B obligations |
| Payment-provider eligibility | Finance and payments lead | Contract, supported currencies/countries, settlement model, KYC/KYB requirements, disputes/refunds process |
| Customs and freight operating model | Logistics lead | Partner contracts, supported Incoterms, clearance responsibility, exception escalation process |
| Supplier qualification | Procurement lead | Verification checklist, required documents, bank-account validation, quality/risk scoring method |
| Data protection assessment | Security and privacy lead | Data map, processing purposes, retention schedule, vendor assessments, incident workflow |
| Financial controls | Finance controller | Segregation-of-duties matrix, payment approval limits, reconciliation procedure, audit retention policy |

## Product guardrails until validation is complete

- Do not enable live collection of customer funds.
- Do not describe a payment as protected, insured, escrowed, or guaranteed
  unless that claim is contractually and legally substantiated.
- Do not promise customs clearance, a fixed landed cost, or delivery certainty
  when estimates or third parties are involved.
- Do not activate a corridor, currency, payment method, or restricted category
  without an approved operational and compliance profile.
- Show quote validity, assumptions, exclusions, and risk conditions
  prominently before approval.

## Validation workshop agenda

1. Confirm target customer segments and launch corridors.
2. Select the legal/commercial role for each initial corridor.
3. Approve the payment and refund model.
4. Approve service tiers and measurable service-level targets.
5. Review the restricted-items policy and supplier qualification rubric.
6. Sign off on the product claims, terms, privacy notice, and operational
   escalation model.

## Approval record

Before implementation begins, this record must be supplemented with named
business owners, decision dates, jurisdiction-specific legal advice, and
signed launch-gate outcomes. Until then, the managed-service model is a
design assumption rather than a production authorization.
