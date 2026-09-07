# Enterprise Chat - Review

## Verdict

**Ship UI module** `@hamd/ui/chat` as the Genesis surface for messaging.  
Legacy Express/Socket.IO chat remains the temporary runtime until a Genesis collaboration API exists.

## KEEP / REFACTOR / REPLACE summary

| Decision | Scope |
| --- | --- |
| **KEEP** | Product intent, `docs/17` room model, notification separation, dashboard messages shell, proven UX behaviors (send, attach, emoji, typing, receipts) |
| **REFACTOR** | Map legacy snake_case → `ChatMessage` via `normalizeLegacyMessage`; unify read model to `delivery`; share emoji/attach in one package |
| **REPLACE** | Monolithic ChatPages, flat DM as system of record, dead `ChatPage1`, dual `is_read`/`read_at` as UI contract |

## Quality checklist

- [x] Presentational - no Socket.IO / REST client inside package
- [x] Mission features covered (typing → message actions)
- [x] Accessibility landmarks, skip link, live typing/announce
- [x] Responsive desktop / tablet / mobile layout
- [x] Dark mode tokens
- [x] Tests + Storybook stories + package exports
- [ ] Genesis `apps/api` collaboration module (follow-up)
- [ ] Signed media playback for audio/video (host)
- [ ] Full-text search service (host); UI search is client-side

## Risks carried from legacy

1. `POST /send` may persist null `file_url` - host must use a corrected upload path.
2. REST mark-read (`is_read`) vs socket (`read_at`) - normalize at the adapter.
3. Client ChatPage historically listened for typing but did not emit - new UI emits via `onTyping`.

## Stop line

Implementation + review complete for `@hamd/ui/chat`. API migration is out of scope for this module stop.
