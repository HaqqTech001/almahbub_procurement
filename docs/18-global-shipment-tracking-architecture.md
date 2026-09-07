# HAMD Global Shipment Tracking Architecture

**Purpose:** A premium, reassuring, evidence-led global tracking experience
covering procurement fulfillment from supplier readiness to delivery and
completion.

## 1. Product definition

HAMD Tracking is a logistics control and communication system. It combines
purchase order lines, packages, containers, shipment legs, milestone evidence,
documents, inspection, warehouse events, delivery proof, exceptions, and
customer notifications into one trusted record.

The primary tracking experience is a **current fact + timeline + next action**
model. Maps are supportive geographic context; they are never the source of
truth or a replacement for accessible milestone information.

## 2. Tracking experience principles

- **Truth before animation:** show confirmed event, source, observed time,
  location context, and next expected event before a map or visual flourish.
- **ETA range, not false precision:** display expected arrival window,
  confidence, basis, and last calculation time. Never imply a guarantee.
- **Exception ownership:** delay/damage/customs/document risk has severity,
  owner, impact, next action, resolution target, and customer update.
- **Context continuity:** tracking links to request, quote, PO, invoice,
  documents, messages, support case, and proof of delivery.
- **Privacy-aware visibility:** public tracking is minimal and tokenized;
  authenticated buyer/operations views reveal appropriate detail.
- **Human reassurance:** automated updates explain what changed and when the
  next update is due; staff remain accountable for material exceptions.

## 3. Shipment lifecycle and milestone model

### Canonical lifecycle

`planned → supplier_ready → inspection_pending → pickup_scheduled → picked_up
→ export_cleared → departed → transshipment → arrived → import_cleared →
warehouse_received → quality_checked → dispatched → out_for_delivery →
delivered → completed`

`exception_open` is parallel to physical lifecycle, not a substitute state.
`cancelled`, `returned`, `held`, and `lost` are controlled exception/terminal
states with reason/evidence and notification policy.

### Canonical milestones

| Phase | Milestone examples | Required evidence/context |
| --- | --- | --- |
| Procurement readiness | PO confirmed, supplier ready, production complete | Supplier/PO reference, source, planned date. |
| Quality and handoff | inspection booked/passed/failed, pickup scheduled, picked up | Inspection evidence, package count, handoff actor. |
| Export | export documents complete, export cleared, departed | Document status, carrier/forwarder, location/mode. |
| Transit | transshipment, in transit, route disruption | Source timestamp, location granularity, ETA confidence. |
| Import | arrived, customs documentation requested, import cleared | Customs/partner source, required customer action, hold reason. |
| Warehouse | warehouse arrival, receiving, inspection, consolidation | Facility, received quantity/condition, photos/documents. |
| Last mile | dispatch, out for delivery, delivery attempt, delivered | Delivery partner, attempt reason, proof of delivery. |
| Closeout | delivery confirmed, issue reported/resolved, completed | POD, receiver/acceptance, final documents. |

Milestones are append-only event records. Corrections create a superseding event
with reason/source; HAMD never rewrites history silently.

## 4. Client tracking UX

### Tracking overview

The first screen answers:

1. What is the current confirmed status?
2. Where is the shipment in operational terms?
3. What is the expected arrival range and confidence?
4. Is action needed from me?
5. Who owns the next step and when will I be updated?

Header contains shipment/order identity, current milestone, status language,
ETA range, exception badge if open, and next action. It does not lead with an
ambiguous animated vehicle/map.

### Interactive timeline

Timeline uses completed/current/upcoming/exception states with text and icons,
not color alone. Each event reveals observed time, recorded time, source,
location context, evidence/documents, linked photo, and relevant actor. It
supports filters for physical, document, inspection, warehouse, and exception
events; keyboard navigation; screen-reader event summaries; and expandable
detail without hiding the current state.

### Map

Map shows route/leg context only when reliable permitted location data exists.
It displays data freshness and source; a generic route line is not presented
as a live GPS position. Users can switch to textual timeline, and maps do not
continuously animate. Exact facilities, addresses, or sensitive route data are
limited by role, partner, and security policy.

### Containers, packages, and items

Clients see package/container identity and linked item quantities only when
commercial policy permits. Large shipments show a clear hierarchy:
order → shipment → leg → container/package → PO item. Quantity/condition
differences create visible exception paths rather than buried notes.

### Documents, photos, inspection, and quality

Document panel groups shipping, customs, inspection, warehouse, and delivery
evidence. Photos include caption/source/time/subject. Inspection/quality status
states pass, conditional pass, fail, not required, or pending; failure explains
owner/next action without exposing unrelated internal notes.

### Completion

After delivery, show proof of delivery, receiver/attempt context where
authorized, final documents, issue-report window, feedback, reorder/save
actions, and clear completion criteria. Do not celebrate delivery before
evidence is confirmed.

## 5. Operations and admin experience

### Logistics control tower

Operations sees queue views for:

- shipments by stage, mode, corridor, partner, owner, customer tier;
- stale milestones, ETA deterioration, customs hold, document gaps;
- open exceptions by severity/owner/SLA;
- warehouse arrivals/quality/dispatch workload;
- missing/invalid proof of delivery;
- carrier/forwarder data-health and integration failures.

Each operational row displays current status, latest reliable event, ETA
confidence, risk, owner, next action, and customer communication state. Bulk
actions are restricted, reviewed, and auditable; no bulk action can falsely
complete a shipment.

### Manual updates and corrections

Authorized logistics users can record manual milestone, location, document,
photo, inspection, exception, or ETA. Each requires source, observed time,
reason/evidence where material, and actor. A manual correction never deletes
external/carrier event evidence; it supersedes/conflicts with an explanation.

### Partner administration

Carrier/forwarder/broker/warehouse connection health, event mapping, auth
expiry, response latency, event freshness, source confidence, and SLA
performance are visible to integration/logistics administrators. Partner
users see only scoped shipment records through a future partner portal.

## 6. Notifications and communications

### Event policy

| Event | Default channel behavior |
| --- | --- |
| Pickup/departure/arrival/warehouse receipt/delivery confirmed | In-app by default; email digest or preference-based immediate alert. |
| ETA materially changes | In-app + email where impact threshold/policy is met; include range, cause if known, and next update. |
| Customer action needed | Immediate in-app/email; SMS/push only with consent and urgency policy. |
| Customs/document/inspection/quality/delay exception | Immediate actionable notification to owner; buyer communication according to severity/SLA. |
| Delivery proof/closeout | In-app/email receipt/document availability. |

SMS and push are opt-in/consent-aware, concise, and privacy-minimized. Never
include full commercial details, address, or sensitive document data in an
unprotected notification preview.

### Customer update pattern

Every material delay message states:

1. confirmed changed fact;
2. customer impact/ETA range;
3. action and owner;
4. required customer action, if any;
5. next update time.

## 7. AI delay prediction and assistance

### Initial capability

AI first summarizes shipment state, identifies stale/incomplete evidence,
explains a delay from cited events, drafts customer update for human review,
and prioritizes exception queues. It does not invent location or promise
delivery.

### Predictive ETA and risk - future

Only introduce prediction after sufficient clean historical milestones by
corridor/mode/carrier/season/category exist. Model output includes predicted
range, confidence, contributing factors, data freshness, model version, and
human override. It creates a risk signal/task, not an automatic customer
promise or route change.

Evaluate calibration, false alerts, bias by sparse trade lane, impact on
customer communication, and user understanding. Suppress prediction where
data quality is inadequate.

## 8. Database architecture

The Phase 6 logistics entities are expanded as follows:

| Entity | Purpose, key fields, constraints/indexes |
| --- | --- |
| `shipments` | Organization/PO/corridor/mode/partner/status/current milestone/ETA range/confidence/public tracking token/version. Unique code; indexes org/status/ETA/partner; restrict deletion after planning. |
| `shipment_legs` | Ordered multimodal origin/destination/carrier/vehicle/voyage planned/actual times. Unique shipment/sequence; time/route consistency checks. |
| `shipment_milestones` | Append-only canonical milestone: type, source, observed/recorded time, location, confidence, supersedes relation, raw source reference. Index shipment/observed; partition-ready. |
| `shipment_eta_estimates` | Versioned ETA range, confidence, basis, model/policy/source, generated time, override. Index shipment/current; never overwrite prior estimate. |
| `shipment_exceptions` | Type/severity/status/impact/owner/SLA/next action/customer update time/resolution. Index open owner/severity/due; immutable resolution history. |
| `containers` | Container/equipment number/type/seal/status with leg relation. Unique normalized container number; protect sensitive seal data. |
| `packages` | Parent/child package hierarchy, dimensions/weight/condition/labels. Unique shipment/package code; positive dimensions/weight. |
| `shipment_items` | Links PO item/package/quantity/condition/fulfillment. Transactional check prevents shipped/received quantity over committed amount. |
| `shipment_documents` | Document-to-shipment role link: B/L, AWB, packing list, customs, insurance, POD. Unique document/shipment/role/version; permission scoped. |
| `shipment_photos` | Asset/photo role, caption, source/time/location policy. Private asset relation; metadata/retention controlled. |
| `inspections` / `inspection_results` | Booking, inspector, checklist, pass/fail, defect/evidence, release gate. Policy/PO/shipment relation; append-only evidence. |
| `warehouse_receipts` | Facility/arrival receipt, quantities/condition, receiver/time, linked packages/photos. Unique shipment/warehouse/receipt reference. |
| `delivery_attempts` | Attempt time/status/reason/driver/recipient-safe data, next attempt. Index shipment/time/status. |
| `proofs_of_delivery` | Delivery evidence/version, receiver confirmation, document/photo/signature refs, verification status. Unique successful final delivery per shipment policy; immutable. |
| `tracking_sources` | Carrier/forwarder/broker/manual source metadata, integration reliability/status. Unique provider/account/source key. |
| `tracking_source_events` | Raw-safe normalized inbound event reference, provider ID/hash, received/processed status. Unique provider event ID; partitioned; immutable/replay-safe. |
| `shipment_notification_events` | Event-to-channel delivery/audit status. Unique shipment event/channel/recipient context; retention policy. |

All events use UUIDs, UTC `timestamptz`, actor/source fields, audit events, and
organization/record authorization. Track only location precision necessary for
the role; do not retain raw partner telemetry indefinitely without purpose.

## 9. API architecture

All endpoints inherit Phase 8 contracts: tenant authorization, validation,
structured error, idempotency, audit, cursor pagination, filter/sort/search,
rate limit, caching, and OpenAPI documentation.

| Method / route | Purpose and policy |
| --- | --- |
| GET `/api/v1/shipments` | Scoped list; filters status/mode/corridor/partner/ETA/exception/owner, q, cursor/sort. Returns client or operations projection by permission. |
| POST `/api/v1/shipments` | Create planned shipment from eligible PO/corridor. `shipment:create`; validates Incoterm/partner/package/policy; idempotent/audited. |
| GET/PATCH `/api/v1/shipments/{id}` | Read/update shipment plan within lifecycle policy; optimistic versioning. |
| GET `/api/v1/shipments/{id}/timeline` | Authorized canonical timeline with source/evidence links and filters. Cache only safe static projection briefly. |
| POST `/api/v1/shipments/{id}/milestones` | Append manual/normalized milestone. `tracking:update`; validates type/source/time/location/confidence/evidence; audit/notify. |
| POST `/api/v1/shipments/{id}/eta-estimates` | Create override/approved ETA estimate. `tracking:eta_update`; requires basis and policy; no silent overwrite. |
| POST `/api/v1/shipments/{id}/exceptions` | Open/update exception. `shipment:exception`; validates severity/owner/impact/SLA/customer update. |
| GET/POST `/api/v1/shipments/{id}/documents` | List/link permitted shipment documents. `document:read/link`; document role/version/access validation. |
| GET/POST `/api/v1/shipments/{id}/inspections` | Read/create inspection/quality workflow. `inspection:read/create`; checklist/evidence/release-gate validation. |
| POST `/api/v1/shipments/{id}/warehouse-receipts` | Record warehouse arrival/condition. `warehouse:receive`; package/quantity/location validation. |
| POST `/api/v1/shipments/{id}/delivery-attempts` | Record delivery attempt/POD. `delivery:update`; proof/recipient/attempt reason validation. |
| GET `/api/v1/tracking/{publicToken}` | Minimal public tracker; opaque expiring token, strict rate/anti-enumeration, no sensitive documents/address/value. |
| POST `/api/v1/webhooks/tracking/{provider}` | Signed carrier/forwarder event intake; raw signature/idempotency/schema validation; async normalization/audit. |
| GET `/api/v1/tracking/analytics` | Authorized shipping KPIs by policy; filters time/corridor/mode/partner; cached read model. |
| POST `/api/v1/shipments/{id}/ai-summary` | Cited shipment explanation/draft update; `ai:use` plus shipment permission; rate/quota/human-review boundary. |

## 10. Frontend, mobile, and performance

### Frontend components

- `ShipmentStatusHeader`, `EtaRange`, `NextAction`, `TrackingTimeline`,
  `MilestoneDetail`, `ShipmentMap`, `ContainerPackageTree`,
  `ExceptionBanner`, `DocumentPanel`, `InspectionPanel`,
  `WarehouseReceiptPanel`, `DeliveryProofPanel`, `TrackingNotificationPanel`,
  and `ShipmentAiAssistant`.

Every component supports loading/empty/error/success/offline/reduced-motion/
keyboard/screen-reader/dark-mode states. Map fails gracefully to timeline text.

### Mobile

Mobile prioritizes current status, ETA, next action, timeline, documents, and
support. Maps, package trees, and analytics move to optional detail routes/
sheets. Camera upload for POD/inspection/warehouse is resumable and works with
offline draft/queue rules where field apps are introduced.

### Performance

Use a cached read projection for timeline/header, virtualized long event lists,
lazy map/media/document preview, responsive media, and websocket event
projections with refetch-on-material-change. Do not delay tracking page
usability for map tiles, AI, or external carrier data.

## 11. Future integrations

- Carrier/forwarder/broker APIs and EDI feeds with normalized milestone map,
  source reliability, replay, and partner SLA monitoring.
- Customs/trade document services, IoT/GPS/container telemetry, warehouse
  management systems, and route/last-mile providers.
- Partner portal for secure event/document handoff.
- Customer-facing mobile push and driver/warehouse apps.
- Carbon emissions calculation and sustainable mode comparison.
- Predictive ETA/disruption, consolidation, and route optimization after data
  quality and operating ownership mature.

## 12. Security, privacy, and release criteria

- Public tracking uses opaque token, rate limits, minimal data, expiry, abuse
  monitoring, and no indexable sensitive pages.
- Authenticate/authorize every client/operations record, document, photo,
  exact location, partner, and POD access.
- Verify provider webhooks/signatures, retain raw-safe event hash, use
  idempotent normalization, and keep manual corrections auditable.
- Protect location/address/receiver/document data through purpose-limited
  retention, least privilege, signed asset URLs, and redacted logs.
- The experience is release-ready only when timeline truth, exception owner/
  communication, document/POD access, notification policy, source reliability,
  reduced-motion/keyboard accessibility, and integration failure fallback are
  tested end-to-end.

## Final quality bar

Tracking reassures users by being clear about what is confirmed, what is
estimated, what is delayed, who owns the response, and when the next update
will occur. A visually impressive but untrusted tracking map is worse than no
map at all.
