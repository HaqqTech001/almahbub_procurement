# Phase 3 - Homepage Hero Implementation

**Component:** `HomepageHero` in `@hamd/ui/homepage`  
**Blueprint:** Concept E - Accountable Corridor (`docs/48-phase-3-hero-section-blueprint.md`)  
**Rule:** Implemented faithfully - not redesigned.

---

## 1. Faithful composition (docs/48)

1. Brand (Almahbub International) + quiet Powered by HAQQ TECH  
2. Large H1 headline  
3. One supporting sentence  
4. Primary CTA **Request Procurement** + Secondary **Explore Services** (+ optional Track)  
5. Global procurement quick entry (“Start a request”)  
6. Trust indicators (text strip - **not** overlays on media)  
7. Optional sourced global statistics (below trust; not hero badges)  
8. Full-bleed visual plane (LCP image or professional placeholder)  
9. Scroll indicator to next section  

---

## 2. Micro-interactions

| Interaction | Behavior | Reduced motion |
| --- | --- | --- |
| Button hover | Primary/secondary tone change ≤120ms | Instant |
| Search “card” hover/focus-within | Border emphasis | Instant |
| Counter animation | Ease-out count-up when enabled | Static final value |
| Scroll indicator | Subtle chevron bob | Static |
| Fade-in | Copy group ≤180ms once | Immediate enter |

---

## 3. Performance & a11y

- Hero image uses `fetchPriority="high"`, width/height, `srcSet`/`sizes` - **not** lazy-loaded (LCP).  
- Placeholder path avoids empty LCP when asset missing.  
- Single H1; labelled search; trust/stats lists; focus-visible rings; ≥44px targets.  
- Scrim maintains text contrast on photographic plane.  
- Dark mode via existing `[data-theme="dark"]` tokens + stronger scrim.

---

## 4. Testing

| Suite | Coverage |
| --- | --- |
| Visual/content | Blueprint copy, CTAs, trust, stats, scroll target |
| Accessibility | H1, labelled search, named placeholder `role="img"` |
| Interaction | Quick-entry `onSearchSubmit` |
| Performance contract | LCP image has `fetchpriority=high`, not `loading=lazy` |

Commands:

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
```

---

## 5. Design Review

| Gate | Result |
| --- | --- |
| Matches Concept E order | **PASS** |
| No redesign / no floating badges on media | **PASS** |
| Brand-first + one H1 | **PASS** |
| One primary CTA weight | **PASS** |
| Search = procurement entry, not checkout | **PASS** |
| Stats sourced + not overlay theatre | **PASS** |
| Reduced motion honored | **PASS** |

**Design verdict:** GO - faithful Accountable Corridor implementation.

---

## 6. Engineering Review

| Area | Result |
| --- | --- |
| Package export | `@hamd/ui/homepage` → `HomepageHero` |
| Tree-shakeable | Named export; CSS via `@hamd/ui/homepage.css` |
| Hooks | `usePrefersReducedMotion`, `useCountUp` local to hero |
| Security | No HTML injection; navigation via app callback or URL |
| SEO | Semantic H1 + descriptive image alt from props |
| Maintainability | Props mirror blueprint; fixtures for demos only |

**Engineering verdict:** GO for composition into public Homepage shell.

---

## STOP

Homepage Hero implemented per approved blueprint. No redesign.
