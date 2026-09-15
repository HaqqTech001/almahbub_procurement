# Business gateway and content correction

Implemented locally on 15 September 2026. No commit, push, deployment or database mutation was performed. Existing staged and unstaged work, including wedding functionality, was preserved.

## 1. Final homepage hierarchy

1. Unified Multi-Commerce Import & Export hero, with equally styled links to both operation sections.
2. Almahbub International: positioning, one concise description, published category images/names linking directly to filtered catalogue pages, then Explore International.
3. Almahbub Integrated Export: positioning, one concise description, published commodity images/names linking directly to detail pages, then Explore Integrated Export.
4. One final request section, with import procurement and export quotation destinations.
5. Existing shared footer, with corrected operation descriptions and homepage gateway links.

Both operation sections use the same typography, grid and spacing. Desktop grids use five columns, intermediate widths three, and mobile two. No separate generic company introduction or process section precedes the operations.

## 2. Exact hero copy

Eyebrow: **MULTI-COMMERCE IMPORT & EXPORT**

Headline, on three lines:

> Commerce Across Borders.
> Sourcing What Businesses Need.
> Supplying What the World Needs.

Supporting copy:

> Our import and export operations connect international sourcing with agricultural commodity trade across China, USA, UK, UAE, Korea and other markets.

Section links: **Almahbub International** and **Almahbub Integrated Export**.

The header identifies the gateway as Almahbub Multi-Commerce. The hero does not attribute agricultural commodity export to International.

## 3. International copy

Name: **Almahbub International**

Positioning: **Devices, Machinery & General Items Import**

Homepage description:

> International sourcing and procurement of devices, machinery and general merchandise from major markets including China, USA, UK, UAE and Korea.

Action: **Explore International**, linking to `/businesses/almahbub-international`.

Dedicated business lead:

> Source devices, machinery and general merchandise to your specifications.

Sourcing guidance:

> Include specifications, quantity, budget and delivery destination. Our team confirms supplier options, pricing and delivery terms in your quotation.

## 4. Integrated Export copy

Name: **Almahbub Integrated Export**

Positioning: **Agricultural Commodity Export**

Homepage description:

> Connecting quality agricultural commodities to international buyers, supporting trade that provides sustenance to the world.

Action: **Explore Integrated Export**, linking to `/businesses/almahbub-integrated-export`.

Dedicated business lead:

> Browse agricultural commodities and discuss grades, packaging and export requirements with our team.

Buyer guidance:

> Share the commodity, grade, quantity, packaging and destination. Availability, quality requirements, documentation and shipping terms are confirmed for your order.

## 5. International categories displayed

Production renders the actual published categories returned by the existing `/api/v1/categories` endpoint, including their assigned image and name. Each links to `/products?category=<slug>`. Categories are not hardcoded into the homepage and are not dependent on a successful products-list request.

The repository catalogue contains these ten category names, used in browser fixtures:

- Electronics and gadgets
- Medical and healthcare equipment
- Home, garden and facilities
- Machinery and industrial
- General procurement
- Home appliances
- Office and business
- Fashion and textiles
- Beauty, spa and salon
- Retail and store setup

Live publication state could not be independently confirmed: the local API was unavailable and the configured database rejected authentication with PostgreSQL code `28P01`. These names describe the repository catalogue and tested fixture, not a verified live database snapshot. Browser category images use a test fixture; production consumes each category's assigned media URL.

## 6. Integrated Export commodities displayed

Production renders the existing published commodity API records through the existing catalogue hook. Every name/image links directly to `/businesses/almahbub-integrated-export/commodities/<slug>`.

Repository commodity names used for the browser fixture:

- Sesame Seeds
- Cashew
- Ginger
- Hibiscus
- Shea
- Soybean
- Cocoa

The repository static published catalogue is empty, and its seven-name manifest is explicitly a draft manifest. This change does not publish those drafts or assume their live publication status. Browser tests supply published fixtures and existing local commodity images to verify the complete layout. API errors show a retry action; an empty published list shows a concise availability message. Both business entry points remain available.

## 7. Old group/AS page disposition and redirects

Before removal, the existing `/group` page was reported to the user as a duplicate gateway: group hero, relationship diagram, business cards, a switcher and repeated International links. `/businesses` pointed to it. Inbound paths were found in homepage content, header/footer configuration, the shared GROUP constant, About and International business pages.

- `/group` and `/group/` now replace the browser route with `/`.
- `/businesses` now redirects directly to `/`.
- `GroupPage.tsx` contains only the compatibility redirect; its old visual page content is removed.
- Shared business switchers, business data and brand components remain because other pages still use them.
- No separate active `/as` route was found. No speculative alias was added.

These are React Router redirects. No hosting-layer HTTP 301 was configured because no applicable hosting redirect configuration was present in the repository.

## 8. Sections removed from the homepage

Removed the International-only hero composition, trust strip, procurement workflow, generic services section and featured-products repetition. The small Export services entry is replaced by a full operation section. Category descriptions under every image are omitted. Repeated procurement CTAs are consolidated into the final request section.

Historical shared homepage content remains where other public pages consume it. The new homepage does not mount that old below-fold composition.

## 9. Sections removed or merged from International

- Business profile: removed the corporate/group breadcrumb, profile illustration, repeated identity paragraphs, capability list, duplicate actions and group switcher panel. Replaced with concise identity, actual categories, full-catalogue link and one sourcing request section.
- About: replaced long company/process copy, feature card and three overlapping contact/request sections with one explanation and one request action.
- Services: removed repeated closing contact CTA and shortened the introduction.
- Service detail: removed the generic audience section and duplicate final CTA; retained coverage and useful engagement information.
- The old `/services/import-export` URL remains valid, but its public title and coverage now describe **Import Coordination**.
- Existing catalogue search, filters, sorting, pagination, product details and request prefill remain.

## 10. Sections removed or merged from Integrated Export

- Home: removed trust strip, long company/about introduction, group switcher, separate process-card section, quality promotion, decorative markets section and repeated closing CTAs. Retained commodity discovery and one short buyer-guidance/request section.
- About: merged identity, focus, group tree, repeated process, buyer topics and coordination cards into concise business identity and order guidance.
- Process: replaced large hero imagery, repeated introductions, illustrated stages and duplicate CTAs with a four-step order process and one quotation action.
- Quality: merged introduction, approach, specification, destination, repeated buyer topics and catalogue repetition into specifications to confirm plus documentation guidance.
- Markets: removed decorative coverage imagery, repeated flow and empty market-data section; retained destination and availability guidance.
- Contact: merged repeated introductions, contact/channel cards, requirement checklist and final CTA into the existing email channel and one quotation action.

All dedicated Export routes and the quotation/request form remain accessible.

## 11. Detail-page simplifications

International product details retain name, description, gallery/lightbox, brand/manufacturer, specification fields, sourcing status, videos and the existing request action. Removed two repeated category labels while retaining category navigation in the breadcrumb. Description now follows the product name.

Export commodity details retain name, short description, imagery, specifications, packaging, quality, applications, markets, gallery and the existing auth-aware quotation action. Specifications precede the longer description. The longer description is omitted when identical to the short description. Spacing is reduced and the request explanation shortened. Buyer data is retained rather than truncated.

Category-filtered product pages were already compact and retain discovery controls. No product, commodity or operational records were deleted.

## 12. Route and SEO changes

- Both operations are visible in guest navigation as well as signed-in navigation.
- Inbound group links point directly to the homepage.
- Removed `/group` from the sitemap.
- Updated the initial HTML title and description plus homepage runtime metadata to describe both operations.
- Runtime homepage metadata uses the shared Almahbub identity. Export metadata uses Integrated Export rather than appending International.
- Homepage canonical remains `/` and the compatibility redirect resolves there.
- All existing business, category, product, commodity, authentication, procurement, quotation, Ops and wedding routes remain.

## 13. Responsive verification

Chromium checks cover 320, 390, 768 and 1280 pixels across the homepage, International main page, Export main page, product detail and commodity detail. Tests check horizontal overflow, hierarchy, record counts, category/detail links, old-route redirects, catalogue outage/retry behavior, image loading and dark-mode discovery.

Screenshots use test API fixtures, not a live publication snapshot. Existing wedding announcement chrome remains in the preview.

## 14. Build and test results

- Production web build: passed, including TypeScript compilation.
- Affected runtime-file ESLint checks: passed.
- Affected regression suite: **23 files, 74 tests passed**, including Export request forms, layout, catalogue/media helpers, redirects, homepage and SEO foundation checks.
- Full-suite audit before the last test correction: 186 passed and 6 failed. One failure was an obsolete Overview heading assertion, subsequently corrected and passed in the affected suite. Five unrelated existing failures remain: one product-list error-state timing assertion, two procurement detail tests missing ToastProvider, and two procurement-list tests using an ambiguous repeated item label. Their application/test files were not changed by this task.
- Final browser checks: **7 tests passed**, including all four responsive widths, direct navigation, redirects, outage recovery and dark mode.

No commit or push was made.

Final browser run: **7 tests passed**. All seven commodity fixture images were loaded and decoded before responsive screenshots. Visual inspection confirmed the equal operation layouts and readable light/dark themes.

Validation artifacts are retained locally under `build/commerce/` (ignored build output):

- `commerce-build.log`
- `commerce-targeted-tests.log`
- `commerce-tests-final.log` (broader-suite audit)
- `commerce-browser.log`
- `commerce-lint.log`
Responsive and dark-mode screenshots remain in `apps/web/commerce-test-results/`.
