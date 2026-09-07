# Almahbub International Procurement Platform  
# Product Handbook - Version 2

**Product:** HAMD Genesis  
**Brand:** Almahbub International  
**Technology partner:** HAQQ TECH (footer-level attribution only - Brand Handbook §7.5)  
**Status:** Official product source of truth  
**Audience:** Product, design, engineering, operations, leadership  
**Authority:** Consolidates adopted product decisions. Prefer this handbook for day-to-day product truth. Deep blueprints remain under `docs/` for history-do not fork conflicting product rules into new parallel handbooks. Where commercial/legal gates remain open, they are labeled **OPEN**.

---

## 1. Vision

Make cross-border procurement feel **legible, controlled, and dependable** for organizations of any maturity.

**Promise:** HAMD makes international procurement feel calm, clear, and controlled.

**Public north star:** Procure globally with a Nigerian partner accountable for every next step.

**Identity:** Flagship Almahbub International platform (engineered by HAQQ TECH; partner line is footer-level only)-premium, intentional, timeless; aiming among the highest-quality procurement systems in its region.

---

## 2. Mission

Provide **one intelligent workspace** to request, source, approve, pay for, communicate about, and track global procurement-operated as a **managed service**, not an open buyer↔supplier marketplace.

Almahbub owns the service experience. Domain records are the system of record. Chat and email never approve, pay, or ship.

---

## 3. Business Goals

| Goal | Meaning |
| --- | --- |
| Governed operating flow | Replace fragmented intake, sourcing notes, quotes, comms, payment follow-up, and shipment updates with one auditable path |
| Trust over speed theater | Separate confirmed facts from estimates; never invent delivery, customs, or payment guarantees |
| Human authority | Ops and approvers retain consequential decisions; AI assists only |
| Commercial clarity | Quotes, invoices, payments, and shipments are versioned, evidenced, and policy-gated |
| Expandable platform | Three product shells + enterprise domains without marketplace chaos |
| Measurable excellence | Cycle time, OTIF, exception MTTR, CSAT, accessibility, and conversion-not vanity charts alone |

**OPEN (not product-complete until signed):** legal role per corridor, money-movement model, fee model, payment milestones, Incoterms/liability defaults, contractual SLA tiers.

---

## 4. Target Users

### 4.1 Buyer-side

| Segment | Needs |
| --- | --- |
| SME buyers | Simple request path, clear next step, trusted partner |
| Enterprise procurement leads | Policy, audit, multi-stakeholder approval |
| Finance approvers / controllers | Evidenced payables, SoD, traceability |
| Procurement officers (customer org) | Specs, clarifications, quote comparison |

### 4.2 Operator-side (Almahbub)

| Role | Focus |
| --- | --- |
| Procurement officer / lead | Queue, sourcing, quotes, supplier coordination |
| Finance operator / controller | Invoices, payment confirmation, controls |
| Logistics coordinator | Milestones, exceptions, evidence |
| Account / support lead | Exceptions, escalations, customer communication |
| Platform / org administrator | Users, roles, settings, CMS (later) |

### 4.3 Partners (controlled)

| Segment | Access model |
| --- | --- |
| Suppliers | **Invite-only** until verification, performance, and dispute controls mature-no open self-serve marketplace in MVP |
| Logistics / freight partners | Coordinated through ops records; not an open portal in Phase 1 |
| First-time visitors / mobile / a11y users | Public clarity, WCAG 2.2 AA, constrained-network practicality |

**Research note:** Interview protocols and success criteria exist; completed interview findings are **not** claimed as locked research evidence.

---

## 5. User Roles

Authorization combines **tenant**, **role**, **relationship**, **record state**, and **segregation of duties (SoD)**.

| Role family | Typical capabilities |
| --- | --- |
| Buyer / requester | Draft/submit requests, clarify, view quotes/invoices/shipments in scope |
| Organization approver | Approve/decline within policy; cannot bypass SoD |
| Finance controller | Confirm payments with evidence; distinct from payment initiator |
| Procurement officer / lead | Source, issue quotes, assign work, progress legal transitions |
| Logistics coordinator | Shipment milestones, exceptions, delivery evidence |
| Organization administrator | Org users/prefs within tenant |
| Platform administrator | Cross-tenant platform governance |

UI role badges are **never** authorization truth. Server policy decides.

---

## 6. Product Principles (non-negotiable)

1. **Calm, trustworthy, intelligent, human, global, efficient, transparent.**  
2. Every meaningful screen answers: *Where am I? What can I do? What should I do next?*  
3. **No cart / checkout / fake stock / buy-now inventory metaphor.** Catalog leads to a qualified **Request**.  
4. Vocabulary: `request → clarify → source → quote → approve → deliver`.  
5. **Policy-gated transitions only**-no unrestricted status dropdowns.  
6. Domain records = system of record; chat/email are not.  
7. Separate **confirmed facts** vs **estimates**; label confidence.  
8. Internal notes ≠ customer-visible messages.  
9. Ops home: **queues and exceptions before vanity KPIs**.  
10. One primary action per local context; color alone never encodes status.  
11. Accessibility (WCAG 2.2 AA), performance, and security are acceptance criteria-not polish.  
12. Celebration / marketing motion must not block critical operational work.

---

## 7. Feature Inventory

Status vocabulary (cutover readiness):

| Status | Meaning |
| --- | --- |
| **Not Started** | No usable V2 host/API for the capability |
| **Planned** | Documented / schema exists; not product-complete |
| **Migrating** | Partial V2 API and/or UI library; hosts incomplete |
| **Completed** | V2 replaces V1 in production use |

**As of Phase RC2: no feature is Completed for end-user cutover** (hosts `apps/web`, `apps/client`, `apps/ops` missing). Runnable product UI remains Version 1 SPAs.

| Feature | Product intent | V2 status |
| --- | --- | --- |
| Authentication | Login, session, register/verify/reset, MFA path | Migrating (core session API); register/forgot/MFA incomplete |
| Public website | Trust, services, catalog discovery, request CTA | Planned (Homepage library DONE; host GAP) |
| Client dashboard | Attention-first next actions | Planned |
| Product catalog | Browse → request (not checkout) | Planned (UI fixtures; catalog API GAP) |
| Procurement requests | Draft → submit → clarify → source → fulfill | Migrating (API) |
| Quotations | Versioned issue/compare/accept | Migrating (API; UI host GAP) |
| Purchase orders | After accepted quote + eligible supplier | Planned |
| Invoices | Finance record + history | Migrating (API) |
| Payments | Evidence-backed confirm; SoD | Migrating (API; manual gateway) |
| Shipments / tracking | Milestones, exceptions, delivery confirm | Migrating (API) |
| Documents vault | Secure evidence on records | Planned |
| Notifications | Event-driven, deep-linked | Migrating (API) |
| Messages / chat | Support reachability; not SoR | Not Started |
| AI assistant | Explain / Assist / Recommend | Planned (product rules locked; execution constrained) |
| CMS / announcements | Experience family | Planned |
| Analytics / reports | Governed KPIs + exports | Not Started (architecture exists) |
| Admin / ops console | Queue-first workbench | Planned (API islands; `apps/ops` GAP) |
| Settings / profile | Prefs, notification prefs, org settings | Planned / partial API |
| Supplier portal | Invite-only later | Future (explicitly out of Phase 1 open access) |
| Celebration engine | Eligible success moments | Future / deferred in ops UI |

---

## 8. Procurement Workflow

### 8.1 End-to-end stages

Discovery → bookmark/save → **request** draft/submit → internal review / **clarification** → **sourcing** / RFQ → **quote** compare/issue → customer **approval** → purchase order → **payment** → production/inspection → **shipping**/customs → warehouse/delivery → completion / feedback / repeat.

### 8.2 Canonical request lifecycle (product)

```text
draft → submitted → needs_clarification ⇄ accepted_for_sourcing
  → sourcing → quote_issued → approved | declined | expired
  → purchase_in_progress → fulfilled | cancelled | closed
```

Exact enum strings in software follow the domain API; product meaning above is normative.

### 8.3 Hard business rules

1. Requester cannot approve their own threshold-gated decision (SoD).  
2. Payment creator ≠ final finance controller.  
3. Quote accept requires an unexpired issued version + policy.  
4. PO requires accepted quote + eligible supplier.  
5. Payment confirm requires provider/bank evidence-**upload ≠ paid**.  
6. Shipment milestones need source, time, confidence, and evidence where required.  
7. Terminal actions need reason + audit.  
8. Transition commands are **idempotent**.  
9. Issued commercial/financial versions are **immutable**; changes create a new version.  
10. Live funds / corridor unlock only after launch authorization gates (**OPEN** until signed).

### 8.4 Sequencing note (**OPEN product clarification**)

Some specs list purchase order before payment; others require confirmed/allocated payment before unlocking purchase. **Treat finance-gate language as controlling until an ADR resolves order:** initiation must not unlock purchase; only confirmed/allocated payment may unlock purchase-side progression where policy requires it.

---

## 9. Supplier Workflow

### 9.1 Current (Phase 1 / managed model)

- Officers match from **verified candidate** suppliers.  
- No open supplier self-registration marketplace.  
- Partner / network marketing ≠ seller self-serve portal.  
- Supplier performance and disputes remain ops-owned.

### 9.2 Future

- Invite / KYB supplier portal  
- RFQ bid intake under policy  
- Performance scorecards tied to governed KPIs  
- Still not an uncontrolled public marketplace

---

## 10. Client Workflow

| Step | Experience |
| --- | --- |
| Discover | Catalog/services/industries → Request CTA |
| Authenticate | Enter Client Workspace |
| Create request | Wizard (draft/sign-in/confirmation contracts must be explicit) |
| Clarify | Respond to ops questions on the **record** |
| Decide quote | Compare versions; accept/decline with audit |
| Pay | Follow invoice/payment instructions; evidence-backed status |
| Track | Shipment timeline with confidence labels; exceptions visible |
| Confirm delivery | Evidence where required |
| Repeat | Attention dashboard surfaces next action |

**Dashboard doctrine:** attention and next actions first-not vanity metrics.

**Primary CTA (public and in-flow):** Request Procurement-not checkout.

---

## 11. Admin (Operations) Workflow

| Mode | Behavior |
| --- | --- |
| Queue | SLA/age/exception prioritized work lists |
| Record Workbench | Single record: facts, timeline, evidence, legal next transitions |
| Transition | Policy-legal command + reason + audit → customer-visible update when appropriate |
| Finance / logistics | Evidence and SoD enforced |
| Experience / CMS | After queues-not instead of them |
| Insights | Governed KPIs after operational attention |

**Forbidden:** unrestricted status `<select>`, treating chat as approval, chart-first home that hides exceptions.

---

## 12. AI Assistant

### 12.1 Modes

| Mode | Allowed |
| --- | --- |
| **Explain** | Clarify record state, policy, timeline |
| **Assist** | Drafts, checklists, summaries, translation aids |
| **Recommend** | Suggestions with confidence + citations |

### 12.2 Hard limits

AI **must not** autonomously: issue/accept quotes, create POs, confirm payment, approve suppliers, file customs, change permissions, or assert unverified logistics/commercial facts.

Outputs need: concise result, confidence, citations/assumptions/gaps, and safe next actions. Escalate to a human task when evidence is missing.

### 12.3 Phase 1 automation (allowed)

Completeness checks, classification aids, SLA alerts, verified-supplier suggestions, summaries, translation, risk flags, draft communications-**always** under human workflow authority.

---

## 13. Notifications

- Domains publish **events**; the Communication Engine chooses channel and template.  
- **Delivery ≠ business truth** (a “paid” email does not mark paid).  
- Critical / security / legal notifications cannot be silently disabled.  
- Marketing requires consent.  
- Prefer **in-app deep links** to records.  
- Coalesce noncritical noise; do not coalesce payment / approval / security without explicit policy.  
- Taxonomy includes: welcome/auth; procurement/quote/approval; payment/invoice; shipment/exception; support; announcement/celebration; marketing; system/security.

---

## 14. Analytics

- KPI definitions are **governed**: owner, formula, timezone, currency, freshness, drill-down.  
- Ops attention layer before vanity dashboards.  
- AI insights (if any) require citations + confidence; not autonomous decisions.  
- Groups: revenue/margin, procurement volume, supplier, corridor, customer growth, funnel/website/product, support, delivery/OTIF, finance aging, AI quality/safety.

---

## 15. Reports

| Report class | Intent |
| --- | --- |
| Operational exports | Queue, request, quote, payment, shipment extracts for ops |
| Customer-facing statements | Invoice/payment/shipment summaries from governed records |
| Management packs | Cycle time, OTIF, exceptions, conversion-definition-owned |
| Audit extracts | Who changed what, when, why |

Reports must use the same KPI definitions as analytics. No shadow spreadsheets as system of record.

---

## 16. Every Page & Screen

### 16.1 Public Website (`apps/web` - planned)

| Page | Purpose | Primary action |
| --- | --- | --- |
| Home | Trust + corridor promise + CTA | Request Procurement |
| About | Credibility | Contact / Request |
| Services (+ children) | Capability story | Request |
| Industries | Sector discovery | Request |
| Catalog | Evidence-led browse | Request / view product |
| Product detail | Specs + request handoff | Request |
| Supplier Network | Accountability story | Request / partner interest |
| Track Shipment | Public track (privacy allow-list **OPEN**) | Track / login |
| Request Procurement | Wizard entry | Continue wizard |
| Search | Enterprise find (not ecommerce) | Open result |
| FAQ / Help / Contact | Support | Contact / Request |
| Privacy / Terms / Cookies | Legal | Accept / manage |
| Login entry | Enter Client Workspace | Sign in |
| Careers / News | Future-ready | - |
| 404 / 500 / Maintenance | Recovery | Home / support |

### 16.2 Client Workspace (`apps/client` - planned)

| Area | Screens |
| --- | --- |
| Dashboard | Attention / next actions |
| Discover | My Products / Saved |
| Procure | Requests list/detail, create/edit wizard, Quotations |
| Finance | Invoices, Payments |
| Deliveries | Tracking, Documents |
| Collaborate | Chat/Support, Notifications |
| Learn | AI assistant, Knowledge |
| Personal | Profile, Settings, Activity |

*(Nav label variants “Overview” / “Learn and support” appear in older IA docs; prefer the freeze list above until an ADR renames.)*

### 16.3 Operations Console (`apps/ops` - planned)

| Family | Screens |
| --- | --- |
| Executive | Queue/exception overview (not vanity-first) |
| Commercial | Orgs/customers, products, suppliers, requests, RFQs, quotes, POs |
| Finance & logistics | Invoices, payments, shipments, warehouses/tracking |
| Experience | CMS, announcements, celebration campaigns (non-blocking) |
| Insight | Reports, analytics, AI management |
| Platform | Users, roles, audit, settings, health/monitoring |

### 16.4 Version 1 surfaces (legacy reference - still runnable)

**Client:** `/`, auth pages, `/services`, category routes, about/faq/contact/legal, announcements, `/dashboard`, `/create-request`, `/my-requests`, `/request/:id`, `/profile`, `/chat`, `/notifications`.

**Admin:** `/login`, `/`, `/requests`, `/requests/:id`, `/users`, `/categories`, `/products`, `/chat`, `/notifications`, `/trackers`, `/announcements` (+ create/edit), `/ai-assistant`, `/settings`.

These are **REPLACE** targets for the three V2 shells-not long-term IA.

---

## 17. Workflow Acceptance Criteria (patterns)

Every feature/screen must satisfy:

| Criterion | Rule |
| --- | --- |
| Purpose | Screen states its job in one line |
| Primary action | One clear next action |
| Status | Maps to legal lifecycle + human-readable next-action text |
| Permissions | Org-scoped; server-enforced |
| States | Loading, empty, error, success (and offline/reduced-motion where UI) |
| Versions | Issued commercial/financial artifacts immutable |
| Payment | Not “paid” from upload/initiate alone |
| Exceptions | Owner, severity, impact, next action, resolution target |
| Audit | High-risk actions recorded |
| Accessibility | WCAG 2.2 AA; keyboard; no color-only status |
| Mobile | Practical on constrained networks |
| Analytics | Events defined when the screen ships |

---

## 18. Success Metrics & KPIs

### 18.1 Launch / operations (measure and calibrate)

| KPI | Intent |
| --- | --- |
| First-response time | Request acknowledgment speed |
| Quote cycle time | Submit → issuable quote |
| Quote acceptance rate | Quality of commercial fit |
| Payment confirmation lag | Evidence → confirmed |
| OTIF / delivery reliability | Promise vs fact (fact-labeled) |
| Landed-cost variance | Quote vs actual |
| Exception MTTR | Time to own and resolve |
| Rework rate | Clarification / redo loops |
| CSAT / repeat rate | Relationship health |
| Qualified requests | Funnel quality |
| WCAG defect count | Accessibility debt |
| Mobile task completion | Real-device success |

### 18.2 Research protocol targets (if studies run)

≥80% buyers explain quote cost/exclusions/next action; ≥80% interpret shipment/ETA confidence; officers can work core records without parallel spreadsheet; finance can trace every payment event to source + authorization.

### 18.3 Proposed ops SLAs

Numeric targets in operating playbooks are **baselines to calibrate**, not public contractual guarantees, until commercial/legal sign-off. Public copy uses honest ranges-not fictional SLAs.

---

## 19. Roadmap

| Phase | Product outcome |
| --- | --- |
| **Phase 1 MVP** | Managed procurement workspace: request → quote → pay → ship with human ops, authz, audit, notifications, documents |
| **Phase 2 UX gate** | IA freeze, wizard handoff, track privacy, quote/pay/ship acceptance clarity |
| **Phase 3 Public** | Public website masterplan; homepage/header/footer system in `@hamd/ui` |
| **Phase 4** | Auth experience + client dashboard foundations |
| **Modernization waves** | Hosts → auth/client → request UX → quote/pay/ship UX → ops queues → catalog/CMS/chat → a11y & retire legacy |
| **Later** | Invite-only supplier portal, richer analytics/BI, celebration campaigns, advanced AI under governance |

Priority stack: **P0 blockers** (hosts, auth parity, policy UX) → first vertical slice → catalog/CMS → chat/supplier/celebration/BI.

---

## 20. Release Timeline (program view)

Exact calendar dates are owned by program management. Product sequencing:

1. Preserve Version 1 as reference (RC2 archival).  
2. Engineering handbook + product handbook (SoT).  
3. Stand up `apps/web` → ship public homepage against live API where needed.  
4. Stand up `apps/client` + complete auth journeys.  
5. Wire procurement → quotation → invoice → payment → shipment UIs to `apps/api`.  
6. Stand up `apps/ops` queue/workbench; retire unrestricted status edits.  
7. Catalog/CMS APIs + pages.  
8. Chat/collaboration when SoR boundaries remain clear.  
9. Data migration rehearsal → cutover → V1 soak → decommission.  

UI library progress **without host apps** does not equal product release.

---

## 21. Migration Tracker

| Legacy | Version 2 | Tracker |
| --- | --- | --- |
| `backend/` | `apps/api` | Partial domains live; catalog/CMS/chat/users admin missing |
| `client-frontend/` marketing | `apps/web` | Host GAP |
| `client-frontend/` buyer | `apps/client` | Host GAP |
| `admin-dashboard/` | `apps/ops` | Host GAP |
| Railway MySQL | Supabase PostgreSQL | Schema/migrations exist; data cutover not executed |
| localStorage JWT | HttpOnly refresh + short access token | API direction set; V1 still on localStorage |

**Feature cutover:** see §7-all **Not Started / Planned / Migrating**; **zero Completed**.  
Detail: `docs/legacy/02-migration-map.md`, `03-feature-inventory.md`, `04-api-inventory.md`.

---

## 22. Future Modules

| Module | Notes |
| --- | --- |
| Supplier portal (invite/KYB) | After verification & dispute maturity |
| RFQ / bid workspace | Policy-gated; not open market |
| Advanced CMS / knowledge / careers | Experience family |
| Collaboration platform (chat) | Explicitly not system of record |
| Celebration engine | Campaigns; never block critical queues |
| Search platform | Enterprise find across records + public |
| Analytics / BI warehouse | Governed metrics at scale |
| Integration platform | ERP/adapters after workflow reliability |
| Media / document platform | Vault, virus-scan, retention |
| AI governance expansion | Broader copilots under same hard limits |
| Native apps | Out of scope until web shells prove out |

---

## 23. Out of Scope (Phase 1 product)

- Open supplier self-registration marketplace  
- Autonomous AI commercial/logistics commitments  
- Live fund collection before launch gates  
- Escrow/credit/guarantees without validation  
- Broad customs automation as SoR  
- Voice/video as system of record  
- Complex ERP integration before workflow reliability  
- Cart/checkout/stock e-commerce metaphors  

---

## 24. Service Tiers (proposed)

| Tier | Intent |
| --- | --- |
| Standard | Baseline managed response targets |
| Priority | Faster acknowledgment; does **not** invent unsupported ETAs |
| Enterprise | Contracted operating model (details **OPEN**) |

Do not publish fictional SLAs on the marketing site.

---

## Appendix A - Screen contract (required for every new screen)

1. Purpose  
2. Primary user + permissions  
3. Primary action  
4. States (loading/empty/error/success)  
5. Business rules / transitions touched  
6. Analytics events  
7. Accessibility notes  
8. Success metrics impacted  

---

## Appendix B - Source stack (consolidated here)

| Topic | Primary origins |
| --- | --- |
| Vision / DNA | `docs/05`, `docs/06`, `docs/58` |
| Launch model | `docs/00`, `docs/03` |
| Users / research | `docs/01`, `docs/04` |
| Experience / shells | `docs/07`, `docs/19`, `docs/20`, `docs/52` |
| Workflows / rules | `docs/02`, `docs/28` |
| UX gate | `docs/46` |
| AI / comms / analytics | `docs/16`, `docs/21`, `docs/23`, `docs/09` |
| Status / migration | `docs/68`, `docs/legacy/*` |

---

**End of Product Handbook.**  
Normative product changes require an ADR or charter amendment, named owner, and alignment with engineering/security/operations when workflows, money, or identity are affected.
