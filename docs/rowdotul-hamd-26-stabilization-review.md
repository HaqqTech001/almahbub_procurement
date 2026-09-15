# Rowdotul HAMD'26 stabilization review

## Participation 500

The configured development database was inspected read-only. `GET /api/v1/wedding/participation` reaches `WeddingParticipationService.state`, which queries the generated Prisma `WeddingSubscription` model. The database has the earlier waiting-track migration but neither `wedding_subscriptions` nor `wedding_waiting_memberships`; Prisma throws `P2021` (table does not exist), which becomes the observed 500. This is a deployment-state problem, not a guest serialization or wedding-media UUID problem. The reviewed migration `20260910120000_wedding_participation_and_date` is the only pending migration. An attempted `prisma migrate deploy` could not complete against the configured Supabase pooler (schema-engine failure); no data was changed. Apply that migration through the normal deployment workflow before relying on participation endpoints.

The Web participation loader now has three bounded attempts (250ms then 750ms), and the UI exposes Retry preferences plus Continue to wedding. It does not convert a server failure into a false joined/subscribed state.

## Refresh 403

The API intentionally returns 403 for CSRF validation failures and for forbidden protected operations. Refresh classification now keeps `CSRF_VALIDATION_FAILED` retryable while treating `FORBIDDEN`, `UNAUTHENTICATED`, and status 403 refresh failures as terminal session loss. Invalid sessions reach signed-out state; public wedding pages remain accessible to guests. Safe return paths remain unchanged.

## Waiting/live/ended presentation

Waiting and ended states no longer mount the dominant video/player shell or guest-message column. They use a compact campaign state surface with the existing wedding identity, date/countdown or conclusion action. The live state retains the video-first desktop grid, chat secondary column, feed/quality/audio controls, and mobile feed/message access. Waiting controls remain the existing audio element and participation disclosure. Focused WeddingLivePage tests pass.

## Audio and preferences

Waiting audio still uses the existing enabled-track filtering, sequential advancement, loop rules, failed-track skipping, API-origin URL resolution, and live fade/stop. Autoplay rejection is visible as Enable Sound and is retried only after a user gesture; browser autoplay security is not bypassed. Production database write/read failures do not fall back to ephemeral wedding media. Preference failures are bounded and non-blocking.

## Tours

The existing Prisma guidance tables/API already persist user preferences and progress, but the Web adapter still loads its local guidance store and does not yet hydrate those API records. The current engine correctly suppresses completed/skipped tours when local persisted progress exists, and manual replay remains available. `Spotlight` already measures visible targets, opens mobile drawers, scrolls targets into view, recalculates on resize/scroll/orientation/resize-observer events, and places desktop callouts using available space. Its cutout shadow is above the scrim and the target is left readable. Narrow-screen callouts intentionally fall back to a bottom sheet when space is insufficient. Full server-backed established-user eligibility still requires wiring the existing guidance API into the Web adapter and adding an activity-based eligibility query.

## Validation

Passed: database schema generation/build; shared UI 48 focused tests and build; Web participation/live tests (8), auth/tour regressions (21), typecheck and build; Ops auth regressions (15), typecheck and build; API typecheck; responsive horizontal-stepper browser checks at 320, 360, 375, 390, 430, 768, and 1280px. The main review documents the existing unrelated full Web failures, empty UI test suites, and Ops CSS warning.

No commit, push, environment-file edit, or secret exposure occurred. The repository remains dirty with pre-existing staged work and generated artifacts; do not commit the current index without review.
