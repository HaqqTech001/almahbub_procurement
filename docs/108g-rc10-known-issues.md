# RC10 - Known Issues

Non-blocking residuals at V2 launch. None of these are placeholders; each has a tracked mitigation.

| ID | Area | Issue | Mitigation / next |
| --- | --- | --- | --- |
| KI-01 | Support chat | Genesis uses REST + poll; V1 Socket.IO realtime removed from primary path | Poll interval tuned; websocket backlog if SLA requires |
| KI-02 | Uploads | Large media still provider/CDN-bound; not all V1 upload UX depth | Use documented upload policy; expand CMS media sprint |
| KI-03 | AI | Copilot returns `503 AI_NOT_CONFIGURED` without provider keys | Required for production AI; configure at least one provider |
| KI-04 | Ops settings | Some deep V1 admin settings not 1:1 in ops settings page | Use API + targeted ops modules; expand only with API backing |
| KI-05 | Audit deps | Transitive **moderate** advisories may remain after high-gate | `pnpm audit --prod`; override/patch when fixed upstream |
| KI-06 | Windows Corepack | Nested `pnpm` in scripts needs `corepack pnpm` on some hosts | Root scripts updated to `corepack pnpm` |
| KI-07 | Lighthouse CI | Requires Chrome/Chromium + preview; gate uses best of `LH_RUNS` (default 3) | `pnpm --filter @hamd/web quality:lighthouse` |
| KI-08 | Performance variance | Single-run Perf can dip on noisy hosts; gate recorded **95** / A11y **100** / BP **100** / SEO **100** | SSR/prerender backlog for stable single-run 95+ |

## Explicit non-goals at launch

- Deleting V1 repositories/folders
- Mock LLM responses
- Dual-write to V1 MySQL as ongoing architecture
