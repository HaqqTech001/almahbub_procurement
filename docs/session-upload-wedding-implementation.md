# Active V2 session, uploads, wedding and hero implementation

## Findings and implementation

1. **Missing bearer root cause.** Shared AttachmentBoard navigated directly to protected document URLs, ignoring its token getter; EnterpriseChat did not forward the host attachment opener. That produced raw API JSON in a new tab. Ops chat upload/preview also bypassed session refresh with raw fetch. Buyer document upload already supplied Bearer; its failure was not attributable to a missing header on that POST. A locally fresh but server-rejected token was returned unchanged by refreshSession.
2. **Upload paths.** Buyer/Ops chat, request/document and quotation document flows now use sessionFetch and shared document validation. Ops product/category/IE commodity/announcement/wedding gallery/waiting-audio uploads already use opsFetch; that wrapper now centralizes friendly errors and inherits shared session transport. There is no separate avatar upload in the inspected V2 paths. Public contact/catalogue reads stay public. No storage architecture changes.
3. **One request mechanism.** Shared sessionAwareFetch attaches the current bearer, coordinates concurrent refreshes and retries an authentication rejection once. It handles a second rejection as session loss, never refreshes for 403, and never retries mutations for network/5xx failures. Browser FormData sets its own multipart boundary. Private attachments fetch authenticated blobs through the configured API origin, not an attachment-supplied host. No raw URL fallback after private fetch failure.
4. **Refresh.** Server-rejected tokens refresh even if the client clock calls them fresh. Pending refresh cannot restore auth after logout; revoked profile hydration fails closed. Database errors no longer become misleading 401 responses. Existing active refresh credentials remain stable (the prior service does not rotate on each refresh); existing revoked-token reuse/family handling is preserved.
5. **Seven days.** Canonical AUTH_SESSION_MAX_SECONDS caps REFRESH_TOKEN_TTL_SECONDS at 604800. Ordinary and remembered login both receive the configured session lifetime, up to seven days; a deliberately shorter configured TTL remains shorter. Access tokens remain short lived (default one hour). Server expiry/createdAt checks impose the absolute cap; refresh does not slide DB expiry and cookies use remaining lifetime. Refresh stays HttpOnly, Secure in production, SameSite=Lax; only access tokens are in memory. Non-secret session hints and CSRF state support reload recovery.
6. **Expiry navigation.** Both apps redirect to login with validated internal returnTo including query/hash and a friendly expiry explanation. Manual login restores that route without replaying mutations. Chat text drafts survive remount in user/room-scoped sessionStorage; selected File objects must be reselected after full navigation. Failed in-page sends retain attachments/text and successful uploaded files are cached for manual retry. A synchronous send guard blocks double clicks.
7. **File errors.** Shared userFacingError/safeErrorMessage maps authentication, authorization, type, size, empty file, count and network failures. Document rules match existing server policy: 10 MB, five files, JPEG/PNG/GIF/WebP/PDF/Word/text. Audio/video/spreadsheets were removed from this document picker rather than weakening the server policy. Wedding audio has its own existing policy.
8. **Raw errors.** Protected attachment links no longer expose raw API pages. Core Web/Ops API error constructors and opsFetch sanitize developer prose; structured codes remain on error objects. No visible MIME or auth codes in the exercised browser errors.
9. **Wedding source of truth.** Existing persisted campaign modalEnabled remains authoritative. No second flag or schema change.
10. **Ops control.** Invitation settings expose the existing field as an accessible Enable wedding experience switch and save through the existing authorized campaign PATCH. Buyer permissions are unchanged.
11. **Public rendering.** Disabled/unresolved state renders no floating trigger or modal, schedules no auto-modal timer and mounts no modal-only media. Polling the campaign continues every ten seconds so admin updates propagate. Enabled state retains the H-heart-M trigger, official Rowdotul HAMD'26 identity, eligibility dates, delayed opening and session dismissal. The independent top celebration banner and dedicated wedding pages retain their existing controls.
12. **Hero.** Preserved approved homepage sections and copy; added photographic port background, responsive theme overlays, faint SVG route lines and restrained ambient gradient.
13. **Asset.** Reused existing licensed ie-portal-home-hero-02.webp and existing responsive procurement derivatives. Provenance: docs/ie-image-02-provenance.json. No AI provider calls, generated media, temporary uploads or new production storage dependency.
14. **Performance.** Responsive srcset, eager high-priority hero image, CSS transform/opacity animation, no canvas/particles/video runtime. Reduced motion disables ambient animation. Desktop/mobile layouts and both themes checked.

## Files in this task

API: config/auth-session-policy.ts, config/env.ts; identity/auth application/auth-service.ts and auth-lifecycle.test.ts, infrastructure/auth-repository.ts, api/auth-controller.ts and auth-controller.test.ts; shared/auth/authenticate.ts and session-upload.test.ts.

Shared UI: auth/index.ts, session-retry.ts and tests, media-request.ts, user-facing-error.ts, authenticated-upload.test.ts; media/open-authenticated-resource.ts; primitives/AuthenticatedMedia.tsx and authenticated-attachments.test.tsx; chat/EnterpriseChat.tsx, useChatRoom.ts and chat-continuity.test.tsx.

Web and Ops: auth/session/AuthProvider.tsx, session-http.ts; auth/guards/RequireAuth.tsx; auth/pages/LoginPage.tsx; auth/api/auth-errors.ts. Web auth session/guard regression tests were expanded.

Web: api/parity-api.ts; copilot/copilot-api.ts; procurement/procurement-api.ts; finance/finance-api.ts; notifications/notification-api.ts; quotations/quotation-api.ts; shipments/shipment-api.ts; app/SupportChatPage.tsx, CelebrationHost.tsx and tests; wedding/wedding-api.ts and tests; pages/HomePage.tsx; styles/public-experience.css; e2e/session-continuity-review.mjs.

Ops: api/copilot-api.ts, notification-api.ts, procurement-api.ts, quotation-api.ts, shipment-api.ts; lib/ops-fetch.ts; modules/SupportPage.tsx, WeddingCampaignPage.tsx and WeddingCampaignPage.visibility.test.tsx.

Several files already contained uncommitted work before this task. Catalogue changes elsewhere in the working tree belong to earlier work and were preserved, not reset or republished.

## Validation

- API, Web and Ops TypeScript checks passed; shared UI build passed.
- Web production build passed (docs/session-web-build.log).
- Relevant API suite: 109 passed. Additional rerun of lifecycle tests including ordinary seven-day session assertion: 5 passed.
- Relevant Web suite: 77 passed. Expanded auth race/revocation suite: 10 passed, including two subsequently added tests.
- Relevant Ops suite: 32 passed, including persisted wedding switch off/on.
- Shared UI session/upload/chat/attachment suite: 30 passed.
- Browser acceptance: docs/session-browser-results.json, repeatable via node apps/web/e2e/session-continuity-review.mjs after building Web. Uses intercepted API fixtures only, no live database writes. Verified sign-in, reload, bearer/multipart uploads, one silent-refresh retry with one accepted upload/message, friendly type rejection, true expiry, exact return route, retained draft/no replay, disabled modal/media behavior, enable/disable, and 390/1440 light/dark hero with reduced motion and no visible em dash. No browser page errors.
- Screenshots: docs/session-hero-{390,1440}-{light,dark}.png. Desktop light and mobile dark visually inspected.
- git diff --check passed. Nothing staged, committed or pushed. No .env changes or runtime upload writes by this task.

## Remaining production checks and limits

- Browser acceptance uses fixtures, not real account credentials, production storage, or seven elapsed days. Verify login/upload/reload on the deployed domains before release.
- Existing SameSite=Lax refresh cookies require same-site deployment or a same-site API proxy. Distinct cross-site Web/API domains need an explicit reviewed cookie/CORS deployment policy; this patch does not silently weaken cookie security.
- Explicit logout clears the client immediately. If the logout request cannot reach the API, or its bearer is already expired, server revocation cannot be guaranteed; the local session hint prevents automatic restoration in that app. The existing absolute server expiry still applies.
- File binaries are not persisted across a login navigation. Text drafts are retained per user/conversation in the current tab; no mutations replay after full login.
- Automatic auth retries are safe because authentication precedes upload/message work. Ambiguous connection loss after a committed server mutation is not automatically retried; this task does not add cross-request server idempotency storage.
- Public catalogue publication/commodity gates, drafts, research/media queues and durable-storage blockers remain unchanged. No catalogue mutations, publication, deletion, image generation, migration, commit or push occurred.
