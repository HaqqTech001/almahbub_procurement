# HAMD Genesis - Celebration Engine Specification

**Module:** Celebration Engine  
**Product:** HAMD Procurement Platform  
**Purpose:** reusable enterprise announcement, milestone, and celebration
orchestration-not a wedding-specific feature.

## 1. Product definition

The Celebration Engine lets authorized Almahbub International operators schedule
high-quality, audience-scoped, time-bounded visual announcements without a code
release. It supports company milestones, weddings, anniversaries, Eid, Ramadan,
promotions, office openings, awards, service announcements, and future event
types.

It is a controlled communications system. It must not be an unrestricted popup
builder, a public media uploader, or a mechanism that blocks users from
critical procurement, payment, support, or operational work.

### Product goals

- Publish one-time or recurring-visit celebrations to selected HAMD surfaces.
- Preserve premium presentation while respecting accessibility, motion, user
  attention, performance, and business context.
- Make scheduling, targeting, analytics, audit, approval, preview, rollback,
  and expiry self-service for authorized operators.
- Store content/configuration as data so event changes do not require a
  deployment.

### Non-goals for first release

- Financial rewards, coupons, games, social sharing, or user-generated
  celebrations.
- Arbitrary HTML, scripts, custom CSS, or unmoderated third-party embeds.
- Background video as a default experience.
- Interrupting a payment, approval, critical exception, active form, support
  chat, or Operations Console task without explicit privileged policy approval.

## 2. Functional specification

### Celebration lifecycle

`draft → pending_review → scheduled → active → expired → archived`

Additional administrative states:

- `paused`: remains configured but cannot display.
- `cancelled`: permanently prevented from display, retaining history.
- `superseded`: replaced by a later version or duplicate.

Only `active` records are eligible for display. The scheduler transitions a
record to `active` when its start instant arrives and to `expired` when its end
instant passes. A read-time eligibility check remains mandatory; scheduled jobs
are an optimization, not the source of truth.

### Authoring fields

| Field | Requirement |
| --- | --- |
| Title | Required, plain text, localized, concise. |
| Subtitle | Optional plain text, localized. |
| Message | Required short supporting text. |
| Rich text description | Optional, sanitized structured rich text only; no arbitrary HTML/script. |
| Button text and link | Optional pair; internal links preferred, external links require allowlist/review and safe target behavior. |
| Start and end date | Required UTC instants plus IANA display time zone; end must be later than start. |
| Status | Lifecycle state with explicit actor/reason audit. |
| Theme | Named, versioned theme token set; no arbitrary style injection. |
| Animation style | Named, allowlisted motion preset. |
| Background image/video | Optional approved asset reference; video is subject to media/performance/accessibility rules. |
| Glass effect | Named level: none, subtle, standard. It never overrides contrast requirements. |
| Effects | Independently configurable confetti, sparkles, fireworks, balloons, sound. |
| Frequency | `once_per_version`, `once_per_campaign`, or `every_eligible_visit`; this replaces contradictory combinations of Show Once and Show Every Visit. |
| Dismissibility | Required option; non-dismissible use is restricted to an approved, non-critical, short system notice-not a celebration. |
| Priority | Integer 0–100 with controlled conflict rules. |
| Audience | Website, Client Workspace, Operations Console, authenticated state, organization, user, role, country/corridor, and optional cohort predicates. |
| Analytics | Enable/disable permitted event collection, subject to privacy consent and policy. |

### Display eligibility

A delivery request evaluates the following in order:

1. **Surface match:** requested surface is in the campaign audience.
2. **Lifecycle/date:** `status = active`; current server-authoritative UTC time
   is at or after start and before end. Use half-open range `[start, end)` to
   prevent double display at the boundary.
3. **Audience policy:** identity, role, organization, country/corridor,
   authentication state, and segment conditions match.
4. **Safety exclusion:** no critical workflow suppression applies. The default
   suppression list includes active payment, approval, destructive confirmation,
   unsaved multi-step request, active support escalation, and focused
   Operations Console task. A celebration may be delivered after completion.
5. **Frequency:** check display/dismiss/action history using the configured
   frequency rule and current campaign version.
6. **Priority resolution:** rank remaining campaigns by priority descending,
   then start time descending, then explicit creation order. Display at most one
   blocking modal per surface session. Lower-priority campaigns become an
   inbox/banner notification where configured; they do not queue a popup
   cascade.
7. **Accessibility/device policy:** use reduced-motion/no-sound presentation
   when user or system preference requires it; do not request media
   auto-play permission.

Expired campaigns stop displaying automatically. Delivery endpoints must never
return expired, paused, cancelled, or unauthorized campaigns even if a cache is
stale.

### Frequency and state

- **Once per version:** display once for each authenticated user or anonymous
  browser identifier after a material campaign version change.
- **Once per campaign:** display only once despite edits; use for sensitive
  notices where repeated attention would be harmful.
- **Every eligible visit:** display at most once per browser session, with a
  server/configured quiet period. It is unsuitable for the Operations Console
  and should have a maximum lifetime policy.
- **Anonymous public web:** store a privacy-respecting, first-party,
  non-identifying display token with expiry. Do not use fingerprinting.
- **Authenticated surfaces:** store server-side user-campaign delivery state;
  client storage is only a cache to prevent flicker.

### Administration capabilities

| Capability | Behavior |
| --- | --- |
| Create | Creates a draft from a blank form or approved template. |
| Edit | Changes create a new immutable configuration version once a campaign has been published. |
| Delete | Drafts can be soft-deleted. Published records are cancelled/archived, never physically erased while audit retention applies. |
| Duplicate | Clones content/configuration into a draft without delivery history, identifiers, or approvals. |
| Preview | Renders a sandboxed/preview-only configuration on desktop, tablet, mobile, light/dark, motion-reduced, and screen-reader semantic checks. Preview never writes delivery analytics. |
| Schedule | Validates date/time zone, audience, conflicting priorities, approved assets, and required approval before entering scheduled state. |
| Enable/disable | Maps to active/paused policy with audit and immediate cache invalidation. |
| History | Shows versions, status transitions, author/reviewer, schedule, audience changes, assets, and delivery aggregates. |
| Analytics | Shows eligible impressions, displays, dismissals, CTA clicks, completion, failure, and suppression counts without exposing personal behavioral data unnecessarily. |

### Roles and approval

- **Celebration Author:** creates and edits drafts; cannot publish.
- **Celebration Publisher:** approves/rejects, schedules, pauses, and cancels
  campaigns; cannot approve their own campaign for public/organization-wide
  delivery.
- **Content Reviewer:** reviews copy, brand, accessibility, and audience scope.
- **Platform Administrator:** manages themes, effect presets, retention, and
  emergency global disable.
- **Analyst:** reads aggregated analytics/history; no content or targeting
  changes.

For public website or organization-wide campaigns, two-person approval is
required. A campaign with external links, sound, video, high priority, or
non-dismissible configuration requires the stricter approval policy.

## 3. Default wedding configuration template

The following is a **draft template**, not an activated campaign. It must not
be scheduled until an authorized administrator chooses an exact year, start/end
time, IANA time zone, audience, owner/content approval, and publication
channel. “September” alone is insufficient for an automated production
schedule.

| Field | Initial template value |
| --- | --- |
| Title | Congratulations! |
| Subtitle | A New Chapter Begins |
| Message | Every great journey begins with a new chapter. |
| Rich text description | As you begin a beautiful new chapter in your personal life, we wanted Almahbub International to begin a new chapter in its digital journey. Today we proudly present the next generation of your company. **HAMD Genesis**. Designed and Engineered with dedication by HAQQ TECH. May Allah bless your marriage, grant you barakah, tranquility, happiness and continued success in both your family and your business. Congratulations. |
| Button text | Enter the New Experience |
| Button link | Homepage/root route, resolved per surface |
| Status | Draft |
| Theme | `genesis-gold` (approved named theme) |
| Animation | `premium-celebration` with a reduced-motion variant |
| Effects | Gold/white confetti and subtle sparkles enabled; fireworks, balloons, and sound disabled by default |
| Glass effect | Standard, only when contrast passes accessibility validation |
| Frequency | Once per campaign |
| Dismissible | Yes, including Escape and accessible close control |
| Priority | 60; below legal/security/critical service notices |
| Audience | Must be explicitly approved; default recommendation is authenticated Client Workspace and optionally public Website, never Operations Console by default |
| Analytics | Enabled only under approved privacy/consent policy |

The template copy remains editable. Personal-event content must have the
subject’s explicit approval, a defined audience, a short finite duration, and a
clear expiry.

## 4. UI and interaction specification

### Presentation

When eligible, the surface applies a subtle backdrop dimming layer and presents
a centered premium modal. “Premium glass” is achieved through a named surface
token, controlled translucency, and a contrast-safe solid fallback-not
unbounded blur.

The modal contains:

1. clear event identity: title and subtitle;
2. readable message and optional rich description;
3. optional supporting asset with alt/caption strategy;
4. one primary CTA and an explicit close/dismiss path;
5. no more than one secondary text action;
6. accessibility semantics and visible focus.

No celebration may obscure a persistent emergency/help control or create a
keyboard trap.

### Default wedding interaction

- Backdrop fades in over 160–200ms.
- Modal enters with a restrained opacity/vertical transform over 220–280ms.
- Confetti begins after the modal becomes readable; gold/white particles use a
  bounded count and duration.
- Sparkles are minimal, peripheral, and do not pass behind or reduce text
  contrast.
- On “Enter the New Experience,” modal fades out immediately. Confetti may
  continue for no more than 400ms, then is removed before navigation/page
  transition completes.
- Escape, close button, or backdrop click dismisses only when campaign is
  dismissible. Backdrop click is disabled on desktop if it could be accidental;
  the close button remains available.

### Motion requirements

Framer Motion is the presentation library for frontend implementation, but all
motion remains optional. Use named presets, not component-specific ad hoc
animations:

- `none`
- `subtle-fade`
- `premium-celebration`
- `quiet-announcement`

`prefers-reduced-motion` and the user profile setting replace all particle,
sparkle, and transform effects with immediate/short opacity state change. Sound
is off for reduced motion and cannot auto-play without a prior user gesture.

### Accessibility

- `role="dialog"` or semantic equivalent, modal label/description, focus moved
  to the title or primary action, focus trapped only while open, and restored
  to invoking/previous element after close.
- Escape dismissal when dismissible. Visible close control with accessible name.
- Keyboard access to every control; no mouse-only effect.
- Minimum WCAG 2.2 AA contrast for text, controls, backdrop/fallback, and
  focus indicators. Glass/asset overlays cannot reduce contrast below target.
- Rich text is sanitized and semantically structured (headings, paragraphs,
  lists, links), not arbitrary styled markup.
- Images require alt text or explicit decorative designation. Video requires
  captions/transcript if it contains meaningful information and a poster image.
- Effects must not flash at seizure-triggering frequencies; no high-speed
  flashing, strobing, or full-screen fireworks. Audio is muted by default.

### Responsive and offline behavior

- Desktop: centered modal with restrained maximum readable width.
- Tablet: same hierarchy with adaptive padding.
- Mobile: bottom-safe or centered modal that fits the visual viewport, supports
  safe-area insets, keeps close/CTA reachable, and never requires pinch zoom.
- Offline: do not delay page use waiting for a campaign. Serve only cached,
  previously authorized static config if safe; otherwise omit celebration
  silently and retry delivery later. CTA links must have normal offline error
  feedback.
- Loading: no full-screen spinner for campaign eligibility. Page becomes usable
  first; eligible modal may appear after a short non-blocking resolution.
- Error: campaign asset/effect failure falls back to text-only modal; telemetry
  records the failure; user-facing page remains functional.

### Admin experience

The admin module belongs in Operations Console under Communications or Website
CMS, not as an isolated dashboard widget.

Views:

- **Celebration list:** status, schedule/time zone, audience summary, priority,
  author, approval, delivery summary, filters/search/sort/pagination.
- **Create/edit studio:** structured form with content, scheduling, audience,
  visual preset, asset, frequency, accessibility, review, and summary steps.
- **Preview:** presentation simulator with device/mode/motion controls and a
  non-production preview URL/token.
- **Review/publish:** validation report, audience estimate, priority conflict
  warning, approval decision, and publish/rollback actions.
- **Analytics/history:** trends and version/audit chronology.

Every view requires loading, empty, error, success, keyboard, reduced-motion,
validation, and clear feedback states under the HAMD quality checklist.

## 5. Database schema

Use UUID primary keys, UTC timestamps, audit fields, foreign-key constraints,
and indexes. This logical model is relational and applies whether the
implementation uses PostgreSQL/Prisma or a compatible enterprise database.

### `celebrations`

Core campaign record:

- `id` UUID primary key.
- `organization_scope_id` nullable UUID; null means platform/public scope.
- `slug` unique stable administrative identifier.
- `status` constrained enum.
- `priority` integer constrained 0–100.
- `start_at`, `end_at` timestamp with time zone; check `end_at > start_at`.
- `display_time_zone` IANA zone string.
- `frequency_policy` constrained enum.
- `dismissible` boolean.
- `analytics_enabled` boolean.
- `current_version_id` UUID foreign key to `celebration_versions`.
- `created_by_id`, `updated_by_id`, `approved_by_id` UUID foreign keys.
- `created_at`, `updated_at`, `approved_at`, `paused_at`, `cancelled_at`,
  `archived_at`.
- `cancellation_reason` nullable constrained/audited text.

Indexes: `(status, start_at, end_at)`, `(priority, status)`,
`(organization_scope_id, status)`, unique `slug`. Partial index for active
eligible records where supported.

### `celebration_versions`

Immutable content/configuration snapshot:

- `id` UUID primary key; `celebration_id` foreign key.
- `version_number` positive integer; unique `(celebration_id, version_number)`.
- localized `title`, `subtitle`, `message`, rich-text document, button label,
  link, and link policy.
- `theme_key`, `animation_preset`, `glass_level`.
- effect booleans: confetti, sparkles, fireworks, balloons, sound.
- image/video asset references and media metadata.
- `created_by_id`, `created_at`, `reviewed_by_id`, `reviewed_at`.
- `change_summary`, `content_hash`.

Rich content is stored as validated structured JSON/document model, not raw
HTML. Asset references use UUIDs and never untrusted URLs.

### `celebration_audience_rules`

One-to-many audience predicates:

- UUID primary key; `celebration_version_id` foreign key.
- surface enum: `public_website`, `client_workspace`, `operations_console`.
- subject type/value: authentication state, role, organization, user, country,
  corridor, locale, cohort.
- inclusion/exclusion operator and optional JSON rule payload constrained by a
  schema.
- `created_at`, `created_by_id`.

Index `(celebration_version_id, surface)` plus audience lookup indexes for
organization/user/role. Do not expose raw rule JSON to unauthorized clients.

### `celebration_assets`

Approved media catalog:

- UUID primary key; storage object key; media kind; MIME type; dimensions;
  duration; size; alt text/caption; poster asset; scan status; approval status;
  ownership/audit fields.
- Storage is private by default, delivered through signed/CDN-approved URLs.

### `celebration_deliveries`

Append-only eligibility/display history:

- UUID primary key; `celebration_id`, `version_id`, `user_id` nullable,
  `organization_id` nullable; surface; session/anonymous token hash.
- event type: eligible, displayed, dismissed, CTA clicked, completed,
  suppressed, render_failed.
- event time, reason code, non-sensitive device/context attributes, correlation
  ID.

Indexes: `(celebration_id, user_id, event_type, created_at)`,
`(celebration_id, anonymous_token_hash, event_type)`,
`(organization_id, created_at)`. Define retention and aggregation policy;
avoid retaining granular anonymous event data longer than required.

### `celebration_approvals` and `celebration_audit_events`

Approval records capture reviewer, decision, decision reason, policy version,
and timestamp. Audit events capture actor, action, before/after-safe metadata,
request/correlation ID, and immutable timestamp.

### Integrity and scalability rules

- Use transactionally consistent version promotion and approval/publish
  transitions.
- Enforce foreign keys and role/state constraints in service logic and database
  constraints where feasible.
- Use an outbox table/event stream for cache invalidation, scheduler updates,
  analytics projection, and notification-not synchronous fan-out in request
  paths.
- Partition/high-volume retention strategy for delivery events before public
  site scale requires it.

## 6. API design

All APIs use authentication/authorization, structured errors, request IDs,
schema validation, audit logging, rate limiting where applicable, pagination,
filtering/search/sorting for collections, and versioned documentation.

### Administrative APIs

| Method and route | Purpose |
| --- | --- |
| `GET /v1/celebrations` | Paginated/filterable/sortable list for authorized console users. |
| `POST /v1/celebrations` | Create draft; validates content, schedule, audience, and policy. |
| `GET /v1/celebrations/{id}` | Read campaign, versions, audience summary, approvals, and permitted analytics. |
| `PATCH /v1/celebrations/{id}` | Edit draft metadata or create a new version for published campaigns. |
| `POST /v1/celebrations/{id}/duplicate` | Duplicate into draft. |
| `POST /v1/celebrations/{id}/review` | Submit for review. |
| `POST /v1/celebrations/{id}/approve` | Publisher approval with separation-of-duties validation. |
| `POST /v1/celebrations/{id}/schedule` | Schedule approved campaign; validates conflict and exact time zone. |
| `POST /v1/celebrations/{id}/pause` | Immediate safe disable and cache invalidation. |
| `POST /v1/celebrations/{id}/cancel` | Cancel with required reason. |
| `POST /v1/celebrations/{id}/preview` | Create short-lived preview token/config; no delivery tracking. |
| `GET /v1/celebrations/{id}/analytics` | Aggregated metrics only, filtered by version/surface/time. |
| `GET /v1/celebrations/{id}/history` | Cursor-paginated audit/version/approval history. |
| `POST /v1/celebration-assets` | Authorized media upload initiation with strict MIME/size policy. |

### Delivery APIs

| Method and route | Purpose |
| --- | --- |
| `GET /v1/celebration-delivery?surface=...` | Returns at most one currently eligible, authorized, sanitized campaign config with opaque asset URLs and delivery token. |
| `POST /v1/celebration-delivery/{token}/events` | Records permitted display/dismiss/click/failure events using an idempotency key. |

The delivery route must accept authenticated context from the session/JWT; it
must not accept user role, organization, or entitlement claims directly from
the browser. Public delivery uses a carefully limited anonymous context and
rate-limited first-party token.

### Error contract

Return consistent machine-readable errors:

- `code`, `message`, `requestId`, `fieldErrors` where relevant, and safe
  remediation guidance.
- Expected examples: `CELEBRATION_SCHEDULE_INVALID`,
  `CELEBRATION_AUDIENCE_FORBIDDEN`, `CELEBRATION_APPROVAL_REQUIRED`,
  `CELEBRATION_FREQUENCY_EXHAUSTED`, `CELEBRATION_NOT_FOUND`,
  `ASSET_NOT_APPROVED`.

Never reveal hidden campaign IDs, audience conditions, or whether another user
received a campaign.

## 7. React component structure

This is an implementation structure, not source code.

### Shared feature package

- `CelebrationProvider`: resolves one eligible campaign after page usability
  and owns display state, frequency cache, and event reporting.
- `CelebrationGate`: checks route/workflow suppression and decides whether the
  provider may present.
- `CelebrationModal`: accessible dialog shell, focus management, backdrop,
  theme tokens, close/CTA behavior.
- `CelebrationContent`: title, rich text, CTA, safe link rendering, and media
  fallback.
- `CelebrationEffects`: lazy-loaded, bounded particle/effect renderer; never
  blocks modal content.
- `CelebrationMotion`: named Framer Motion variants and reduced-motion
  implementation.
- `CelebrationAnalytics`: batched/idempotent non-blocking event client.
- `useCelebrationEligibility`, `useCelebrationPreferences`,
  `useCelebrationDelivery`: typed data/behavior hooks.

### Surface adapters

- `PublicCelebrationSurface`: delays modal until critical page content is
  interactive; uses privacy-safe anonymous delivery behavior.
- `ClientWorkspaceCelebrationSurface`: resolves organization/user context,
  honors user accessibility preferences, and suppresses during critical
  workflows.
- `OperationsCelebrationSurface`: defaults to non-blocking banner/inbox
  delivery; modal only for explicitly approved low-risk contexts.

### Operations Console components

- `CelebrationList`, `CelebrationFilters`, `CelebrationStatusCell`,
  `CelebrationCreateEditStudio`, `CelebrationContentStep`,
  `CelebrationAudienceStep`, `CelebrationScheduleStep`,
  `CelebrationVisualStep`, `CelebrationReviewStep`, `CelebrationPreview`,
  `CelebrationApprovalPanel`, `CelebrationHistory`, and
  `CelebrationAnalyticsDashboard`.

All component states follow the HAMD quality checklist: loading, empty, error,
success, offline where relevant, validation, keyboard, responsive, dark mode,
i18n, and reduced motion.

## 8. Backend architecture

### Domain ownership

Celebration Engine is a bounded communications domain. It references Identity,
Organization, Roles, Asset/Document Storage, Notification Preferences, Audit,
Analytics, and Feature/Policy Configuration. It never owns user credentials,
payment state, or procurement workflow transitions.

### Services

- **Authoring service:** validates drafts, creates versions, manages review and
  approval state.
- **Eligibility service:** evaluates date/lifecycle/audience/safety/frequency/
  priority rules from trusted server context.
- **Delivery service:** produces sanitized presentation contracts and
  short-lived asset access.
- **Scheduler worker:** promotes/expires campaigns, invalidates caches, and
  emits events. Read-time checks remain authoritative.
- **Analytics projector:** transforms append-only delivery events into
  aggregated metrics.
- **Asset pipeline:** upload, virus scan, metadata extraction, transcode/poster
  generation, approval, and CDN delivery.
- **Policy service:** manages theme/effect presets, priority limits, protected
  routes, media policy, and retention.

### Caching and reliability

Cache only the resolved active campaign set/configuration with short TTL and
event-driven invalidation. Do not cache a user’s authorization decision across
role/organization changes without appropriate keying and expiry. Use
transactional outbox events for publish/pause/expire changes, idempotent
workers, dead-letter observability, and safe scheduler replays.

## 9. Security and privacy

- Enforce least-privilege RBAC plus separation of author and publisher for
  broad campaigns.
- Validate every field server-side; sanitize structured rich text; prohibit
  arbitrary HTML, scripts, inline styles, and untrusted embeds.
- Restrict external CTA URLs through allowlists, safe URL parsing, and
  `noopener` behavior. Internal routes use route identifiers where possible.
- Media uploads require signed upload flow, MIME/signature validation, size/
  duration limits, malware scan, transcode, content policy review, private
  storage, and signed delivery URLs.
- Protect delivery endpoint against enumeration, replay, cache poisoning, and
  audience spoofing. Public endpoints are rate-limited and return minimal
  data.
- Use CSP compatible with the approved effects/media strategy; do not weaken
  CSP for campaign content.
- Audit authoring, approval, scheduling, audience, deletion/cancellation,
  asset, and global-disable actions.
- Treat delivery analytics as behavioral data: minimize fields, use retention,
  respect cookie/analytics consent where required, and provide applicable
  privacy rights workflows.
- Provide emergency global disable, per-surface disable, and campaign kill
  switch independent of normal publishing workflow.

## 10. Testing strategy

### Unit and domain tests

- Lifecycle transitions, date boundaries, time-zone conversion, priority
  resolution, audience include/exclude rules, frequency rules, and suppression
  conditions.
- Validation of content, URLs, effects, media metadata, schedule duration, and
  approval separation.
- Version immutability, audit generation, idempotent event recording, and
  expiry behavior.

### API and integration tests

- Authentication, role/organization authorization, public anonymity limits,
  rate limits, structured errors, pagination/filter/search/sort, and audit.
- Concurrent schedule/pause/delivery race conditions.
- Scheduler retry and cache invalidation behavior.
- Asset scan/transcode failure, signed URL expiry, analytics aggregation, and
  third-party media failure.

### UI and accessibility tests

- Keyboard-only open/dismiss/CTA, focus trap/restore, screen-reader dialog
  labels, close semantics, contrast in light/dark themes, and rich text
  semantics.
- Reduced-motion, no-audio/autoplay, screen-size/safe-area, browser zoom,
  slow network, offline fallback, and text-only asset fallback.
- Verify no effect renders more than safe particle/frequency thresholds and no
  animation causes seizure-risk flashing.

### End-to-end and operational tests

- Draft → review → approve → schedule → active delivery → dismiss/CTA →
  expiry → history/analytics.
- Correct audience isolation across public, client, admin, role, organization,
  and anonymous visitor.
- Critical workflow suppression and later safe delivery.
- Load test public delivery/cache behavior and abuse test tracking endpoint.
- Security test rich-text XSS, URL injection, asset upload, authorization
  bypass, token replay, and analytics privacy.

## 11. Future enhancements

- Campaign templates and organization-approved brand themes.
- Locale-specific content/version fallback and translation workflow.
- A/B test only after privacy and product governance are established; never
  experiment on legal, payment, or critical service announcements.
- In-app celebration inbox/banner fallback for lower priority campaigns.
- Organization-level delegated campaign authoring with platform approval.
- Signed/verified corporate milestone badges or partner co-marketing templates.
- Calendar/event integration for approved internal-only events.
- AI-assisted copy suggestion with explicit source, review, and no automatic
  publication.
- Accessibility preview that automatically flags contrast, motion, missing alt
  text, missing captions, and unsafe rich-text structure before review.

## 12. Release criteria

The Celebration Engine is production-ready only when:

1. all authoring, review, scheduling, eligibility, delivery, pause, expiry,
   analytics, and audit workflows pass end-to-end;
2. no campaign can bypass audience, date, frequency, accessibility, or
   workflow-suppression policy;
3. the emergency kill switch is tested;
4. privacy, content, media, and retention policies are approved;
5. the reduced-motion and keyboard/screen-reader experience is independently
   verified;
6. public delivery performance does not delay core page usability; and
7. the wedding template remains an approved, editable configuration-not
   hard-coded application behavior.
