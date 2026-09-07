# HAMD Motion Design System

**Project:** HAMD Genesis  
**Purpose:** Official animation language for public, client, operations, AI, and
future mobile experiences.

## 1. Motion philosophy

HAMD motion communicates a meaningful change: where something came from, what
changed, whether work is progressing, and where attention should go next. It
must feel calm, fast, professional, and intentional.

Motion never:

- decorates an otherwise static screen;
- delays task completion;
- competes with a financial, procurement, support, or logistics decision;
- implies a guarantee, completion, or real-world movement that has not
  occurred;
- becomes the only way to perceive a state change.

The visual character is restrained confidence: brief easing, small distance,
low amplitude, no bouncy personality, no elastic overshoot in operational
work, and no continuous ambient movement outside a narrowly approved
celebration/illustration context.

## 2. Motion token system

### Duration

| Token | Duration | Use |
| --- | --- | --- |
| `instant` | 0ms | Reduced motion; direct state switch. |
| `micro` | 80ms | Press/toggle visual response. |
| `fast` | 120ms | Button, icon, hover, input feedback. |
| `standard` | 180ms | Small component enter/exit, row expansion. |
| `moderate` | 240ms | Menus, popovers, notifications, panels. |
| `emphasized` | 320ms | Dialog, drawer, page/content change. |
| `progress` | 400ms | Meaningful timeline/progress sequence. |
| `celebration` | 600ms max | Approved special campaign sequence only. |

No ordinary interaction should exceed 320ms. A long-running business operation
uses real progress/background task status, not a long decorative animation.

### Delay

Default delay is 0ms. Delay is allowed only to preserve sequence:

- 20–40ms: icon/label refinement after a parent action.
- 40–80ms: small stagger for a clearly related list of no more than six items.
- 80–120ms: a secondary panel after its parent establishes context.

Do not stagger tables, dashboards, search results, form fields, or critical
workflows. Delays make expert software feel slow.

### Easing

| Token | Curve | Meaning |
| --- | --- | --- |
| `out` | cubic-bezier(0.16, 1, 0.3, 1) | Entering/appearing; fast start, calm settle. |
| `in` | cubic-bezier(0.7, 0, 0.84, 0) | Leaving/disappearing. |
| `standard` | cubic-bezier(0.2, 0, 0, 1) | General state change. |
| `linear` | linear | Progress indicators only. |
| `soft` | cubic-bezier(0.22, 1, 0.36, 1) | Public editorial reveal; never critical operations. |

### Transform constraints

- **Opacity:** ordinary entrances use 0 → 1; avoid prolonged low-opacity text.
- **Scale:** 0.98 → 1 for dialogs/popovers; 0.99 → 1 for compact elements.
  Never use elastic growth for operational UI.
- **Translation:** 4–8px for small controls; 12–20px for panels/dialogs; 24px
  maximum for standard page content. Direction must match spatial origin.
- **Rotation:** prohibited for ordinary UI. Reserved for a loading indicator
  where rotation clearly expresses ongoing work; never spin an entire card/page.
- **Blur:** not used as ordinary entrance animation. Approved only for glass
  layer transitions with a solid contrast-safe fallback and strict performance
  budget.

### Spring values

Use springs sparingly. Default operational motion is duration/easing based.
Where a spring provides real direct-manipulation feedback:

- `gentle`: stiffness 320, damping 30, mass 0.8.
- `firm`: stiffness 420, damping 34, mass 0.7.

Both must settle without visible bounce/overshoot. Springs are prohibited for
danger/destructive actions, error states, finance, quote acceptance, shipment
exceptions, and table refreshes.

## 3. Global motion rules

- Animate only `transform` and `opacity` in normal interaction paths.
- Never animate layout properties such as width, height, top, left, margin, or
  box shadow continuously when a transform-based alternative exists.
- Do not animate more than one competing focal region at once.
- User-triggered feedback responds within 100ms even if a longer state
  transition follows.
- Interruption is respected: close/route change immediately cancels or safely
  completes a visual transition.
- Animate state, not data volume. A 100-row refresh must not animate 100 rows.
- Every animation has an instant/reduced-motion equivalent.

## 4. Framer Motion implementation specification

Framer Motion is the approved web motion library. Implementations use a shared
motion-token layer and named variants; they do not define arbitrary per-page
durations/easing.

### Required shared behavior

- A central motion preference resolves system `prefers-reduced-motion` and
  explicit user accessibility preference.
- Named variants correspond to documented patterns: `fade`, `fadeUp`,
  `scaleIn`, `panelFromRight`, `sheetFromBottom`, `collapse`, `statusChange`,
  `quietAttention`, and `celebration`.
- Presence handling keeps exit motion short and avoids route/page blocking.
- Layout animation is used only for small, local relationship changes and must
  be tested with dynamic content, virtualized lists, and reduced motion.
- Gesture animation is limited to clear touch/direct manipulation behavior;
  hover cannot be the only discoverable affordance.

### Default variant semantics

- `fade`: opacity only, 120–180ms. Use for content refresh/non-spatial change.
- `fadeUp`: opacity plus 8–16px upward settle, 180–240ms. Use for a bounded
  panel entering its page context.
- `scaleIn`: opacity plus 0.98 → 1, 180–240ms. Use for popovers/dialogs.
- `panelFromRight`: 16–20px horizontal translation, 240–320ms. Use for
  contextual desktop side panels.
- `sheetFromBottom`: 16–24px vertical translation, 240–320ms. Use for mobile
  sheets.
- `collapse`: opacity and transform/controlled measured height only for small,
  user-triggered disclosure.
- `statusChange`: brief opacity transition plus non-motion textual/semantic
  update; never color-only.
- `quietAttention`: one low-amplitude emphasis response, not a repeating pulse.
- `celebration`: strictly scoped high-quality campaign preset with particle
  effects lazy-loaded and disabled/reduced by preference.

## 5. Experience standards by surface

### Hover

Purpose: confirm interactivity without inventing discovery.

- Duration: `fast` (120ms) with `standard` easing; delay 0ms.
- Change border, background, or text tone; optional 1–2px lift only on clearly
  clickable marketing/product cards.
- Operational work surfaces prefer tone/border over lift.
- Hover must never be the only path to menus, actions, or critical controls.

### Focus

Purpose: make keyboard and assistive navigation unmistakable.

- Focus ring appears within `fast` (120ms); visibility is mandatory.
- Focus treatment is stronger than hover and survives without a pointer.
- Do not animate the ring away while the element remains focused.
- Dialogs, drawers, wizards, and error summaries must move focus intentionally
  and return it on dismiss.

### Landing page and hero

Purpose: establish hierarchy and confidence without delaying comprehension.

- Hero text may use one `fadeUp` sequence, maximum two content groups, 240ms
  with 40ms sequence spacing.
- Image/media may fade independently; no continuous parallax or scroll-jacking.
- Primary CTA has standard press/focus feedback only.
- Below-the-fold sections enter naturally on scroll; avoid “every section
  fades in” patterns that make the site feel staged and harm performance.

### Buttons

Purpose: confirm intent and processing state.

- Press: `micro` (80ms) transform/opacity feedback, scale about 0.99 → 1; no
  bounce.
- Loading: label remains meaningful; compact spinner/progress appears without
  shifting button width; no indefinite animated success after action.
- Success/error: status is announced and persists as text/state, not merely
  a checkmark animation.

### Cards and product cards

Purpose: clarify hover/selection, not simulate physical objects.

- Hover/focus-within: 120–180ms surface/border change; optional 1–2px transform
  only on clearly clickable marketing/product cards.
- Operational cards: no lift by default; use durable focus/selection state.
- Never stagger card grids on load.
- Product-gallery image transition uses fade only, 180ms; preserve image
  dimensions to avoid layout shift.

### Tables

Purpose: keep dense data calm and scannable.

- Selection, sort, and filter application are instant or near-instant.
- Row expand/collapse uses `standard` (180ms); collapse exits slightly faster.
- Refresh replaces the content region once; never stagger rows, cells, or money
  columns.
- Virtualized lists must not animate virtualization mechanics.
- Animate state of a row (selected/expanded), not data volume.

### Dialogs

Purpose: establish a focused layer and clear origin.

- Backdrop opacity: 160–200ms.
- Dialog enter: opacity 0 → 1 + scale 0.98 → 1 (`emphasized`, 240–320ms).
- Exit: 180–240ms, no slower than entrance.
- Trap focus; Escape cancels immediately; reduced motion uses instant state.
- Do not chain modals; replace content or use a route/step within one dialog.

### Drawers

Purpose: preserve spatial context for secondary work.

- Enter from the owning edge with 12–20px translation + opacity
  (`moderate`–`emphasized`, 240–320ms).
- Mobile uses the same rules as a bottom sheet (`sheetFromBottom`).
- Do not animate width/height continuously; lock underlying page scroll.
- Closing must feel immediate and restore focus to the trigger.

### Navigation

Purpose: orient without theatrical chrome.

- Active item indicator moves or fades in 120–180ms; never bounce.
- Desktop sidebar collapse uses transform/opacity; avoid layout thrash that
  impairs reading.
- Mobile navigation uses a sheet/drawer.
- Route change is content transition, not logo or brand animation.

### Page transition

Purpose: continuity between related views.

- Keep shared application shell/nav stable.
- Route content may use a 180–320ms fade/fadeUp if content relationship is
  clear; incoming content uses ≤12px vertical continuity when hierarchy changes.
- Direct deep links must feel immediate.
- No full-page slides.
- Use no page transitions between tightly linked operations such as approving a
  quote or confirming a payment; update the record in place.

### Loading

Purpose: explain wait without masking failure.

- Skeleton matches final layout; shimmer is optional, low-contrast, and disabled
  under reduced motion.
- Known measurable work: determinate progress with phase/percentage.
- Unknown work: local indeterminate indicator plus meaningful label.
- Background work: immediate confirmation, stable task status, notification on
  completion.
- Loading motion never delays error surfacing.

### Success

Purpose: confirm completed work after truth exists.

- Low-risk local actions: toast or inline status in 120–180ms after server truth.
- Approvals, finance, shipment, and destructive outcomes: durable confirmation
  in record/inbox/history - never toast-only.
- No confetti, bounce, or celebration in operational workflows.
- Celebration (`600ms` max) is reserved for approved public/campaign sequences.

### Errors

Purpose: correct without alarm theatre.

- Instant or 120ms appearance; focus moves to error summary then first invalid
  field.
- Retain entered data; identify recovery path in text.
- Never shake, strobe, vibrate, or pulse as the sole cue.
- Pair color with icon/text; motion is optional and brief.

### Notifications

Purpose: deliver attention without chaos.

- Toast: enters from nearest logical edge in 180–240ms; no bounce; pause on
  hover/focus; dismissible.
- Stacked toasts: max 0–40ms stagger; rate-limit volume.
- Inbox items appear without push-down animation storms.
- Critical notices persist until acknowledged.
- Approvals and payment outcomes are never toast-only.

### Product gallery

Purpose: inspect products without autoplay distraction.

- Image fade after decode, 120–180ms; preserve reserved aspect ratio.
- Thumbnail selection updates the main image; no autoplay carousel.
- Manual swipe may use firm non-bouncy spring for direct manipulation only.
- Reduced motion: instant image swap; full keyboard controls required.
- Zoom opens a focused viewer with static/reduced-motion fallback.

### Search

Purpose: keep results stable while queries update.

- Query debounce is 150–250ms on the request, not on decorative UI.
- Suggestion/results panel opens once (`moderate`); results replace without
  per-item stagger.
- Preserve prior results until new results are ready when possible.
- Cancel stale requests; clear/collapse is quick (120–180ms).

### Wizard

Purpose: step progress without carousel theatre.

- Step content crossfades in 180–240ms; no horizontal page travel between steps.
- Progress indicator and step labels update instantly or with `statusChange`.
- Focus moves to the new step heading after transition.
- Autosave feedback is subtle status text, not repeated toasts.
- Back/forward must not trap unfinished motion; reduced motion is instant swap.
- Validation errors use the standard error rules; do not animate the user
  “back” with bounce.

### Forms

Purpose: guide input and validation.

- Label/help/error changes use instant or 120ms opacity; no animated
  cursor/placeholder theatrics.
- Conditional field groups use `collapse` only after user action and preserve
  focus/order.
- Submit failure moves focus to error summary; no screen shake.
- Autosave uses subtle status text transition, not repeated animated toasts.

### Dropdowns and menus

- Dropdown/combobox: `scaleIn`, 180–240ms, anchored to trigger; close faster
  at 120–180ms.
- Menus follow the same open/close budget; hover cannot be the only open path.

### Timeline

Purpose: make progress and exception state understandable.

- New confirmed milestone uses a single ≤240ms `statusChange`.
- Connector growth is allowed only for meaningful confirmed progress.
- Current position can receive one `quietAttention` response after update.
- No continuously moving shipment marker, fake map vehicle animation, looping
  cargo/globe decoration, or spinning route path.
- Delays update the timeline/ETA text and use semantic state plus message;
  animation is subordinate to the explanation. Map never replaces status.

### Charts

Purpose: reveal a decision, not decorate a dashboard.

- Initial draw optional and short (0–240ms); prefer discrete redraw on update
  over morphing large datasets.
- Avoid bar-by-bar or point-by-point animation on dense series.
- Always provide an accessible data table or textual summary.
- No animated vanity counters for revenue, SLA, risk, money due, payment
  status, or quote totals.
- Reduced motion: static render and text update.

### Dashboard

Purpose: prioritize attention queue over widget choreography.

- Widgets load independently; skeletons preserve layout.
- After load, content may fade once over 0–180ms.
- Optional ≤40ms stagger only for ≤4 related KPI cards on first paint.
- Attention/exception queue appears before decorative charts.
- Never count-up operational KPIs; never run simultaneous widget choreography.
- Refresh updates the affected widget region once.

### AI assistant

- AI shows a clear processing state with bounded neutral indicator and plain
  text such as “Reviewing your request context.”
- Do not simulate human typing word-by-word. Stream results responsibly with
  stable layout and an immediate stop action.
- Citations, errors, tool activity, and approval-required actions appear as
  clear state transitions, not visual theater.

## 6. Loading motion

Use the least animated pattern that explains loading:

- **Known short load:** static/skeleton layout with subtle non-looping
  luminance change only if needed.
- **Known measurable work:** determinate progress with phase/percentage.
- **Background task:** immediate confirmation, stable task status, notification
  on completion.
- **Indeterminate work:** concise spinner only in the local region, with a
  meaningful label for long waits.

Shimmer is not default. Fast shimmer can be visually fatiguing and expensive;
if used, it is low-contrast, slow, and disabled for reduced motion.

## 7. Accessibility and reduced motion

### Required behavior

- Honor `prefers-reduced-motion` and user preference globally.
- Reduced mode changes entrance/exit to instant or 80–120ms opacity only; it
  removes translation, scaling, particle effects, continuous loops, animated
  charts, and decorative effects.
- Do not auto-play audio. Sound must require explicit user gesture and remain
  independently controllable.
- Never use flashing above safe seizure thresholds. Avoid strobe, blinking
  status, repeated pulsing, and rapid color alternation.
- Motion cannot be the sole indicator of success, error, current tracking
  state, focus, or notification.
- Announce meaningful dynamic state through semantic labels/live regions,
  calibrated to avoid excessive screen-reader interruption.

## 8. Performance and GPU recommendations

- Prefer `transform` and `opacity`; these are most likely to remain on the
  compositor path.
- Do not animate `filter`, large `backdrop-filter`, `box-shadow`, `width`,
  `height`, `top`, `left`, `margin`, or expensive SVG path changes on frequent
  interaction paths.
- Use `will-change` only immediately before a known transition and remove it
  afterward; blanket use consumes memory and can reduce performance.
- Lazy-load celebration particles, large gallery viewer, complex chart motion,
  and non-critical media. Core pages remain interactive without them.
- Bound particle count, effect duration, simultaneous animated nodes, and image
  size. Pause nonessential effects on hidden tabs or when the document is not
  visible.
- Test low-end mobile, battery-saver, slow CPU/network, large table/chart
  datasets, and browser zoom. Motion must not cause dropped input, scroll
  jank, or cumulative layout shift.
- Use browser performance profiling and real-user metrics. If animation harms
  interaction latency or page responsiveness, remove it.

## 9. Best practices

- Begin from user intent and state transition, not an animation idea.
- Use named presets; document exception cases before introducing a new one.
- Make entering and leaving motion symmetric in purpose but exit slightly
  faster.
- Preserve spatial context: panel motion follows its trigger/origin.
- Keep movement small, avoid overlap, and let text become readable quickly.
- Test with long localized text, errors, async updates, keyboard use, and
  screen-reader operation.
- Pair every visual change with textual/semantic state where it matters.

## 10. Common mistakes

- Fading/staggering every screen element.
- Bouncy spring buttons, shaking inputs, confetti for ordinary success, or
  spinning cards.
- Animated counters for money, price, payment, or legal status.
- Long skeleton shimmers that mask errors.
- Continuous map/tracking movement that implies real-world precision.
- Page transitions that delay direct operational actions.
- Motion defined inside individual feature components without token governance.
- Ignoring animation cancellation on route change, error, or user preference.

## 11. Enterprise motion governance

- Motion tokens and presets are versioned design-system assets.
- New motion requires documented purpose, duration/easing, reduced alternative,
  performance profile, and accessibility review.
- Product/design/engineering review high-attention effects, celebrations,
  public hero animation, and AI activity states.
- Include visual regression and reduced-motion tests in component release
  criteria.
- Instrument only performance/error metrics needed to detect motion harm; do
  not collect unnecessary behavioral data.

## Final motion quality bar

A HAMD animation is approved only if removing it would reduce comprehension,
orientation, feedback, or confidence. If it merely makes a screen look busy,
it does not belong in the product.
