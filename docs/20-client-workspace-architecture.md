# HAMD Genesis - Client Workspace Architecture

**Purpose:** Premium client procurement software that lets an organization
discover, request, approve, pay for, track, communicate about, and learn from
international procurement in one accountable workspace.

## 1. Experience principles

The Client Workspace is not a simplified operations console and not a generic
customer dashboard. It is a buyer’s controlled operational home.

### Principles extracted and adapted

- **Notion:** organized, focused sidebar sections and favorites reduce
  navigation noise; HAMD applies this to buyer domains and permitted saved
  views, not free-form page sprawl.
- **Linear:** personal/team work queues and shareable saved filters help users
  focus without changing the underlying record; HAMD applies this to approvals,
  requests, invoices, and shipments.
- **Slack:** searchable context, threaded communication, and notification
  preferences make collaboration useful; HAMD keeps messages record-scoped and
  does not let chat replace commercial decisions.
- **ClickUp:** dashboards/filters are useful when located close to the work;
  HAMD uses compact role-aware overview widgets and always drills into the
  authoritative record.
- **Stripe Customer Portal:** financial context, invoices, payments, and
  self-service actions should be clear, safe, and evidence-led.
- **Dropbox:** documents must be reliably organized, searchable, previewable,
  permissioned, and version-aware.
- **GitHub:** a dedicated, triageable activity/notification inbox and saved
  items prevent important updates from becoming noise.

### Workspace promise

Every page answers:

1. Where am I and which organization/record is this?
2. What is true now?
3. What can I do?
4. What should happen next, and who owns it?

## 2. Main navigation

### Primary sidebar

1. Dashboard
2. Discover: My Products, Saved Products
3. Procure: Procurement Requests, Quotations
4. Finance: Invoices, Payments
5. Deliveries: Tracking, Documents
6. Collaborate: Chat, Support, Notifications
7. Learn: AI Assistant, Knowledge Center
8. Personal: Profile, Settings, Activity

The sidebar presents only pages authorized for the active organization/member
role. It supports a small favorites section, unread/action counts, global
search, organization switcher, command palette, keyboard navigation, responsive
collapse, and context-preserving deep links. It does not expose hidden
administrative concepts to client users.

## 3. Shared page contract

All pages use the HAMD Design System, Motion System, API Architecture,
Authentication/Security Architecture, Collaboration Platform, Tracking, and AI
boundaries.

### Required states

- Loading: stable shell/skeleton prioritized around primary action/record.
- Empty: explains why no data exists and offers the next safe action.
- Error: preserves filters/drafts, exposes retry/support reference, and never
  uses empty state for failed data.
- Success: confirms material completion and directs user to next action.
- Offline: preserve drafts/queued low-risk actions; clearly mark stale data and
  never queue quote/payment/approval confirmation as if final.
- Accessibility: WCAG 2.2 AA, keyboard, semantic headings/landmarks, screen
  reader updates, contrast, 44px touch targets, focus restore, reduced motion.
- Responsive: mobile prioritizes current status/action and record detail over
  compressed desktop data tables.
- Animation: only semantic state/orientation feedback; no animation delays
  commercial or financial decisions.
- Security: organization/membership/record authorization at API and document/
  message layer; UI visibility is not access control.

### Performance rules

Use route-level code splitting, role-scoped read projections, cursor pagination,
virtualized long lists, cached reference data, responsive media, lazy document/
map/chart/AI loading, request cancellation, and optimistic updates only for
safe reversible actions such as preference/read state/draft metadata.

## 4. Page catalogue

### Dashboard

- **Purpose/business goal:** make urgent work, spend/delivery visibility, and
  next actions obvious; reduce status chasing.
- **Components:** attention queue, pending approvals/clarifications, quotes
  expiring, payments due, shipments at risk, active spend/KPIs, recent activity,
  saved views, quick actions, data freshness.
- **Workflow:** resolve attention item → inspect record → take permitted action
  or assign/escalate; dashboard never performs opaque bulk completion.
- **API/database:** dashboard read model aggregates requests, quotes,
  approvals, invoices, payments, shipments, notifications, activity,
  membership; `/dashboard` with role/scope/time filters.
- **Accessibility/responsive/motion:** cards have labels/values/drill-down;
  mobile stacks attention first; only short content transitions.
- **Performance/security/future:** cached scoped projection, widget-level
  fallback; no cross-org aggregate leakage; future configurable widgets within
  approved layout/policy.

### My Products

- **Purpose/business goal:** discover relevant approved/reference products and
  convert exploration into a well-formed procurement request.
- **Components:** search, category breadcrumbs, facets, policy guidance,
  product cards, compare tray, recent/viewed, request action, data-source
  indicators.
- **Workflow:** search/browse → evaluate specs/evidence → compare/save → request
  procurement or quotation; never imply direct ecommerce checkout.
- **API/database:** catalog search/detail/facets/relationships/policy
  endpoints; products, variants, specifications, categories, docs,
  supplier-capability projections.
- **Accessibility/responsive/motion:** filter sheet on mobile, semantic result
  count, keyboard compare; media fade only, no heavy card animation.
- **Performance/security/future:** cached published catalog, search index/CDN
  media; policy/offer data role-scoped; future contract catalogs/punchout/BOM.

### Saved Products

- **Purpose/business goal:** retain reusable product research, shared lists,
  project collections, and repeat-buy context.
- **Components:** lists, tags, notes, owners, share controls, item state,
  compare/request/reorder actions.
- **Workflow:** save product → organize/share internally → create request from
  list or compare selection; removed products retain explanation/history.
- **API/database:** saved lists/items/shares endpoints; `saved_lists`,
  `saved_list_items`, ACL/share links, activity.
- **Accessibility/responsive/motion:** list/table toggle with mobile cards,
  keyboard reorder/action controls, no drag-only interactions.
- **Performance/security/future:** cursor list and optimistic safe bookmark
  changes; organization ACL not public link by default; future team templates/
  recurring lists.

### Procurement Requests

- **Purpose/business goal:** manage buyer requirements from draft to fulfilled
  or closed.
- **Components:** request queue, status/next-action/SLA, filters, drafts,
  templates, bulk-safe selection, request cards/table.
- **Workflow:** draft → submit → answer clarification → sourcing/quote →
  accepted order/close. Primary action changes by state.
- **API/database:** `/procurement-requests`; request/items/status events/
  assignments/documents/messages; filters status/date/owner/priority/q.
- **Accessibility/responsive/motion:** guided mobile creation, error summary,
  preservable drafts, timeline text; no status animation beyond semantic change.
- **Performance/security/future:** request read projection/cursor pagination;
  role/record ownership; future templates/BOM import/department policy.

### Request Detail

- **Purpose/business goal:** single source of truth for a buyer requirement.
- **Components:** status/owner/next action, item/spec summary, conversation,
  documents, activity timeline, quote/order relation, clarification checklist,
  support/AI entry.
- **Workflow:** inspect current state → provide missing data/respond →
  review quote or resolve issue; formal actions launch their controlled flow.
- **API/database:** request detail/activity/documents/chat/related quotes/
  approvals endpoints; request aggregate and event relations.
- **Accessibility/responsive/motion:** anchored sections, keyboard timeline,
  mobile detail routes/sheets, stable contextual header.
- **Performance/security/future:** parallel lazy tabs with record version;
  internal notes excluded at projection; future delegated requester/projects.

### Quotations

- **Purpose/business goal:** help buyers understand, compare, approve, decline,
  or request revision of a commercial proposal.
- **Components:** quote list, expiry/status, option comparison, total landed
  cost, assumptions/exclusions, source documents, approval path, revision
  delta, AI explanation.
- **Workflow:** issued quote → inspect options/risks → internal approval if
  needed → accept/decline/revise; accepted quote becomes immutable basis.
- **API/database:** quotations/options/items/cost components/approvals/docs;
  `/quotations`, decision commands with idempotency/row version.
- **Accessibility/responsive/motion:** comparison has screen-reader table and
  mobile summary/expand; price uses tabular numbers; no animated totals.
- **Performance/security/future:** cached safe issued view per scope; quote
  terms/documents restricted; future counteroffers/budget integration.

### Invoices

- **Purpose/business goal:** provide accurate financial document visibility and
  reduce finance/support enquiries.
- **Components:** invoice queue, status/due/aging, amount/currency, documents,
  allocation, receipt/credit note, download/share controls.
- **Workflow:** inspect issued invoice → pay or reconcile with finance contact
  → view receipt/credit; immutable documents remain historical evidence.
- **API/database:** invoices/items/tax/documents/payment allocations; filters
  status/due/currency/type/q.
- **Accessibility/responsive/motion:** accessible monetary table, document
  preview/download fallback, mobile invoice detail; no finance-state animation.
- **Performance/security/future:** signed documents, role/organization
  projection, export audit; future accounting integration/statements.

### Payments

- **Purpose/business goal:** explain payment milestones, instructions,
  confirmation, receipts, and remaining balance without ambiguity.
- **Components:** payment schedule, invoice link, amount/currency/beneficiary,
  due date, method/instructions, provider state, proof/receipt, support.
- **Workflow:** choose approved payment path → initiate/submit permitted
  evidence → pending confirmation → confirmed/allocated → receipt; user cannot
  self-mark confirmed.
- **API/database:** payment requests/payments/events/allocations/refunds,
  provider handoff; strict idempotency and status projection.
- **Accessibility/responsive/motion:** step-by-step readable flow, clear
  pending versus confirmed labels, responsive financial detail, reauth for
  sensitive action.
- **Performance/security/future:** no shared cache, tokenized provider flow,
  MFA/step-up and audit; future multi-method/currency policy.

### Tracking

- **Purpose/business goal:** reassure users with current facts, ETA range,
  ownership, documents, and exception communication from supplier readiness to
  delivery.
- **Components:** status header, ETA confidence, timeline, map context,
  containers/packages, exception banner, documents/photos, inspection/
  warehouse/POD, support/AI summary.
- **Workflow:** inspect fact/next event → provide required document/action or
  ask support → confirm delivery/report issue.
- **API/database:** shipments/legs/milestones/ETA/exceptions/packages/
  documents/POD; `/shipments` and tracking projections.
- **Accessibility/responsive/motion:** timeline authoritative, map optional/
  text equivalent, mobile current state/timeline first; no fake moving marker.
- **Performance/security/future:** lazy map/media, live event projection,
  privacy-scoped routes/POD; future predictive ETA/partner feed.

### Documents

- **Purpose/business goal:** make every authorized procurement, finance,
  logistics, and support document findable and controlled.
- **Components:** searchable vault, record/type filters, version/source/
  expiry, preview, access/share/download, upload request, retention notice.
- **Workflow:** locate → preview/download → link/use in permitted record →
  upload/review where authorized; expired/missing document generates action.
- **API/database:** documents/versions/links/media/sign URLs/search; document
  ACL/retention/audit.
- **Accessibility/responsive/motion:** accessible preview/download fallback,
  keyboard file list, mobile route-specific preview; no visual-only file type.
- **Performance/security/future:** lazy preview/async OCR, signed URLs/scans,
  audit all exports; future e-sign/document intelligence.

### Chat

- **Purpose/business goal:** enable contextual human collaboration without
  external messaging fragmentation.
- **Components:** room list, record header, message timeline, replies,
  attachments, mentions, pins, translation, cited AI summary, participant/
  notification controls.
- **Workflow:** communicate → attach evidence → follow/reply → move material
  decision into formal action. Room scope follows request/quote/shipment/ticket.
- **API/database:** chat rooms/participants/messages/attachments/read/
  reactions/search; Socket.IO projections; collaboration tables.
- **Accessibility/responsive/motion:** keyboard composer/reply/search, read/
  typing status accessible, mobile list→room navigation; no typing theater.
- **Performance/security/future:** cursor history/virtualization, private
  signed attachments, visibility recheck; future voice/video with consent.

### Support

- **Purpose/business goal:** resolve customer issues with ownership, evidence,
  SLA, and business-record context.
- **Components:** ticket queue, category/priority/SLA/status, linked record,
  conversation, documents, escalation, knowledge suggestions, satisfaction.
- **Workflow:** create → triage → investigate/respond → resolve → feedback/
  reopen; urgent tracking/payment cases route to correct team.
- **API/database:** support tickets/events/assignments/knowledge search;
  filters status/priority/SLA/record/q.
- **Accessibility/responsive/motion:** simple issue creation, status explained,
  mobile updates, keyboard conversation; stable error/retry.
- **Performance/security/future:** organization scoped, no internal case
  leakage, SLA events/audit; future entitlement/routing/service status.

### Notifications

- **Purpose/business goal:** surface important work without forcing users to
  monitor every record.
- **Components:** inbox, unread/saved/done states, filters, notification
  reason, deep link, preferences, digest/quiet-hours controls.
- **Workflow:** receive → inspect context → act/save/done/unsubscribe where
  permitted; critical security/legal events cannot be muted.
- **API/database:** notifications/deliveries/preferences; cursor filters
  unread/type/priority/reason/q, mark read/save/done batch commands.
- **Accessibility/responsive/motion:** no toast-only critical events, mobile
  inbox sync, screen-reader live region calibrated; user-controlled motion.
- **Performance/security/future:** event dedupe/background delivery, recipient
  scope checked, preview redaction; future smart priority/digest.

### AI Assistant

- **Purpose/business goal:** help users find, understand, structure, translate,
  and escalate within authorized procurement context.
- **Components:** scoped entry, conversation, citations, confidence, draft
  review, source controls, feedback/stop/escalate.
- **Workflow:** ask/inline action → retrieve permitted evidence → cited answer
  or draft → human review/submit or escalation.
- **API/database:** AI conversations/messages/citations/tools/preferences;
  task endpoints from Phase 10.
- **Accessibility/responsive/motion:** readable streaming/stop, citations
  keyboard navigable, no simulated typing; mobile panel/full route.
- **Performance/security/future:** quota/caching per Phase 10, tenant-scoped
  context, no autonomous action; future governed predictive support.

### Knowledge Center

- **Purpose/business goal:** educate buyers and reduce avoidable support
  contacts.
- **Components:** search, categories, article/table of contents, glossary,
  related content, feedback, contextual record recommendations.
- **Workflow:** search/browse → read/download → return to relevant request/
  quote/tracking action or escalate support.
- **API/database:** knowledge articles/versions/search/feedback; full-text
  index and audience scope.
- **Accessibility/responsive/motion:** readable measure, semantic headings,
  accessible TOC, mobile search; no content reveal animation.
- **Performance/security/future:** cache public/safe article projections,
  role-scoped internal content; future learning paths/localization.

### Profile

- **Purpose/business goal:** give users control over identity, contact, locale,
  accessibility, and security preferences.
- **Components:** profile/contact, language/time zone, notification/accessibility
  preferences, MFA/security/session/device entry.
- **Workflow:** edit validated fields → save → confirmation/audit; security
  changes require recent authentication.
- **API/database:** `/me`, preferences, sessions/devices/MFA; user/profile/
  session entities.
- **Accessibility/responsive/motion:** straightforward form/error summary,
  password-manager support, mobile safe layout; no distracting confirmation.
- **Performance/security/future:** no shared cache, reauth/audit for sensitive
  change; future passkeys/enterprise profile sync.

### Settings

- **Purpose/business goal:** manage personal workspace behavior and permitted
  organization settings without mixing it with profile/security.
- **Components:** organization switch, team/membership view, saved-view
  preferences, notification/digest, document/share defaults, integrations where
  authorized.
- **Workflow:** change scoped setting → validation/impact explanation → save/
  rollback if allowed; organization-level changes require admin policy.
- **API/database:** settings/membership/organization policy/preferences;
  versioned typed settings/audit.
- **Accessibility/responsive/motion:** grouped settings/navigation, descriptive
  controls, mobile sections; no hidden auto-save for consequential settings.
- **Performance/security/future:** cached non-sensitive preference/reference
  data, org scope/step-up; future multi-entity/SSO settings.

### Activity

- **Purpose/business goal:** provide a trustworthy personal/organization
  chronology of relevant actions, updates, and material state changes.
- **Components:** activity feed, filters record/type/date/actor, saved
  entries, source links, audit distinction, export where authorized.
- **Workflow:** filter → inspect linked record/version → resolve/follow
  workflow; activity is read-only evidence, not an edit surface.
- **API/database:** activity event read model/audit-safe projections; cursor
  pagination/search/filter/sort.
- **Accessibility/responsive/motion:** chronological semantics, keyboard
  filter, mobile detail links; no infinite animated feed.
- **Performance/security/future:** partitioned read model, tenant/redaction
  controls; future compliance/auditor views.

## 5. End-to-end client journey

### Discover to request

Buyer enters Dashboard or My Products, searches/browses product data, evaluates
specifications/evidence/policy guidance, saves or compares products, then
starts a prefilled request. The request flow explains which information is
missing and why it matters; draft progress is preserved.

### Request to quotation

Buyer sees submitted state, owner, expected next update, and clarifications in
one detail workspace. The issued quote presents comparable options, total cost
assumptions, terms, delivery range, risks, documents, and the approval path.
The buyer accepts, declines, or requests revision through controlled actions.

### Quotation to payment

Once approved, payment view shows the related invoice/payment milestone,
amount/currency/beneficiary, instructions, due date, and exact confirmation
state. The user can upload permitted evidence or complete a provider flow, but
never receives a false confirmed state.

### Payment to delivery

Tracking leads with confirmed milestone, ETA range/confidence, owner, and next
event. Documents, inspection, exceptions, warehouse, delivery proof, and
support stay linked. A delay produces an actionable update, not a vague status.

### Completion to repeat procurement

Buyer confirms delivery/reports issue, accesses final documents and feedback,
then returns to history, saved products, templates, and product discovery for
the next request. Previous outcome informs recommendation without exposing
other organizations’ data.

## 6. Workspace data and API dependencies

The workspace is built on organization-scoped aggregates:

- `organizations`, memberships, teams, roles, permissions;
- products/variants/specifications/saved lists/policy guidance;
- procurement requests/items/status events/RFQs/quotations/approvals/POs;
- invoices/payments/allocations/documents;
- shipments/milestones/exceptions/packages/inspection/POD;
- chat/support/notifications/activity/knowledge/AI;
- audit/feature settings/read projections.

Each page calls a dedicated bounded-domain read or command API. Do not create a
single “client dashboard” endpoint that returns every record or allow frontend
joins to reconstruct authorization logic.

## 7. Security, privacy, and quality bar

- Client users see only active organization data and records allowed by role/
  relationship/policy. Switching organization invalidates prior scoped cache.
- Quotes, financial data, documents, tracking exact location, internal support
  notes, and chat visibility are independently authorized.
- All material actions are audited; sensitive actions require MFA/step-up and
  clear consequences.
- Public share links are narrow, revocable, expiring, and never expose
  organization activity, quote, payment, or private document data.
- No page is complete until its loading/empty/error/success/offline,
  accessibility, responsive, performance, animation, and security behavior is
  verified.

## Reference practices consulted

- Notion focused sidebar/teamspaces:
  https://www.notion.com/help/guides/structure-sidebar-focused-work-teamspaces
- Linear saved custom views:
  https://linear.app/docs/custom-views
- Slack search, threads, notifications:
  https://slack.com/help/articles/202528808-Search-in-Slack
- ClickUp dashboards and filters:
  https://help.clickup.com/hc/en-us/articles/6312197753239-Intro-to-Dashboards
- GitHub notification triage:
  https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications
