# Almahbub UX and Rowdotul HAMD'26 implementation review

Review date: 14 September 2026. No commits, pushes, index changes, environment-file edits, or production database migrations were performed by this implementation.

## Architecture and persistence

The existing pnpm/Turborepo API, public Web, Ops, shared UI/constants, and Prisma architecture remains in place. Buyer and Ops permissions remain separate. Private StoredDocument storage is unchanged.

Wedding uploads reuse the catalogue public-media store factory and its configured local, Supabase, or S3 driver. The existing wedding storage UUID and path convention remain intact. Local development still uses disk. Configured production object storage holds new audio bytes; production playlist database failures return a recoverable error instead of silently falling back to ephemeral disk. Playlist settings hydrate saved tracks before writing, and failed hydration can be retried. Existing locally uploaded files still require copying or re-uploading before an ephemeral deployment.

Public catalogue-media API paths resolve against the configured API base in Web, so separate Web/API origins work. Absolute provider URLs and intentional public static paths remain unchanged. The existing public-media route retains its path, identifier, MIME, and access checks and uses Express file serving for GET ranges and conditional requests. HEAD ignores Range; unsatisfiable GET ranges return 416, and failed preconditions retain 412. Catalogue storage and private documents have not been combined.

## Migration and date

New migration: `database/prisma/migrations/20260910120000_wedding_participation_and_date/migration.sql`.

It creates separate `wedding_subscriptions` and `wedding_waiting_memberships` tables with campaign/user uniqueness, foreign keys, status timestamps, and listing indexes. Existing AuditEvent records retain transition history. The migration corrects the known campaign's old September 29/30 event and stream dates to **26 September 2026**, preserving times, and adjusts its known old promotion expiry. Shared defaults and API normalization use the corrected date; countdowns, modal copy, and derived Ops/public content follow it. Historical applied migrations were not edited. September 29 remains legitimate as the corrected promotion expiry.

Prisma validation, generation, and database package build passed. The migration has **not** been applied to a live database. Review and apply it through the existing migration deployment workflow before deploying the dependent API; do not use db push.

## Request wizard and actionable errors

The wizard already had step validation, but error navigation and field feedback were incomplete. Next now retains current-step gating with precise inline messages, scrolling and focusing the first useful invalid field. Final and structured API errors map through a central field-to-step mechanism; error-summary buttons return to the correct field without discarding entered values. Quantity, item text, delivery, budget, currency, notes, and date rules align with API constraints. Optional category selection is no longer presented as required. Duplicate notes input was consolidated.

The existing local draft is saved before submission. The shared error surface provides sign-in/session recovery, safe return destinations, permission guidance, and retry actions. Authenticated users receive session recovery or permission guidance rather than an unconditional login redirect. Existing draft limitations, including non-persistence of attachment bytes, remain.

## Homepage and images

The hero immediately describes sourcing and procurement, with a primary request action and secondary service discovery. Retained: navigation, footer, newsletter in the footer, organization metadata, real catalogue categories/products when available, and Integrated Export entry. Added/consolidated: three simple process steps, concise service cards, short trust statements, and a final request/contact action. Repetitive company/group, industry, statistics, testimonial, benefits, FAQ, and body newsletter sections are no longer rendered. FAQ structured metadata was removed with its visible section. Unused content definitions were not broadly deleted.

Image audit distinguished these classes:

- Intentional static public assets: 134 tracked assets were checked; active production `/media` and `/almahbub` literal references resolved with matching case. Vite public-path conventions and Git trackability remain intact. Missing literal paths identified in this audit were test fixtures.
- Uploaded public catalogue/wedding media: API-relative URLs previously resolved on the Web origin. Shared API-base normalization fixes this for catalogue, Integrated Export, and wedding consumers.
- Provider objects: absolute URLs remain intact; actual production object existence and bucket permissions require a deployment smoke test.
- Unavailable/stale images: neutral fallbacks now cover relevant category and wedding images. Integrated Export resets failure state when its source changes, allowing a replacement image to load. No product imagery was fabricated.

No .gitignore changes or broad image exclusions were introduced.

## Wedding experience

Ops uses the existing persisted `modalEnabled` setting with a clearly labelled Wedding promotion control. Public campaign reads refresh persisted configuration; failed configuration requests do not auto-open a promotion. Public polling picks up toggle changes while retaining existing route eligibility and session dismissal rules.

The compact invitation shows the corrected date, primary wedding action, close control, and explicit Continue browsing action. Native dialog keyboard focus and Escape behavior remain. After eligible dismissal, a subtle wedding entry control links to the canonical wedding page; it disappears when promotion is disabled or the current route makes it redundant. Animation respects reduced motion. Cookie-banner height is measured to prevent overlap on narrow screens; the control remains separate from chat.

Update subscriptions require a signed-in, verified-email account to subscribe, persist idempotently, show current state, and support unsubscribe. No second mail framework or bulk email sender was added, and no emails were sent by this work.

Waiting-room membership is a separate authenticated join/leave/rejoin record. Leaving preserves the row and audit history. Refresh reloads membership. A visible-page heartbeat runs every 30 seconds; activity expires after 90 seconds. Heartbeat cannot rejoin a departed member. Ops has authorized paginated lists and counts, safe display names, timestamps, status, and 10-second polling. Existing live viewer counts remain distinct. Waiting audio ordering, disabled-track skipping, loop behavior, and live-transition stop/fade logic were preserved.

## Validation

| Check | Result |
| --- | --- |
| Prisma validate/generate and database build | Passed; no live migration applied |
| Constants build/tests | Passed, 15 tests |
| Shared UI build and focused wizard/modal tests | Passed, 24 tests |
| API full suite | Passed, 312 tests before the final persistence guards |
| Final API wedding/media regression run | Passed, 33 tests after the final guards |
| Final API typecheck/build and focused lint | Passed |
| Web typecheck/build | Passed |
| Web full suite | 195 passed, 5 failed; failures listed below |
| Additional focused Web checks | Passed, including auth, media, participation, promotion, and cookie behavior |
| Ops typecheck/build | Passed |
| Ops full suite | 61 tests passed; one existing empty test suite failed collection |
| Modified-file lint | Passed |
| Browser responsive invitation/re-entry checks | 6 passed: 320, 360, 375, 390, 768, and 1280 px |
| Source diff whitespace check | Passed excluding generated test reports |
| Full diff whitespace check | Failed only on staged generated Playwright error-context reports |

Browser checks covered date, primary/dismiss actions, horizontal overflow, focus, Escape, reduced motion, cookie coexistence, and re-entry. Wizard mobile focus was covered with focused DOM tests and layout review; a full authenticated wizard flow was not browser-tested against production services.

Remaining Web failures are in unchanged pages/tests and were established as unrelated to this patch:

1. `ProductsPage.test.tsx` — `public products page shows an error when the catalogue API fails`: cannot find heading `/unable to load products/i`.
2. `ProcurementRequestDetailPage.test.tsx` — `buyer request detail mutations keeps a successful cancel even when a later refresh would 404`: `useToast must be used within a ToastProvider`.
3. Same file — `deletes a cancelled request without fetching the deleted id again`: the same missing ToastProvider error.
4. `ProcurementRequestsPage.test.tsx` — `My Requests deletion removes a deleted request from the list without refetching the deleted id`: multiple elements match `Cancelled valves` across desktop/mobile markup.
5. Same file — `does not treat a background list refresh failure as a delete failure`: the same duplicate-text assertion.

Ops collection failure: `apps/ops/src/modules/wedding/WeddingBroadcastPanel.test.tsx` contains component code but no tests; its pre-existing contents were not changed. An earlier sixth Web failure did not recur in the final controlled run.

## Git state and deployment risks

The index changed outside this implementation while execution was paused. It contains the earlier patch plus generated Playwright reports; subsequent fixes remain partly unstaged. The index was left untouched. **NO-GO for committing the currently staged snapshot**: exclude generated test reports and include the reviewed latest source changes first. Full-suite failures also remain visible and need an explicit release decision or separate repair.

No actual .env files, secrets, dist, node_modules, or runtime wedding audio were added or staged by this task. Existing `.env.example` templates remain tracked. A repository-wide filename audit also found pre-existing tracked `backend/uploads` announcement/category/chat files; those are not new changes and were left untouched. This review does not claim the historical repository contains no generated uploads.

Real Postgres concurrency, production bucket policy, and deployed cross-origin playback still need integration smoke testing. Existing process-local wedding viewer/feed/comment and playlist caches have not been redesigned for multiple simultaneous API writers. A stale ignored database build tree was removed and rebuilt after it shadowed fresh generated Prisma types; production should use clean generated artifacts. No production data or provider objects were changed.

## Global stepper correction

The subsequent correction is implemented and verified in [the global stepper audit](horizontal-stepper-review.md), including the conversion inventory and responsive screenshots. It adds a shared horizontal component for request creation, registration, guided tours, and the exported Web Stepper. Final focused checks passed 48 UI, 21 Web, and 15 Ops tests, with all three builds passing. See that audit for the two pre-existing empty UI suites and existing Ops CSS warning discovered during expanded checks.

## Exact changed-file inventory

Includes the carried-forward storage patch and the subsequent global stepper correction. Generated reports are listed separately.

- `apps/api/src/app.ts`
- `apps/api/src/modules/catalog/api/catalog-media-routes.ts`
- `apps/api/src/modules/catalog/tests/catalog-media-routes.test.ts`
- `apps/api/src/modules/wedding/api/wedding-controller.ts`
- `apps/api/src/modules/wedding/api/wedding-participation-routes.test.ts`
- `apps/api/src/modules/wedding/api/wedding-routes.ts`
- `apps/api/src/modules/wedding/application/wedding-campaign-service.test.ts`
- `apps/api/src/modules/wedding/application/wedding-campaign-service.ts`
- `apps/api/src/modules/wedding/application/wedding-participation-service.test.ts`
- `apps/api/src/modules/wedding/application/wedding-participation-service.ts`
- `apps/api/src/modules/wedding/application/wedding-storage.test.ts`
- `apps/ops/src/modules/wedding/WeddingParticipantsPanel.test.tsx`
- `apps/ops/src/modules/wedding/WeddingParticipantsPanel.tsx`
- `apps/ops/src/modules/WeddingCampaignPage.tsx`
- `apps/web/e2e/fixtures/stepper.html`
- `apps/web/e2e/fixtures/stepper.tsx`
- `apps/web/e2e/horizontal-stepper.spec.ts`
- `apps/web/e2e/wedding-quality.spec.ts`
- `apps/web/src/app/CelebrationHost.test.tsx`
- `apps/web/src/app/CelebrationHost.tsx`
- `apps/web/src/auth/pages/StatusPages.tsx`
- `apps/web/src/components/CommerceCatalogue.tsx`
- `apps/web/src/components/CookieConsentBanner.tsx`
- `apps/web/src/components/HostChrome.test.tsx`
- `apps/web/src/components/HostChrome.tsx`
- `apps/web/src/components/InteractionKit.tsx`
- `apps/web/src/content/commerce.ts`
- `apps/web/src/content/homepage.ts`
- `apps/web/src/integrated-export/IeCommodityImage.test.tsx`
- `apps/web/src/integrated-export/IeCommodityImage.tsx`
- `apps/web/src/lib/media-url.test.ts`
- `apps/web/src/lib/media-url.ts`
- `apps/web/src/pages/HomePage.test.tsx`
- `apps/web/src/pages/HomePage.tsx`
- `apps/web/src/procurement/procurement-api.ts`
- `apps/web/src/styles/commerce.css`
- `apps/web/src/styles/foundation.css`
- `apps/web/src/wedding/wedding-api.test.ts`
- `apps/web/src/wedding/wedding-api.ts`
- `apps/web/src/wedding/WeddingLandingPage.tsx`
- `apps/web/src/wedding/WeddingLivePage.test.tsx`
- `apps/web/src/wedding/WeddingLivePage.tsx`
- `apps/web/src/wedding/WeddingParticipation.test.tsx`
- `apps/web/src/wedding/WeddingParticipation.tsx`
- `database/prisma/migrations/20260910120000_wedding_participation_and_date/migration.sql`
- `database/prisma/schema.prisma`
- `docs/horizontal-stepper-review.md`
- `docs/rowdotul-hamd-26-quality-review.md`
- `packages/constants/src/wedding-campaign.test.ts`
- `packages/constants/src/wedding-campaign.ts`
- `packages/ui/src/auth/screens/RegisterScreen.tsx`
- `packages/ui/src/guidance/TourRunner.tsx`
- `packages/ui/src/homepage/TrustServicesCatalog.tsx`
- `packages/ui/src/marketing/CelebrationExperienceModal.tsx`
- `packages/ui/src/primitives/HorizontalStepper.test.tsx`
- `packages/ui/src/primitives/HorizontalStepper.tsx`
- `packages/ui/src/primitives/index.ts`
- `packages/ui/src/procurement/procurement.test.tsx`
- `packages/ui/src/procurement/ProcurementProgress.tsx`
- `packages/ui/src/procurement/RequestCreateWizard.tsx`
- `packages/ui/src/procurement/RequestCreateWizard.validation.test.tsx`
- `packages/ui/src/styles/auth.css`
- `packages/ui/src/styles/foundation.css`
- `packages/ui/src/styles/guidance.css`
- `packages/ui/src/styles/horizontal-stepper.css`
- `packages/ui/src/styles/procurement.css`
- `packages/ui/src/styles/wedding-campaign.css`

Generated artifacts already in the index (not staged by this task):

- `apps/web/test-results/.last-run.json`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-1280px-chromium-desktop/error-context.md`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-320px-chromium-desktop/error-context.md`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-360px-chromium-desktop/error-context.md`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-375px-chromium-desktop/error-context.md`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-390px-chromium-desktop/error-context.md`
- `apps/web/test-results/wedding-quality-wedding-invitation-and-re-entry-fit-768px-chromium-desktop/error-context.md`
