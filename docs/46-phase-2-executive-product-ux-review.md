# Phase 2 - Executive Product UX Review

**Project:** HAMD Genesis / Almahbub International  
**Purpose:** Pre-frontend UX gate for CEO, Procurement Director, Operations Manager, Supplier, first-time visitor, mobile user, and accessibility reviewer.  
**Scope:** Documentation and product judgment only. No frontend screen implementation.

---

## 1. Executive verdict

**NO-GO for frontend screen implementation until P0 gates close.**

Phase 2 blueprints correctly separate three ecosystems (Public Website, Client Workspace, Operations Console) and reject ecommerce metaphors. That direction is sound.

What is not yet safe to build:

1. Information-architecture labels still drift across canvases and docs.
2. Supplier self-serve can be accidentally implied by Partner CTAs.
3. The 9-step request wizard lacks a frozen draft/sign-in/confirmation contract.
4. Public tracking privacy allow-list is not signed off.
5. Quote comparison, payment dual-control, and shipment exceptions need acceptance criteria before UI.

**Approve design-system and vertical-slice planning. Do not invent screens that the API and policy cannot support.**

---

## 2. Persona review

| Persona | Cares about | Pass condition |
| --- | --- | --- |
| CEO | Brand accountability, qualified demand, controllable operations | Visitor can request without marketplace confusion; ops can prove control |
| Procurement Director | Comparison quality, policy, auditability | Quotes compared with evidence; approvals are records, not chat |
| Operations Manager | Queues, SLA, legal transitions | Exceptions cleared from attention queues via Record Workbench |
| Supplier | Fair access without chaos | No open supplier portal in MVP; Partner ≠ seller self-serve |
| First-time Visitor | Clarity in one viewport | Brand + one job + Request Procurement |
| Mobile User | One action per screen | Wizard, compare, track, and approve without clipped tables |
| Accessibility Reviewer | Equivalent access | Keyboard, focus, labels, live regions, reduced motion, non-color status |

---

## 3. Dimension review

### Information Architecture

**Status:** Strong direction, incomplete freeze.

- Keep three separate experiences with shared record language.
- Freeze Client labels: Dashboard · Discover · Procure · Finance · Deliveries · Collaborate · Learn · Personal.
- Freeze Ops into queue families; avoid a second mega-nav from legacy admin.
- Resolve dual meaning of “Discover” (public marketing catalog vs client saved/my products) with distinct UI copy.

### Navigation

**Status:** Needs freeze before build.

- Public: Request Procurement primary; Account secondary until intent is clear.
- Client: attention-first; do not lead with vanity analytics.
- Ops: queues before CMS/insights.
- Reject flat unrestricted legacy admin navigation.

### User Journeys

| Journey | Assessment |
| --- | --- |
| Visitor → trust → request/track | Coherent if homepage stays brand-led and non-ecommerce |
| Buyer request → quote → pay → ship → repeat | Core path; must be first vertical slice |
| Ops queue → workbench → audit → customer message | Core path; must ship with permitted transitions only |
| Supplier self-serve | Out of MVP; invite/KYB later only |

### Business Flows

Backend domains for requests, quotations, invoices, payments, shipments, and notifications are ahead of UI readiness. Frontend must not promise:

- live chat as system of record;
- open marketplace checkout;
- optimistic payment/delivery success;
- RFQ/Orders depth beyond API contracts.

### Content Hierarchy

Homepage and record headers should answer: what is this, who owns it, what is next. Stats, logos, CMS, and charts are supporting - never the first decision surface.

### Accessibility

WCAG 2.2 AA is committed in architecture. Before screens: define acceptance criteria for tables, dialogs/drawers, wizard steps, toasts, and tracking status announcements. Color alone must never encode status.

### Performance

Motion and skeleton rules exist. Set budgets for catalog grids, ops data tables, and any tracking media. Mobile CPU/network is a first-class constraint.

### Visual Consistency

Design tokens, components, and motion systems are specified. Legacy ecommerce styling and admin clutter must not leak into new shells.

### Conversion

Primary conversion is **qualified Request Procurement**, not account spam or catalog browsing without intent. Wizard friction is the main conversion risk.

### Trust Signals

Use verifiable proof only. No fake inventory, prices, guarantees, or invented supplier counts. Finance and shipment states wait for server truth. Public track must not leak PII or commercial terms.

---

## 4. Screen audit

For every critical screen: purpose, primary action, mental model, confusion, cognitive load, trust, conversion.

### Public Home

| Question | Answer |
| --- | --- |
| Purpose | Build trust and start a qualified request |
| Primary action | Request Procurement |
| Mental model | Accountable global procurement partner |
| Confusion | Marketplace cues; services vs categories ambiguity |
| Reduce load | One hero job; secondary proof below fold |
| Increase trust | Real facilities, process, verifiable proof |
| Improve conversion | Persistent Request CTA; Account soft until intent |

### Catalog / Product Detail

| Question | Answer |
| --- | --- |
| Purpose | Discover product fit and sourcing evidence |
| Primary action | Add to request / Request this product |
| Mental model | Qualify sourcing, not checkout |
| Confusion | Price/stock language; overloaded compare |
| Reduce load | Evidence-first attributes; short compare set |
| Increase trust | Specs, origin, compliance cues |
| Improve conversion | Save/list + wizard handoff with context |

### Request Wizard (9 steps)

| Question | Answer |
| --- | --- |
| Purpose | Capture a complete procurement brief |
| Primary action | Continue → Submit request |
| Mental model | Guided briefing |
| Confusion | Step count; fear of lost progress |
| Reduce load | Autosave, optional skips, clear progress, review summary |
| Increase trust | Explicit next owner after submit |
| Improve conversion | Draft/auth handoff; confirmation with next step |

### Public Track

| Question | Answer |
| --- | --- |
| Purpose | Reassure with public-safe progress |
| Primary action | Find shipment status |
| Mental model | Limited public progress |
| Confusion | Expecting full commercial detail |
| Reduce load | Status + next milestone only |
| Increase trust | Honest ETA; sign-in for full detail |
| Improve conversion | Help/request CTA without leaking private data |

### Client Dashboard

| Question | Answer |
| --- | --- |
| Purpose | Show what needs attention now |
| Primary action | Resolve top attention item |
| Mental model | Work inbox |
| Confusion | Widget competition |
| Reduce load | Attention queue first; KPIs secondary |
| Increase trust | Owner, SLA, evidence links |
| Improve conversion | Deep link into the exact decision |

### Client Request Detail

| Question | Answer |
| --- | --- |
| Purpose | Manage request lifecycle |
| Primary action | Respond / advance / open quote |
| Mental model | My procurement cases |
| Confusion | Status jargon; chat vs record |
| Reduce load | Plain-language status + next action |
| Increase trust | History and documents on the record |
| Improve conversion | Quote-ready path into comparison |

### Quote Comparison

| Question | Answer |
| --- | --- |
| Purpose | Choose with evidence |
| Primary action | Approve / request revision |
| Mental model | Side-by-side commercial decision |
| Confusion | Hidden fees; unequal columns |
| Reduce load | Normalized fields; highlighted deltas |
| Increase trust | Terms, validity, source notes |
| Improve conversion | One primary approve with explicit confirm |

### Invoices / Payments

| Question | Answer |
| --- | --- |
| Purpose | Pay with dual-control certainty |
| Primary action | Submit evidence / confirm per policy |
| Mental model | Money is audited |
| Confusion | Optimistic success; unclear bank steps |
| Reduce load | Checklist of required evidence |
| Increase trust | Reference IDs, dual control, audit trail |
| Improve conversion | Clear unpaid → evidence → confirmed path |

### Shipments

| Question | Answer |
| --- | --- |
| Purpose | Understand progress and exceptions |
| Primary action | Acknowledge exception / confirm delivery |
| Mental model | Milestone truth |
| Confusion | Map theatre implying false precision |
| Reduce load | Timeline + exception banner first |
| Increase trust | Evidence, honest ETA, contacts |
| Improve conversion | Exception CTA into support/ops message on record |

### Ops Overview

| Question | Answer |
| --- | --- |
| Purpose | Surface risk/SLA needing humans |
| Primary action | Open top queue item |
| Mental model | Command center |
| Confusion | BI charts before work |
| Reduce load | Queues > charts > CMS |
| Increase trust | Auditability visible |
| Improve conversion | One click into Record Workbench |

### Ops Record Workbench

| Question | Answer |
| --- | --- |
| Purpose | Execute a permitted transition |
| Primary action | Apply allowed action |
| Mental model | Controlled case file |
| Confusion | Unrestricted status dropdowns |
| Reduce load | Only legal transitions; reason codes |
| Increase trust | Immutable history |
| Improve conversion | Assignment + customer message hooks |

### Messages / Notifications

| Question | Answer |
| --- | --- |
| Purpose | Coordinate without becoming source of truth |
| Primary action | Open linked record action |
| Mental model | Alerts point to records |
| Confusion | Approving/paying inside chat |
| Reduce load | Deep links; suppress non-actionable noise |
| Increase trust | Audit where decisions occur |
| Improve conversion | Unread → resolve on the business record |

---

## 5. Improvement recommendations

| Priority | Recommendation |
| --- | --- |
| P0 | Freeze IA labels across Public / Client / Ops |
| P0 | Separate three shells; ban ecommerce copy and unrestricted status controls |
| P0 | Define wizard draft save, sign-in handoff, confirmation next-owner copy |
| P0 | Acceptance criteria for quote compare, payment truth, shipment exceptions |
| P0 | Public Track field allow-list and threat model sign-off |
| P1 | Client attention dashboard content contract |
| P1 | Ops six-family nav + universal Record Workbench |
| P1 | Mobile patterns for compare, sheets, wizard density |
| P1 | Accessibility checklist per component family |
| P1 | Performance budgets for catalog, tables, tracking media |
| P2 | Discover/Learn after core Procure→Finance→Deliveries loop |
| P2 | Defer supplier portal; discipline Partner page copy |
| P2 | Gate CMS/Knowledge so it never outranks Request CTA |
| P3 | Live chat only after async record messaging is proven |
| P3 | Celebration/campaign motion only on approved public surfaces |

---

## 6. Priority matrix

| Tier | Scope | Primary audiences |
| --- | --- | --- |
| P0 - Block frontend | IA freeze, three shells, wizard handoff, compare/pay/ship truth, public track privacy | CEO, Procurement Director, Accessibility Reviewer |
| P1 - First build slice | Attention dashboard, requests, quotes, invoices/payments, shipments, ops queues/workbench | Ops Manager, Buyer, Mobile User |
| P2 - Second slice | Catalog depth, saved lists, knowledge, partner discipline, analytics after queues | Visitor, Procurement Director |
| P3 - Later | Live chat, supplier portal, celebration engine, advanced BI | Future supplier, growth extras |

---

## 7. Implementation strategy

1. **Governance freeze** - Lock nav labels, MVP screen inventory, vocabulary, and anti-patterns.
2. **Design-system first** - Tokens, components, motion, and a11y criteria before feature pages.
3. **Vertical slices** - One buyer path (request→quote→pay→ship) and one ops path (queue→workbench→audit) before CMS/catalog expansion.
4. **Screen contracts** - Each screen ships with purpose, primary action, states, permissions, and analytics; no UI without API readiness.
5. **Persona gates** - Release checklist covering visitor viewport, buyer decision clarity, ops queue speed, mobile one-action, keyboard pass, no supplier false promise.
6. **Measure** - Qualified requests, quote cycle time, payment confirmation lag, shipment exception MTTR, WCAG defects, mobile task completion.

---

## 8. Do not build / defer / reject

**Blockers**

- Unresolved IA label conflicts
- Wizard draft/auth handoff undefined
- Public track field allow-list unsigned

**Defer**

- Supplier portal / open registration
- Live chat as system of record
- Celebration engine in operational UI

**Reject**

- Ecommerce checkout metaphor
- Fake stock, prices, or guarantees
- Unrestricted status dropdowns in ops

---

## Final gate

Frontend screens may begin only after P0 items are signed off and the P1 vertical slices have explicit screen contracts. Until then, continue design-system and API contract work only.
