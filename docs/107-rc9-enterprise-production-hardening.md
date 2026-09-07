# RC9 - Enterprise Production Hardening

**Status date:** 2026-08-07  
**Target:** Lighthouse ≥ 95 (Performance, Accessibility, Best Practices, SEO)

## Security

| Control | Implementation |
| --- | --- |
| Penetration / dependency audit | `pnpm audit:deps` + CI Trivy image scan |
| Secret scanning | Gitleaks in `.github/workflows/quality.yml` |
| RBAC | `requirePermission` / `requireAnyPermission` on ops routes; domain policies elsewhere |
| Session | Existing httpOnly refresh + CSRF double-submit + rotation |
| Input validation | Zod parse on controllers |
| Rate limiting | Redis-backed limiters (auth / API / AI / marketing) with in-memory fallback |

## Performance

- Self-hosted Source Sans / Source Serif (no Google Fonts CDN)
- `React.lazy` route splitting in `apps/web/src/App.tsx`
- Vite `manualChunks` for react / router / ui / motion
- Homepage Framer removed from critical path
- Static cache headers via `apps/web/public/_headers`

## Accessibility (WCAG AA)

- Skip link + main landmark (PublicPageFrame)
- Reduced motion / high contrast via AccessibilityProvider
- Icon control accessible names match visible labels
- Primary button contrast fixed for dark theme
- Footer contact targets ≥ 44px
- Playwright + axe WCAG 2 A/AA e2e gate

## SEO

- Static OG / Twitter / robots / canonical in `index.html`
- Runtime `applyPageSeo` + product JSON-LD
- `robots.txt` + `sitemap.xml` (includes `/announcements`)
- E2E asserts robots/sitemap are not SPA HTML fallthroughs

## Quality gates

```sh
corepack pnpm --filter @hamd/api typecheck test
corepack pnpm --filter @hamd/web typecheck test build
corepack pnpm --filter @hamd/ui build
corepack pnpm --filter @hamd/web test:e2e
corepack pnpm audit:deps
# Optional local Lighthouse (requires preview server + Chrome):
# pnpm --filter @hamd/web preview
# pnpm --filter @hamd/web quality:lighthouse
```

CI jobs: quality · secrets · web-quality (Playwright/axe) · container (Trivy).
