# RC-POLISH-06 - Announcement slider + wedding celebration + hero mobile composition

**Status:** Verified - STOP (no further feature work until accepted).

## Announcement architecture

```
AnnouncementSlider (@hamd/ui/marketing)
  └── AnnouncementSlide[]  (reusable UI contract)
        ├── founder-wedding-september-2026  (celebration theme)
        └── sourcing-season-guidance-2026   (default theme)
```

Hosts resolve config → slides:

- `apps/web/src/content/campaigns.ts` - `SiteCampaign[]` + activity window / kill-switches
- `apps/web/src/lib/announcement-slides.ts` - maps to `AnnouncementSlide`
- Wired in `HomePage`, `RootLayout`, `WorkspaceShell`

Wedding is **one data item**, not hard-coded into the header.  
`CampaignBanner` remains a thin single-slide wrapper over `AnnouncementSlider`.  
No fake admin CMS; Genesis announcements API is not inventively wired.

## Contract (`AnnouncementSlide`)

`id`, `title`, `message`, `category`, `priority`, `publishedAt`, `expiresAt`, `dismissible`, `mediaSrc`/`mediaAlt`, `ctaLabel`/`href`, `theme`, `showConfetti`.

## Slider behavior

- Prev/next + dots only when `length > 1`
- Auto-rotate; pause on hover/focus; keyboard (arrows/Home/End); touch swipe
- Per-slide dismiss + restore; reduced-motion disables particle motion / auto-rotate chrome as applicable
- Accessible region label: “Site announcements”

## Wedding design

- Theme: `celebration` - warm navy/gold/rose gradient, serif eyebrow hierarchy
- Copy: “Celebrating with our family” + September congratulations + CTA
- Decor: `ConfettiField` balloons + sprinkles (`pointer-events: none`, overflow contained); soft CSS accent orbs
- Motion: gentle float/drift; `prefers-reduced-motion` hides/stops particles

## Hero layout - root causes & fixes

| Issue | Root cause | Fix |
| --- | --- | --- |
| Stacked right panel left-offset | Desktop absolute card positions + right-biased SVG retained on mobile | ≤1023px: normal grid flow; stage/cards full width; SVG centered |
| Empty left space | Stage art `object-position` / transform bias | `preserveAspectRatio` + center object positioning |
| Floating card radii | Previous all-corner radius | Logical radii: start (left) rounded; end (right) square - scoped to `.hamd-hero-visual__card` only |
| “Missing images” | Cards were never photo slots | SVG glyph icons in card chrome; illustration remains the stage canvas |

## Files changed (primary)

- `packages/ui/src/marketing/AnnouncementSlider.tsx` (+ test)
- `packages/ui/src/marketing/ConfettiField.tsx`
- `packages/ui/src/marketing/CampaignBanner.tsx`
- `packages/ui/src/styles/campaign-banner.css`
- `packages/ui/src/styles/hero-visual-system.css`
- `packages/ui/src/homepage/HeroVisualSystem.tsx`
- `apps/web/src/content/campaigns.ts`
- `apps/web/src/lib/announcement-slides.ts`
- `apps/web/src/pages/HomePage.tsx`, `RootLayout.tsx`, `WorkspaceShell.tsx`
- `apps/web/e2e/rc-polish-06-announcement-hero.spec.ts`
- Evidence: `apps/web/e2e/evidence/rc-polish-06/`

## Quality gates

| Gate | Result |
| --- | --- |
| `@hamd/ui` build | Pass |
| `@hamd/ui` AnnouncementSlider + HeroVisualSystem tests | Pass |
| `@hamd/web` typecheck | Pass |
| `@hamd/web` lint | Pass |
| `@hamd/web` unit tests | Pass (prior full run) |
| Playwright `rc-polish-06-announcement-hero` | Pass (2/2) |

## Screenshots (evidence)

| Requirement | File |
| --- | --- |
| Desktop announcement / hero 1280 | `desktop-announcement-hero-1280.png` |
| Desktop announcement / hero 1920 | `desktop-announcement-hero-1920.png` |
| Desktop slider crop | `desktop-announcement-slider-1280.png` |
| Wedding active | `wedding-announcement-1280.png` |
| Wedding animation | `wedding-celebration-animation-1280.png` |
| Multi-announcement | `desktop-multi-announcement-1280.png` |
| Mobile announcement 390/430 | `mobile-announcement-390.png`, `mobile-announcement-430.png` |
| Mobile hero | `mobile-announcement-hero-390.png`, `…-430.png` |
| Stacked panel | `mobile-stacked-panel-390.png`, `…-430.png` |
| Card borders | `hero-card-border-1280.png` |
| Navbar | `navbar-1280.png`, `navbar-1920.png` |

## Accessibility

- Slider: semantic controls, aria-labels, keyboard, focus, reduced-motion
- Cards: decorative `aria-hidden` layer; readable contrast; icons + text hierarchy

## Remaining defects / follow-ups (non-blocking)

- Announcements remain config-driven until a real CMS/API domain is productized
- Third floating card on desktop may sit partially below the fold depending on viewport height (composition intentional; not a mobile alignment bug)

## STOP

RC-POLISH-06 is complete for review. Do not start another feature until accepted.
