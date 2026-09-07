# HAMD Genesis - Enterprise Operations Command Center

**Brand:** Almahbub International  
**Powered by:** HAQQ TECH  
**Purpose:** Role-aware command center for executives and operations teams to
run procurement, finance, logistics, customers, content, policy, and platform
health from actionable workspaces.

## 1. Command-center principles

The Operations Console is not an admin dashboard. It is an operational system
that helps a person understand business state, identify risk, take permitted
action, and prove what happened.

### Best-practice synthesis

- Stripe-style organization: lead with a high-level overview, use bookmarkable
  list-to-detail flows, progressive disclosure, consistent patterns, and
  connected routes rather than isolated widget pages.
- Linear-style execution: work belongs to accountable teams, moves through
  clear statuses, and is viewed through shareable/saved filtered lenses without
  changing the underlying truth.
- Vercel-style observability: system health, performance, logs, and alerts are
  queryable by scope and drill into an evidence trail; dashboards are not
  vanity charts.
- Dynamics-style role workspace: a user sees assigned work, permitted
  workspaces, relevant KPIs, and quick routes based on responsibilities-not a
  universal menu.
- Notion/Monday/HubSpot lessons: flexible views, rich records, ownership,
  activity, and templates are useful only when governed by a clear data model
  and permission system.

### Design rules

- Every KPI answers “what changed?”, “why does it matter?”, and “what can I
  do?” through a drill-down or action.
- Default home is role-aware; user personalization is permitted within
  governance and cannot expose inaccessible data or hide critical queue work.
- Lists and queues are first-class. Charts support decisions, but never replace
  the record-level work surface.
- Status, owner, SLA, risk, next action, data freshness, and source appear
  consistently across operational records.
- Operational density is deliberate: compact readable tables, saved views,
  keyboard actions, and contextual side panels serve frequent expert work.

## 2. Console information architecture

### Workspace families

1. **Executive overview:** health and trend, no direct broad mutation.
2. **Commercial operations:** CRM, customers, organizations, products,
   suppliers, requests, RFQs, quotations, POs.
3. **Finance and logistics:** invoices, payments, shipments, warehouses,
   tracking, documents.
4. **Experience and content:** support, knowledge, CMS, media, blog, careers,
   Celebration Engine.
5. **Insight and intelligence:** reports, analytics, AI management.
6. **Platform governance:** users, roles, permissions, settings, flags, audit,
   system health, API monitoring.

### Global console components

- global search with permission-filtered record results;
- workspace switcher and organization/corridor/time-range context;
- command palette for safe, permitted high-frequency actions;
- persistent notifications/inbox and assigned-work count;
- saved/shared view system with filters, sort, columns, density, and owner;
- universal record header: status, owner, priority/SLA, next action, key
  references, activity, documents, related records;
- right-context panel for activity, comments, linked documents, AI assistance,
  and safe quick actions.

## 3. Executive Overview

### Purpose and users

Executives, operations leaders, finance leaders, and account leaders need a
trusted view of performance and risk without becoming a passive analytics
screen. Permission projection limits data to organization, region, legal
entity, or team scope.

### Content hierarchy

1. **Attention now:** pending approvals, payment/reconciliation risk, shipment
   exceptions, SLA breaches, compliance holds, system incidents.
2. **Core KPIs:** revenue/service margin, pipeline, quote acceptance, cash
   collection, active shipments, OTIF, supplier quality, customer growth.
3. **Trend/insight:** period comparison, cost variance, route/corridor,
   supplier/customer performance, AI-detected anomalies with evidence.
4. **Execution:** today’s tasks, upcoming deadlines, recent activities, quick
   actions, saved operational views.

### Components and behavior

KPI cards show definition, time range, freshness, comparison, trend where
meaningful, and drill-down. Charts include accessible tabular alternative and
filter context. Quick actions are role/permission/lifecycle aware. AI
recommendations explain source, confidence, risk, and human next action.

### Loading/error/analytics/security

Show stable shells, partial widget error states, freshness timestamp, retry,
and no “all dashboard failed” screen. Use cached analytics read models,
role-scoped aggregation, audit exports, and governed metric definitions. Do not
show raw customer/supplier/financial detail in a broad executive widget without
authorization.

## 4. Standard module contract

Every module below has:

- **roles/permissions:** stated in the module row; all actions additionally
  check organization scope, record relation, lifecycle, separation of duties,
  and MFA/step-up where required;
- **components:** overview/queue, filters/saved views, detail workspace,
  timeline/activity, documents, contextual actions, and relevant charts;
- **API:** Phase 8 versioned, validated, authenticated, authorized,
  rate-limited, logged, audited, paginated/filterable/sortable/searchable
  endpoints;
- **database:** dependencies from Phase 6; material events use audit/outbox;
- **states:** loading skeleton, empty/onboarding, permission-limited, error/
  retry, success/feedback, offline/reconnect where appropriate, keyboard,
  dark mode, reduced motion, and responsive record detail;
- **security:** least privilege, no client-trusted scope, document/media access
  recheck, export control, and redaction;
- **scalability:** cursor lists, indexed queues, background exports/imports,
  read projections, and stable saved views.

## 5. Commercial and master-data modules

| Module | Business purpose, users, permissions | Workflow/components/API/database/analytics/future |
| --- | --- | --- |
| Customers | Manage customer contacts, account health, history, service tier. Account/support/ops roles; `customer:read/update`. | Lead→customer→organization relationship, health tasks, linked requests/support; APIs `/customers`; `users`, CRM/contact/activity tables; KPIs retention/response/CSAT; future account plans. |
| Organizations | Govern tenant legal/billing/team/policy context. Org/platform admins; `organization:read/update`. | Onboard→verify→active→suspended; profile, members, teams, approval/service settings; `/organizations`; `organizations`, memberships, teams, policies; KPI active/health; future multi-entity trees/SSO. |
| Products | Curate procurement reference product data. Catalog/product-data roles; `catalog:manage`. | Draft→review→published→archived; data-quality queue, specs/media/certs/variants; `/products`; catalog tables; KPIs completeness/search conversion; future supplier self-service/punchout. |
| Categories | Govern taxonomy and required attributes. Catalog governance; `category:manage`. | Propose→impact review→publish; hierarchy, attribute template, mapping; `/categories`; category/attribute tables; KPI coverage/classification; future taxonomy translation. |
| Suppliers | Verify/manage supplier lifecycle, risk, capability, scorecards. Procurement/compliance/finance roles; `supplier:*`. | Provisional→KYB→approved/suspended; 360 profile, assessments, bank/cert/doc tabs; `/suppliers`; supplier/cert/assessment tables; KPIs OTIF/quality/risk; future supplier portal. |
| Manufacturers | Maintain legal producer/product relationship. Catalog/procurement roles; `manufacturer:manage`. | Verify→active→archived; manufacturer profile, origin, products, evidence; `/manufacturers`; manufacturers/brands/products; KPI data quality; future factory audit integration. |
| Countries | Configure country/corridor/regulatory availability. Platform/compliance roles; `country:manage`. | Draft policy→legal review→active; country/currency/document/corridor panels; `/countries`, `/corridors`; countries/corridor/compliance; KPI corridor exceptions; future live regulation feeds. |
| Procurement | Operate intake, triage, assignment, clarification, sourcing. Procurement officers/leads; `request:*`. | Draft→submitted→clarification→sourcing→quote→close; queue, SLA, detail, internal notes, checklist; `/procurement-requests`; request/items/status/assignment; KPI first response/cycle/SLA; future templates/BOM. |
| RFQs | Run structured supplier sourcing/bid events. Procurement roles; `rfq:*`. | Draft→issue→responses→analysis→award/close; invite/bid comparison/evidence; `/rfqs`; RFQ/invites/bids; KPI response/award cycle; future supplier portal/optimization. |
| Quotations | Build, review, issue, revise buyer commercial proposals. Procurement/approvers; `quote:*`. | Draft→review→issued→accepted/declined/revised; cost/options/delta/approval views; `/quotations`; quote/options/items/cost/approval; KPI acceptance/variance; future scenario optimization. |
| Purchase Orders | Convert accepted quote into supplier commitment/fulfillment. Procurement/finance; `po:*`. | Draft→issued→acknowledged→changed→fulfilled/closed; line fulfillment/change order/documents; `/purchase-orders`; PO/items/changes/contracts; KPI change/fulfillment; future supplier EDI. |

## 6. Finance and logistics modules

| Module | Business purpose, users, permissions | Workflow/components/API/database/analytics/future |
| --- | --- | --- |
| Invoices | Create/manage buyer/supplier financial documents. Finance roles; `invoice:*`. | Draft→issued→partial/paid→credited/void; invoice lines/tax/doc/allocation view; `/invoices`; invoices/items/tax; KPI aging/accuracy; future accounting sync. |
| Payments | Control payment request, confirmation, allocation, refund, reconciliation. Finance operator/controller; `payment:*`, SoD + MFA. | Request→pending→confirmed→allocated→settled/refunded; reconciliation queue/evidence/provenance; `/payments`; payments/events/allocations; KPIs success/unreconciled/disputes; future provider expansion. |
| Shipments | Plan/coordinate multi-leg physical fulfillment. Logistics roles; `shipment:*`. | Planned→pickup→transit→arrival→delivery; shipments/legs/packages/ETA/exceptions; `/shipments`; shipment tables; KPI OTIF/ETA/exception; future carrier control tower. |
| Warehouses | Manage facility, receipt, quality, consolidation, dispatch. Warehouse/logistics; `warehouse:*`. | Inbound→receive→inspect→store/consolidate→dispatch; facility queue/location/package views; `/warehouses`; warehouse/inventory/receipts; KPIs dwell/accuracy; future WMS/mobile scanning. |
| Tracking | Operate normalized milestones, sources, ETA, exceptions, POD. Logistics/support; `tracking:*`. | Ingest/manual update→normalize→notify→resolve; timeline/exception/source health; `/tracking`; milestones/source events/ETA; KPI freshness/exception response; future prediction/IoT. |
| Documents | Govern business document lifecycle and access. All scoped roles; `document:*`. | Upload→scan→review→link→expire/archive; vault, preview, expiry/retention queue; `/documents`; documents/versions/links; KPIs completeness/expiry; future OCR/e-sign. |
| Media Library | Manage approved images/video/brand/content assets. Content/catalog roles; `media:*`. | Upload→scan/transcode→approve→publish/archive; asset grid, usage map, rights; `/media`; media_assets; KPI usage/processing; future DAM integration. |

## 7. Experience, content, and people modules

| Module | Business purpose, users, permissions | Workflow/components/API/database/analytics/future |
| --- | --- | --- |
| Knowledge Base | Govern help, playbooks, internal/public articles. Authors/reviewers/publishers; `knowledge:*`. | Draft→review→publish→expire; editor/version/audience/search/feedback; `/knowledge`; articles/versions; KPI search success/deflection; future AI retrieval governance. |
| Website CMS | Manage public page/navigation/SEO content. Content roles; `cms:*`. | Draft→preview→review→publish/rollback; page builder/version/SEO/redirect; `/admin/cms`; CMS/SEO/media; KPI page performance/conversion; future locale workflow. |
| Blogs | Publish thought leadership/education. Authors/publishers; `blog:*`. | Draft→review→schedule→publish/archive; editor/SEO/related content; `/blogs`; blog posts; KPI organic/read; future newsletter integration. |
| FAQs | Maintain structured support answers. Content/support roles; `faq:*`. | Draft→review→publish; question/category/audience/order; `/faqs`; FAQ tables; KPI deflection/helpfulness; future AI answer linking. |
| Testimonials | Manage consented customer proof. Marketing/publisher; `testimonial:*`. | Collect consent→review→publish→withdraw; evidence/attribution/public preview; `/testimonials`; testimonial/consent docs; KPI conversion; future localized proof. |
| Case Studies | Publish approved customer outcome story. Marketing/account roles; `case_study:*`. | Draft→customer approval→publish; narrative/metrics/evidence/related service; `/case-studies`; case-study versions; KPI lead influence; future vertical library. |
| Careers | Manage open roles/public job content. HR/admin; `career:*`. | Draft→publish→close/archive; role list/detail/SEO; `/careers`; positions; KPI applicants/time to fill; future ATS integration. |
| Job Applications | Securely process candidate applications. HR/recruiter; `job_application:*`. | Submitted→screen→interview→offer/reject; applicant queue/PII/documents/notes; `/job-applications`; applications/documents; KPI funnel; future ATS/retention automation. |
| Celebration Engine | Author/review/schedule audience campaigns. Content/publisher/platform admin; `celebration:*`. | Draft→review→scheduled→active→expired; studio, preview, audience, analytics/history; `/admin/celebrations`; celebration tables; KPI eligible/display/CTA; future templates/locales. |

## 8. Insight, intelligence, and governance modules

| Module | Business purpose, users, permissions | Workflow/components/API/database/analytics/future |
| --- | --- | --- |
| Reports | Create governed operational/finance/compliance exports. Analysts/leads; `report:*`. | Define→validate scope→run→download/schedule; report builder/runs/delivery; `/reports`; reports/runs; KPI adoption/failure; future external BI. |
| Analytics | Explore trusted metrics/insights. Executives/analysts; `analytics:read`. | Select governed lens→filter→drill down→save; dashboards/charts/metric dictionary; `/analytics`; read models/events; KPI metric freshness; future semantic AI analyst. |
| AI Management | Govern sources, models, prompts/tools, evaluations, feedback, incidents. AI/security/product roles; `ai:manage`. | Source approve→ingest→evaluate→policy activate→monitor; source/model/eval/usage panels; `/admin/ai`; AI tables; KPI quality/citation/cost; future multi-model routing. |
| Settings | Configure scoped platform/organization behavior. Platform/org admins; `settings:*`. | Draft→review→apply/rollback; typed settings/change diff; `/settings`; settings/audit; KPI config incidents; future delegated settings. |
| Audit Logs | Investigate immutable access/business/admin events. Auditors/security; `audit:read/export`. | Search→filter→inspect→authorized export; event explorer/correlation; `/audit-events`; audit ledger; KPI coverage/investigation; future SIEM integration. |
| Users | Administer accounts, security state, recovery/suspension. Platform/org admins; `user:*`. | Invite→active→suspend/recover; user 360/session/device/security panels; `/users`; users/sessions/devices; KPI activation/security; future SCIM. |
| Roles | Define role templates and organizational duties. Security/platform admin; `role:*`. | Draft→impact review→publish→assign; role/permission matrix; `/roles`; roles/permissions; KPI least privilege; future certification. |
| Permissions | Inspect/manage atomic capability catalog. Security only; `permission:manage`. | Propose→security review→release; matrix/dependency/effect preview; `/permissions`; permissions/role links; KPI access reviews; future policy-as-code. |
| Feature Flags | Safely release/target capabilities. Platform/product roles; `feature_flag:*`. | Draft→review→target→monitor→expire; flag/rule/metrics/kill switch; `/feature-flags`; flags/rules/audit; KPI rollout health; future experiments policy. |
| System Health | Operate service/database/cache/queue/provider health. SRE/platform roles; `system:read`. | Detect→triage→incident→resolve/postmortem; SLO panels/alerts/runbooks; observability sources; KPI uptime/error/lag; future incident automation. |
| API Monitoring | Investigate API latency/errors/traffic/webhooks/quotas. SRE/API owners; `api_monitor:read`. | Filter→trace→correlate→alert; route/provider dashboards/traces; telemetry/read models; KPI p95/error/rate-limit; future customer API status. |

## 9. Dashboard widgets and work queues

| Widget/queue | Owner audience | Drill-down/action |
| --- | --- | --- |
| Revenue/service margin | Executive/finance | Filter period/entity/corridor; drill to invoices/POs/variance. |
| Procurement statistics | Procurement lead | Request/quote cycle, conversion, SLA; drill to overdue queue. |
| Supplier performance | Procurement/compliance | OTIF, defect, response, risk; drill to scorecard/assessment. |
| Customer growth | Executive/account | New/active/retention; drill to account health/CRM. |
| Active shipments | Logistics/executive | By stage/ETA/risk; drill to tracking timeline. |
| Pending quotations/approvals | Buyer/procurement/approver | Direct decision queue with expiry/policy context. |
| Payments/invoices | Finance | Due, pending confirmation, unreconciled, aging; direct controlled action. |
| Today’s tasks/upcoming deadlines | All roles | Personal/team queue by SLA, priority, record. |
| AI recommendations/business insights | Authorized leaders/operators | Evidence/citation/confidence/next action; dismiss/escalate/inspect. |
| Recent activities/notifications | All roles | Correlated activity detail; no unprioritized event flood. |
| Quick actions | Role scoped | New request, assign, issue quote, record milestone, upload document, create support; never bypass workflow. |

## 10. Data, API, loading, security, and scalability rules

### API and database

Each module consumes the Phase 6 domain model and Phase 8 APIs. Command-center
dashboards query role-scoped read models/analytics projections, not raw
unbounded transactional joins. Every queue uses cursor pagination,
allowlisted filters/sort/search, saved view persistence, resource-level
authorization, data freshness, and audit for material actions/exports.

### Loading and error policy

- Show navigation/shell immediately; high-priority action queue loads before
  secondary charts.
- Use widget-level error/retry and freshness state, not one global dashboard
  failure.
- Distinguish no data, zero filter results, permission restriction, integration
  delay, and failed request.
- Preserve applied filters/search/column state after error; support accessible
  retry and error reference.
- Long export/import/report actions become background jobs with status,
  notification, result expiry, and safe retry.

### Security

Console visibility is permission- and organization-scoped. Privileged modules
require MFA/step-up where defined in Phase 7. Exports, PII, supplier bank,
finance, security, and audit data are redacted/limited and logged. No dashboard
aggregation can become a side channel revealing records outside scope.

### Scalability and future expansion

Use indexed queue/read-model patterns, cached reference metrics, asynchronous
exports, virtualized lists, event/outbox analytics, and role-aware saved views.
Future expansion includes multi-entity group reporting, external BI,
organization-configurable workspaces under policy, partner workspaces, natural
language insight with HAMD AI guardrails, and mobile field-operation
workspaces.

## 11. Command-center release quality bar

The Console is complete only when a permitted user can move from an executive
signal to the underlying source record, understand current state/owner/next
action/freshness, take a safe governed action, and later prove that action in
the audit trail. A visually polished dashboard that cannot drive accountable
work is not a command center.

## Reference practices consulted

- Stripe dashboard design patterns:
  https://docs.stripe.com/stripe-apps/patterns/full-page-apps
- Linear workflow/conceptual model:
  https://linear.app/docs/conceptual-model
- Vercel observability/query practice:
  https://vercel.com/docs/observability
- Microsoft Dynamics operational workspaces:
  https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/build-workspaces
