# HAMD Genesis - Product Experience Architecture

**Public brand:** Almahbub International  
**Technology partner:** HAQQ TECH  
**Status:** Pre-implementation product architecture  
**Companion standards:** HAMD Product DNA, HAMD Design Bible, Phase 1 MVP
Specification, Domain Architecture and Controls.

## 1. PXA purpose and operating rule

HAMD is an ecosystem of three intentionally different experiences:

1. **Public Website:** creates confidence, educates, qualifies demand, and
   turns interest into a well-formed procurement request.
2. **Client Workspace:** gives a buyer a calm, complete, accountable view of
   procurement from request to delivery and repeat purchase.
3. **Operations Console:** enables teams to run the procurement business by
   exception, with controlled records, permissions, and measurable execution.

These are not three disconnected applications. They share identity, customer
and organization context, catalog references, procurement records, documents,
notifications, audit trails, and product language. They must not share a
generic visual layout: a public visitor needs trust and education; a buyer
needs clarity and self-service; an operator needs safe, high-density control.

### Cross-ecosystem experience contract

Every primary record must preserve:

- **Context:** organization, request/order identity, status, owner, and current
  stage.
- **Truth:** confirmed facts versus estimates, source/provenance, timestamps,
  decision history, and dependencies.
- **Action:** the permitted next action, reason it is needed, and expected
  result.
- **Continuity:** links to related quotes, payments, documents, messages,
  shipment events, support cases, and activity.

### Product decisions to reject

- Do not expose a broad public product catalog as if all items are immediately
  purchasable inventory. International procurement availability and price are
  conditional; catalog pages must lead to a qualified sourcing request.
- Do not build an “admin dashboard” that merely shows charts. Operations needs
  queues, ownership, SLAs, controlled transitions, financial evidence, and
  exception resolution.
- Do not make chat the system of record for quotes, approvals, payment
  confirmation, or shipment state.
- Do not launch supplier self-registration, unrestricted marketplace listings,
  or live fund collection before verification, policy, and operating controls
  are approved.

---

# Part One - Public Website

## 2. Public website architecture

### Purpose

The public site is Almahbub International’s trust, education, discovery, and
lead-generation system. Its job is not to imitate a consumer marketplace; it
must set accurate expectations about a managed international procurement and
logistics service, make capability credible, and convert qualified intent into
a useful procurement request or support interaction.

### Global public components

- Global navigation with service-led information architecture, accessible
  mega-menu only when category depth warrants it, and a visible Request
  Procurement action.
- Trust bar for verified business facts only: operating regions, service
  capability, partner/association credentials where approved, and support
  availability.
- Request Procurement entry point, persistent but unobtrusive on desktop and
  mobile.
- Country/currency/language selector only when the content and support model
  genuinely support the selection.
- Search for catalog, knowledge, FAQ, and support content.
- Accessible footer with legal links, corporate identity, contact channels,
  knowledge links, and concise service disclaimers.

### Global SEO, accessibility, performance, and motion

- Use unique intent-led titles, descriptions, canonical URLs, structured data
  appropriate to Organization, Service, FAQ, Article, Product, Breadcrumb, and
  JobPosting content. Never use misleading product availability or review
  markup.
- Build semantic landmarks, heading hierarchy, skip navigation, accessible
  form labels, descriptive links, image alternatives, and keyboard-operable
  navigation before adding visual refinement.
- Prioritize fast content rendering, optimized responsive images, minimal
  client-side JavaScript, static/cached content delivery, and no auto-playing
  media that harms page load or comprehension.
- Motion explains hierarchy or response: brief navigation/drawer transitions,
  purposeful content reveal, and reduced-motion alternatives. No decorative
  parallax on core conversion pages.

## 3. Public page catalogue

Each entry defines **why**, audience, conversion, content, and delivery
requirements. All pages inherit the global standards above.

### Home

- **Why / audience / goal:** establishes Almahbub’s credibility for new
  prospects, returning customers, partners, and referral traffic; converts
  broad interest into a service path or request.
- **Primary CTA:** Request Procurement. **Secondary CTA:** Explore Services.
- **Content hierarchy:** clear value proposition; service outcomes; how the
  managed process works; categories/corridors; credible proof; customer
  outcomes; FAQ; final conversion.
- **Trust and emotion:** composed confidence through factual capability,
  transparent process, and real operational evidence-not animated counters or
  vague “global leader” claims.
- **Components:** hero, service navigation, process timeline, category/country
  highlights, proof blocks, case-study teaser, FAQ, request CTA.
- **Mobile / motion / performance:** stacked scannable sections, sticky request
  action after intent is established, no heavy hero video, motion limited to
  short content transitions.

### About and Our Story

- **Why / audience / goal:** establish institutional legitimacy, leadership,
  values, and the company’s operating philosophy for buyers, partners, and
  candidates.
- **Primary CTA:** Speak to an expert. **Secondary CTA:** Explore Services.
- **Content:** organization identity, mission, history, leadership where
  appropriate, operational standards, geographic capabilities, and accountable
  contact paths.
- **Trust / SEO:** use verifiable facts, named legal/company information, and
  original photographs; optimize for brand, company, and international
  procurement queries.
- **Do not:** turn the founder’s personal milestone into product imagery or
  obscure the business purpose with a celebratory brand story.

### Our Services

- **Why / audience / goal:** gives prospects an understandable service map
  before they choose a specialized path.
- **Primary CTA:** Request Procurement. **Secondary CTA:** Compare Services.
- **Content:** service overview cards for procurement, import/export,
  logistics, warehousing, and supporting advisory/handling capabilities; who
  each service suits; scope, inputs, outputs, and dependencies.
- **Components:** service directory, comparison guidance, process preview,
  route to detailed service page, related knowledge.
- **Mobile:** cards become a prioritized list with direct “is this right for
  me?” guidance; do not force side-by-side comparison.

### Global Procurement

- **Why:** converts custom sourcing intent and educates buyers on the managed
  procurement lifecycle.
- **Primary CTA:** Start a Procurement Request. **Secondary CTA:** How Quotes
  Work.
- **Content:** requirements intake, sourcing, verification, quote comparison,
  payment, shipment, quality/dispute boundaries, and service expectations.
- **Trust:** disclose that price, availability, customs, and lead times depend
  on confirmed supplier and route information.
- **SEO:** target managed procurement, global sourcing, and country/corridor
  queries with expert original content, not keyword-stuffed pages.

### Import & Export

- **Why:** clarifies cross-border trade support and routes qualified import or
  export work to the correct intake.
- **Primary CTA:** Discuss an Import or Export Need. **Secondary CTA:** Learn
  About Required Documents.
- **Content:** supported scope, Incoterm guidance, documentation, customs
  dependencies, prohibited/restricted category escalation, and FAQ.
- **Accessibility/performance:** use diagrams with textual equivalents; avoid
  complex interactive maps as the only explanation.

### Logistics

- **Why:** explains shipment planning, forwarding coordination, tracking, and
  exception management.
- **Primary CTA:** Plan a Shipment. **Secondary CTA:** Track a Shipment.
- **Content:** modes, shipment planning, milestone examples, ETA limitations,
  document needs, insurance/responsibility boundaries, and support path.
- **Emotion:** reassurance through transparent operating process, never an
  unqualified delivery guarantee.

### Warehousing

- **Why:** establishes warehousing/consolidation capability for buyers needing
  storage, inspection, consolidation, or distribution support.
- **Primary CTA:** Discuss Warehousing. **Secondary CTA:** Explore Logistics.
- **Content:** service locations/capabilities, handling rules, storage
  conditions, inventory visibility, inbound/outbound process, and limitations.
- **Trust:** capacity and location claims require current operational approval.

### Product Catalogue, Product Categories, and Product Detail

- **Why / audience / goal:** supports discovery, repeat buying, and a more
  precise request-not false instant purchase.
- **Primary CTA:** Request This Product. **Secondary CTA:** Save / Compare
  Products.
- **Content:** category taxonomy, search and filters, specification-first
  product detail, variants, indicative lead-time/price bands where defensible,
  origin/compliance attributes, relevant documents, related categories.
- **SEO:** canonical product/category pages, structured product metadata only
  when accurate, descriptive specifications, and no duplicate vendor content.
- **Mobile:** search, filters, compare, and “request sourcing” remain usable
  with compact summaries and detail drill-down.

### Country Sourcing

- **Why:** helps buyers understand country-specific sourcing opportunities,
  trade constraints, categories, and process assumptions.
- **Primary CTA:** Source From This Country. **Secondary CTA:** View Product
  Categories.
- **Content:** country profile, supported categories, sourcing strengths,
  typical lead-time range, documents/route considerations, local capability,
  and FAQ.
- **Do not:** imply that a country page guarantees supplier access, price, or
  shipping route availability.

### Industries

- **Why:** speaks to industry-specific procurement needs without creating a
  separate product for every vertical.
- **Primary CTA:** Discuss Your Industry Need. **Secondary CTA:** Read Related
  Case Study.
- **Content:** industry use cases, relevant product classes, quality/compliance
  considerations, operational requirements, and proof.
- **SEO:** industry-service combinations with original, useful content; no
  thin templated vertical pages.

### Knowledge Centre, FAQs, and Support Centre

- **Why:** reduce support load, establish expertise, and help visitors make
  informed choices.
- **Primary CTA:** Ask a Question / Contact Support. **Secondary CTA:** Request
  Procurement.
- **Content:** searchable articles, guides, glossary, FAQ categories, document
  checklists, shipment/payment/quote explainers, and support escalation.
- **Components:** search, article cards, table of contents, related content,
  feedback, contact escalation.
- **Accessibility:** reading-friendly measure, heading navigation, accessible
  table of contents, downloadable documents that are tagged and searchable.

### Case Studies and Testimonials

- **Why:** provide credible social proof for a high-trust business service.
- **Primary CTA:** Discuss a Similar Requirement. **Secondary CTA:** Explore
  Services.
- **Content:** business challenge, scope, constraints, approach, outcome,
  carefully qualified metrics, customer permission, and related service.
- **Do not:** use anonymous claims, unverifiable logos, manufactured reviews,
  or results presented without context.

### Become a Partner

- **Why:** acquires vetted logistics, supplier, warehousing, inspection, and
  strategic partners through a controlled channel.
- **Primary CTA:** Apply to Partner. **Secondary CTA:** Review Partner
  Standards.
- **Content:** partner types, qualification criteria, document requirements,
  onboarding process, data/privacy expectations, and partner-support contact.
- **Workflow:** creates a partner-lead record and a verification queue; it is
  not supplier portal access.

### Careers

- **Why:** attracts credible operations, logistics, procurement, and technology
  talent.
- **Primary CTA:** View Open Roles. **Secondary CTA:** Submit General Interest.
- **Content:** operating culture, roles, hiring process, location/work style,
  inclusion/accessibility statement, and job detail pages.
- **SEO/accessibility:** use JobPosting structured data for active roles and
  fully accessible application paths.

### Contact

- **Why:** gives prospective customers and stakeholders a direct, routed
  contact path.
- **Primary CTA:** Send Enquiry. **Secondary CTA:** Request Procurement.
- **Content:** enquiry routing by purpose, expected response time, verified
  contact details, locations where accurate, and emergency/urgent distinction.
- **Form behavior:** concise validated form, spam protection, clear consent,
  success reference, safe retry, and support alternative.

### Request Procurement

- **Why:** the principal conversion workflow; captures enough structured
  information for meaningful triage without forcing full technical expertise.
- **Primary CTA:** Submit Request. **Secondary CTA:** Save Draft / Contact an
  Expert.
- **Content / components:** guided multi-step intake, request type, line items,
  quantity/unit, specification, destination, target date, budget range,
  attachments, compliance declaration, contact/organization detail, review.
- **Experience:** autosave where identity is known; explain why data is needed;
  allow incomplete requirements to enter a clarification state; show success
  reference, owner/expected update, and next steps.
- **Performance/accessibility:** keyboard-operable steps, error summary,
  resumable upload, low-bandwidth resilience, no loss of entered data.

### Track Shipment

- **Why:** lets a customer or recipient check a shipment without forcing full
  workspace registration, where policy permits.
- **Primary CTA:** Track Shipment. **Secondary CTA:** Sign In for Full Details.
- **Content:** tracking identifier, identity verification where sensitive,
  current milestone, ETA range, public-safe events, support link.
- **Security:** do not expose customer names, documents, purchase values,
  addresses, or detailed route intelligence through an unauthenticated tracker.

### Legal pages: Privacy Policy, Terms, Cookie Policy

- **Why:** explain rights, service terms, data handling, cookies, and legal
  boundaries in readable, versioned form.
- **Primary CTA:** Manage Cookie Preferences / Contact Privacy Team.
- **Requirements:** effective date, version history, accessible document
  structure, localization/legal-jurisdiction workflow, consent records, and
  no preselected non-essential cookies.

### Supplier Registration - future

- **Why:** future controlled supplier acquisition; it must not be exposed as an
  active marketplace feature before governance is ready.
- **Primary CTA:** Start Supplier Application. **Secondary CTA:** Supplier
  Requirements.
- **Requirements:** invite or reviewed application, company/KYB evidence, bank
  verification, category/country capability, certifications, sanctions/risk
  screening where applicable, and a clear “application is not approval” state.

---

# Part Two - Client Workspace

## 4. Client workspace purpose and navigation

The Client Workspace is the buyer’s operational home. It replaces scattered
email, messages, spreadsheets, document folders, and status-chasing with a
single organization-scoped workspace.

### Primary navigation domains

1. Overview
2. Discover
3. Procure
4. Finance
5. Deliveries
6. Collaborate
7. Learn and support
8. Organization and personal settings

Every client page requires loading, empty, error, success/confirmation,
offline/retry behavior where relevant, reduced-motion behavior, keyboard
navigation, validation, and clear feedback.

## 5. Client page catalogue

| Domain / page | Purpose, features, and actions | Relationships / required APIs | Future scale |
| --- | --- | --- | --- |
| Dashboard | Attention-first overview: approvals required, clarifications, quotes expiring, payments due, shipments at risk, recent activity, saved reports. Primary action resolves highest-priority item; secondary actions create request and explore records. | Aggregates request, quote, approval, payment, shipment, notification, activity, and organization APIs. Links every widget to filtered source records. | Role-specific dashboards, configurable views, cost-center and multi-entity rollups. |
| Products | Discover curated reference products through search, filters, categories, specifications, indicative data, and request-from-product flow. | Catalog search, categories, product detail, availability/reference metadata, saved lists, request-draft APIs. | Contract catalogs, negotiated prices, punchout/API catalogs, multi-language content. |
| Saved Products and Lists | Save products, supplier preferences, project lists, repeat-buy templates, and shareable procurement collections. | Saved-item/list CRUD, product references, organization sharing/permission APIs. | Team collections, approval-based list publishing, reorder recommendations. |
| Procurement Requests | Manage drafts, submitted requests, clarifications, assigned owner, line items, documents, timeline, and cancellation where permitted. Primary action responds to current state. | Request CRUD, lifecycle, attachments, comments, assignments, activity, search/filter/sort APIs. | Department/cost-center policy, recurring requests, bulk import, templates, ERP requisition sync. |
| Request Detail | The authoritative request record: status/next action, requirements, conversation, documents, sourcing progress at the right disclosure level, quote/order relationships. | Request detail, line items, documents, messages, audit/activity, related quote/order APIs. | Multi-project, delegated requester, rich approval and change-order support. |
| Quotations | Compare issued quote versions/options, landed-cost breakdown, validity, terms, risks, approval policy, accept/decline/revise decision. | Quotes, quote versions/options, approval workflow, documents, messages, financial-estimate APIs. | Multi-stage approval, negotiated counteroffers, purchase commitments, budget controls. |
| Invoices | View pro forma, tax/commercial invoices, receipts, credit notes, status, allocations, downloads, and reconciliation context. | Invoice listing/detail, document access, payment allocation, export APIs. | Accounting integrations, multi-entity invoicing, tax localization, statement generation. |
| Payments | Understand amounts due, milestones, payment method/instructions, confirmation state, history, and payment evidence. | Payment request/detail, provider handoff/status, receipt, refund/dispute, notification APIs. | Multi-currency wallets only if legally supported, approval limits, accounting sync, payment methods by corridor. |
| Tracking | Track orders/shipments via current fact, ETA range/confidence, timeline, exception details, documents, proof of delivery, and support escalation. | Orders, shipments, milestones, ETA, exceptions, documents, support APIs. | Carrier feeds, consolidation/package detail, predictive ETA, location sharing subject to policy. |
| Documents | Secure, searchable document vault grouped by request/order/shipment/finance; permission-aware previews and downloads. | Document listing/search, metadata, signed access, retention, upload/version APIs. | E-signatures, OCR/extraction, document expiry alerts, external document exchange. |
| Chat | Record-scoped messaging with external messages, mentions, attachment upload, message search, unread state, and separate support escalation. | Conversations, messages, read state, attachments, presence/notification APIs. | Translation assistance, structured message forms, external partner participation with policies. |
| Notifications | Triage actionable events by urgency, record, channel, read state, and preferences. | Notification feed, mark-read, preferences, deep-link APIs. | Digests, escalation policies, channel integrations, organization-level notification policy. |
| Support | Create/view support cases linked to relevant record; show SLA, owner, conversation, evidence, and resolution. | Support ticket CRUD, categories, attachments, SLA, knowledge search APIs. | Priority entitlements, service health communications, customer satisfaction and dispute routes. |
| Activity History | Searchable record and organization activity for authorized members; presents what changed, by whom, when, and why. | Activity/audit read API with cursor pagination, filters, search, export policy. | Compliance exports, immutable audit views, delegated auditor role. |
| Knowledge Hub | Personalized service guidance, procurement glossary, document checklists, FAQs, and contextual recommendations. | Knowledge search/article/detail, feedback, related-record context APIs. | Role/corridor-aware content, learning paths, in-product announcements. |
| AI Assistant | Context-aware assistance for explaining records, drafting non-final messages, finding permitted information, and identifying missing request data. | Scoped AI conversation, retrieval/citation, feedback, consent/audit APIs. | Agentic workflows only with review gates, evaluation, and domain-specific copilots. |
| Profile | Personal identity, contact details, security controls, language/time-zone, and accessibility preference. | Profile, session/security, preference, locale APIs. | MFA, SSO profile management, delegated access controls. |
| Organization Settings | Manage organization profile, members, teams, cost centers, approval policy visibility, billing contacts, and integrations according to role. | Organization, membership, role, cost-center, policy, integration APIs. | Multi-entity organization tree, SSO, SCIM, procurement policy configuration. |

### Client workspace API quality requirements

All APIs are versioned, tenant-scoped, authenticated, authorized, validated,
documented, observable, and return structured errors. Collection APIs support
cursor/offset policy chosen consistently, filter schema, full-text search where
useful, deterministic sorting, pagination metadata, and export/background-job
behavior for large data. High-risk state transitions must be idempotent and
create audit events.

---

# Part Three - Operations Console

## 6. Operations console purpose

The Operations Console is a role-based work management and business control
system. It must support the people who acquire customers, validate and source
requests, issue quotes, control payments, coordinate shipments, manage
warehouses, resolve support issues, administer policy, and measure service
performance.

### Console operating model

- Use role-focused queues, saved views, ownership, SLA due dates, exception
  indicators, bulk-safe actions, and record chronology.
- Keep commercial, financial, logistics, support, and compliance actions
  governed by state and permission-not by a user’s ability to edit a generic
  table.
- Provide executive aggregation without turning the entire console into a
  passive reporting dashboard.
- Platform administration is distinct from ordinary operations; privileged
  actions need explicit reasons and audited confirmation.

## 7. Operations module catalogue

| Module | Business purpose / users | Permissions, workflow, dependencies | KPIs |
| --- | --- | --- | --- |
| Executive Dashboard | Executives and operations leaders monitor pipeline, revenue/service outcomes, risk, and performance. | Read-only role-appropriate rollups; drill to governed records; depends on analytics definitions and trusted operational data. | GMV/service revenue, quote conversion, cycle time, OTIF, exception rate, cash collection, NPS. |
| CRM | Sales/account teams manage leads, opportunities, contacts, account health, and conversion into organization/request. | Controlled lead ownership, notes, tasks, consent, pipeline transitions; depends on public enquiries, organization, request, and activity records. | Lead response time, qualified conversion, pipeline value, win rate, retention. |
| Customers | Operations/support view individual customer relationships, history, risk flags, permissions, and service context. | Authorized staff can view/update with audit; depends on identity, organization, CRM, requests, support. | Active customers, response quality, retention, unresolved issues. |
| Organizations | Manage legal/business buyer entities, teams, billing contacts, policies, service tier, and account status. | Organization admins vs platform operators; changes to legal/financial context require audit; depends on identity, finance, contracts. | Active organizations, expansion, policy adoption, account health. |
| Suppliers | Curate/verify supplier records, capabilities, documents, bank status, scorecards, and risk. | Procurement roles create/assess; lead/compliance approval for high-risk activation; depends on countries, categories, documents, sourcing, POs. | Verified suppliers, supplier response, on-time delivery, defect/dispute rate. |
| Countries | Configure permitted corridors, country metadata, document requirements, currency/locale, risk and service availability. | Platform/compliance-only editing; versioned policy changes; depends on catalog, supplier, logistics, pricing, legal review. | Corridor activation quality, exception rate by corridor. |
| Products | Maintain curated reference products, attributes, variants, compliance metadata, media, search synonyms, and catalog governance. | Catalog roles edit; publishing approval; depends on categories, suppliers, documents, public CMS. | Search success, request conversion, data completeness. |
| Categories | Maintain navigable taxonomy and attribute templates. | Catalog governance; changes impact catalog/search/reporting and require migration plan. | Catalog coverage, classification accuracy. |
| Inventory | Future inventory visibility for owned/warehouse-managed stock, reservations, condition, and reconciliation. | Warehouse/operations roles; depends on warehouses, SKUs, inbound/outbound events. | Inventory accuracy, stock aging, fulfillment accuracy. |
| Procurement Requests | Intake, triage, assignment, clarification, sourcing work, SLA management, and controlled lifecycle progression. | Requester-facing data separate from internal notes; depends on customers, products, docs, quotes, tasks, notifications. | First response, sourcing cycle, SLA breach, rework rate. |
| Quotations | Build/review/version/issue commercial quotes and options; preserve quoted assumptions and approval history. | Procurement authors; review/approval thresholds; depends on requests, suppliers, pricing, finance, docs, approvals. | Quote issue time, acceptance, revision rate, margin/cost variance. |
| Purchase Orders | Convert approved commercial commitments into controlled supplier orders and changes. | Authorized procurement/finance roles; immutable issue versions and change orders; depends on quote acceptance, supplier, payment, logistics. | PO cycle time, change-order rate, supplier fulfillment. |
| Invoices | Issue and manage buyer invoices, supplier bills, receipts, credits, and tax/commercial document lifecycle. | Finance roles, approval controls, immutable issued records; depends on orders, payments, organization/legal entity, documents. | Invoice aging, accuracy, credit rate, reconciliation completion. |
| Payments | Track requests, provider/bank evidence, confirmation, allocation, release, refund, dispute, and reconciliation. | Strict segregation of duties; depends on invoices, payment provider, approvals, audit logs. | Payment success, confirmation time, unreconciled value, dispute rate. |
| Shipping | Plan shipments, mode/route/partner, packages, insurance, Incoterms, handoffs, and shipping documents. | Logistics roles; depends on POs, suppliers, warehouses, partners, documents, tracking. | Departure adherence, freight variance, document completeness. |
| Warehouses | Manage facilities, capacity, handling capabilities, inbound/outbound work, consolidation, and inventory relation. | Warehouse role scopes by facility; depends on inventory, shipping, partner, documents. | Throughput, dwell time, handling error, capacity utilization. |
| Tracking | Record/ingest milestones, ETA confidence, carrier source, stale updates, delivery proof, and exceptions. | Logistics update permissions; manual override must record source/reason; depends on shipping, documents, notifications, support. | Milestone freshness, ETA accuracy, exception response, OTIF. |
| Support Tickets | Own customer/internal support cases, SLAs, priority, communication, evidence, resolutions, and CSAT. | Support roles with escalation policy; depends on CRM, records, knowledge, messages, notifications. | First response, resolution time, reopen rate, CSAT. |
| Announcements | Publish scoped operational/product/service notices to audiences. | Content approval and scheduled publishing; depends on identity, notification preferences, CMS. | Reach, acknowledgement, support deflection. |
| Knowledge Base | Govern help, operational playbooks, internal procedures, and public articles. | Author/reviewer/publisher permissions, versioning, ownership, expiry review; depends on CMS/search/AI retrieval. | Search success, deflection, content freshness. |
| Users | Platform identity administration, invitation, suspension, recovery, security review. | Privileged administrators only; no direct credential access; depends on identity, audit, organization. | Activation, dormant accounts, security events. |
| Roles | Define role templates and scoped permission bundles. | Security/platform governance; versioned changes and impact review; depends on permission model, organizations. | Least-privilege adoption, permission exceptions. |
| Permissions | Inspect and govern fine-grained entitlements and sensitive operations. | Security/platform governance; approval/audit required; depends on roles, policy engine, audit. | Privilege creep, denied-action trends, access-review completion. |
| Audit Logs | Provide immutable trace of high-value actions, access, changes, exports, and integrations. | Read/export only to authorized audit roles; depends on event ledger and retention policy. | Audit coverage, investigation time, tamper/retention controls. |
| Reports | Deliver scheduled/on-demand operational, finance, procurement, supplier, and compliance reports. | Role-scoped data, asynchronous export, audit trail; depends on reporting model and data warehouse/read models. | Report adoption, freshness, export success. |
| Analytics | Explore governed product/business/operations metrics and trends. | Metric definitions centrally owned; depends on event pipeline and semantic layer. | Metric trust, decision usage, data latency. |
| AI Management | Govern AI knowledge sources, prompts/tools, policy, evaluations, feedback, incidents, and usage. | AI/security/product owners; depends on access control, audit, knowledge, model provider. | Citation coverage, acceptance, correction rate, safety incidents. |
| Website CMS | Manage public pages, navigation, SEO metadata, media, redirects, forms, and publishing workflow. | Author/reviewer/publisher roles; preview/version/rollback; depends on public delivery, knowledge, catalog. | Publish reliability, organic conversion, page performance. |
| Settings | Configure non-domain platform behavior: branding, locale, notification templates, feature flags, retention, operational defaults. | Strict platform administration; changes audited, staged, and reversible; depends on all domains. | Configuration incident rate, flag hygiene. |
| Integrations | Configure/manage approved partner, payment, carrier, accounting, identity, and communication connections. | Integration/security administrators; secrets never exposed; webhooks signed/idempotent; depends on audit, jobs, events. | Sync health, failure/retry rate, reconciliation quality. |

### Console module quality rules

Every queue has clear ownership, SLA/priority, filters, search, sort, saved
views, pagination, bulk-action eligibility, empty/loading/error states, and an
accessible responsive alternative. Every destructive or material state change
shows consequence, validates prerequisites, records an actor/reason, and
returns the user to an intelligible next state.

---

# Part Four - End-to-end user journeys

## 8. Visitor to repeat customer

### Journey 1: Visitor → interested customer

1. Visitor lands through a service, country, industry, product, case-study, or
   knowledge page.
2. The site communicates fit, capability, process, realistic constraints, and
   trust evidence.
3. Visitor compares service paths, reads supporting content, or asks a
   low-friction question.
4. The Request Procurement path captures intent without forcing account
   creation before value is clear.

**Success condition:** the visitor either submits a useful enquiry/request or
understands that the service is not appropriate. Misqualified leads are better
than misleading conversion.

### Journey 2: Interested customer → registered user

1. A submitted request/contact creates a lead and secure acknowledgement.
2. Customer receives a clear confirmation reference, privacy explanation, and
   expected response-not a generic “we received your message.”
3. When account access adds value, invite the customer to a scoped organization
   workspace with secure identity verification.
4. First-run onboarding explains workspace context, pending request, next
   action, notifications, and support.

**Success condition:** the customer can enter the workspace and locate their
request without duplicate data entry.

### Journey 3: Registered user → procurement request

1. Buyer chooses custom request, saved template, or catalog reference.
2. Guided intake asks for requirement, quantity, destination, deadline,
   budget/context, attachments, and declarations.
3. Inline guidance makes missing information understandable; draft preserves
   work and supports low-connectivity recovery.
4. Submission returns a readable summary, reference, status, accountable team,
   and expected update.
5. Operations triages and either accepts for sourcing or requests clarification
   in the record-scoped thread.

**Success condition:** no request is lost in email or misrepresented as sourced
before it is operationally accepted.

### Journey 4: Request → quotation → approval

1. Procurement officer sources verified options, records constraints, and
   creates a reviewed quote version.
2. Buyer receives an actionable notification and views comparable options with
   total cost, terms, expiry, risk, delivery range, and documents.
3. Buyer accepts, declines, or requests a revision; organization policy routes
   approval to the correct person where required.
4. Accepted quote becomes an immutable commercial basis; changes become
   revisions/change orders.

**Success condition:** buyer knows exactly what is being approved, and the
company can later prove the decision and terms.

### Journey 5: Approval → payment

1. System creates an appropriate payment request/invoice from approved terms.
2. Buyer sees amount, currency, beneficiary, purpose, due date, payment
   instructions, and status.
3. Payment provider/bank evidence is confirmed by the appropriate controlled
   workflow; finance allocates payment and issues receipt.
4. Buyer sees confirmation, remaining balance, and the next procurement
   milestone.

**Success condition:** an initiated or uploaded payment proof is never shown as
confirmed before finance/provider confirmation.

### Journey 6: Payment → shipping → tracking → delivery

1. Operations issues purchase commitment and plans shipment with documents,
   mode, route, partner, and dependencies.
2. Buyer sees a milestone timeline with current fact, next expected event, ETA
   range/confidence, and required action.
3. An exception triggers named ownership and a customer-facing update that
   states impact, action, and next update time.
4. Delivery proof, final documents, any quality/dispute path, and completion
   feedback are captured.

**Success condition:** a buyer never needs to chase status by phone simply to
know what has happened.

### Journey 7: Delivery → feedback → repeat customer

1. Buyer confirms receipt or reports an issue in a structured resolution flow.
2. HAMD requests focused feedback after a meaningful closure point, not during
   an unresolved exception.
3. Workspace surfaces order history, documents, saved products, templates, and
   re-order path.
4. Account team/operations review service outcome and supplier performance.

**Success condition:** repeat procurement starts with prior knowledge and
reduced effort, without hiding previous issues.

---

# Part Five - Five-year ecosystem expansion

## 9. Future products and sequencing

### Supplier Portal

Invite-only supplier workspace for verification, catalog/RFQ participation,
structured quotations, production milestones, quality documents, bank/data
maintenance, and scorecards. Launch only after supplier policy, audit, dispute,
and support operating models are mature.

### Customer Mobile App

Buyer-first mobile companion for requests, clarification, quote review,
approvals, payments, documents, shipment tracking, notifications, and support.
Do not simply compress a desktop dashboard.

### Procurement Officer App

Task and exception-oriented mobile tool for on-the-go sourcing work, supplier
visits, attachment capture, approvals, and customer updates. It must preserve
the same formal record controls as desktop.

### Warehouse App

Operational tablet/mobile application for receiving, inspection, scan-based
inventory movement, consolidation, packing, exceptions, and dispatch evidence.
Requires offline-capable synchronization and strict facility/device controls.

### Driver App

Last-mile delivery execution with assigned route/manifest, proof of delivery,
photo/signature capture, issue reporting, and offline synchronization. Only
after a managed delivery operation exists.

### Partner Portal

Controlled collaboration for carriers, forwarders, inspectors, warehouse
partners, and brokers. Scope data by partner relationship; record documents,
milestones, exceptions, and service performance without exposing unrelated
customer information.

### API Platform and Developer Portal

Customer/partner integrations for requests, catalog, documents, tracking,
webhooks, and reports. Requires stable versioning, OAuth/scoped credentials,
sandbox, rate limits, audit, status documentation, SDKs, and lifecycle
governance before external launch.

### Marketplace

Curated supplier discovery and transactability after verified supply,
moderation, pricing integrity, dispute process, reviews governance, and
financial/legal controls. An open marketplace is a distinct business model,
not a UI feature.

### Analytics Platform

Governed self-service reporting, semantic metrics, spend intelligence,
benchmarking where privacy permits, operational forecasting, and scheduled
data delivery. Build only on reliable event and transactional data.

### AI Platform

Central AI governance, tenant-scoped retrieval, evaluation, policy, model
routing, human review, audit, feedback, and domain copilots. Avoid fragmented
feature-level AI integrations that cannot be assessed or controlled.

## 10. Experience architecture governance

- Maintain a cross-ecosystem taxonomy for customers, organizations, suppliers,
  products, requests, quotes, orders, shipments, documents, payments, and
  support cases.
- Add a new page only when it owns a distinct user goal; otherwise extend an
  existing domain or record workspace.
- Add a new status only with a lifecycle definition, valid transitions,
  ownership, notification behavior, analytics meaning, API contract, and
  customer language.
- Add a new integration only with data ownership, security, retry/idempotency,
  failure behavior, support ownership, and removal plan.
- Every release is reviewed against HAMD Product DNA, Design Bible, quality
  checklist, accessibility criteria, operational playbooks, security model,
  and analytics instrumentation.
