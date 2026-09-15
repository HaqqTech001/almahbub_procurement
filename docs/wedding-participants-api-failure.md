# Wedding participants API failure investigation

Status: root cause confirmed; code fixes and local automated checks complete. Applying the existing database migration and verifying persisted lifecycles remain blocked pending confirmation that the hosted database used by the local API is development-only. No production database was modified.

1. **Actual exception and HTTP reproduction**

```text
PrismaClientKnownRequestError (P2021)
Invalid this.database.weddingSubscription.findMany() invocation
wedding-participation-service.ts:86:43
The table `public.wedding_subscriptions` does not exist in the current database.
    at async WeddingParticipationService.list (...wedding-participation-service.ts:85:38)
```

The waiting query also raises P2021 for `public.wedding_waiting_memberships` at the corresponding findMany/count calls. Read-only HTTP reproduction through createWeddingRouter, real ops:access middleware, WeddingParticipationService, Prisma and the real error handler returned 500/INTERNAL_ERROR for both `kind=subscription&page=1` and `kind=waiting&page=1`. The harness supplied a test Ops identity rather than a real user's bearer token. Original service and route stack traces are captured in `build/wedding-server-exception.log` and `build/wedding-route-exception.log`.

2. **Root cause**

The API code and generated Prisma client know about both participation models, but the connected database has neither table. This is not a serialization, campaign-ID, empty-result, count-query, or React Router failure. The participant endpoints are inline async handlers in wedding-routes.ts; they directly call WeddingParticipationService, which uses Prisma delegates (there is no separate participant controller/repository class).

3. **Schema/client/migration mismatch**

The existing Prisma schema defines WeddingSubscription -> wedding_subscriptions and WeddingWaitingMembership -> wedding_waiting_memberships. Mapped columns, nullable timestamps, Boolean states, UUID record/user keys, unique campaign/user pairs, foreign keys and indexes agree with the existing migration. Prisma validation and generation passed. Neither model uses an enum. The user relation is required and cascade-deleted; timestamps may be null and are handled by Ops. The database schema is behind the code.

4. **Missing local migration**

The database used by apps/api/.env is hosted Supabase, not localhost. Read-only checks found both to_regclass results null and no applied entry for the participation migration. Prisma migrate status against that API connection confirmed exactly one pending migration: 20260910120000_wedding_participation_and_date. The ordinary database-package status command initially failed using its configured connection. A temporary read-only Prisma configuration under build/ selected the API URL and omitted the unusable shadow configuration; no saved environment values were changed. Migration status intentionally exits nonzero when migrations are pending. No migration was applied because whether this hosted target is shared with production has not been established.

5. **Models and identifiers**

WeddingParticipationService.state/change/heartbeat/list use weddingSubscription and weddingWaitingMembership. Both campaign_id fields are TEXT referencing WeddingCampaign.id. The logical identity remains `founder-wedding-september-2026`. WEDDING_MEDIA_STORAGE_ID is not used for participant records. Page 1 means skip=0, take=50; page 2 means skip=50. Count queries use the same logical campaign. Ops derives next-page availability from page*50 < total. No records yields a successful result with page, total=0, enabled=0, active=0 and items=[]. Actual success on this target awaits the migration.

6. **Subscription versus waiting**

`kind=subscription` lists subscription history only, including opt-outs; enabled counts currently subscribed records. Subscribing requires an authenticated, email-verified account. `kind=waiting` lists waiting membership history only; joined records contribute to enabled, and joined records with a heartbeat within 90 seconds contribute to active. Left/offline are distinct. Rejoining is supported. Guest writes/state/listing are not supported. Neither distinction nor authorization was weakened: listing requires authentication and ops:access; guests receive 401, authenticated buyers receive 403.

7. **Exact files changed in this task**

- apps/api/src/modules/wedding/api/wedding-routes.ts
- apps/api/src/modules/wedding/api/wedding-participation-routes.test.ts
- apps/api/src/modules/wedding/application/wedding-participation-service.test.ts
- apps/ops/src/modules/wedding/WeddingParticipantsPanel.tsx
- apps/ops/src/modules/wedding/WeddingParticipantsPanel.test.tsx
- docs/wedding-participants-api-failure.md

Generated Prisma output was regenerated using the project command. Reproduction scripts/logs are under ignored build/. Existing staged and unstaged work was preserved, including previously added wedding code. No backend catch converts the missing-table exception into an empty response.

8. **Migration involved**

`database/prisma/migrations/20260910120000_wedding_participation_and_date/migration.sql` already exists and was not edited or duplicated. It creates both tables, their unique constraints, indexes and foreign keys. It also corrects specific dates in the known wedding campaign overlay; it is not solely a table-creation migration. No db push, resolve-as-applied workaround, reset, or direct SQL schema mutation was used.

9. **Repeated request cause and fix**

WeddingParticipantsPanel used setInterval every 10 seconds regardless of success/failure, with an explicit indefinitely-retrying message. opsFetch does not itself retry general 500 responses. The panel now schedules the next request only after completion. Successful waiting polls remain 10 seconds; subscription polls use 30 seconds. Transient failures allow only two retries, after 30 and 60 seconds, then stop until manual Retry. Validation/permission failures are not retried automatically. Cleanup suppresses stale results and cancels scheduled retries. Loading is explicit; errors say Unable to load wedding subscribers (or waiting participants), offer Retry, and do not render an empty/success table. Empty subscriptions say No wedding update subscribers yet. API query validation now returns controlled HTTP 400 for invalid kinds/pages, including NaN, negative/fractional/empty/repeated pages; an omitted page defaults to one.

10. **Validation results and limits**

- Database validate: passed.
- Prisma generate: passed, client 7.9.1.
- Migration status using the API database: one pending migration, independently corroborated by database history/table inspection.
- API build and API typecheck: passed.
- Full API tests: 341 passed, 74 files.
- Ops build and Ops typecheck: passed.
- Ops focused participants tests: 4 passed; includes bounded fake-timer retries and manual recovery.
- git diff --check for all task code files: passed.
- Route tests verify both kinds, empty success, valid/default pagination, malformed pagination, 401 and 403.
- Service tests verify list separation, logical campaign ID, pagination, subscribe/unsubscribe idempotency, email verification, heartbeat behavior, join/leave/rejoin, retained history and re-reading state from a new service instance.

Service lifecycle tests use an in-memory database double. Real persisted subscribe/join/refresh/list/unsubscribe/leave lifecycles cannot pass until the tables exist, and were not claimed as database-backed end-to-end success. Real database reads currently reproduce the failure. After migration, rerun the same route reads and perform authenticated subscription/waiting writes, reload reads, Ops lists, repeated writes, unsubscribe/leave and rejoin with a development test account. No React Router upgrade was made; v7_relativeSplatPath remains separate technical debt.

11. **Production requirement and deployment order**

No new migration is required. Any production database lacking the existing participation migration must apply it before serving this API version. Production migration history and Render dashboard settings were not accessed. Repository API startup and Docker CMD run the server only; neither invokes migrations. The deployment guide explicitly requires migration first, but does not prove a Render pre-deploy hook is configured.

For a confirmed target, configure MIGRATION_DATABASE_URL for that same database (and keep the shadow URL distinct as required by the current Prisma configuration), inspect status, then run:

```sh
corepack pnpm --filter @hamd/database exec prisma migrate status
corepack pnpm --filter @hamd/database migrate:deploy
corepack pnpm --filter @hamd/database exec prisma migrate status
```

Generate/build before release; apply the existing migration before switching traffic to the API; deploy the Ops polling fix; verify both participant list kinds and authenticated lifecycles. Deploying the API first reproduces these P2021/500 failures on list, personal-state and write operations. Do not apply the migration to the hosted target until its environment is confirmed; the user's instruction explicitly prohibits manual production changes.

12. **Git status**

No commit, push or staging operation was performed. The workspace already contained many staged/unstaged/untracked changes from other work; they remain. Full status snapshot: build/wedding-git-status.txt. Task completion remains pending the database-environment confirmation, migration application on the authorized development target, and real persistence/lifecycle verification.
