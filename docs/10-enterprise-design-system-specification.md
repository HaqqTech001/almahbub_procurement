# HAMD Enterprise Design System

**Project:** HAMD Genesis  
**Public brand:** Almahbub International  
**Powered by:** HAQQ TECH  
**Status:** Implementation-facing design-system source of truth  
**Applies to:** Public Website, Client Workspace, Operations Console, AI
Assistant, and future mobile applications.

## 1. Design philosophy

### Premium interfaces create trust through discipline

Users trust a premium enterprise interface when its behavior is predictable, its
information is legible, and it handles uncertainty honestly. In procurement,
visual polish without operational clarity is actively harmful: the user is
making commercial, financial, and delivery decisions.

HAMD therefore earns premium perception through:

- stable hierarchy and controlled density;
- clear current status, owner, evidence, and next action;
- excellent typography and numerical legibility;
- polished loading, empty, error, and exceptional states;
- responsive, accessible, fast behavior on real devices and networks;
- small, intentional visual and motion details.

### Whitespace protects decisions

Whitespace separates unrelated information, establishes reading rhythm, and
makes high-consequence actions easier to identify. It is not empty decoration.
In operational contexts, whitespace must support scanning rather than make
tables or queues wasteful. Use more space around a decision; use compact,
consistent rhythm inside repeated data.

### Consistency reduces training cost

Users should learn the meaning of a status, table filter, primary action,
approval, document, or error once. Reusing patterns lowers cognitive load,
improves accessibility, reduces bugs, and lets teams ship faster. A visually
novel local pattern is rejected unless it materially improves a validated user
outcome.

### Motion communicates state

Motion may show entry/exit, parent-child relationship, progress, spatial
continuity, confirmation, or attention change. It never exists merely to make a
screen look active. It must be short, interruptible, performance-safe, and
replaced by an accessible non-motion equivalent.

### Typography leads color

Typography organizes meaning continuously across every screen; color should
reinforce hierarchy and semantic state, not carry the entire burden. A screen
must remain understandable in grayscale, reduced contrast environments, and
with color-vision differences.

### Hierarchy reduces cognitive load

Every screen follows the HAMD three-question rule:

1. Where am I?
2. What can I do?
3. What should I do next?

Page title/context, current state, primary action, and next action appear before
secondary metadata, visual decoration, or deep configuration.

---

## 2. Color system

### Color intent

HAMD uses a deep navy trust foundation, an accessible blue interaction accent,
and restrained semantic colors. Gold is reserved for brand moments and approved
celebrations; it is not a primary interactive or operational status color.

All color values below are design-token values, not component-specific
exceptions. A component consumes semantic tokens such as `action.primary` or
`status.warning`, never an arbitrary palette value.

### Light mode core tokens

| Token | Value | Usage and rationale |
| --- | --- | --- |
| Brand primary 900 | `#0B1F3A` | Trust anchor, primary dark brand surface, high-emphasis navigation. |
| Brand primary 700 | `#123B66` | Primary action hover/strong link. |
| Brand primary 600 | `#155AAF` | Primary interactive control and accessible link color on light surface. |
| Brand primary 100 | `#E8F1FB` | Selected/quiet informational surface. |
| Accent gold 700 | `#8A6415` | Approved celebratory/brand accent with dark-text contexts only. |
| Accent gold 100 | `#FBF3DD` | Sparse celebration/recognition surface. |
| Neutral 950 | `#101828` | Primary text. |
| Neutral 700 | `#344054` | Secondary text. |
| Neutral 500 | `#667085` | Tertiary text/metadata; not for essential instructions below contrast target. |
| Neutral 300 | `#D0D5DD` | Structural border. |
| Neutral 200 | `#EAECF0` | Soft divider/quiet fill. |
| Neutral 100 | `#F2F4F7` | Hover/secondary surface. |
| Neutral 50 | `#F9FAFB` | Page canvas/subtle background. |
| Surface base | `#FFFFFF` | Primary content surface. |
| Success 700 | `#067647` | Confirmed/completed state. |
| Success 100 | `#D1FADF` | Quiet success surface. |
| Warning 700 | `#9A6700` | Attention/expiry/risk state. |
| Warning 100 | `#FEF0C7` | Quiet warning surface. |
| Danger 700 | `#B42318` | Failure/block/destructive action. |
| Danger 100 | `#FEE4E2` | Quiet danger surface. |
| Information 700 | `#175CD3` | Contextual information. |
| Information 100 | `#D1E9FF` | Quiet information surface. |

### Dark mode core tokens

| Token | Value | Usage and rationale |
| --- | --- | --- |
| Background canvas | `#101828` | Main dark canvas; avoid pure black fatigue. |
| Surface base | `#182230` | Standard card/panel surface. |
| Surface raised | `#1D2939` | Menu, dialog, and elevated panel. |
| Surface selected | `#123B66` | Selected navigation/quiet active state. |
| Text primary | `#F9FAFB` | Primary reading text. |
| Text secondary | `#D0D5DD` | Supporting text. |
| Text tertiary | `#98A2B3` | Metadata only where contrast is sufficient. |
| Border | `#344054` | Structural separation. |
| Action primary | `#53B1FD` | Interactive blue tuned for dark surfaces. |
| Action primary hover | `#84CAFF` | Hover/focus visual reinforcement. |
| Success | `#6CE9A6` | Accessible dark semantic success. |
| Warning | `#FEC84B` | Accessible dark semantic warning. |
| Danger | `#FDA29B` | Accessible dark semantic danger. |
| Information | `#84CAFF` | Accessible dark information. |

### Semantic state and interaction tokens

- **Primary:** explicit primary actions, active navigation, selected tab/filter,
  and strong links. One primary action per local context.
- **Secondary:** neutral secondary buttons and structural emphasis; never a
  second competing primary color.
- **Hover:** subtle background/border/luminance change plus pointer/keyboard
  feedback. Hover is never the only disclosure mechanism.
- **Active/pressed:** slightly darker/lower-luminance action surface and no
  layout shift.
- **Disabled:** low-emphasis surface/text while preserving 3:1 contrast for
  controls containing necessary information; disabled controls include a reason
  when the user can resolve it.
- **Borders:** structural token only. Do not use colorful borders as decoration.

### Charts

Use a limited ordered data palette: navy, blue, teal, violet, amber, and slate,
validated for adjacent luminance distinction. Semantic success/warning/danger
colors are reserved for actual status, target variance, or risk-not ordinary
series. Direct labels and accessible tables accompany charts. Every chart has a
title, unit, date range, source/definition, visible values on interaction, and
non-color differentiation where categories matter.

### Accessibility rule

- Normal text requires 4.5:1 contrast; large text requires 3:1.
- Interactive boundaries, focus indicators, meaningful icons, and chart
  distinctions require at least 3:1.
- Primary buttons target 4.5:1 text contrast in normal use.
- Verify token pairs in actual composition; alpha/translucency/glass/imagery
  can invalidate a nominal contrast result.

---

## 3. Typography

### Type family and numerical standard

Use **Inter** for product UI because it is legible at compact sizes, strong for
data density, globally practical, and stable across platforms. Use system
fallbacks when unavailable. Use tabular figures for money, quantities, dates,
tracking IDs, and table metrics. Marketing display typography may use an
approved licensed companion only outside core operational interfaces.

### Type scale

| Style | Size / line height / weight | Use |
| --- | --- | --- |
| Display XL | 48 / 56 / 600 | Restrained campaign hero only. |
| Display L | 40 / 48 / 600 | Major public hero. |
| Display M | 32 / 40 / 600 | Public feature/marketing section. |
| H1 | 28 / 36 / 600 | Product page title. |
| H2 | 24 / 32 / 600 | Major workspace section. |
| H3 | 20 / 28 / 600 | Record/detail section. |
| H4 | 18 / 26 / 600 | Card/group heading. |
| Body large | 16 / 26 / 400 | Explanatory content. |
| Body | 14 / 22 / 400 | Default application reading. |
| Small | 13 / 20 / 400 | Dense supporting content. |
| Caption | 12 / 18 / 400 | Metadata, timestamps, help. |
| Micro | 11 / 16 / 500 | Rare dense data only; never sole instructions. |
| Button | 14 / 20 / 500 | Buttons and durable actions. |
| Label | 12 / 16 / 500 | Form labels/status labels. |
| Navigation | 14 / 20 / 500 | Primary navigation. |
| Table body | 13 / 20 / 400 | Operational rows. |
| Table header | 12 / 16 / 600 | Sortable table headings. |

Use 400 for reading, 500 for labels/actions, 600 for hierarchy, and 700 only
for exceptional emphasis. Avoid all-capital body content. Do not use text
smaller than 12px for required instructions; micro is reserved for compact
metadata with accessible alternative context.

### Readability rules

- Long-form content maximum measure: 65–75 characters.
- Maintain 8px minimum separation between label and input and 4px between
  field and help/error text.
- Do not use truncation for unique IDs, money, critical status, or primary
  action labels without a discoverable full value.
- Currency uses locale-aware formatting, currency code where ambiguity is
  possible, and tabular alignment in financial views.

---

## 4. Spacing system

The spacing scale is `4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96`.
Use only these values unless a component's optical correction is explicitly
documented.

| Value | Primary use |
| --- | --- |
| 4 | icon-to-label, compact inline metadata, validation micro-gap. |
| 8 | control label-to-field, tightly related inline actions. |
| 12 | compact list item groups, table-cell rhythm, related controls. |
| 16 | default mobile/page padding, standard form rhythm, compact cards. |
| 20 | form subsection or medium control group. |
| 24 | standard card/dialog padding, desktop page inset, related section group. |
| 32 | page section separation, major card padding, desktop content grouping. |
| 40 | prominent record/feature separation. |
| 48 | major dashboard/public page section separation. |
| 56 | public transition spacing where editorial rhythm is needed. |
| 64 | large public section and hero internal spacing. |
| 80 | major marketing break; never inside a dense workspace. |
| 96 | large hero/public canvas separation only. |

Use whitespace to group related content and separate decisions. Do not make
every dashboard card spacious; operational density is a user-experience
requirement for frequent expert work.

---

## 5. Shape, border radius, and elevation

### Radius

| Token | Value | Use |
| --- | --- | --- |
| XS | 2px | data chips/internal indicators only. |
| SM | 4px | compact table controls, small input sub-elements. |
| MD | 6px | standard inputs, buttons, tags. |
| LG | 8px | standard cards, menus, popovers. |
| XL | 12px | dialogs, prominent panels, media containers. |
| 2XL | 16px | large public feature surfaces only. |
| Pill | 999px | compact status/filter/segmented controls only. |
| Circular | 50% | avatars, icon-only circular controls. |

Avoid excessive rounding in dense enterprise views. Shape signals component
family and should not become decoration.

### Elevation

| Level | Use | Why |
| --- | --- | --- |
| 0 | tables, page sections, quiet cards | Keeps reading surfaces stable. |
| 1 | hoverable cards, sticky bars | Indicates limited lift without visual noise. |
| 2 | menus, select popovers, drawers | Separates temporary interaction layer. |
| 3 | dialogs and modal sheets | Establishes explicit focus layer. |
| 4 | critical full-screen overlays | Reserved for rare interruption. |

Use a subtle neutral shadow plus structural border. Dark mode relies more on
surface steps/borders than heavy shadows. Floating action buttons, dropdowns,
tooltips, dialogs, and temporary navigation use the elevation appropriate to
their layer; ordinary cards do not all receive elevation.

---

## 6. Glassmorphism

Glass may be used in an approved marketing/celebration overlay, transient
media-backed hero overlay, or low-information floating preview where a solid
fallback preserves contrast. It communicates temporary layering, not “premium”
by default.

Never use glass for:

- quote, payment, invoice, approval, tracking, table, form, error, or support
  surfaces;
- dense operational sidebars, navigation, or AI answer content;
- backgrounds behind sustained reading;
- components whose contrast depends on unknown user-uploaded imagery.

The fallback must be a solid semantic surface. Blur is performance-budgeted and
disabled/reduced on constrained devices and reduced-transparency preferences
where supported.

---

## 7. Component standards

### Interaction primitives

| Component | Standard and reason |
| --- | --- |
| Buttons | Primary, secondary, tertiary/ghost, destructive, and loading states. One primary action per local context. Use explicit label plus optional leading icon; never icon-only for consequential actions. |
| Inputs | Persistent label, help text, required/optional convention, unit/format context, inline validation, error summary relation, autocomplete semantics, and preserved entered value on failure. |
| Dropdowns / comboboxes | Use select for short fixed choices; searchable combobox for large known sets; keyboard navigation, async loading, empty/error states, and no custom inaccessible listboxes. |
| Search | Explicit scope, debounce, accessible results count, recent/saved options when useful, and clear no-results recovery. |
| Tags and badges | Text-first semantic status or compact filter entity; never use color-only dots. Tags are removable only with keyboard-accessible explicit control. |
| Avatars | Person/organization identity with initials fallback, accessible name, and no reliance on photo alone. |
| Alerts | Contextual, persistent until understood or resolved; state the fact, impact, action, and owner where relevant. |
| Notifications | Actionable, deduplicated, grouped by importance; critical events are not hidden in transient toasts. |

### Content and data components

| Component | Standard and reason |
| --- | --- |
| Cards | One bounded purpose: KPI, record summary, action, or contained workflow. Avoid “card walls.” Card titles are concise; cards do not replace page hierarchy. |
| Product cards | Product image/specification, origin/compliance/lead-time context, indicative status, save/compare/request actions. Never imply real-time purchasability without evidence. |
| Tables | Stable sort/filter/search, visible result count, cursor/page behavior, column preferences for expert views, row action safety, selection scope, responsive detail route/card alternative. |
| Charts | Decision-specific title, units, legend/direct labels, accessible data alternative, empty/loading/error behavior, and no chart merely for decoration. |
| Statistics cards | Metric, period/definition, comparison only when meaningful, source freshness, drill-down, and no misleading positive/negative color. |
| Tracking cards | Current fact, next event, ETA range/confidence, owner, exception state, and record link. Map never replaces timeline/text. |
| Timeline | Ordered, timestamped, source-aware events with current/upcoming/exception distinction. |

### Feedback and overlay components

| Component | Standard and reason |
| --- | --- |
| Modal | Requires focused, bounded decision; accessible dialog semantics, focus restore, explicit close, no nested modal sequence. |
| Drawer | Uses horizontal context when user needs to retain the parent page; on mobile, use a safe-area-aware sheet. |
| Accordion | Optional disclosure for secondary content; headings and keyboard controls required. Do not hide required error or policy content. |
| Tabs | Switch sibling views of the same context; preserve state, have clear labels, keyboard arrows, and do not use tabs as primary app navigation. |
| Empty state | Names the condition, explains value/next action, distinguishes no data from filtered data, permission, and failure. |
| Loading state | Stable skeleton for short expected loads; button progress for actions; determinate progress/background continuation for long tasks. |
| Error state | Explain what failed, safe retry, preserved work, and support reference. Never use generic “something went wrong” alone. |
| Success state | Confirm completed business result and direct next action; avoid toast-only confirmation for high-consequence work. |

### Navigation and public components

| Component | Standard and reason |
| --- | --- |
| Navbar | Product/service hierarchy, accessible mobile drawer, persistent Request Procurement action, no hover-only navigation. |
| Sidebar | Role-aware workspace navigation, active context, collapsible but discoverable labels, keyboard and narrow-screen behavior. |
| Breadcrumbs | Record hierarchy/navigation context, not repeated page title. Collapse safely on mobile. |
| Pagination | Stable result count, first/last where useful, keyboard labels, and selectable page size only in expert contexts. |
| Footer | Legal, company, support, knowledge, locale, and approved trust links; no cluttered duplicate navigation. |
| Pricing cards | Only for transparent service tiers; show inclusions, exclusions, conditions, and discussion path. Never fabricate fixed costs for conditional sourcing. |
| Testimonials / FAQ | Evidence-led, attributed, accessible disclosure/search, and no anonymous or manipulative social proof. |

All components include default, hover, focus-visible, active, disabled, loading,
empty, error, success, dark-mode, responsive, and accessible states before
release.

---

## 8. Iconography, illustration, and photography

### Iconography

Use one modern outlined icon family with rounded joins and 1.75–2px stroke.
Default sizes: 16px dense inline, 20px standard controls, 24px touch/mobile.
Use filled icons only for selected/active state or a defined high-salience
semantic pattern. Pair icons with labels for consequential actions; every
icon-only control has accessible name, tooltip, and visible focus.

### Illustration

Illustrations are sparse, editorial, geometric, globally inclusive, and used
for onboarding, informative empty states, and select marketing explanation.
They never compete with transactional data. Avoid generic dashboard fragments,
exaggerated characters, decorative globes, or imagery that implies operational
guarantees.

### Photography

Use authentic, well-lit editorial photography with real operational context:

- **Factories:** responsible production, real equipment, safety, quality work.
- **Products:** accurate clean detail, scale, neutral/background consistency.
- **Corporate teams:** candid capable collaboration, not staged handshakes.
- **Warehouses:** organized handling, scanning, packing, inspection.
- **Shipping and ports:** real freight movement and documented operations,
  never misleading route/supplier attribution.
- **International trade:** people, goods, and places shown respectfully and
  globally, avoiding visual stereotypes.

Every meaningful image has alt text/caption policy and responsive optimized
variants. Decorative images are explicitly marked decorative.

---

## 9. Dark mode

Dark mode is a native semantic theme, not inverted light mode. It uses a deep
neutral canvas, stepped surfaces, restrained accessible interaction blue, and
retuned semantic colors. It preserves information hierarchy, table readability,
focus visibility, chart differentiation, document preview safety, and media
quality.

Rules:

- default to system preference; keep an explicit persistent user preference;
- avoid pure black, pure white body text, neon accents, and heavy shadows;
- do not simply invert logos/photos/documents; review each asset;
- maintain equal component states and contrast obligations in both themes;
- test long forms, dense tables, charts, maps, and toast/modal overlays in dark
  mode before release.

---

## 10. Accessibility

HAMD targets WCAG 2.2 AA minimum.

- Semantic HTML/component semantics, landmarks, logical headings, skip links,
  keyboard navigation, logical focus order, and no keyboard traps.
- Visible 2px minimum focus treatment with 3:1 contrast; focus must not sit
  under sticky UI.
- Every control has an accessible name; every status change and async result is
  announced appropriately without excessive screen-reader noise.
- Minimum target size 44 × 44px for touch controls. Dense desktop controls use
  adequate hit area and keyboard alternative.
- Respect reduced motion; do not auto-play sound; no flashing/seizure-risk
  effects.
- Field errors use plain language, identify the field, explain resolution,
  preserve data, and present a summary after submit.
- Test keyboard-only, screen reader, 200% zoom/reflow, high contrast, reduced
  motion, mobile screen reader, and color-vision conditions.

Accessibility is a quality gate, not a manual afterthought.

---

## 11. Responsive strategy

| Range | Layout strategy |
| --- | --- |
| Mobile: under 640px | 4-column grid, 16px gutter, bottom-safe actions, concise summaries, drill-down records, no forced horizontal enterprise table scan. |
| Tablet: 640–1023px | 8-column grid, 20–24px gutter, secondary panels become drawers/routes, maintain touch-friendly controls. |
| Laptop: 1024–1439px | 12-column operational grid, optional contextual panel, standard dashboard/table density. |
| Desktop: 1440–1919px | 12-column centered content plus stable navigation; use width for clarity, not oversized cards. |
| Ultra-wide: 1920px and above | Cap reading/content width, use intentional secondary context/analytics panels, never stretch forms or paragraphs indefinitely. |

Maximum long-form measure is 720px; public content container is generally
1200–1280px. Tables adapt with pinned identity columns, priority fields,
horizontal affordance, saved views, and responsive record detail rather than
shrinking text below readable size.

---

## 12. Design token taxonomy

The implementation needs the following semantic token families:

| Token family | Required tokens |
| --- | --- |
| Color | palette primitives; text; icon; surface; background; border; action; focus; status; chart; overlay; disabled; shadow. |
| Typography | family; weight; size; line-height; letter spacing; tabular-figure; text styles. |
| Spacing | full documented spacing scale. |
| Size | control height, icon sizes, target sizes, input/menu/dialog width constraints, navigation/sidebar dimensions. |
| Radius | XS through 2XL, pill, circular. |
| Elevation | 0–4 shadow/surface/border combinations. |
| Motion | duration, easing, delay, distance, reduced-motion alternatives, named presets. |
| Breakpoint | mobile/tablet/laptop/desktop/ultra-wide ranges and container limits. |
| Z-index | base, sticky, dropdown, popover, drawer, modal, toast, critical overlay-documented globally to prevent stacking conflicts. |
| Content | max reading width, truncation rules, media aspect ratios, image quality/format rules. |
| Accessibility | focus treatment, contrast-safe pairs, touch target, motion preferences, screen-reader announcement pattern. |

Token naming is semantic and stable. Examples of conceptual use are
`surface.canvas`, `text.primary`, `action.primary`, `status.warning`,
`space.24`, `radius.lg`, `motion.enter`, and `elevation.dialog`. Component
implementations consume these meanings, allowing global theming without
component-by-component redesign.

## 13. Design-system governance

- Maintain component ownership, documented variants, accessibility behavior,
  usage examples, deprecation policy, and visual regression coverage.
- New primitive components require design, engineering, accessibility, and
  product review. A feature-specific one-off is not a primitive.
- Every change is reviewed in light/dark, responsive, keyboard, reduced-motion,
  loading, empty, error, success, and long-content states.
- Track adoption and duplicate patterns. Design debt is product risk:
  inconsistent statuses, ungoverned colors, inaccessible dropdowns, and custom
  spacing are defects.
- The system evolves through semantic tokens and approved patterns, not
  uncontrolled variants.

## Final quality bar

A HAMD interface is complete when it is calm, precise, legible, fast,
accessible, responsive, dark-mode compatible, internationalization ready,
truthful about state, and consistent with the system. If a visual treatment does
not improve confidence, comprehension, or speed, it is removed.
