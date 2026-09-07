# HAMD Collaboration Platform Architecture

**Purpose:** Enterprise collaboration for procurement, inspired by the
immediacy of modern messaging tools while preserving the control, context, and
auditability required for commercial, logistics, finance, and support work.

## 1. Product definition

HAMD Collaboration is not a generic company chat application. It is a
record-centric communication layer that lets buyers, procurement officers,
finance, logistics, support, and approved partners work in context.

Every meaningful conversation is attached to a business record:

- procurement request;
- RFQ;
- quotation;
- purchase order;
- shipment/exception;
- supplier qualification;
- invoice/payment case;
- support ticket; or
- controlled organization/team workspace.

Formal decisions are never buried in chat. Quote issuance/acceptance, payment
confirmation, approvals, shipment milestones, supplier status, and support
closure remain governed workflows that link to relevant messages and create
their own immutable events.

## 2. Experience principles

- **Context first:** room header states related record, current status, owner,
  participants, and permitted actions.
- **Human but professional:** direct conversation, attribution, clear time,
  readable attachments, and respectful notification behavior.
- **Internal/external separation:** internal notes are visibly distinct and
  impossible to expose through an external query or share link.
- **Signal over noise:** mentions, task-relevant notifications, pinning, and
  summaries reduce message hunting; typing/presence is transient and quiet.
- **Evidence preserved:** messages, edits, attachments, translated text,
  reactions, read state, and moderation actions have durable policy-aware
  history.
- **Accessible and global:** keyboard, screen reader, reduced motion, mobile,
  time-zone, language, low-bandwidth, and asynchronous communication are
  first-class.

## 3. Conversation and room model

### Room types

| Room type | Purpose and participants | Policy |
| --- | --- | --- |
| Request room | Buyer organization and assigned procurement team clarify requirements. | External buyer-visible messages plus separate internal notes; created with request. |
| RFQ/supplier room | Controlled communication with one invited supplier for a specific RFQ. | Supplier sees only its invite, scope, and own documents/messages. |
| Quote/order room | Buyer and accountable team discuss issued quote/PO fulfillment. | Commercial actions link to formal record; no chat acceptance. |
| Shipment room | Buyer/logistics/approved partner coordinate tracking and exceptions. | Status events are system-generated; sensitive route/document exposure is scoped. |
| Support room | Customer and support staff resolve a ticket. | SLA/ownership/closure remain ticket events. |
| Internal operations room | Procurement/finance/logistics team collaboration around permitted record(s). | Internal-only; no accidental external participant conversion. |
| Organization/team room | Optional durable team coordination. | Limited retention/governance; not a substitute for business record rooms. |

### Room lifecycle

`open → archived → retained/read-only → purged` according to business and
retention policy. A room may be closed to new messages while preserving
authorized read access. Deleting a user does not delete commercial/support
conversation history; identity is anonymized where policy requires.

## 4. Feature specification

### Chat, group chat, replies, and threads

Messages support plain text, safe structured forms, attachments, reply-to
context, and optional thread. Threads keep side discussions from obscuring a
business-room timeline; they are not used to hide a formal decision. Group
rooms require named participants/roles and clear visibility scope.

### Typing, presence, and read receipts

Typing indicators are ephemeral, scoped to active room, expire quickly, and
are never persisted/audited. Presence is optional and privacy-minimized:
available/away/offline, not a precise monitoring tool.

Read receipts use a per-participant read cursor/timestamp, not an event per
message. Display “read by” only where recipient privacy and room policy permit;
external partner/client rooms show limited aggregate read state.

### Voice notes and media

Voice notes are an accessibility-sensitive attachment type: explicit record/
send control, duration/size cap, waveform/transcript where policy permits,
download alternative, playback speed/keyboard controls, and no auto-play.

Files support images, PDF, Excel, audio, video, and approved business formats.
Every upload is a document/media asset with type/size policy, malware scan,
private storage, access-controlled signed delivery, preview fallback, and
retention classification. Files are linked to both message and relevant record.

### Mentions, pinning, reactions, and search

- Mentions resolve only active authorized participants; notification respects
  preference and escalation policy.
- Pinned messages are a limited, ordered room reference set with pin reason/
  actor/history; not a replacement for documents or workflow status.
- Reactions are a compact, accessible set of approved semantic/acknowledgment
  reactions; they are not a public social feed.
- Message search is permission-filtered full-text search by room, sender,
  participant, date, attachment type, mention, and record. Conversation search
  finds authorized rooms/record context, not content the user cannot access.

### AI summary and translation

AI summary is available only to an authorized participant and cites message/
record sources. It distinguishes external messages from internal notes and
never summarizes hidden content into an external view.

Translation preserves original text, marks machine translation, uses approved
procurement glossary, and does not replace the legally/commercially
authoritative original. For sensitive negotiations, users can request human
translation/escalation.

### Voice/video calls - future

Voice/video are not Phase 1 because WebRTC signaling, TURN infrastructure,
recording consent, security, retention, bandwidth, and operational support are
substantial. Future calls must be record-scoped, explicit-consent, access
controlled, optional recording with visible policy, captions, and safe fallback
to chat/voice note. Calls do not create formal procurement decisions; any
decision must be recorded through HAMD workflow afterward.

## 5. UI and UX specification

### Desktop workspace

- Left: room list grouped by active record/workspace, unread count, status, and
  search; no noisy presence feed.
- Center: room header/context, chronological messages, reply/thread access,
  composer, attachments, visible external/internal distinction.
- Right contextual panel: related request/quote/shipment/support summary,
  participants, pinned messages, documents, AI summary, and activity links.

### Mobile workspace

Use room list → conversation → record details navigation. Composer remains
safe-area-aware; attachment selection, audio recording, search, reply,
translation, and read state remain reachable. Do not compress a three-column
desktop view into unreadable panels.

### States and accessibility

Every room/message feature defines loading, empty, error, permission-limited,
offline/queued, sent/delivered/read, retry, success, and reduced-motion states.
Messages have semantic sender/time/content ordering; keyboard shortcuts are
discoverable and never conflict with assistive technology. New-message
announcements are polite and avoid interrupting screen readers while users type.

## 6. Database architecture

Extend Phase 6 entities:

| Entity | Purpose, constraints, indexes, retention |
| --- | --- |
| `chat_rooms` | UUID, organization, room type, related entity/type, visibility, status, title, creator, created/updated/archive times. Unique active room per required record/type; indexes org/status/updated and related entity. |
| `chat_room_participants` | Room/user or external partner identity, participant role, visibility scope, joined/left, read cursor, mute preference. Unique room/participant; indexes user/unread/update. |
| `messages` | Append-only UUID message: room, sender identity/type, visibility class, content document, reply/message/thread parent, delivery state, edited/deleted/moderated timestamps. Index room/created; partition by time at scale; soft delete renders tombstone, not loss of audit. |
| `message_revisions` | Immutable revision history/reason for allowable edits. Unique message/version; no hard delete. |
| `message_attachments` | Message-to-document/media relation, display order, caption, scan/preview status. Unique message/document; document access rechecked at fetch. |
| `message_reactions` | Participant reaction with reaction key/time. Unique message/participant/reaction; small bounded vocabulary. |
| `room_pins` | Pinned message/order/reason/pinner/time. Unique room/message; limit active pins per room. |
| `message_mentions` | Mentioned participant/message/time/read state. Unique message/participant; drives notifications. |
| `message_translations` | Source message/version, target locale, provider, translated content, status, reviewer/expiry. Unique message/version/locale/provider policy. |
| `voice_note_metadata` | Attachment/media duration, transcript status, language, consent and retention metadata. No raw audio in database. |
| `room_search_index` | Search projection/access metadata; can be PostgreSQL full-text or external index. Must carry room/org/visibility filters. |
| `moderation_cases` | Reported message/attachment/room, reason, reporter, status, reviewer, action, evidence, timestamps. Immutable outcome history. |
| `presence_sessions` | Ephemeral Redis-first presence/typing data; database only for optional aggregate/operational events, not surveillance history. |

Messages, moderation, and notification delivery events are partition-ready by
month. Attachments are retained under document policy, not a message-only
deletion rule. Foreign keys restrict destructive deletion of rooms with
commercial/support history.

## 7. REST API design

All endpoints inherit Phase 8 security/validation/pagination/filter/sort/search
standards and Phase 7 organization/permission enforcement.

| Method / route | Purpose, permission, request/response, policy |
| --- | --- |
| GET `/api/v1/chat-rooms` | List authorized rooms; `chat:read`; filters room type/status/record/unread, q, cursor/sort. Returns safe room summaries and context. |
| POST `/api/v1/chat-rooms` | Create permitted room; `chat:create`; validates type, related record, participants, visibility. Returns room; idempotent/audited. |
| GET `/api/v1/chat-rooms/{id}` | Read room/context/participants/pins. Requires participant or scoped support/operations permission; no hidden member leakage. |
| PATCH `/api/v1/chat-rooms/{id}` | Update permitted title/status/participants. `chat:manage`; validates room policy and external/internal boundaries; audited. |
| GET `/api/v1/chat-rooms/{id}/messages` | Cursor message history; participant permission; filters before/after/sender/type/hasAttachment/q where policy permits. |
| POST `/api/v1/chat-rooms/{id}/messages` | Send text/structured reply/attachment references. `chat:send`; content/visibility/attachment scan validation; rate limited, audited, real-time event. |
| PATCH `/api/v1/messages/{id}` | Permitted edit within policy window. Sender + room policy; returns new revision; `MESSAGE_EDIT_FORBIDDEN` when immutable. |
| DELETE `/api/v1/messages/{id}` | Soft-delete/tombstone message as policy allows. Sender/moderator permission; preserves revision/audit. |
| POST `/api/v1/messages/{id}/reactions` | Add/remove approved reaction. Participant only; idempotent, light rate limit. |
| POST `/api/v1/messages/{id}/mentions` | Normally derived on send; privileged repair only. Validates active authorized participant. |
| POST `/api/v1/chat-rooms/{id}/read-state` | Update read cursor. Participant; idempotent, batched, not individually audited as material event. |
| POST `/api/v1/chat-rooms/{id}/pins` | Pin/unpin message. `chat:pin`; room policy/limit validation; audit/activity. |
| GET `/api/v1/chat/search` | Permission-filtered full-text search across authorized rooms/messages. Strict org/visibility filter; cursor/rate; no cache leakage. |
| POST `/api/v1/messages/{id}/translate` | Request allowed translation. Participant; locale/content/provider validation; async response/job, clear original retained. |
| POST `/api/v1/chat-rooms/{id}/summary` | Request cited AI room summary. `ai:use` plus participant; scope/risk validation, rate/quota/audit. |
| POST `/api/v1/messages/{id}/report` | Create moderation case. Participant/reporting policy; reason/evidence validation; safe acknowledgement. |
| POST `/api/v1/uploads/initiate` | Create scoped attachment upload. Message/record permission; MIME/size/duration policy; signed temporary upload. |

## 8. Socket.IO architecture

### Authentication and rooms

At connection, validate session/access token, organization membership, origin,
and rate policy. Join only server-authorized rooms:

- `user:{userId}` for personal notification;
- `organization:{organizationId}` for scoped aggregate updates;
- `chat:{roomId}` only after participant/relationship check.

The browser never chooses arbitrary room IDs or sends a room name to gain
access.

### Server events

- `chat.message.created`, `chat.message.updated`, `chat.message.deleted`
- `chat.reaction.updated`, `chat.pin.updated`
- `chat.read_state.updated`
- `chat.typing.started`, `chat.typing.stopped` (ephemeral)
- `chat.participant.updated`, `chat.room.updated`
- `chat.moderation.updated`, `notification.created`

Payloads contain only safe authorized projections and event/version IDs. Client
refetches canonical resource for material updates. Typing events use Redis TTL,
strict per-room rate, and are never persisted as message activity.

### Reliability

Use acknowledgments for client sends, message idempotency keys, reconnect
cursor/since-event recovery, backpressure limits, message ordering by server
timestamp/sequence, and horizontal Socket.IO scaling through a Redis adapter.
Socket events do not replace REST/service-layer validation for message writes.

## 9. Notifications

Notification events are generated for:

- mention, direct reply, assignment/participant addition;
- customer/external message in owned record;
- message requiring action, pinned update, moderation outcome;
- AI summary complete/human escalation reply;
- not generic typing/reaction noise.

Users control channel/preference/digest for non-critical events. Organization
and support policies can require notification for SLA-critical messages.
Deduplicate events, respect quiet hours/time zone, link directly to authorized
room/record context, and never disclose room content in an email/push preview
when device privacy policy forbids it.

## 10. Permissions and security

### Visibility classes

- `external`: visible to authorized buyer/supplier/partner participants.
- `internal`: visible to authorized HAMD/organization internal participants
  only.
- `restricted`: visible to explicitly authorized finance/compliance/support
  role subset.
- `system`: generated activity/status; immutable and scope controlled.

Visibility is stored per message/attachment/link, not inferred only from UI
color. Permission is rechecked for each message, attachment preview, search
result, translation, AI summary, notification, and Socket.IO delivery.

### Security controls

- Session/membership/record authorization on every operation.
- Attachment scan, MIME signature/size validation, private storage, signed URL,
  malware quarantine, content-disposition hardening, and preview sandboxing.
- Structured rich text sanitized; no arbitrary HTML/scripts/link injection.
- Rate limits for sending, attachments, search, translation, AI summary,
  mentions, and typing.
- Encryption in transit/at rest; redacted logs; audit for external invites,
  participant/visibility changes, moderation, export, and sensitive room
  access.
- Search index must inherit tenant, room, visibility, and participant access
  filters before ranking; no global semantic search over private messages.

## 11. Moderation and compliance

Procurement collaboration needs governance, not consumer-chat moderation alone.

- Automated controls: malware/file policy, spam/flood detection, abusive link
  detection, secrets/PII warning where policy permits, and retained evidence.
- Human controls: report, hide/quarantine, restrict sender, remove participant,
  suspend external access, restore, and appeal. Material actions create
  moderation case/audit events.
- No opaque automated moderation decision may delete commercial evidence.
Quarantine/policy labels retain authorized reviewer access and audit trail.
- Moderators cannot use their role to browse unrelated private rooms; access is
case-scoped and auditable.

## 12. Retention, privacy, and scalability

### Retention

Define retention by room/business type, legal hold, organization contract, and
jursidiction. Commercial/support/payment/shipment conversation may require
longer retention than team chat. On expiry, purge content/attachments/search
projection/embeddings consistently; preserve minimal legally required audit
record or anonymized aggregate where permitted.

### Scalability

- PostgreSQL stores durable room/message truth; partition messages/events by
  time when volume warrants.
- Redis stores presence, typing, rate limits, fan-out coordination, and
  ephemeral reconnect cache-not authoritative message history.
- Object storage/CDN handles files/media; async workers scan, preview,
  transcode, transcript, index, and notify.
- Search uses PostgreSQL FTS/trigram initially; migrate to dedicated search
  only when volume/relevance needs justify it. Enforce access filters in index
  and application.
- Use cursor pagination, virtualized client lists, bounded thread depth,
  attachment/download limits, and backpressure to prevent a high-volume room
  degrading the platform.

## 13. Future enhancements

- Voice/video calls with WebRTC, TURN, captions, consent/recording policy,
  record-scoped attendance, and post-call decision capture.
- External supplier/forwarder partner room portal with explicit tenant/record
  isolation.
- Human-reviewed translation glossary and domain-specific terminology.
- Action items/task extraction from authorized conversation, always reviewable.
- Compliance retention/legal-hold administration, e-discovery export, and
  customer-managed encryption where enterprise demand supports it.
- Offline mobile message drafts with encrypted local storage, conflict-safe
  queue, and attachment retry.

## Final quality bar

HAMD Collaboration succeeds when a participant can understand the current
business context, communicate safely, find the evidence later, receive only
useful notifications, and move a decision into the correct governed workflow
without copying work to external messaging apps.
