# Almahbub International  
# Brand Handbook

**Company:** Almahbub International  
**Product platform:** HAMD Genesis  
**Technology partner:** HAQQ TECH  
**Status:** Official brand source of truth  
**Scope:** Marketing, product UI (Public / Client / Ops), communications, documents, presentations, and partner materials  
**Canonical implementation tokens:** `packages/design-tokens`  
**Authority stack:** This handbook consolidates the Design Bible, Product DNA, Enterprise Design System, Motion System, and Identity Charter. When values conflict, prefer **`packages/design-tokens` + Enterprise Design System (`docs/10`)** for implementation numbers, and the **Identity Charter / Product DNA** for voice and positioning.

---

## 1. Brand Story

Almahbub International helps organizations procure across borders with a partner that owns every next step-sourcing, clarification, quotation, payment coordination, and delivery accountability.

HAMD Genesis is the flagship digital platform of that promise: one calm, evidence-led workspace where buyers and operators see current fact, ownership, and the next action. It is engineered by HAQQ TECH and must feel premium because it is **disciplined**, not because it is ornamental.

**Brand promise:** International procurement that feels calm, clear, and controlled.

**Public north star:** Procure globally with a Nigerian partner accountable for every next step.

**Hero message (approved):**  
**Global procurement. Local accountability.**  
Support: “We source, clarify, quote, and deliver for buyers who need a partner that owns every next step.”

---

## 2. Mission

Give buyers and operations teams a single, intelligent workspace to request, source, approve, pay for, communicate about, and track global procurement-as a managed service, not an open marketplace.

---

## 3. Vision

Make cross-border procurement feel legible, controlled, and dependable for any business, regardless of procurement maturity. Become one of the highest-quality procurement systems in Africa-premium, intentional, and timeless.

---

## 4. Core Values

| Value | Meaning in practice |
| --- | --- |
| **Trust before decoration** | Evidence, ownership, and honest uncertainty beat visual novelty |
| **Transparency with context** | Show assumptions, risks, inclusions/exclusions, and next actions |
| **Global fluency** | Respect currency, language, corridor, documents, and time zones without bureaucracy theater |
| **Operational accountability** | Every material event has an owner and a next step |
| **Human expertise, amplified** | AI and automation assist; they never hide responsibility |
| **Purposeful premium** | Craft signals reliability; never theatrical luxury |

---

## 5. Brand Personality

HAMD / Almahbub is **precise, calm, warm, accountable, and quietly confident**.

It speaks like an experienced international operations partner: direct, informed, respectful of uncertainty, and never theatrical.

**Eight DNA traits:** Calm · Trustworthy · Intelligent · Human · Global · Efficient · Transparent · Purposeful premium.

**Emotional outcomes**

| Audience | Should feel |
| --- | --- |
| First-time buyer | “I understand what happens next.” |
| Finance approver | “This decision is controlled and evidenced.” |
| Procurement officer | “The system helps me run work, not duplicate it.” |
| Delayed-shipment customer | “Someone owns this problem and has told me what they know.” |

**Perception bar:** Evidence over claims · Navy calm authority · Documentary craft · HAQQ TECH credited quietly-never louder than Almahbub.

---

## 6. Tone of Voice

**Voice:** concise, factual, respectful, composed.

**Three-question rule for every message and screen:** Where am I? What can I do? What should I do next?

| Prefer | Avoid |
| --- | --- |
| “Your quote is ready for review. It expires 14 June at 17:00 WAT.” | “Great news! Your amazing quote is waiting for you!” |
| “Customs clearance is delayed. Our logistics team is verifying the missing document and will update you by 14:00 WAT.” | “Your shipment is processing. Please wait.” |
| Named owners, times, evidence | Absolute delivery promises on variable logistics |
| Procurement vocabulary: request, clarify, source, quote, approve, deliver | Checkout, cart, “buy now,” fake stock urgency |

**Register by surface**

| Surface | Tone |
| --- | --- |
| Marketing | Premium and balanced-not corporate-boring, not startup-playful |
| Product (buyer/ops) | Operational clarity; minimal celebration language |
| Errors / delays | Honest, owned, time-bound next step |
| Success / celebration | Restrained confirmation; gold accent allowed; never block work |

---

## 7. Messaging

### 7.1 Name lockups

| Element | Correct form |
| --- | --- |
| Company | Almahbub International |
| Platform | HAMD Genesis (product) / HAMD (short in UI chrome where space is tight) |
| Attribution | Powered by HAQQ TECH (footer-level only - see §7.5) |
| Primary CTA | Request Procurement |
| Secondary CTAs | Explore Services · Track Shipment (contextual) |

### 7.2 Approved vocabulary

`request → clarify → source → quote → approve → deliver`

### 7.3 Claims review

Any customer-facing claim about cost, protection, delivery, customs, or payment requires UX, content, operations, and legal review. Do not invent SLAs or guarantees in marketing copy.

### 7.4 Tagline options (approved family)

- Global procurement. Local accountability.  
- Calm, clear, and controlled international procurement.  
- A partner that owns every next step.

### 7.5 HAQQ TECH attribution placement (normative)

“**Powered by HAQQ TECH**” is a **footer-level engineering attribution**, not a global UI element. Style it as subtle enterprise microcopy (caption / soft tertiary), never a promotional banner, badge cluster, or co-brand hero.

| Surface | Rule |
| --- | --- |
| **Public website** | Footer basebar only |
| **Client workspace** | Footer **or** About dialog only |
| **Operations console** | Footer **or** System Information only |
| **Authentication pages** | Do **not** display prominently (prefer omit from auth chrome) |
| **Transactional / marketing emails** | Optional small footer attribution |
| **Loading screens, dashboards, forms, cards, modals, page headers, heroes** | Do **not** display |

**Implementation:** use `@hamd/ui` `PoweredByAttribution` (or equivalent `.hamd-powered-by` / footer basebar styles) only on allowed surfaces. Do not pass partner lines into Homepage hero, overview body chrome, welcome modals, or document `<title>` as marketing chrome.

---

## 8. Logo System

### 8.1 Official mark

**Primary artwork (canonical file):**  
`client-frontend/public/almahbub.svg`  
Square master artboard **1200 × 1200**. Treat this SVG as the source master until a dedicated brand-asset package supersedes it.

### 8.2 Lockups

| Lockup | Use |
| --- | --- |
| **Symbol alone** | App icons, favicons, compact chrome, avatars ≥ 32px |
| **Symbol + wordmark “Almahbub International”** | Website header, presentations, letterhead |
| **Product lockup** | “HAMD” or “HAMD Genesis” adjacent to Almahbub mark on product splash / docs |
| **Partner line** | “Powered by HAQQ TECH” in footer/About/System Info (or optional email footer) only - caption/micro type; never competing with Almahbub hierarchy |

Wordmark type: **Inter SemiBold (600)** tracking normal; color **Deep Midnight** `#0B1F3A` on light, `#F9FAFB` on dark.

### 8.3 Color versions

| Version | Background | Mark treatment |
| --- | --- | --- |
| Full color on light | `#FFFFFF` / `#F9FAFB` | Master colors as in SVG; prefer navy-dominant presentation |
| Mono navy | Light surfaces | Single color `#0B1F3A` |
| Mono white / knockout | `#0B1F3A`, `#123B66`, photography with navy scrim | `#FFFFFF` |
| Reverse on dark UI | `#101828` / `#182230` | Knockout white or approved light mark |

Gold (`#8A6415`) may appear in celebration moments near the brand-not as the logo fill for primary navigation.

---

## 9. Logo Usage

| Allowed | Required practice |
| --- | --- |
| Website header / footer | Clear space respected; link to home |
| Product loading / auth shells | Centered or top-leading; calm, no bounce loops |
| Pitch decks / one-pagers | Title slide + closing slide |
| Email header (HTML) | Linked PNG/SVG from approved CDN; max height 32–40px in mail clients |
| Partner co-brand | Almahbub primary; partner mark secondary with clear space between |

Always provide adequate contrast. On photography, use a **deep navy scrim** only as needed for WCAG text/logo contrast-no purple gradients or glow.

---

## 10. Logo Restrictions

Do not:

1. Stretch, skew, rotate, or add perspective  
2. Recolor with off-brand hues (purple, neon, gradients)  
3. Apply drop shadows, glows, bevels, or outlines not in the master  
4. Place on busy photography without scrim/contrast control  
5. Set the mark smaller than minimum sizes (§12)  
6. Crowding: invade clear space with other logos, badges, or UI chrome  
7. Animate the logo theatrically (spin, bounce, pulse loops)  
8. Use low-resolution raster blow-ups  
9. Make “HAQQ TECH” larger or higher contrast than Almahbub  
10. Combine with cart/checkout ecommerce visual metaphors  

---

## 11. Clear Space

Measure clear space as **≥ 0.5 × mark height** on all four sides for the symbol, and **≥ height of the capital “A” in the wordmark** for horizontal lockups.

No typography, icons, rules, or photography subjects may enter this zone. Co-brand partners must sit outside clear space with a divider or generous gap (≥ full mark height between marks).

---

## 12. Minimum Size

| Context | Minimum |
| --- | --- |
| Symbol (print) | 8 mm height |
| Symbol (digital UI) | 24 px height |
| Symbol (favicon) | 16 px (use simplified mark if detail fails) |
| Horizontal lockup (digital) | 120 px wide overall |
| Horizontal lockup (print) | 30 mm wide overall |
| Email header | 28 px mark height minimum |

If detail collapses at small sizes, use the simplified mono symbol-not a blurry full illustration.

---

## 13. Primary Colors

Foundation language: **Deep Midnight Blue** (trust) + **Azure action blue** (interaction).

| Role | Hex | Token / note |
| --- | --- | --- |
| Brand primary 900 - Deep Midnight | `#0B1F3A` | Foundation navy (docs); hero scrims, wordmark |
| Brand primary 700 | `#123B66` | `actionPrimaryHover` (light) / selected surfaces (dark) |
| Brand primary 600 - Azure | `#155AAF` | `actionPrimary` (light) |
| Brand primary 100 | `#E8F1FB` | `actionSelected` (light) |

**Dark interactive blues**

| Role | Hex | Token |
| --- | --- | --- |
| Action primary | `#53B1FD` | `actionPrimary` |
| Action hover | `#84CAFF` | `actionPrimaryHover` |

---

## 14. Secondary Colors

| Role | Hex | Token | Use |
| --- | --- | --- | --- |
| Celebration gold 700 | `#8A6415` | `celebration` | Brand moments, success celebrations only-not primary buttons or status |
| Celebration gold 100 | `#FBF3DD` | `celebrationSubtle` | Soft celebration surfaces (light) |
| Celebration (dark) | `#F9DB8B` / `#5F4C13` | `celebration` / `celebrationSubtle` | Dark mode celebration |

Gold is recognition and ceremony-not a second primary CTA color.

---

## 15. Neutral Palette

### Light

| Role | Hex | Token |
| --- | --- | --- |
| Text primary | `#101828` | `textPrimary` |
| Text secondary | `#344054` | `textSecondary` |
| Text tertiary | `#667085` | `textTertiary` |
| Border | `#D0D5DD` | `border` |
| Border subtle | `#EAECF0` | `borderSubtle` |
| Surface subtle | `#F2F4F7` | `surfaceSubtle` |
| Canvas | `#F9FAFB` | `canvas` |
| Surface | `#FFFFFF` | `surface` |

### Dark

| Role | Hex | Token |
| --- | --- | --- |
| Canvas | `#101828` | `canvas` |
| Surface | `#182230` | `surface` |
| Surface raised | `#1D2939` | `surfaceRaised` |
| Text primary / secondary / tertiary | `#F9FAFB` / `#D0D5DD` / `#98A2B3` | matching |
| Border | `#344054` | `border` |

**Forbidden:** pure black body backgrounds, pure white long-form body text on dark, neon accents.

### Semantic status (not brand decoration)

| Meaning | Light | Dark |
| --- | --- | --- |
| Success | `#067647` / `#D1FADF` | `#6CE9A6` / `#054F31` |
| Warning | `#9A6700` / `#FEF0C7` | `#FEC84B` / `#7A2E0E` |
| Danger | `#B42318` / `#FEE4E2` | `#FDA29B` / `#7A271A` |
| Information | `#175CD3` / `#D1E9FF` | `#84CAFF` / `#1849A9` |

Status always includes text (and optional icon)-never color alone.

### Charts

Ordered categorical hues: navy, blue, teal, violet, amber, slate. Prefer sampling from primary/neutral/semantic tokens; do not introduce unmanaged neons.

---

## 16. Typography

### Families

| Role | Stack |
| --- | --- |
| UI / product sans | `"Inter", "Segoe UI", sans-serif` |
| Mono (IDs, code, refs) | `"Roboto Mono", "SFMono-Regular", Consolas, monospace` |

A licensed **display companion** may be used for large marketing headlines only if it preserves calm authority and ships with fallback to Inter. Do not introduce playful display faces.

### Weights

400 reading · 500 labels/controls · 600 hierarchy · 700 sparingly.

### Scale (implementation)

| Style | Size | Line height | Weight |
| --- | --- | --- | --- |
| Display XL | 48px | 56px | 600 |
| Display L | 40px | 48px | 600 |
| Display M | 32px | 40px | 600 |
| H1 | 28px | 36px | 600 |
| H2 | 24px | 32px | 600 |
| H3 | 20px | 28px | 600 |
| H4 | 18px | 26px | 600 |
| Body large | 16px | 26px | 400 |
| Body | 14px | 22px | 400 |
| Small | 13px | 20px | 400 |
| Caption | 12px | 18px | 400 |
| Micro | 11px | 16px | 500 |
| Button / Navigation | 14px | 20px | 500 |
| Label | 12px | 16px | 500 |
| Table body | 13px | 20px | 400 |
| Table header | 12px | 16px | 600 |

**Measure:** 65–75 characters for long-form; max reading width **720px**.

Tokens currently export a subset (`display*`, `h1–h3`, `body`, `label`, `button`); full scale above is normative for design and must be completed in tokens over time.

---

## 17. Spacing System

Base unit **4px**. Use the scale-no arbitrary pixels.

| Token | Rem | px |
| --- | --- | --- |
| 1 | 0.25rem | 4 |
| 2 | 0.5rem | 8 |
| 3 | 0.75rem | 12 |
| 4 | 1rem | 16 |
| 5 | 1.25rem | 20 |
| 6 | 1.5rem | 24 |
| 8 | 2rem | 32 |
| 10 | 2.5rem | 40 |
| 12 | 3rem | 48 |
| 14 | 3.5rem | 56 |
| 16 | 4rem | 64 |
| 20 | 5rem | 80 |
| 24 | 6rem | 96 |

Related elements share tighter space; unrelated sections use larger steps. Equal spacing between unrelated blocks is a common mistake.

---

## 18. Grid System

| Breakpoint | Range | Gutter |
| --- | --- | --- |
| Mobile | < 640px | 16px |
| Tablet | 640–1023px | 20–24px |
| Desktop / laptop | 1024–1439px | 24px |
| Wide | 1440px+ | 24px+ |
| Ultra-wide | 1920px+ | constrain content; avoid stretched prose |

**Marketing content width:** 1120–1280px (prefer ~1200px).  
**Product workspaces:** fluid with max content columns; ops tables may go wider with horizontal scroll rather than crushing density.

Columns: 4 (mobile) → 8 (tablet) → 12 (desktop). Align to spacing scale.

---

## 19. Elevation System

| Level | Use | Shadow token |
| --- | --- | --- |
| 0 | Flat tables, list rows, inline | none |
| 1 | Cards, subtle separation | `shadow.xs` / `sm` |
| 2 | Dropdowns, popovers | `shadow.sm` / `md` |
| 3 | Modals, sheets | `shadow.md` / `lg` |
| 4 | Critical overlays / command palettes | `shadow.lg` (+ dimmed backdrop) |

**Token values**

```text
xs: 0 1px 2px rgb(16 24 40 / 0.05)
sm: 0 1px 3px rgb(16 24 40 / 0.1), 0 1px 2px rgb(16 24 40 / 0.06)
md: 0 4px 6px -2px rgb(16 24 40 / 0.05), 0 12px 16px -4px rgb(16 24 40 / 0.1)
lg: 0 8px 8px -4px rgb(16 24 40 / 0.03), 0 20px 24px -4px rgb(16 24 40 / 0.08)
```

Prefer borders + surface steps in dense ops UI; reserve larger shadows for overlays.

**Glass:** exceptional marketing/ambient only. **Never** on forms, tables, quotes, payments, tracking, navigation, or errors.

---

## 20. Border Radius

| Token | Value | Typical use |
| --- | --- | --- |
| xs | 2px | Dense chips, fine controls |
| sm | 4px | Inputs in compact toolbars |
| md | 6px | Default controls |
| lg | 8px | Buttons, inputs, small cards |
| xl | 12px | Cards, panels |
| 2xl | 16px | Large marketing containers (sparingly) |
| pill | 9999px | Tags only when semantically chips-not primary CTAs by default |
| circular | 50% | Avatars, icon buttons |

Floating elements use medium/large radius with subtle elevation. Avoid playful over-rounding on enterprise tables and finance records.

---

## 21. Iconography

| Rule | Spec |
| --- | --- |
| Style | One modern **outlined** family across the product |
| Stroke | 1.75–2px optical |
| Sizes | 16 / 20 / 24 px |
| Filled | Only for selected/active states |
| Color | Inherit semantic text/action tokens |
| Touch | 44×44px hit target with padding |

Do not mix icon libraries in one shell. Prefer a single licensed outlined set aligned with Inter metrics (selection is an asset decision; style rules above are normative).

---

## 22. Illustrations

- Editorial, sparse, geometric, globally inclusive  
- Brand-adjacent navy/azure/neutral; gold only for celebration motifs  
- Realistic business objects (documents, containers, corridors)-not mascots  

**Avoid:** floating dashboard fragments, decorative globes, overexpressive characters, visuals that imply guaranteed delivery or fake live inventory.

---

## 23. Photography Style

**Documentary craft:** authentic, well-lit, editorial honesty, diversity, global context.

| Subject | Guidance |
| --- | --- |
| Hero | Commerce corridors, accountable people at work-not staged handshakes |
| Product | Neutral backgrounds; honest scale |
| Factory / warehouse | Safety and order visible |
| Ports / shipping | Real freight context |
| Teams | Candid professional moments |

Caption when an image could be mistaken for a specific customer transaction. Full-bleed heroes preferred on marketing; **no inset collage heroes**, no floating badge stickers on hero media.

---

## 24. Motion Design

Motion communicates hierarchy, progress, relationship, or confirmation-never decoration for its own sake.

### Durations

| Token | ms | Use |
| --- | --- | --- |
| instant | 0 | Reduced-motion hard cut |
| micro | 80 | Tiny feedback |
| fast | 120 | Control hover/press (`motion.fast`) |
| standard / normal | 180 | Default UI (`motion.normal`) |
| moderate / panel | 240 | Panels (`motion.panel`) |
| emphasized | 320 | Emphasis transitions |
| progress | 400 | Progress reveals |
| celebration | ≤ 600 | Celebration max |

### Easings

| Token | Curve |
| --- | --- |
| standard (default in tokens) | `cubic-bezier(0.2, 0, 0, 1)` |
| out | `cubic-bezier(0.16, 1, 0.3, 1)` |
| in | `cubic-bezier(0.7, 0, 0.84, 0)` |
| soft | `cubic-bezier(0.22, 1, 0.36, 1)` |
| linear | `linear` |

### Distances (tokens)

Control `8px` · Panel `16px` · Sheet `20px`  
Page travel max ~24px. Scale enters ~0.98→1 / 0.99→1.

Animate **transform + opacity** only. Framer Motion is approved for product marketing motion where needed.

---

## 25. Animation Principles

1. **Purposeful** - every animation answers a user question.  
2. **Fast enough to trust** - operational UI stays in the 120–240ms band.  
3. **Interruptible** - never block forms, payments, or approvals.  
4. **One focal motion** - avoid competing animations.  
5. **Respect `prefers-reduced-motion`** - opacity-only 80–120ms or instant.  
6. **No theatrical logo loops**, parallax, autoplay video, or purple glow.  
7. **Celebration** is capped and never appears inside critical finance/shipment confirmation paths as a blocker.  
8. Tracking UIs animate only the **newly recorded** milestone-not the entire timeline.

---

## 26. Marketing Guidelines

| Do | Don’t |
| --- | --- |
| Lead with accountability and next steps | Fake urgency, countdown stock, checkout metaphors |
| Use documentary photography + navy/azure | Purple gradients, neon, glassmorphism on claims |
| Primary CTA: Request Procurement | “Buy now”, “Add to cart” |
| Evidence: process, ownership, corridors | Absolute customs/delivery guarantees |
| Quiet HAQQ TECH credit in footer only | Co-equal logo wars, hero/header/modal partner lines |
| WCAG AA on all hero text | Low-contrast overlays |

**Section rhythm (public home):** Hero → Partners → Stats → Services → Products → Industries → Workflow → Stories → Testimonials → FAQ → Newsletter → Contact CTA → Footer.

---

## 27. Presentation Templates

**Slide canvas:** 16:9 · background `#FFFFFF` or title `#0B1F3A`.  
**Type:** Inter; titles Display M / H1; body 18–20px projected.  
**Accent bar:** 4–6px `#155AAF` under titles on light slides.  
**Title slide:** Almahbub lockup top-left or centered; headline (Almahbub primary).  
**Closing slide:** Contact + Request Procurement QR/URL optional; optional “Powered by HAQQ TECH” micro line on the closing slide only.  
**Charts:** categorical navy→slate set; label axes; no 3D.  
**Imagery:** full-bleed only with navy scrim for text.

Export PDF/PPTX from a single master; do not restyle per deck.

---

## 28. Business Cards

| Spec | Value |
| --- | --- |
| Size | 85 × 55 mm (or regional standard with same proportions) |
| Front | Deep Midnight `#0B1F3A` field; knockout Almahbub mark; name in Inter 600 white; title secondary |
| Back | Light `#F9FAFB`; azure rule; phone, email, web, address in Inter 400 `#344054`; “Powered by HAQQ TECH” micro |
| Finish | Matte or soft-touch; avoid glitter/foil gimmicks |
| QR | Optional to Request Procurement or site; quiet bottom alignment |

---

## 29. Email Signature

```text
[Full Name]
[Title] | Almahbub International

[Phone] · [Email]
[Website]

Almahbub International - Global procurement. Local accountability.
Powered by HAQQ TECH   ← optional micro line (email footer attribution)
```

HTML signature: mark height 28–32px; colors `#0B1F3A` / `#344054` / `#667085`; no animated GIFs; no stacked social icon walls. Legal disclaimers in tertiary micro type when required. Partner line remains optional and never larger than the Almahbub block.

---

## 30. Website Identity

| Element | Standard |
| --- | --- |
| Shell | Public Website - calm navy authority, documentary hero |
| **Homepage** | **Official Version 2 design foundation** - tokens, section rhythm, CTAs, motion, and chrome for all subsequent public pages |
| Header | Almahbub lockup + enterprise nav; one primary CTA |
| Hero | Full-bleed; Accountable Corridor concept; no cards/badges on media; no HAQQ TECH line |
| CTAs | Primary azure filled; secondary quiet outline/text |
| Footer | Trust links, legal, quiet HAQQ TECH line (only allowed public-site placement) |
| Favicon | Derived from symbol; multi-size PNG/SVG set |

Performance: protect LCP; no autoplay video; motion never delays task.

---

## 31. Dashboard Identity

| Shell | Visual emphasis |
| --- | --- |
| Client Workspace | Attention and next actions; restrained chrome; azure actions; HAQQ TECH only in footer or About |
| Operations Console | Queue-first; dense but legible tables; elevation sparingly; no vanity KPI theater on home; HAQQ TECH only in footer or System Information |

Shared: Inter, semantic status tokens, 44px targets, visible focus ≥2px at 3:1. Never place partner attribution on loading screens, dashboards, forms, cards, modals, or page headers.

---

## 32. Product Identity

- Semantic tokens only-no raw hex in components  
- `@hamd/ui` is the product expression of this handbook  
- One primary action per local context  
- Procurement vocabulary everywhere  
- Dark mode uses the dark token set-never inverted hacks  
- Loading / empty / error / success are first-class brand moments (below)

---

## 33. Loading Screens

| Context | Treatment |
| --- | --- |
| App bootstrap | Navy or canvas field; centered mark; indeterminate progress in azure; no joke copy |
| In-page | Skeleton using `surfaceSubtle` / `borderSubtle`; preserve layout (CLS ≈ 0) |
| Button pending | Spinner or progress on control; keep label (“Submitting…”) |

Copy: factual (“Loading requests…”)-not playful.

---

## 34. Empty States

Structure: **what’s missing → why it matters → one primary action**.

Example: “No procurement requests yet. Create a request to start sourcing with Almahbub.” → **Request Procurement**.

Illustration optional and sparse; never blame the user.

---

## 35. Error States

| Severity | Visual | Copy |
| --- | --- | --- |
| Inline field | Danger token + text | Specific fix instruction |
| Page / section | Danger subtle surface | What failed + next step + support path |
| System | Honest outage language | Status and retry/time bound when known |

Never: “Oops!”, meme art, or silent failure. Always include a request/support path for operational errors.

---

## 36. Notification Style

| Channel | Brand rules |
| --- | --- |
| In-app | Deep link to record; semantic icon + title + concise body; unread affordance |
| Email | Almahbub header; azure text links; factual subject lines; gold unused except rare celebration templates |
| Toasts | Short; auto-dismiss noncritical; persistent for payment/approval/security |

Critical/security/legal notifications are never “cute.” Celebration templates use gold subtly and never masquerade as operational truth.

---

## 37. Accessibility

| Rule | Requirement |
| --- | --- |
| Standard | WCAG 2.2 AA floor |
| Text | 4.5:1 normal; 3:1 large |
| UI / focus / icons | ≥ 3:1 |
| Focus | Visible ≥ 2px |
| Targets | ≥ 44×44px |
| Motion | Honor `prefers-reduced-motion` |
| Meaning | Never color alone |
| Keyboard | Full operation without pointer |

Brand craft that fails accessibility is rejected-even if “on brand” visually.

---

## 38. Print Guidelines

- Color: prefer CMYK conversions from hex masters; proof navy `#0B1F3A` and azure `#155AAF`  
- Minimum logo sizes per §12  
- Body text ≥ 9pt Inter equivalent; headings Inter 600  
- Bleeds 3mm; safe margin ≥ clear space  
- Paper: uncoated or soft matte for premium calm-avoid high-gloss carnival finishes  
- QR codes: test scan; quiet zone intact  

---

## 39. Future Expansion

| Track | Direction |
| --- | --- |
| Brand asset pack | Dedicated `brand/` package: SVG/PNG lockups, favicons, social OG images, email header |
| Token completion | Export full type scale, motion durations/easings, elevation map, brand primary 900 |
| Icon vendor lock | Single outlined library licensed and documented |
| Display type | Optional licensed companion for marketing only |
| Regional packs | Locale-ready templates; RTL spacing verification |
| Partner kit | Co-brand PDF with clear-space diagrams |
| Motion | Complete token parity with Motion System (`docs/11`) |
| Photography library | Approved corridor/product set with rights metadata |

Expansion must preserve navy calm authority, documentary craft, and quiet HAQQ TECH attribution.

---

## Appendix A - Quick reference

| Item | Value |
| --- | --- |
| Company | Almahbub International |
| Product | HAMD Genesis |
| Partner line | Powered by HAQQ TECH (footer / About / System Info / optional email only) |
| Promise | Calm, clear, and controlled |
| Primary CTA | Request Procurement |
| Navy | `#0B1F3A` |
| Action (light) | `#155AAF` |
| Gold | `#8A6415` |
| Sans | Inter |
| Mono | Roboto Mono |
| Tokens package | `@hamd/design-tokens` |
| Master mark | `client-frontend/public/almahbub.svg` |

---

## Appendix B - Related sources (consolidated)

| Document | Role |
| --- | --- |
| `docs/05-hamd-design-bible.md` | Brand philosophy & design principles |
| `docs/06-hamd-product-dna.md` | Personality & experience DNA |
| `docs/10-enterprise-design-system-specification.md` | Token & component system |
| `docs/11-motion-design-system-specification.md` | Motion doctrine |
| `docs/58-project-identity-charter.md` | Identity & craft bar |
| `docs/47` / `docs/48` | Homepage / hero visual system |
| `packages/design-tokens` | Implemented semantic values |

---

**End of Brand Handbook.**  
Brand system changes require design ownership review, token updates, and alignment with Product and Engineering handbooks when they affect product UI.
