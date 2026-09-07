# Phase 3 - Public Website Masterplan

**Brand:** Almahbub International  
**Platform:** Powered by HAQQ TECH  
**Objective:** One of the most premium procurement websites in Africa  
**Deliverable:** Complete masterplan (architecture, contracts, reviews). **No page React implementation in this module.**

---

## 1. Mission & doctrine

Design the public site as **one continuous user journey**, not a pile of independent pages.

**North star:** Procure globally with a Nigerian partner accountable for every next step.

**Laws (docs/51):**

1. One primary action per page  
2. Never compete for attention  
3. Every section leads to the next  
4. Hierarchy obvious without reading every word  

**Consistency:** Shared tokens, shell, components, motion, and vocabulary (`request → clarify → source → quote → approve → deliver`). Reject checkout/cart/fake stock.

---

## 2. Site architecture - continuous journey

```text
Arrive      Home
   ↓
Understand  About → Services → Procurement Services → Global Sourcing
   ↓
Relate      Industries → Supplier Network
   ↓
Discover    Product Catalog → Product Details
   ↓
Resolve     FAQ → Help Center → Contact
   ↓
Commit      Request Procurement (wizard - separate surface, linked everywhere)
   ↓
Comply      Privacy · Terms · Cookies
   ↓
Recover     404 · 500 · Maintenance → back onto the path
```

**Future-ready (flagged, not primary-nav until content exists):** Careers · News & Insights

---

## 3. Navigation flow

| Layer | Items | Rule |
| --- | --- | --- |
| Primary | Home · Services · Industries · Catalog · About | Desktop always visible |
| Capability | Procurement Services · Global Sourcing · Supplier Network | Under Services / Discover |
| Support | FAQ · Help Center · Contact · Track Shipment | Utility + footer |
| Conversion | **Request Procurement** | Persistent primary CTA |
| Account | Sign in | Secondary until intent |
| Legal | Privacy · Terms · Cookies | Footer |
| Future | Careers · News & Insights | Reserved; hidden/flagged until publish |

**Mobile:** Same IA in nav sheet; Request persistent; Account secondary.

**Handoff rule:** Catalog/product/context links into Request Wizard must preserve product/query context.

---

## 4. Page hierarchy & contracts

For every page: Purpose, Business goal, User goal, Primary CTA, Secondary CTA, SEO, Accessibility, Responsive, Motion, Loading, Errors, Performance.

### Homepage

| Dimension | Spec |
| --- | --- |
| Purpose | Position Almahbub; start qualified demand |
| Business goal | Qualified Request starts |
| User goal | Understand who/offer and what to do next |
| Primary CTA | Request Procurement |
| Secondary CTA | Explore Services |
| SEO | H1 global procurement partner Nigeria; Organization schema |
| Accessibility | Skip link, landmarks, AA, ≥44px CTAs |
| Responsive | Brand-first hero; stacked CTAs mobile |
| Motion | ≤240ms hero text; no autoplay |
| Loading | LCP image priority; SSR shell |
| Errors | Media/section fallbacks; no blank hero |
| Performance | One LCP asset; lazy below-fold |

### About

| Dimension | Spec |
| --- | --- |
| Purpose | Prove identity, story, accountability |
| Business goal | Trust / brand equity |
| User goal | Know who we are |
| Primary CTA | Request Procurement |
| Secondary CTA | Explore Services |
| SEO | About / Organization entities |
| Accessibility | Readable measure; heading order |
| Responsive | Editorial stack |
| Motion | Quiet fade only |
| Loading | SSR; lazy media |
| Errors | Media retry; content still readable |
| Performance | Static-first |

### Services

| Dimension | Spec |
| --- | --- |
| Purpose | Map capability areas |
| Business goal | Service-qualified traffic |
| User goal | Pick a path |
| Primary CTA | Request Procurement |
| Secondary CTA | Open service detail |
| SEO | Service collection + internal links |
| Accessibility | Whole-card keyboard targets |
| Responsive | 4 → 2 → 1 |
| Motion | 120ms hover tone |
| Loading | SSR list; defer imagery |
| Errors | Empty CMS state with Contact |
| Performance | Copy before images |

### Industries

| Dimension | Spec |
| --- | --- |
| Purpose | Show sector fit |
| Business goal | Industry-qualified demand |
| User goal | See relevance |
| Primary CTA | Request for this industry |
| Secondary CTA | Related services |
| SEO | Industry topical authority |
| Accessibility | Descriptive links |
| Responsive | 2 → 1 |
| Motion | Focus/hover only |
| Loading | SSR text-first |
| Errors | Honest “not covered” → Contact |
| Performance | Minimal media |

### Product Catalog

| Dimension | Spec |
| --- | --- |
| Purpose | Evidence-led discovery |
| Business goal | Catalog → request funnel |
| User goal | Find fit under constraints |
| Primary CTA | Open product **or** Request from selection (one dominant per state) |
| Secondary CTA | Save, Compare, Filters |
| SEO | Indexable category/product listings |
| Accessibility | Combobox + facets + live counts |
| Responsive | Grid/list; filter sheet mobile |
| Motion | No result stagger |
| Loading | SSR shell + cursor pagination |
| Errors | Empty explains scope + Request |
| Performance | Server facets; image `srcset` |

### Product Details

| Dimension | Spec |
| --- | --- |
| Purpose | Evidence → request handoff |
| Business goal | High-intent requests |
| User goal | Validate product fit |
| Primary CTA | Request this product |
| Secondary CTA | Save, Compare |
| SEO | Product schema only when factual |
| Accessibility | Gallery keyboard; section headings |
| Responsive | Sticky Request on mobile |
| Motion | Image fade after decode |
| Loading | Critical HTML; lazy docs |
| Errors | “Not provided” for missing fields |
| Performance | Reserved aspect; no CLS |

### Supplier Network

| Dimension | Spec |
| --- | --- |
| Purpose | Explain ecosystem without marketplace falsehood |
| Business goal | Correct supplier/partner expectations |
| User goal | Understand how supply works |
| Primary CTA | Request Procurement |
| Secondary CTA | Become a Partner (gated - not open seller signup) |
| SEO | No invented supplier counts |
| Accessibility | Status as text + icon |
| Responsive | Proof list → stack |
| Motion | None decorative |
| Loading | SSR; lazy logos |
| Errors | No open registry UX |
| Performance | Lightweight logo grid |

### Procurement Services

| Dimension | Spec |
| --- | --- |
| Purpose | Explain managed procurement engagement |
| Business goal | Clarify commercial model |
| User goal | Know how working together works |
| Primary CTA | Request Procurement |
| Secondary CTA | Talk to specialist |
| SEO | Service + supporting FAQ |
| Accessibility | Process as ordered list |
| Responsive | Timeline vertical on mobile |
| Motion | Optional connector ≤240ms |
| Loading | SSR; inline SVG |
| Errors | Contact fallback |
| Performance | No Lottie dependency |

### Global Sourcing

| Dimension | Spec |
| --- | --- |
| Purpose | Corridors and geographic capability |
| Business goal | Corridor-qualified demand |
| User goal | Understand reach |
| Primary CTA | Request for corridor |
| Secondary CTA | Explore industries |
| SEO | Country/corridor landing potential |
| Accessibility | Map never sole information |
| Responsive | Map → list on mobile |
| Motion | No looping map animation |
| Loading | SSR corridors; lazy map |
| Errors | Text corridors if map fails |
| Performance | Static corridor content first |

### FAQ

| Dimension | Spec |
| --- | --- |
| Purpose | Clear objections |
| Business goal | Reduce support load; keep funnel warm |
| User goal | Self-serve answers |
| Primary CTA | Request Procurement |
| Secondary CTA | Contact / Help Center |
| SEO | FAQPage schema; HTML answers |
| Accessibility | Accordion button/region |
| Responsive | Full-width |
| Motion | Expand ≤180ms |
| Loading | SSR |
| Errors | Unanswered → Contact |
| Performance | No JS-only answers |

### Help Center

| Dimension | Spec |
| --- | --- |
| Purpose | Guided support IA |
| Business goal | Deflect + correct routing |
| User goal | Solve or escalate |
| Primary CTA | Search help **or** Contact (one primary by state) |
| Secondary CTA | Open article / FAQ |
| SEO | Help article index |
| Accessibility | Search combobox pattern |
| Responsive | Category cards → stack |
| Motion | Panel 180ms |
| Loading | SSR index |
| Errors | Empty search explain |
| Performance | Static articles |

### Contact

| Dimension | Spec |
| --- | --- |
| Purpose | Human path |
| Business goal | Sales/support capture |
| User goal | Reach a person |
| Primary CTA | Send message |
| Secondary CTA | Request Procurement |
| SEO | Contact / Organization points |
| Accessibility | Labeled fields; announced errors |
| Responsive | Stacked form |
| Motion | Validation 120ms |
| Loading | SSR form |
| Errors | Inline + request ID |
| Performance | No heavy third-party embeds |

### Careers (future-ready)

| Dimension | Spec |
| --- | --- |
| Purpose | Employer brand |
| Business goal | Talent pipeline |
| User goal | Explore roles |
| Primary CTA | View open roles |
| Secondary CTA | Contact HR |
| SEO | JobPosting when live |
| Accessibility | List semantics |
| Responsive | Stacked listings |
| Motion | None |
| Loading | Feature-flagged off until content |
| Errors | Empty careers state |
| Performance | Static |

### News & Insights (future-ready)

| Dimension | Spec |
| --- | --- |
| Purpose | Thought leadership |
| Business goal | Organic authority |
| User goal | Learn |
| Primary CTA | Read article |
| Secondary CTA | Newsletter (quiet - never > Request sitewide) |
| SEO | Article schema when published |
| Accessibility | Readable measure |
| Responsive | List → article |
| Motion | No autoplay |
| Loading | Flagged until CMS |
| Errors | Unpublished → 404 |
| Performance | Paginated index |

### Privacy Policy · Terms · Cookie Policy

| Dimension | Spec |
| --- | --- |
| Purpose | Legal clarity & consent context |
| Business goal | Compliance trust |
| User goal | Understand rights/obligations |
| Primary CTA | Contact privacy/legal **or** Open cookie settings (Cookie page) |
| Secondary CTA | Cross-links among legal pages |
| SEO | Indexable; clear titles; last-updated |
| Accessibility | In-page heading nav; skip link |
| Responsive | Long-form readable measure |
| Motion | None |
| Loading | SSR static HTML |
| Errors | Version/date always visible |
| Performance | Minimal JS; lightweight CMP on cookies |

### 404 · 500 · Maintenance

| Page | Purpose | Primary CTA | Secondary | SEO | Notes |
| --- | --- | --- | --- | --- | --- |
| 404 | Recover lost path | Go to Home | Search / Contact | noindex | Suggest high-value links |
| 500 | Honest failure | Retry | Home / Contact | noindex | Show request ID when available |
| Maintenance | Planned downtime | Status / try later | Contact | noindex | ETA if known; CDN static |

Shared: centered calm layout, no marketing clutter, AA contrast, minimal assets.

---

## 5. Component mapping

| Family | Components |
| --- | --- |
| Shell | PublicHeader, PublicFooter, SkipLink, LocaleControl (future), CookieBanner |
| Navigation | PrimaryNav, MobileNavSheet, PersistentRequestCTA, UtilityLinks, Breadcrumb |
| Hero | AccountableCorridorHero, QuickProcurementEntry, TrustStrip |
| Discovery | SearchCombobox, FacetRail, FacetSheet, SortControl, ResultSummary |
| Catalog | ProductCard (Grid/List/Compact/Featured), CompareBar, SaveToList |
| Content | ServiceCard, IndustryCard, ProcessTimeline, StatsRow, PartnerLogoRow, Testimonial, CaseCard, FaqAccordion, HelpCategory |
| Forms | ContactForm, NewsletterForm, CookiePreferences |
| Feedback | EmptyState, ErrorState, SkeletonBlock, low-risk Toast, InlineAlert |
| System | ErrorPageLayout, SeoHead, AnalyticsConsentGate |

---

## 6. Implementation strategy

| Phase | Work |
| --- | --- |
| 0 | Freeze IA, routes, CTAs, anti-patterns |
| 1 | Design system + public shell (header/footer/a11y/cookie) |
| 2 | Journey slice A: Home → Services → Request handoff |
| 3 | Journey slice B: Catalog → Product Detail → Request |
| 4 | Trust/support: About, FAQ, Help, Contact, Legal |
| 5 | Depth: Industries, Procurement Services, Global Sourcing, Supplier Network |
| 6 | System pages: 404 / 500 / Maintenance |
| 7 | Future routes flagged: Careers, News |
| 8 | Perf / a11y / SEO gate → CMS wiring |

**Dependency order:** Shell → tokens/components → slice A → slice B → support → depth → system → future.

---

## 7. Engineering review

| Area | Requirement |
| --- | --- |
| Routing | Locale-ready; no legacy-route dependence |
| Data | SSR/SSG public content; catalog API cursor; supplier field permissions |
| Forms | CSRF, rate limit, spam controls; no secret logging |
| Search | Debounce + abort; no restricted suggestion leakage |
| Errors | requestId on API forms; static 500/maintenance fallbacks |
| Performance | Mobile LCP target ≤2.5s; CLS≈0 on heroes; CDN images; no autoplay |
| Security | CSP-ready; analytics behind consent; PII minimization |
| Observability | CWV + funnel: view → request start → submit |

**Engineering verdict:** Architecture is implementable after shell + API catalog contracts. **Do not start all pages in parallel.**

---

## 8. Design review

| Gate | Pass condition |
| --- | --- |
| Journey continuity | Each page’s primary CTA feeds the next beat |
| One primary action | Squint + button audit (docs/51) |
| Visual system | Navy/blue/gold; documentary imagery; no startup play |
| Catalog honesty | No cart/stock/price invention |
| Supplier Network | Partner ≠ open supplier portal |
| HAQQ TECH | Footer always; never louder than Almahbub |
| Motion | Explain only; reduced-motion instant |
| Premium bar | Clarity + proof + craft - not ornament |

**Design verdict:** Masterplan aligns with homepage/hero/card/search blueprints. **GO for phased implementation planning. NO-GO for big-bang page build in this STOP.**

---

## 9. Related blueprints

- `docs/47` Homepage · `docs/48` Hero · `docs/49` Product cards · `docs/50` Search · `docs/51` Attention laws  
- Canvas: `phase-3-public-website-masterplan.canvas.tsx`

---

## STOP

Public Website Masterplan complete. No page implementation code in this module.
