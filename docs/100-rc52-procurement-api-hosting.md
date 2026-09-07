# RC5.2 - Procurement API Hosting

**Status date:** 2026-08-06  
**Mission:** Replace localStorage procurement source-of-truth with `apps/api` `/api/v1/procurement-requests`.

## Shipped

| Surface | Behaviour |
| --- | --- |
| `procurement-api.ts` | List / get / create / patch / transition / duplicate (quotations pattern) |
| `/app/requests` | Loads + transitions against API |
| `/app/requests/new` | Create draft or create + `submit` transition |
| Wizard autosave | Still localStorage (`wizardDraft` only) |

## Deferred (honest)

- Attachments / comments / timeline events on GET (no PR document/comment API yet)
- Internal notes as a first-class field (folded into `notes` with `[Internal]` prefix when present)

## Cutover

RC5.1 blocker **B1** closed. Remaining cutover blockers: **B2** chat, **B3** announcements, **B4** product sign-off on Partial rows.

## Quality

```sh
corepack pnpm --filter @hamd/web test
corepack pnpm --filter @hamd/web typecheck
```
