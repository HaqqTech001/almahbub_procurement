# Phase 3 - Hero Visual System

**Component:** `HeroVisualSystem` + `HomepageHero` visual modes  
**Styles:** `hero-visual-system.css` (via `@hamd/ui/homepage.css`)  
**Doctrine:** Accountable Corridor (docs/48) - brand/copy hierarchy unchanged; visual plane upgraded.

---

## 1. Mission

A premium hero visual that communicates:

| Signal | How the visual shows it |
| --- | --- |
| Global procurement | Corridor pins, trade arcs, isometric platform |
| International trade | Stylized globe meridians + lane card (e.g. Lagos → Rotterdam) |
| Technology | Tech rails, network nodes, dash-route motion |
| Professionalism | Deep navy atmosphere, restrained gold pin, no stock clichés |
| Efficiency | Shipment stage card + cargo unit on an active route |

**Not stock photography.** Default plane is a **layered SVG illustration system**.

---

## 2. Implementation

### Layers

1. **Atmosphere** - radial glows + masked grid  
2. **3D-style platform** - isometric slab (procurement “desk”)  
3. **World trade indicators** - stylized globe, meridians, corridor arcs/pins  
4. **Supplier network** - node graph  
5. **Shipment visualization** - dashed route + isometric cargo  
6. **Floating information cards** - corridor / shipment / network (decorative; `aria-hidden`)

### `HomepageHero` modes

| Mode | Behavior |
| --- | --- |
| `layered` (default) | SVG system only - zero photo bytes |
| `image` | Photographic LCP (`fetchpriority=high`) |
| `hybrid` | Lazy photo base (low opacity) + layered SVG |
| `placeholder` | Minimal fallback plane |

```tsx
import { HomepageHero, HeroVisualSystem } from "@hamd/ui/homepage";
import "@hamd/ui/homepage.css";

// Default - layered system
<HomepageHero />

// Hybrid - optional documentary texture under SVG
<HomepageHero visualMode="hybrid" imageSrc="/media/ops.webp" />

// Photo-only (legacy / campaign)
<HomepageHero visualMode="image" imageSrc="/media/hero.webp" imageAlt="…" />
```

Cards are configurable via `visualCards` / `HeroVisualSystem` props.

---

## 3. Responsive · Dark · Motion

| Surface | Behavior |
| --- | --- |
| Desktop | Full scene + 3 cards in the visual (right) half |
| Tablet | Hide 3rd card; simplify density |
| Mobile | One card; scaled canvas; softer glows |
| Dark mode | Deeper card surface via `[data-theme="dark"]` |
| Reduced motion | `prefers-reduced-motion` + `reduceMotion` prop - no dash/float |

Floating cards sit in the **visual half**, not over brand/H1/CTAs on desktop (scrim still protects copy).

---

## 4. Performance

| Rule | Implementation |
| --- | --- |
| SVG where appropriate | Entire default system is inline SVG + CSS |
| Optimized assets | No required raster for `layered` |
| Lazy loading | Hybrid photo uses `loading="lazy"`; SVG is light and eager |
| Motion | Transform / stroke-dashoffset only; long, calm loops |

---

## 5. Asset recommendations

| Asset | Spec | Priority |
| --- | --- | --- |
| Default | Ship `layered` SVG system as-is | **Required** |
| Optional hybrid base | Custom documentary still (port/inspection/warehouse), desaturated, 1600×1200 WebP/AVIF, &lt;120KB | Optional |
| Do **not** use | Handshake stock, generic globes with continents photo, smiling warehouse clipart, neon SaaS mock chrome | Reject |
| Future illustration pack | Export platform/globe/network as separate optimized SVGs if marketing needs campaign variants | Later |
| Lottie/Rive | Avoid on LCP path; SVG+CSS is enough | Reject for hero |

If commissioning illustration: isometric navy/teal palette, flat metallic materials, no characters required, corridor metaphor preferred.

---

## 6. Fallback strategy

| Condition | Fallback |
| --- | --- |
| No JS / CSS only | Atmosphere gradient still readable under scrim; cards may be static |
| `prefers-reduced-motion` | Static scene (`--static` / media query) |
| SVG unsupported (rare) | Atmosphere + cards still paint; canvas hidden by CSS if needed |
| Host forces photo campaign | `visualMode="image"` with prioritized WebP/AVIF |
| Photo fails to load (hybrid) | Layered SVG remains complete - photo is optional texture |
| Extreme low bandwidth | Keep `layered`; never block LCP on hybrid photo |
| Broken custom cards prop | Pass `[]` to hide cards; network/world/shipment SVG remain |

**Accessibility fallback:** one `role="img"` name on the composition; card text is decorative (`aria-hidden`) so screen readers are not flooded - operational facts stay in hero copy/trust/stats.

---

## 7. Testing

`HeroVisualSystem.test.tsx` + existing `HomepageHero.test.tsx`

```bash
pnpm --filter @hamd/ui test
pnpm --filter @hamd/ui build
```

---

## 8. Quality notes vs Concept E

Concept E forbids **marketing sticker overlays on copy**. This system places informational cards inside the **visual plane** as part of the illustration - they do not replace trust strip or CTAs, and they are hidden from the accessibility tree as individual announcements.

---

## STOP

Hero Visual System implemented with asset recommendations, fallback strategy, and documentation.
