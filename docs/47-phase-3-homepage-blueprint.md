# Phase 3 - Homepage Blueprint

**Brand:** Almahbub International  
**Platform attribution:** Powered by HAQQ TECH  
**Module:** Public Homepage  
**Deliverable:** Complete design blueprint only. No page implementation code.

---

## 1. Mission

The homepage must immediately communicate:

- Trust
- Professionalism
- Innovation
- Reliability
- Global procurement capability
- Powered by HAQQ TECH

**Tone:** Premium and balanced - not corporate-boring, not startup-playful.

**North star message:**  
“Procure globally with a Nigerian partner accountable for every next step.”

**Conversion rule:** Every section either increases confidence or advances **Request Procurement**.

---

## 2. Page posture

| Signal | How the homepage shows it |
| --- | --- |
| Trust | Verifiable proof, real facilities, accountable process language |
| Professionalism | Deep navy, precise copy, measured density, calm hierarchy |
| Innovation | HAQQ TECH-powered clarity and modern product craft - not gimmicks |
| Reliability | Transparent workflow, honest ranges, no invented guarantees |
| Global capability | Corridors, industries, sourcing evidence - grounded, not generic globes |

**Visual system**

- Deep navy trust foundation; accessible blue actions; gold only for brand recognition
- Documentary trade photography (ports, inspection, warehousing, people at work)
- Full-bleed hero image plane; no inset collage; no cards in the hero
- Motion: brief, purposeful, reduced-motion safe
- Copy vocabulary: request, clarify, source, quote, approve, deliver - never “checkout”

---

## 3. Section order

1. Hero  
2. Trusted Partners  
3. Global Statistics  
4. Services  
5. Featured Products  
6. Industries  
7. Procurement Workflow  
8. Success Stories  
9. Testimonials  
10. FAQ  
11. Newsletter  
12. Contact CTA  
13. Footer  

**Funnel rhythm**

- **Above:** Hero → Partners → Statistics (verified only)
- **Middle:** Services → Products → Industries → Workflow
- **Lower:** Stories → Testimonials → FAQ → Newsletter → Contact CTA → Footer

---

## 4. Global systems

### Spacing

| Token | Value | Use |
| --- | --- | --- |
| Section Y | 64 / 80 / 112px | Quieter for Partners/FAQ; opener for Services/Workflow/CTA |
| Content width | 1120–1200px | Hero copy ≤720px; FAQ ≤800px |
| Component gap | 12–24px | CTA group 12–16; grids 20–24 |
| Decision separation | 32–48px | Before primary CTA bands |

### Typography

- Brand/name is the strongest public signal in the first viewport
- One H1 only (hero capability statement)
- H2 per section; H3 for service/industry/product titles
- Body 14–16px / 1.5–1.6; metrics use tabular figures
- No theatrical display type in operational claims

### Animation (page-level)

- Ordinary UI ≤320ms; hero text reveal 0–240ms once
- Transform/opacity only; no bounce, marquee, count-up, or autoplay
- `prefers-reduced-motion`: instant equivalents

### Accessibility (page-level)

- WCAG 2.2 AA floor
- Skip link; landmarks; visible focus; ≥44px targets
- Status/meaning never color-only
- All carousels manual if present (prefer none)

### SEO (page-level)

- Unique title + meta description aligned to H1
- Organization + WebSite schema; FAQPage where real; Product only for factual records
- Crawlable HTML for critical copy (not JS-only)
- Internal links to services, industries, request, track, legal

### Loading (page-level)

- SSR/static shell first
- One prioritized LCP hero image (AVIF/WebP, responsive)
- `font-display: swap`
- Lazy-load below-fold media
- No autoplay video; no heavy third-party on critical path

### Responsive (page-level)

- Mobile: one job per viewport; primary CTA full-width where intent peaks
- Tablet: 2-column grids
- Desktop: editorial max-width with full-bleed hero/CTA bands

---

## 5. Section contracts

### 5.1 Hero

| Dimension | Spec |
| --- | --- |
| Purpose | Position Almahbub as the accountable Nigerian global procurement partner in one composition |
| Visual hierarchy | Brand → one headline → one supporting sentence → CTA group → full-bleed documentary image |
| Spacing | ~100vh desktop composition; content max ~720px; CTA gap 12–16px; padding 24/32/48 |
| Typography | Brand largest; H1 subordinate to brand; body 16–18px; CTA 14–16px semibold |
| Animation | One text-group reveal ≤240ms; image static or fade-after-decode; no rotator/parallax |
| Accessibility | Single H1; CTAs ≥44px; descriptive image alt; visible focus |
| SEO | H1/title for global procurement partner Nigeria; Organization schema; preload LCP |
| Responsive | Desktop full-bleed plane; mobile brand+copy+CTAs first |
| Loading | Priority hero image; no hero video |

**Primary CTA:** Request Procurement  
**Secondary:** Explore Services · Track Shipment  
**Optional quiet line:** Powered by HAQQ TECH (never louder than Almahbub)

### 5.2 Trusted Partners

| Dimension | Spec |
| --- | --- |
| Purpose | Ecosystem credibility without false endorsement |
| Visual hierarchy | Eyebrow → relationship line → logo/name grid |
| Spacing | Section py 64–96; logo gap 24–40 |
| Typography | Quiet label; body 14–16px; partner names as text |
| Animation | None (no marquee) |
| Accessibility | Accessible names for each partner |
| SEO | Crawlable names; no fake “as seen in” |
| Responsive | 5–6 → 3 → 2; no forced horizontal scroll |
| Loading | Lazy-load; reserved logo slots |

### 5.3 Global Statistics

| Dimension | Spec |
| --- | --- |
| Purpose | Scale with audited/qualified metrics only |
| Visual hierarchy | Title → 3–4 metrics (value, label, source) → methodology link |
| Spacing | Section py 64–80; grid gap 24 |
| Typography | Value 28–40px tabular; label 13–14px; source 12px |
| Animation | Static numbers - never count-up |
| Accessibility | Value+label association; descriptive methodology link |
| SEO | Do not publish unsupported claims |
| Responsive | 4 → 2 → 1 |
| Loading | Text-first; no chart library |

### 5.4 Services

| Dimension | Spec |
| --- | --- |
| Purpose | Explain capability beyond catalog browsing |
| Visual hierarchy | Title → four services (Global Procurement, Import & Export, Logistics, Warehousing) |
| Spacing | Section py 80–112; gap 20–24 |
| Typography | H2 24–28px; service title 18–20px; body 14–16px |
| Animation | 120ms hover tone/border; no layout-shifting lift |
| Accessibility | Whole target keyboard-operable; H2→H3 |
| SEO | `/services/*` internal links; accurate Service markup |
| Responsive | 4 → 2 → 1 |
| Loading | Copy first; defer imagery |

### 5.5 Featured Products

| Dimension | Spec |
| --- | --- |
| Purpose | Prove sourcing capability with commercial context |
| Visual hierarchy | Product identity → MOQ/lead guidance → Request this product |
| Spacing | Section py 80–112; reserved image ratio |
| Typography | Name 16–18px; meta tabular |
| Animation | Image fade after decode 120–180ms; no autoplay |
| Accessibility | Product-identifying alt; named buttons |
| SEO | Product schema only for factual records; no invented prices |
| Responsive | 3–4 → 2 → vertical cards |
| Loading | `srcset`; lazy-load; aspect boxes |

### 5.6 Industries

| Dimension | Spec |
| --- | --- |
| Purpose | Help buyers recognize relevant expertise |
| Visual hierarchy | Industry outcome + challenge → proof link |
| Spacing | Section py 64–96; 2-column gap 24 |
| Typography | Industry titles 16–18px; challenge secondary |
| Animation | Focus/hover tone only |
| Accessibility | Descriptive link labels |
| SEO | Industry routes for topical authority |
| Responsive | 2 → 1 |
| Loading | Text-first |

### 5.7 Procurement Workflow

| Dimension | Spec |
| --- | --- |
| Purpose | Make the managed process transparent |
| Visual hierarchy | Request → Clarify → Source → Quote → Approve → Deliver → Request CTA |
| Spacing | Section py 80–112; step gap 16–24 |
| Typography | Tabular step index; title 16px; description 14px |
| Animation | Optional one-time connector ≤240ms; static if reduced motion |
| Accessibility | Ordered list semantics; CTA clearly named |
| SEO | Managed-procurement vocabulary consistency |
| Responsive | Horizontal desktop → vertical mobile timeline |
| Loading | Inline SVG; no Lottie dependency |

### 5.8 Success Stories

| Dimension | Spec |
| --- | --- |
| Purpose | Outcome evidence with consent and specificity |
| Visual hierarchy | Industry · challenge · outcome · constraint → Read case |
| Spacing | Section py 80–96; 2–3 cards gap 24 |
| Typography | Title 18px; outcome 14–16px |
| Animation | Optional image fade |
| Accessibility | No hover-only outcome text |
| SEO | Real case URLs only |
| Responsive | 2–3 → 1 |
| Loading | HTML text first; lazy media |

### 5.9 Testimonials

| Dimension | Spec |
| --- | --- |
| Purpose | Credible human proof |
| Visual hierarchy | Quote → name/role/org → context → optional case link |
| Spacing | Section py 64–80; quote max-width ~720px |
| Typography | Quote 18–22px; attribution 14px |
| Animation | No autoplay; manual controls only if multi |
| Accessibility | Controls + static fallback; portrait alt = name |
| SEO | Review schema only when verified/compliant |
| Responsive | One testimonial per mobile viewport |
| Loading | Lazy portraits; prefer 1–3 quotes |

### 5.10 FAQ

| Dimension | Spec |
| --- | --- |
| Purpose | Resolve objections before contact |
| Visual hierarchy | Questions → answers → Contact/Request if unanswered |
| Spacing | Section py 64–96; accordion gap 8–12; max-width ~800px |
| Typography | Question 16px semibold; answer 14–16px / 1.6 |
| Animation | Expand ≤180ms; instant if reduced motion |
| Accessibility | Button/region pairing; focus on trigger |
| SEO | FAQPage schema; answers in HTML |
| Responsive | Full-width accordions |
| Loading | SSR core FAQ; no client fetch required |

### 5.11 Newsletter

| Dimension | Spec |
| --- | --- |
| Purpose | Optional nurture - never primary conversion |
| Visual hierarchy | Value line → email → Subscribe → privacy note |
| Spacing | Section py 48–64; quieter than Contact CTA |
| Typography | Label 14px; input 16px; privacy 12–13px |
| Animation | Validation 120ms; no celebration theatre |
| Accessibility | Associated label; announced errors; explicit consent |
| SEO | Privacy link; no empty thank-you index targets |
| Responsive | Stacked on mobile |
| Loading | Lightweight POST; no heavy embeds on critical path |

### 5.12 Contact CTA

| Dimension | Spec |
| --- | --- |
| Purpose | Convert high-intent visitors |
| Visual hierarchy | Reassurance → Request Procurement → Contact specialist |
| Spacing | Section py 80–112; full-bleed quiet navy band |
| Typography | Headline 24–28px; support 16px |
| Animation | Press/focus only; no background video |
| Accessibility | Privacy/next-step statement; keyboard actions |
| SEO | Conversion metadata; no false guarantees |
| Responsive | Stacked full-width primary on mobile |
| Loading | Static band; no heavy media |

### 5.13 Footer

| Dimension | Spec |
| --- | --- |
| Purpose | Durable nav, compliance, HAQQ TECH attribution, verified contact |
| Visual hierarchy | Brand + **Powered by HAQQ TECH** → nav columns → Track → Legal → Contact |
| Spacing | Footer py 48–64; column gap 32; legal row separated |
| Typography | Links 13–14px; legal/credit 12–13px |
| Animation | None |
| Accessibility | `contentinfo`; labeled social/language controls |
| SEO | Crawlable legal/company/service links; Organization contact points |
| Responsive | Multi-column → mobile accordion groups |
| Loading | Static HTML; minimal JS |

---

## 6. Interaction rationales

| Interaction | Why it exists | UX improvement | Performance impact |
| --- | --- | --- | --- |
| Request Procurement CTA | Primary conversion | One unambiguous next step | Navigation; optional cheap prefetch |
| Explore Services / Track | Education & reassurance | Fewer false wizard starts | Normal links |
| Partner logo link | Clarify relationship | Prevents endorsement confusion | Lazy targets |
| Service card open | Capability depth | Matches mental model | Defer images; optional prefetch |
| Request this product | Context into wizard | Higher-quality briefs | Pass IDs; no full catalog download |
| Industry detail | Relevance filter | Qualifies demand | Static pages |
| Workflow disclosure | Process transparency | Lowers anxiety | Inline; no per-step network |
| Case study open | Deep evidence | Specific trust | Separate page; lazy media |
| Testimonial next/prev | Manual proof browse | User control | No autoplay timers |
| FAQ accordion | Objection handling | Fewer premature contacts | HTML disclosure; SEO-friendly |
| Newsletter submit | Permissioned nurture | Captures low intent safely | Async; never blocks LCP |
| Contact specialist | Human path | Respects buying stage | Simple route |
| Footer legal/track | Safety & compliance | Always-available exits | Static |

---

## 7. Guardrails

- No ecommerce checkout metaphor, fake stock, or invented supplier counts
- No autoplay video/carousel; no count-up metrics
- No cards or floating badges in the hero
- Partner apply ≠ supplier portal
- Newsletter never visually outranks Request Procurement
- **Powered by HAQQ TECH** always in footer
- Statistics require source/methodology or they do not ship
- Testimonials/cases require consent and factual outcomes

---

## 8. Content prerequisites before build

1. Approved metrics with sources  
2. Consented testimonials and case studies  
3. Partner relationship statements  
4. Frozen service, industry, FAQ copy  
5. Hero LCP image set (responsive)  
6. Legal/privacy URLs for newsletter and footer  

---

## 9. Stop condition

This module ends at the complete homepage blueprint. No React/page implementation in this step.
