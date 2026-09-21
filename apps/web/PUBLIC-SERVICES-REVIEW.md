# Public service redesign

Implemented in the active V2 Web app and shared UI package. No API-server, Ops, database, environment or hosted-service changes were made for this redesign. No commit, push or deployment was performed.

## Navigation and routes

- `packages/ui/src/navigation/GlobalHeader.tsx` remains the single public navbar implementation. The export layout now consumes it through `usePublicHeaderProps`, retaining its existing export footer and brand tokens.
- Main order: Home, Global Procurement, Nigerian Export, Services, About, Contact. The service labels are normal links with separate attached disclosure buttons. Search, theme, guest authentication and authenticated account controls remain available.
- Procurement identity: **Almahbub International**, existing `/almahbub.svg`.
- Export identity: **Almahbub Integrated Export Ltd.**, existing `/media/brands/almahbub-integrated-export.jpg`. “Nigerian Export” is a navigation label only.
- Home points to `/`, including authenticated sessions. The former authenticated redirect on `/` was removed. Workspace access remains in authenticated account controls.
- Existing service URLs are retained: `/businesses/almahbub-international` and `/businesses/almahbub-integrated-export`. No new alias or migration is required.
- Procurement menu anchors target the service page's category and process sections. Existing category preview, product-detail and filtered-catalogue routes remain intact. Export links use the existing commodity, process, quality, markets and request routes.
- Desktop disclosure supports hover, click, safe pointer transit, outside click, Escape, Tab and arrow-key navigation. Mobile/tablet uses drawer accordions and a focus cycle inside the open drawer.
- Light page: navy menu with light text. Dark page: white menu with dark text. Mobile accordion panels follow the same inversion. Page sections and the shared footer follow the page theme.

## Service pages and content

The procurement service home has a logistics hero, requirement-driven sourcing copy, actual API categories, process, sourcing rationale, existing consented testimonials, FAQ and request CTA. It does not add product rows beneath each category.

The export service home has a distinct agricultural hero, the actual export identity, actual published commodity records, links to process/quality/markets, FAQ and export request CTA. It introduces neither a commodity-category layer nor invented customer endorsements.

The main homepage remains the umbrella introduction and explicitly distinguishes the two operations. Existing supporting sections and the global wedding announcement are preserved.

## Hero assets and performance

Reused repository photographs, with no new image generation:

| Service | Existing source | Responsive derivatives |
| --- | --- | --- |
| Procurement | `/media/ie/portal/hero/ie-portal-home-hero-02.webp` | `/media/services/procurement-640.webp` (50,308 bytes), `procurement-1280.webp` (148,122 bytes) |
| Export | `/media/ie/commodities/sesame-seeds/hero/ie-sesame-seeds-hero-01.webp` | `/media/services/export-640.webp` (32,116 bytes), `export-1280.webp` (68,692 bytes) |

The derivatives are resized WebP copies, with the original photographs retained. `srcSet`/`sizes` select 640, 1280 or 1920-pixel media according to display width and device pixel ratio. Only the current service hero mounts with high fetch priority. Below-the-fold category and commodity images retain their existing lazy loading. Static assets remain on the normal public asset path and reuse the existing hosting/cache configuration; no hosting configuration was changed.

All headings, overlays, labels and buttons are coded. No new font files, certifications, supplier identities or statistics were introduced. New user-facing copy contains no U+2014 em dash.

## Wedding control

`WeddingMonogram.tsx` supplies an original stroked SVG H-heart-M monogram with the exact caption `Rowdotul HAMD'26`. The compact floating button uses a restrained glow and honors reduced motion. It opens the existing invitation modal. Explicit reopening does not clear the session-dismiss flag, so automatic promotion remains dismissed. Existing campaign polling, disable behavior, modal actions and announcement handling remain in place. Browser verification also exposed a public campaign refresh defect: after anonymous session initialization, the authenticated request helper rejected polling before sending a request. The public campaign GET now uses the bounded public fetch helper. Private wedding actions retain the authenticated session helper, covered by a regression test.

## Changed files for this redesign

- Shared UI: `packages/ui/src/navigation/GlobalHeader.tsx` and `GlobalHeader.test.tsx`.
- Navigation: `src/content/public-navigation.ts`, `src/lib/use-public-header-props.tsx` and its test, `src/App.tsx`.
- Pages: `src/pages/BusinessPage.tsx`, `src/pages/HomePage.tsx` and its test, `src/content/commerce.ts`, `src/integrated-export/IntegratedExportLayout.tsx` and its test, `src/integrated-export/pages/IeHomePage.tsx`.
- Components: `src/components/ServiceHero.tsx`, `src/components/WeddingMonogram.tsx`, `src/app/CelebrationHost.tsx` and its test.
- Styles: `src/styles/critical.ts`, `src/styles/public-experience.css`, `src/styles/service-pages.css`.
- Assets: four WebPs under `public/media/services/`.
- Public campaign client: `src/wedding/wedding-api.ts` and `wedding-api.test.ts`.
- Review: `e2e/public-services-review.mjs` and this report. Existing unrelated working-tree changes are preserved.

## Validation

Web typecheck, shared UI typecheck, Web production build, scoped ESLint and `git diff --check` passed. Focused tests passed: 32 Web tests and nine shared-header tests. API typecheck was not required because this redesign does not change API code.

Browser review results are written to the ignored `apps/web/commerce-test-results/public-services/` directory. The runner uses a local production preview and intercepts every API and external request. Catalogue records and authentication are local test fixtures, not a live inventory or hosted-account audit. No database is contacted.

Browser matrix: **136/136 cases passed**, covering 17 routes at 390, 768, 1024 and 1440 pixels in light and dark mode. Checked the main landing, procurement home/category/catalogue/product detail, export home/commodity list/detail/process/quality/markets/about/contact/request, Services, global About and Contact.

The final production run also passed desktop hover/click/Escape/arrow navigation, pointer access to the last menu item (preventing hidden-overflow regressions), outside click, drawer accordions, Home navigation from both services, mocked signed-in Home, cross-page category anchors, hero decoding/current-service loading and invitation reopening/dismissal. The invitation remained open through the 10-second campaign refresh. No browser runtime errors or horizontal page overflow were observed.

Screenshots were visually reviewed, including the desktop attached menus and both service heroes on mobile/tablet. Results and screenshots are ignored by Git, and nothing is staged.

## Reproduce locally

Run from the repository root:

```powershell
corepack pnpm --filter @hamd/ui build
corepack pnpm --filter @hamd/web typecheck
corepack pnpm --filter @hamd/web build
corepack pnpm --filter @hamd/ui exec vitest run src/navigation/GlobalHeader.test.tsx
corepack pnpm --filter @hamd/web exec vitest run src/lib/use-public-header-props.test.ts src/app/CelebrationHost.test.tsx src/integrated-export/IntegratedExportLayout.test.tsx src/pages/HomePage.test.tsx src/pages/ProcurementCategoryPage.test.tsx src/integrated-export/pages/IeCommodityPages.test.tsx src/wedding/wedding-api.test.ts
node apps/web/e2e/public-services-review.mjs
git diff --check
```

These commands do not require starting the API or modifying the database. The browser runner saves screenshots and a JSON result file locally.
