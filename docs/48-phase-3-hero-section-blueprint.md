# Phase 3 - Hero Section Blueprint

**Brand:** Almahbub International  
**Attribution:** Powered by HAQQ TECH (quiet)  
**Module:** Homepage Hero  
**Deliverable:** Blueprint only. No React.

---

## 1. Mission

Design one of the strongest B2B procurement heroes.

**First five seconds must answer:**

| Question | Answer |
| --- | --- |
| Who are we? | Almahbub International - Nigerian global procurement partner |
| Why trust us? | Accountable managed process + verifiable operating proof |
| What do we offer? | Cross-border procurement: source, clarify, quote, approve, deliver |
| What should I do next? | **Request Procurement** |

**Tone:** Premium, balanced - not corporate-boring, not startup-playful.

---

## 2. Concepts designed

### Concept A - Editorial Authority

Full-bleed documentary image. Brand dominates. One headline, one sentence, CTA group. Quiet trust line. Search/quick entry deferred to a slim rail at the fold.

- **Strength:** Maximum brand calm; cleanest premium read  
- **Weakness:** Quick procurement entry weaker in the first five seconds  
- **Score:** 9.2

### Concept B - Split Decision Desk

Copy left; inset visual/form panel right.

- **Strength:** Form visible immediately  
- **Weakness:** Template B2B; inset panel breaks full-bleed doctrine; form competes with brand  
- **Score:** 6.4

### Concept C - Platform Command

Headline over blurred product UI with floating status chips.

- **Strength:** Signals software innovation  
- **Weakness:** Startup-demo energy; overlay chips forbidden; theatre over accountability  
- **Score:** 5.1

### Concept D - Search-First Sourcing

Large catalog search center-stage; mosaic products; CTAs secondary.

- **Strength:** Fast for product-known buyers  
- **Weakness:** Ecommerce read; weak who/why-trust; collage breaks single-plane hero  
- **Score:** 4.8

### Concept E - Accountable Corridor (**Winner**)

Full-bleed documentary plane. Brand-first. Headline + one supporting sentence. Primary/Secondary CTAs. Quiet trust strip (not media overlays). **Quick Procurement Entry** field under CTAs - procurement start, not marketplace search.

- **Strength:** Answers all four 5-second questions; premium; conversion-integrated search  
- **Weakness:** Field copy must stay operational, never “shop/search products”  
- **Score:** 9.6

---

## 3. Evaluation matrix

| Criterion | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| 5-second answers | Strong | Mixed | Weak | Weak | **Strongest** |
| Premium / not playful | High | Medium | Low | Low | **High** |
| Brand-first | Pass | Weak | Fail | Fail | **Pass** |
| Full-bleed / no hero cards | Pass | Fail | Fail | Fail | **Pass** |
| Trust without vanity | Strong | Form-heavy | Fake UI risk | Ecommerce risk | **Strong** |
| Quick procurement entry | Deferred | Visible | Weak | Dominant (wrong) | **Integrated rightly** |
| Accessibility | High | Medium | Overlay risk | Mosaic risk | **High** |
| LCP / performance | Best | Two focals | Heavy mock | Many images | **One LCP image** |

---

## 4. Why E wins

1. **Completeness:** Only E reliably answers who / trust / offer / next without sacrificing brand.  
2. **Category fit:** Reads as a managed procurement partner, not a SaaS demo or catalog shop.  
3. **Rule compliance:** Brand-first, full-bleed visual plane, no floating badges, no hero cards.  
4. **Conversion:** Quick entry feeds the request wizard with context while Primary CTA remains unambiguous.  
5. **Performance:** One prioritized photographic LCP asset.  
6. **Close alternative:** Concept A if stakeholders demand extreme hero restraint - move quick entry just below the fold, keep E’s copy and trust strip.

---

## 5. Chosen hero specification

### Headline

**Recommended:** Global procurement. Local accountability.

**Alt:** Cross-border procurement with a partner who owns the next step.

### Supporting text

**One sentence only:**  
We source, clarify, quote, and deliver for buyers who need a partner that owns every next step.

### Primary CTA

**Request Procurement** - solid accessible blue, ≥44px height, routes to request wizard (empty or with quick-entry context).

### Secondary CTA

**Explore Services** - secondary/ghost.

**Optional tertiary text link:** Track Shipment.

### Hero visual

Single full-bleed documentary still: port, warehouse, or quality inspection with real human/work scale. No collage, no 3D ornament, no fake dashboard UI.

### Background

The image *is* the background plane. Deep navy scrim only as required for WCAG text contrast. No playful shapes, glow, or purple gradients.

### Micro animations

| Motion | Spec |
| --- | --- |
| Text group | One-time fade/fadeUp 0–240ms |
| Image | Optional fade-after-decode |
| CTA press | 80–120ms opacity/scale ≤0.99 |
| Forbidden | Parallax, claim rotator, autoplay video, looping ambient motion |
| Reduced motion | Instant state |

### Trust indicators

Quiet strip **below** CTAs / quick entry - never overlays on the image:

- Managed end-to-end process  
- Nigeria-rooted partner  
- Quotes & tracking you can verify  

Optional approved partner marks as named text/logo row - no marquee, no “as seen in” vanity.

HAQQ TECH: quiet “Powered by HAQQ TECH” under brand or in trust strip - never louder than Almahbub.

### Search bar → Quick Procurement Entry

| Spec | Detail |
| --- | --- |
| Role | Start a procurement request, not browse a store |
| Label | Start a request |
| Placeholder | Product, destination, or shipment reference |
| Submit | Continue → wizard with query prefilled |
| Not allowed | Live marketplace typeahead dropdown in the hero; “Add to cart” language |

### Layout order (desktop)

1. Top nav (Request persistent; Account secondary)  
2. Brand (dominant)  
3. Headline  
4. Supporting sentence  
5. Primary + Secondary CTAs  
6. Quick-entry field  
7. Trust strip  
8. Full-bleed visual plane (behind/beside - never inset card)

### Mobile

Brand → H1 → sentence → stacked CTAs (primary full-width) → quick entry → trust strip → image as atmospheric plane.

---

## 6. Interaction rationales

| Interaction | Why | UX improvement | Performance |
| --- | --- | --- | --- |
| Primary CTA | Capture qualified demand | Clearest next step | Route; optional prefetch |
| Explore Services | Educate before commit | Fewer false wizard starts | Normal nav |
| Track Shipment | Serve return users | Reassurance without diluting Request | Light route |
| Quick-entry submit | Carry intent into wizard | Less re-typing; operational feel | Pass state; no hero typeahead API required |
| Trust link (optional) | Deepen proof on demand | Trust without clutter | Static page |
| Text reveal | Orient hierarchy once | Calm entrance | CSS opacity; off if reduced motion |

---

## 7. Accessibility, SEO, loading

- Text/scrim contrast AA+; visible focus; ≥44px targets  
- One H1; if brand is an image, provide accessible name  
- Focus order: skip → nav → brand/H1 region → CTAs → quick entry  
- SEO: title/H1 aligned to global procurement partner positioning; Organization schema; descriptive image alt  
- Loading: one prioritized LCP image (AVIF/WebP, responsive); `font-display: swap`; no hero video  

---

## 8. Explicit rejects

- Floating badges, promo chips, or stickers on hero media  
- Autoplay video; count-up statistics in the first viewport  
- Product mosaic / collage hero  
- Checkout, cart, or fake stock language  
- Live ecommerce search results panel in the hero  

---

## STOP

Blueprint complete. No React generated.
