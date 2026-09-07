# Phase 3 - Product Card System Blueprint

**Brand:** Almahbub International  
**Module:** Procurement Product Cards  
**Deliverable:** Blueprint only. No React.

---

## 1. Mission

Design premium procurement product cards that support discovery, comparison, and request handoff - not ecommerce shopping tiles.

**Doctrine**

- Availability means **available to source**, never false “in stock.”
- MOQ and lead time are constraints; lead time is **indicative** unless contractual.
- Rating and supplier preference appear only with evidence.
- Primary action: **Request / Quick Procurement** - never Add to cart.
- Missing data shows **Not provided** - never invent.

---

## 2. Variants

| Variant | Purpose | Hierarchy | Layout | Where used |
| --- | --- | --- | --- | --- |
| **Grid** | Visual scan when form/packaging matters | Image → identity → manufacturer → origin → MOQ/lead → availability → actions | 3–4 / 2 / 1 columns | Default catalog |
| **List** | High-density technical scan | Thumb + all key fields in columns + trailing actions | Table-like desktop; attribute sections mobile | Category list density, saved lists |
| **Compact** | Dense rails and strips | Thumb + name + MOQ/lead + one action | Horizontal or tight vertical | Recently viewed, sidebars |
| **Featured** | Editorial spotlight | Larger image, short sourcing line, stronger Request | 1–2 featured slots | Homepage Featured Products |
| **Comparison** | Pinned compare slot | Normalized fields; delta highlight; remove | Fixed columns; mobile per-attribute | Compare Products |
| **Recommendation** | Explainable suggestion | Core fields + “Why suggested” + freshness | Grid or compact | Alternates / assisted suggestions |

---

## 3. Field contract

| Field | Role | Display rule | Accessibility | Loading |
| --- | --- | --- | --- | --- |
| **Image** | Recognition | Reserved 1:1 or 4:3; factual pack/product shot | Alt = product name + distinguishing trait | Skeleton box; lazy `srcset` |
| **Manufacturer** | Who makes it | Text; never invent brand | Accessible name | Static |
| **Supplier** | Who can supply | Qualification-aware; may read “Managed sourcing” | Text + optional chip with text | No animated “preferred” |
| **Country** | Origin | Plain country name; flag decorative only | Text required (not flag-only) | Static |
| **MOQ** | Constraint | Tabular number + unit; “Negotiable” only if true | Label “MOQ” associated | Never animate |
| **Lead time** | Indicative range | e.g. 14–21 days; mark Indicative when needed | Label + value | Never animate |
| **Rating** | Optional evidence | Policy-backed only; else omit | “Rated x of 5” text equivalent | No star-fill animation |
| **Availability** | Confidence | Available to source / Limited / Lead-time constrained / Unavailable / Unknown | Icon + text chip | No pulse |
| **Certifications** | Compliance | 1–3 chips + “+N” | Full name in text or sr-only | Static |
| **Quick actions** | Intent | Request · Save · Compare · More | Labelled controls; not unnamed icon-only | Press 80–120ms |

### Field priority

- **Grid / Featured:** Image, Name, Manufacturer, Country, MOQ, Lead, Availability, Certs (1–3), Request + Save + Compare  
- **List:** All fields in columns; Supplier visible  
- **Compact:** Image, Name, MOQ/Lead, Request  
- **Comparison:** Normalized comparable fields only  
- **Recommendation:** Core + why/freshness line  

---

## 4. States

| State | Rule |
| --- | --- |
| Default | Flat bordered surface; clear hierarchy; one heading link |
| Hover | 120ms border/tone; optional ≤2px lift on Grid/Featured only |
| Focus | 2px ring; focus-within may light surface; stronger than hover |
| Selected | Durable compare/wishlist selection; announced |
| Loading | Skeleton matching variant; image + 3–4 lines; no shimmer storm |
| Empty image | Neutral placeholder; alt still describes product |
| Partial data | “Not provided” - never invent |
| Disabled action | Accessible reason (e.g. compare limit reached) |

**Hover rule:** Hover must not be the only path to Save, Compare, or Request. Mobile and keyboard expose the same actions.

---

## 5. Interaction rules

| Action | Purpose | Behavior | Performance / trust |
| --- | --- | --- | --- |
| **Quick Procurement / Request** | Primary intent | Open wizard with product ID, name, MOQ defaults, known specs | Optional route prefetch; no price promise |
| **Wishlist / Save** | Preserve intent | Toggle save to procurement list; list picker if multiple | Optimistic only if reversible; server confirms |
| **Compare** | Build set (max 4 compatible) | Toggle selection; live region for count; disable with reason at limit | Client set + server projection |
| **Open detail** | Full evidence | Heading/image navigation | Normal navigation |
| **Recommendation why** | Disclose rationale | Inline explanation; never covert advertising | Prefer inline text |

### Additional rules

1. Guest shortlist allowed only if policy permits, with sign-in handoff to org lists.  
2. Compare compatibility: same category schema family; incompatible items rejected with plain reason.  
3. Bulk selection on list/grid updates a selection bar (count + Compare + Request selected + Clear).  
4. Featured cards may emphasize Request and de-emphasize Compare, but must not remove keyboard access to Save.  
5. AI/recommendation cards must show rationale, data freshness, and a path to alternatives.

---

## 6. Accessibility

| Topic | Rule |
| --- | --- |
| Structure | One product heading link per card; avoid duplicate adjacent identical links |
| Actions | Separate buttons; include product name in accessible name when ambiguous |
| Keyboard | Tab: heading → actions; Enter/Space activates; toggles announce state |
| Grid semantics | List/listitem or grid as appropriate |
| List variant | Desktop table with headers; mobile definition/attribute sections |
| Live regions | Compare count; save confirmation; page-level result updates |
| Contrast | Secondary meta ≥4.5:1; chips use text + icon |
| Reduced motion | No lift; instant state; image fade optional/off |

---

## 7. Animation rules

| Moment | Duration | Easing | Rule |
| --- | --- | --- | --- |
| Hover / focus | 120ms | standard | Border/background; lift ≤2px on Grid/Featured |
| Action press | 80–120ms | out | Opacity / scale ≤0.99; no bounce |
| Image appear | 120–180ms | opacity | After decode only |
| Save / compare toggle | instant–120ms | standard | State change only |
| Skeleton → content | instant or 120ms | opacity | Whole card once - **no field stagger** |
| **Forbidden** | - | - | Animate MOQ, lead time, rating, availability, price, or recommendation confidence |
| Card grid entrance | - | - | **No staggered card cascade** |

---

## 8. Responsive behaviour

| Breakpoint | Grid | List | Compact |
| --- | --- | --- | --- |
| Desktop | 3–4 columns | Multi-column table | Rail width constrained |
| Tablet | 2 columns | Priority columns; others in detail | 2–up rails |
| Mobile | 1 column; actions visible | Attribute sections; sticky Request after identity | Single horizontal snap optional with controls |

Comparison never squeezes unreadable columns - pivot to per-attribute sections on small screens.

---

## 9. Loading behaviour

- Skeletons match the active variant’s geometry (grid tile vs list row vs compact).  
- Images use reserved aspect boxes to prevent CLS.  
- Content replacement for filter/sort is one region update - not per-card stagger.  
- Cancel stale image decodes when scrolling virtualized grids.

---

## 10. Do / Don’t

**Do**

- Use procurement vocabulary (Request, Save to list, Compare)  
- Show indicative ranges and confidence honestly  
- Keep Request the clearest action  
- Explain recommendations  

**Don’t**

- Fake stock, cart, or checkout CTAs  
- Animate commercial numbers or ratings  
- Ship icon-only compare/save without accessible names  
- Stagger grid entrances or pulse availability  

---

## STOP

Product Card System blueprint complete. No React generated.
