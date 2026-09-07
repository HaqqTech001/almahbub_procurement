# HAMD Procurement Platform Design Bible

**Owned by:** Almahbub International  
**Engineered by:** HAQQ TECH  
**Status:** Official design source of truth  
**Scope:** All product surfaces: marketing, buyer portal, operations, supplier
network, mobile, AI, communications, dashboards, documents, and future
integrations.

## How to use this document

This is a decision system, not a gallery of visual ideas. Every team should use
it to decide whether a screen, component, interaction, animation, or feature
feels like HAMD before it is built. When a local visual preference conflicts
with an accessibility, clarity, or consistency requirement in this document,
the requirement wins.

---

## 1. Brand philosophy

### Purpose

Establish HAMD as the trusted, calm, globally capable partner for international
procurement and logistics.

### Vision

Make cross-border procurement feel legible, controlled, and dependable for any
business, regardless of its procurement maturity.

### Mission

Give buyers and operations teams a single, intelligent workspace to request,
source, approve, pay for, communicate about, and track global procurement.

### Brand personality

HAMD is precise, calm, warm, accountable, and quietly confident. It speaks
like an experienced international operations partner: direct, informed,
respectful of uncertainty, and never theatrical.

### Emotional goals and user perception

- A first-time buyer should feel: “I understand what happens next.”
- A finance approver should feel: “This decision is controlled and evidenced.”
- A procurement officer should feel: “The system helps me run work, not
  duplicate it.”
- A delayed-shipment customer should feel: “Someone owns this problem and has
  told me what they know.”

The product must look premium because it is disciplined, not because it is
ornamental. Trust is earned through clear costs, visible ownership, precise
language, reliable records, and honest uncertainty.

### Brand values

1. **Trust before decoration:** business evidence is more valuable than visual
   novelty.
2. **Transparency with context:** expose the information users need to decide,
   including assumptions and risks.
3. **Global fluency:** respect currency, language, route, trade, time-zone,
   and document complexity without making the interface feel bureaucratic.
4. **Operational accountability:** every material event has an owner and next
   action.
5. **Human expertise, amplified:** automation and AI assist professionals;
   they do not hide responsibility.

**Common mistakes:** decorative luxury cues, absolute promises on variable
logistics events, excessive promotional language in operational surfaces, and
status labels without meaning or an owner.

**Enterprise recommendation:** require UX, content, operations, and legal
review for any customer-facing claim about cost, protection, delivery, customs,
or payment.

---

## 2. Design principles

### Trust before decoration

Purpose: make every important decision inspectable. Show money, ownership,
dates, source documents, assumptions, and risk in a stable hierarchy.

Reasoning: procurement users act on behalf of a business; a beautiful but
ambiguous interface increases commercial risk.

Best practice: lead quotes with total landed cost, validity, delivery range,
inclusions/exclusions, and decision action. Use visual polish to support
scanning, never to disguise uncertainty.

### Function before complexity

Purpose: reduce work before adding controls or options.

Reasoning: global procurement is inherently complex; the interface must absorb
complexity through progressive disclosure and sensible defaults.

Best practice: show a short summary and next action first; provide record
history, source data, and advanced controls on demand.

### Motion with purpose

Purpose: motion must explain a state change, preserve spatial context, or
confirm action.

Best practice: keep motion short, interruptible, and optional. Never animate
for decoration during urgent operations.

### Minimal cognitive load

Purpose: make a user’s next decision obvious.

Best practice: one primary action per context, grouped secondary actions,
consistent statuses, human-readable dates, and meaningful empty states.

### Accessibility first

Purpose: make HAMD fully usable regardless of ability, device, connection, or
input method.

Best practice: design keyboard, screen-reader, contrast, touch, and
reduced-motion behavior before visual embellishment.

### Consistency above creativity

Purpose: make the platform learnable across requests, quotes, payments, and
tracking.

Best practice: use a shared component and content pattern for the same concept
everywhere. Innovation belongs in workflows, not arbitrary component variants.

**Common mistakes:** introducing a new interaction pattern for every page,
overloading dashboards with equally prominent cards, and using color as the
only signal of status.

---

## 3. User psychology

### Landing page

Users should feel confidence, relevance, and orientation. Explain who HAMD is,
what it manages, supported procurement outcomes, and a low-friction next step.
Avoid marketplace-style urgency or inflated claims. The landing page should
create informed interest, not force a decision.

### Product browsing

Users should feel discovery without pressure. Procurement catalog content must
make availability, indicative pricing, lead time, MOQ, origin, and
specification confidence clear. When data is not guaranteed, label it as
indicative.

### Procurement requests

Users should feel guided and competent, even with incomplete technical
knowledge. Ask for essentials first; explain why additional data helps; save
progress automatically; acknowledge submission with owner, expected next
update, and a readable summary.

### Chat

Users should feel that communication is professional and connected to the
work. Conversation must answer questions in context, retain attachments and
decisions, and distinguish internal notes from buyer-visible messages.

### Order tracking

Users should feel informed, not falsely reassured. Emphasize current fact,
next expected event, ETA confidence, owner, and action required. In a delay,
say what changed, impact, action, and next update time.

### Payments

Users should feel protected and in control. Present amount, currency,
beneficiary, purpose, due date, payment status, and evidence clearly. Avoid
dark patterns, hidden fees, or ambiguous “paid” states.

### Dashboard

Users should feel prioritized, not overwhelmed. The dashboard begins with
items requiring attention, then trusted KPIs, then recent activity and
exploration.

### Support

Users should feel heard and routed. A support experience must preserve the
case history, give a named owner, acknowledge urgency, and state a next update
time.

---

## 4. Visual language

### Modern

Use intentional spacing, fast feedback, concise composition, responsive
behavior, and data visualization that serves decisions. Modern is not
synonymous with visual effects.

### Professional

Use disciplined alignment, stable layouts, accurate terminology, deliberate
data density, and reliable document presentation.

### Premium

Premium comes from typographic restraint, excellent empty/loading/error states,
quiet surfaces, generous breathing room where decision-making needs it, and
craft in details such as truncated text, date formatting, and transitions.

### Global

Design for long names, currency variation, localization, time zones, multiple
address formats, bidirectional-language readiness, and regional document
requirements. Never encode country assumptions into icon-only or fixed-width
interfaces.

### Minimal, reliable, elegant

Screens should use a strong hierarchy with one dominant purpose. Borders,
elevation, color, and motion are structural signals. Reliability is made
visible through timestamps, provenance, record history, and clear exception
states.

---

## 5. Color system

### Purpose and rationale

Color communicates hierarchy, action, semantic status, focus, and selected
state. It must never be the sole method of conveying meaning. Use a restrained
neutral foundation so operational data, alerts, and primary actions retain
salience.

### Core palette

The brand system uses a deep **Midnight Blue** primary family for trust and
global professionalism, with a precise **Azure** interaction accent. Green,
amber, red, and blue remain semantic colors-not brand decoration.

| Token family | Intended role | Light mode | Dark mode |
| --- | --- | --- | --- |
| Primary | primary actions, selected navigation, key links | deep midnight blue | luminous but restrained blue |
| Secondary | secondary emphasis and supporting brand surfaces | muted blue-gray | muted blue-gray |
| Neutral | typography, chrome, data density, inactive controls | neutral graphite scale | cool near-black scale |
| Success | confirmed, completed, healthy | deep accessible green | light accessible green |
| Warning | needs attention, expiring, at risk | deep amber | light amber |
| Danger | failed, blocked, destructive, overdue critical | deep red | light red |
| Information | factual notices, active tracking context | accessible blue | light blue |
| Background | page canvas | soft warm/cool off-white | deep charcoal |
| Surface | cards, panels, menus, dialogs | white or subtle neutral | elevated charcoal |
| Border | structure, not decoration | low-contrast neutral stroke | low-contrast light stroke |
| Hover | interactive feedback | subtle tinted neutral/primary | subtle light overlay |
| Disabled | unavailable controls | reduced-contrast neutral | reduced-contrast neutral |

### Semantic rules

- Success means a completed or positively verified business state, never merely
  “active.”
- Warning means attention is needed and must include a text label or icon.
- Danger means failure, destructive action, or a critical risk; reserve it.
- Information describes context, not a generic call to action.
- Status badges include text and, where useful, a small icon. Do not rely on
  color dots alone.

### Charts

Charts use a limited ordered categorical set and a separate semantic alert set.
Adjacent series must differ by luminance and pattern/label support, not hue
alone. Direct labels are preferred over distant legends. Negative values and
exceptions use semantic colors only when they truly represent negative states.

### Contrast requirements

- Normal text: minimum 4.5:1 against its background.
- Large text: minimum 3:1.
- Icons, borders that convey meaning, focus indicators, and interactive
  components: minimum 3:1.
- Primary action text and controls: minimum 4.5:1 where possible; never below
  applicable WCAG 2.2 AA requirements.
- Validate actual generated token pairs in both modes; do not assume a named
  color is accessible.

**Common mistakes:** using saturated color for entire cards, semantic color as
a decorative palette, low-contrast gray text, and a different color meaning
on each product surface.

---

## 6. Typography

### Purpose and choice

Use **Inter** as the primary interface typeface: highly legible, globally
available, numerically capable, and efficient at small UI sizes. Use the
system font stack as a robust fallback. Product marketing may use a licensed
display companion only when it maintains clarity and does not appear in
operational workflows.

Use tabular numerals for financial amounts, dates in dense tables, and
operational metrics. Avoid all-caps paragraphs and tracking-heavy labels.

### Type scale

| Style | Desktop size / line height | Usage |
| --- | --- | --- |
| Display | 40 / 48 | restrained marketing hero only |
| H1 | 28 / 36 | page title |
| H2 | 22 / 30 | major section |
| H3 | 18 / 26 | card/group heading |
| H4 | 16 / 24 | subsection/record section |
| Body | 14 / 22 | default application reading |
| Body compact | 13 / 20 | dense operational content |
| Label | 12 / 16 | field labels, metadata |
| Caption | 12 / 18 | supporting context and timestamps |
| Micro | 11 / 16 | rare table/meta use; never core instructions |

Buttons, navigation, and table headers use the body/label scale with a medium
or semibold weight rather than artificial capitalization. Use 400 for reading,
500 for labels and controls, 600 for hierarchy, and 700 sparingly.

Maximum readable text measure is roughly 65–75 characters for long-form copy.
Use line-height generously for explanatory text; tighten only for compact,
scan-oriented metadata.

**Enterprise recommendation:** financial values must align vertically and use
consistent locale-aware number/currency formatting. Never treat a money amount
as ordinary body copy.

---

## 7. Spacing system

### Purpose

An 8-point system creates rhythm, predictable density, and scalable component
composition.

### Scale

`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96`

Use 4 only for tightly related inline elements and 12 when 8 or 16 would feel
too compressed or loose. All other layout spacing derives from this scale.

### Application

- Page horizontal margin: 24–32 on desktop, 16–24 on tablet, 16 on mobile.
- Major page sections: 32–48; marketing sections: 64–96.
- Card padding: 16 compact, 24 standard, 32 for high-focus summary panels.
- Form fields: 16 vertical rhythm; 8 between label and input; 4 between input
  and help/error text.
- Table cell padding: 12–16 horizontal and 10–14 vertical according to
  density mode.
- Dialog content: 24–32; destructive dialogs favor space and readability over
  compactness.

**Common mistakes:** arbitrary pixel values, equal spacing between unrelated
groups, tight dialogs for high-consequence actions, and dashboard cards with
too much decorative whitespace.

---

## 8. Grid system

### Desktop

Use a 12-column grid, 24px gutters, and a responsive centered container.
Operational workspaces may use a full-width shell with persistent navigation
and a content area that respects comfortable reading widths.

### Tablet

Use an 8-column grid, 20–24px gutters, and collapse secondary side panels into
drawers or contextual routes.

### Mobile

Use a 4-column grid, 16px gutters, and one-handed action placement. Horizontal
tables become summaries with drill-down rather than scaled desktop tables.

### Breakpoints

- Mobile: under 640px
- Tablet: 640–1023px
- Desktop: 1024–1439px
- Wide desktop: 1440px and above

Max marketing content width: 1200–1280px. Max long-form reading width: 720px.
Use high-density operational layouts only where task frequency and user
expertise justify them.

---

## 9. Border radius

Radius conveys grouping and interaction, not personality.

| Token | Use |
| --- | --- |
| Small: 6px | inputs, compact controls, table-adjacent elements |
| Medium: 8px | standard buttons, cards, menus |
| Large: 12px | dialogs, prominent panels, media blocks |
| Pill: 999px | compact filters, tags, segmented controls only |

Floating elements use medium or large radius with subtle elevation. Avoid
excessively rounded enterprise tables, charts, or dense rows. Preserve shape
consistency inside a component family.

---

## 10. Shadow and elevation system

### Purpose

Elevation clarifies layering. It must never be used as a decorative haze.

| Level | Use |
| --- | --- |
| 0 | default page sections, tables, quiet cards |
| 1 | hoverable cards, sticky headers, anchored popovers |
| 2 | menus, comboboxes, contextual panels |
| 3 | dialogs and modal sheets |
| 4 | full-screen critical overlays only |

Use subtle, neutral, soft shadows paired with a structural border. Dark mode
uses reduced shadow reliance and clearer surface/luminance separation. Do not
stack shadows or use shadows to make every card appear clickable.

---

## 11. Glass effects

Glassmorphism is an exceptional atmospheric layer, not a system default.

Use it only for non-critical transient overlays on rich marketing imagery or
high-level ambient dashboards where text contrast remains guaranteed.

Never use glass effects for forms, tables, quotes, invoices, payment surfaces,
tracking data, navigation, error states, dense operational views, or any
surface requiring sustained reading. Blur reduces perceived clarity, can impair
performance, and weakens the platform’s evidence-led character.

---

## 12. Motion system

### Motion language

HAMD motion is quiet, direct, and physical enough to explain relationship. It
does not bounce, spin decoratively, or delay work.

### Timing and easing

- Immediate feedback: 100–150ms.
- Small component transitions: 150–200ms.
- Panels, menus, dialogs: 200–280ms.
- Page/content transition: 220–320ms.
- Complex progress/tracking motion: 300–500ms only when it communicates
  sequence.

Use a standard ease-out for entrance, ease-in for exit, and gentle
ease-in-out for state change. Avoid spring effects on business-critical
elements unless damped and extremely restrained.

### Rules by component

- **Pages:** fade/translate content minimally; preserve navigation stability.
- **Cards:** no ambient movement; hover may produce a subtle border/background
  response, not a dramatic lift.
- **Buttons:** immediate press feedback and loading state; never shift layout.
- **Tables:** animate row expansion/filter result change only when it preserves
  orientation; large data refreshes should announce change, not animate every
  row.
- **Charts:** reveal initial data once; update with short interpolation and
  clear values, not perpetual motion.
- **Tracking:** animate only the newly recorded milestone or route progression;
  do not animate a shipment map continuously.
- **Notifications:** enter briefly, remain stable, and never cover primary
  actions without a user-triggered expansion.
- **Dialogs/sidebar:** use directional transitions that explain origin.
- **AI assistant:** show deliberate thinking/progress states with plain
  language, not simulated human typing or uncertainty theater.
- **Loading:** use skeletons for layout continuity and determinate progress
  when duration/steps are known.

### Accessibility

Respect `prefers-reduced-motion`: replace movement with instant state change or
subtle opacity change. Never make motion the only way to perceive success,
error, focus, tracking progress, or new content. Allow users to pause
auto-updating data where necessary.

---

## 13. Iconography

Use a single modern outlined icon family with a consistent rounded stroke,
typically 1.75–2px. Default sizes are 16px for inline/dense UI, 20px for
standard controls, and 24px for touch-focused/mobile controls.

Icons clarify known actions; they do not replace labels for consequential
actions. Use filled icons only for selected/active state, high-salience
notification, or a carefully defined semantic system. Do not mix icon styles,
use novelty symbols, or invent ambiguous metaphors.

Every icon-only control requires an accessible name, tooltip where appropriate,
visible focus, and minimum touch target.

---

## 14. Illustration style

Illustrations should be editorial, sparse, geometric, and globally inclusive.
They may explain an onboarding concept, empty state, or marketing story but
must not compete with operational data.

Use restrained brand-adjacent color, clean composition, and realistic business
objects rather than generic “startup” characters. Avoid clichés such as
floating dashboard fragments, decorative globes, overexpressive characters, or
visuals that imply a guarantee HAMD cannot make.

---

## 15. Photography style

Photography conveys real operational credibility. Use authentic, well-lit,
editorial imagery with honest scale, diversity, and global context.

- **Hero banners:** confident people and legitimate international commerce
  environments; room for accessible overlay text.
- **Products:** clean, accurate, high-detail images on neutral surfaces with
  relevant scale/reference where useful.
- **Factories:** safety-conscious, orderly production with real equipment and
  people.
- **Ports/shipping:** real containers, vessel operations, freight movement, and
  documentation context; avoid generic stock imagery implying specific routes.
- **Warehouses:** organized inventory, scanning, packing, and quality checks.
- **Corporate teams:** candid collaboration and responsible operations, not
  staged handshake imagery.

Use captions where photographs could be mistaken for a supplier, shipment, or
facility associated with a specific customer transaction.

---

## 16. Accessibility

HAMD targets WCAG 2.2 AA as a release requirement.

- Full keyboard traversal, logical tab order, skip links, landmark regions,
  visible focus, and no keyboard traps.
- Semantic controls and headings; screen-reader announcements for async
  progress, form errors, notifications, and state changes.
- Minimum contrast requirements defined in the color system.
- 44 × 44px minimum touch target for touch controls; dense desktop controls
  must still have an accessible hit area.
- Error messages state what happened, why if known, and how to fix it. Errors
  are linked to fields and summarized for screen-reader/keyboard users.
- Reduced-motion behavior is mandatory.
- Tables need captions/summaries where complexity warrants, keyboard-accessible
  controls, and responsive alternatives.
- Test with automated tooling, keyboard-only users, screen readers, zoom/reflow
  to 200%, and representative disabled users.

**Common mistakes:** placeholder-only labels, inaccessible custom dropdowns,
focus hidden under sticky headers, low-contrast disabled text that contains
important information, and error color without explanatory copy.

---

## 17. Performance UX

Performance is part of trust. A sluggish quote, payment, or tracking screen
looks operationally unreliable.

- Use skeletons that mirror final layout only when content is genuinely
  expected shortly; do not use generic shimmering blocks for long operations.
- Use optimistic updates only for low-risk reversible actions such as
  preferences, read state, or draft metadata. Do not optimistically mark
  payments, approvals, quote acceptance, or shipment milestones as final.
- Use determinate progress for uploads, exports, document generation, and
  known multi-step processes. Explain background continuation and where users
  can find the result.
- Lazy-load non-critical routes, media, charts, and large document previews.
- Load product images progressively with defined dimensions to prevent layout
  shift.
- Use pagination for auditable operational data. Infinite scroll is appropriate
  for activity feeds and discovery only when users retain orientation and can
  return to a prior item.

---

## 18. Dashboard standards

### Cards and KPIs

Cards have a single purpose: an actionable metric, a focused record summary, or
a bounded workflow. Every KPI has label, value, comparison/time context when
relevant, source/definition availability, and a useful drill-down.

### Charts

Use charts only to expose trend, composition, distribution, or comparison that
a table cannot show faster. Always provide values, time range, filters, and a
tabular/accessible alternative.

### Tables, forms, filters, and search

Use tables for comparison and operational scanning; use forms for creation or
controlled editing; keep filters visible when they materially affect results.
Search must indicate scope and preserve filters. Bulk actions show selection
count, scope, consequences, and an undo/review path where possible.

### Status badges and widgets

Statuses are text-first, compact, and consistent across the product. Widgets
are configurable only when user benefit outweighs layout fragmentation; default
dashboards must remain coherent without setup.

---

## 19. Forms

Forms use a predictable label → control → help/error pattern. Labels remain
visible after entry. Required/optional conventions are consistent. Group fields
by user goal, not database structure.

- Inputs state expected format and unit/currency context.
- Dropdowns support search when option volume requires it; do not use a
  dropdown for a small exclusive choice that a segmented control or radio group
  explains better.
- File upload explains allowed types, size, purpose, processing, privacy, and
  completion state. Support drag/drop and keyboard upload.
- Validate inline when it helps, but do not accuse users of errors before they
  have finished a field. Validate on blur/submit according to risk.
- Preserve completed data after an error. Focus the first unresolved error on
  submission and offer a summary.
- Use success confirmation sparingly; a completed state or next action often
  communicates success better than a toast.
- Autosave drafts quietly with visible status and recovery behavior. Never
  autosave irreversible approvals or commercial commitments.

---

## 20. Tables

Tables are an enterprise workspace, not a mobile layout scaled down.

- Sorting shows current column and direction; use stable ordering and make
  default sort meaningful.
- Filters are structured, removable, shareable where appropriate, and clearly
  reflected in result count.
- Search is debounced, scoped, and can search natural record identifiers.
- Column resizing, reordering, visibility, and saved views belong to
  high-density professional tables; persist preferences by user/workspace.
- Bulk selection always states selected count and applies actions only to
  eligible rows, explaining exclusions.
- Pin identity/status columns when horizontal scanning is essential.
- On mobile, provide summary cards, key fields, filters, and detail routes;
  never force users to pan across a critical table without an alternative.

---

## 21. Empty states

An empty state explains the present condition and the most useful next action.
It should be specific, not generic.

- First-use: explain value and primary creation action.
- Filtered result: name the active filter condition and offer clear/reset
  action.
- Permission-limited: explain access boundary and route to the appropriate
  administrator without exposing restricted data.
- Temporary data delay: show a loading/retry state, not an empty state.

Use a small illustration only when it contributes meaning or warmth. Do not
celebrate an absence of business data with playful visuals.

---

## 22. Loading states

Loading behavior preserves context and sets expectation.

- Initial page: stable shell with skeleton content matching expected hierarchy.
- Button/action: preserve label context, disable duplicate submission, and
  show compact progress.
- Long task: show phase, estimated time only when reliable, backgrounding
  behavior, and where the final result will appear.
- Refresh: retain prior valid data, show freshness timestamp, and indicate
  refresh rather than blanking a dashboard.
- Failure to load: use an error state with retry and support context.

Avoid indefinite spinners without explanation, layout jumps, and skeletons
that conceal a permanent permission or server error.

---

## 23. Error states

Errors are friendly, professional, factual, and actionable.

Every error should answer:

1. What could not be completed?
2. What can the user do now?
3. Was any action saved or processed?
4. Is retry safe?
5. When should support be contacted, with what reference?

Use plain language: “We could not confirm this payment yet” is preferable to
“Transaction failed” when the system does not know failure is final. Destructive
or irreversible errors require explicit recovery/escalation paths.

---

## 24. AI experience

AI is an accountable assistant, not an autonomous authority. It should feel
helpful, confident within evidence, professional, and transparent about limits.

- State what the assistant can do: summarize, extract, draft, explain,
  recommend, and find records within the user’s authorization.
- Cite source records for recommendations, quote explanations, and operational
  summaries.
- Separate suggestion from execution. A user must review and explicitly
  authorize outgoing supplier/buyer messages, commercial terms, payment
  actions, and workflow transitions.
- Communicate uncertainty plainly; do not invent suppliers, prices, document
  contents, approvals, or shipment facts.
- Make it easy to correct, reject, report, and inspect AI output.
- Protect tenant boundaries, sensitive data, and internal notes; no cross-tenant
  retrieval or training use without an explicit governing policy.

**Common mistakes:** human-like typing theatrics, hidden AI actions, citations
that do not resolve to evidence, and confident answers without source data.

---

## 25. Chat experience

Chat is a professional conversation layer attached to a business record.

- One thread per request/order by default, with clear participants and context.
- Internal notes are visually and permission-wise distinct from external
  messages.
- Messages support structured requests, documents, mentions, read state, and
  searchable history.
- Use clear timestamps and sender identity; group messages only when it does
  not obscure accountability.
- Link formal decisions to their record rather than burying approval, quote, or
  payment state inside text.
- Allow notifications to be tuned, but preserve mandatory critical events.

Never use chat as the sole authoritative record for an approved commercial or
financial action.

---

## 26. Tracking experience

Tracking must prioritize certainty and action over visual maps.

- Lead with: current milestone, current location/context when known, latest ETA
  range, confidence, owner, and next expected event.
- Show a vertical timeline with completed, current, upcoming, and exception
  milestones. Each milestone exposes source, timestamp, evidence, and details.
- Shipment maps are optional supporting context; never use a map instead of
  accessible textual progress.
- Delays show changed fact, customer impact, action under way, required buyer
  action, and next update time.
- Completed deliveries show proof of delivery, related documents, and clear
  closure/issue-reporting path.

Avoid a falsely precise moving marker, vague “in transit” labels without
context, or celebratory completion before delivery evidence exists.

---

## 27. Product catalog

HAMD catalog design adapts modern ecommerce to business procurement.

- Search by product name, part number, attribute, synonym, category, and
  natural language intent.
- Filters reflect procurement decisions: category, origin, certification,
  supplier qualification, MOQs, indicative lead time, price band, and delivery
  relevance.
- Product pages prioritize specification, variants, documents, procurement
  constraints, indicative information, and “request sourcing” over impulse
  purchase behavior.
- Compare items in a structured, scannable specification table.
- Clearly differentiate catalog reference data, indicative prices, and
  negotiated quote terms.
- Support saved lists, repeat requests, project lists, and team sharing.

Do not mimic consumer ecommerce urgency, countdown deals, or misleading stock
claims when procurement availability is conditional.

---

## 28. Dark mode

Dark mode is a complete, first-class system-not inverted light mode.

Use deep neutral backgrounds with stepped surface elevation, high-quality
off-white text, restrained blue interaction color, and semantic tones retuned
for contrast. Reduce dependence on shadows; use surface separation and borders.
Images, charts, maps, documents, and logos require dark-mode review rather
than automatic inversion.

Maintain equal information hierarchy, focus visibility, semantic meaning, and
contrast in both modes. Respect system preference by default and retain a
user-controlled setting. Avoid pure black backgrounds, pure white body text,
neon accents, and large bright panels that cause visual fatigue.

---

## 29. Future expansion

The system scales through tokens, primitives, patterns, and governance:

1. **Foundation:** semantic color, type, spacing, radius, elevation, motion,
   icon, and accessibility tokens.
2. **Primitives:** buttons, inputs, overlays, navigation, feedback, layout,
   data display, and content building blocks.
3. **Domain patterns:** request intake, quote comparison, approvals, payment
   status, logistics timeline, exception handling, messaging, documents, and
   audit history.
4. **Product templates:** buyer, procurement officer, finance, logistics,
   supplier, and administrator workspaces.
5. **Governance:** component ownership, visual regression review, accessibility
   checks, usage analytics, deprecation policy, release notes, and a regular
   design-system council.

Future supplier portals, partner APIs, native mobile experiences, multi-language
markets, embedded analytics, AI workflows, and new logistics corridors must
extend semantic tokens and existing patterns before creating one-off variants.

### Enterprise design governance

- Maintain a component inventory with purpose, states, accessibility behavior,
  content rules, and approved variants.
- Require design review for new primitive components and semantic statuses.
- Test critical flows across light/dark mode, keyboard, screen reader, mobile,
  long localized strings, slow network, permission states, loading states, and
  failures.
- Treat design debt as product risk: duplicate patterns, ambiguous wording, and
  inaccessible behavior are not cosmetic defects.

## Final quality bar

A HAMD screen is complete only when it is visually coherent, accessible,
responsive, localized-ready, operationally truthful, performant, resilient to
loading/error/empty states, and clear about the user’s next action. Premium
quality is the absence of uncertainty caused by the interface.
