# Migration Summary - Homepage (`/`) · Phase A production

**Phase:** RC3 · Phase A · Page 1 (production quality)  
**Host:** `apps/web` (`@hamd/web`)  
**Design role:** Official Version 2 design foundation (Brand Handbook §30)

## Run

`corepack pnpm --filter @hamd/web dev` → http://127.0.0.1:3000/

## What shipped

- Full production overrides for every Homepage section (no fixture bleed)
- Branded SVG media for overview, categories, products, partners
- Shared primitives: `FeatureCard` (services), `BackgroundPattern` (CTA), `PublicPageFrame`, `CampaignBanner`, `EmptyState` / `ErrorState`, `PoweredByAttribution` (footer only)
- Newsletter: waitlist + optional API; honest success copy (no silent fake inbox)
- FAQ JSON-LD uses merged production FAQ
- Soft-landing pages for Homepage CTAs not yet migrated
- HAQQ TECH attribution footer-only

## Quality artifacts

See [`quality/QUALITY-REPORT.md`](./quality/QUALITY-REPORT.md) for:

1. Desktop / tablet / mobile screenshots  
2. Lighthouse scores  
3. Accessibility (axe) report  
4. Remaining issues  

**STOP before Authentication.**
