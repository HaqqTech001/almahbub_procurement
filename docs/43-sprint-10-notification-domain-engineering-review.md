# Sprint 10 - Notification Domain Engineering Review

## Delivered scope

The Notification Domain is implemented in the new TypeScript/PostgreSQL platform
under `apps/api/src/modules/communication/notification`. It provides a
tenant-scoped, persistent in-app inbox; user preferences; versioned
communication templates; a Resend email adapter; and an outbox dispatcher.
The legacy MySQL notification implementation was intentionally not changed.

## Architecture

Business modules remain the system of record. Their committed `outbox_events`
are consumed by the notification dispatcher, which requires an explicit
`recipientUserId` in the event payload, verifies active membership in the event
organization, creates a deduplicated notification event/projection, and then
plans/sends email when policy permits.

The notification dispatcher is invoked with:

```text
pnpm --filter @hamd/api dispatch:notifications
```

It is designed for a scheduled worker invocation. It processes a bounded batch,
records retryable failures on the source outbox event, and marks an event
published only after notification planning and any configured email delivery
succeed.

## Database and integrity controls

- UUIDv7 IDs, organization and recipient foreign keys, restrictive deletes, and
  tenant-scoped indexes.
- `notification_events.outbox_event_id` is unique, and recipient projections
  are unique per notification event, preventing duplicate inbox rows on retry.
- Notifications are soft-deleted; delivery attempts remain append-only.
- Template versions are append-only. Publishing requires a separate
  `communication:publish` permission and rejects author self-publication.
- Account and system notification types cannot be disabled in preferences.

## API and authorization

- Inbox: list/filter/search, unread count, bulk mark-read, mark-unread,
  archive/unarchive, and soft-delete.
- Preferences: authenticated user read/update, scoped to the active
  organization and user.
- Template administration: organization-scoped list, create, retrieve,
  revision, and publish APIs.
- Every route is authenticated, represented in the route-policy registry, and
  documented in OpenAPI. Mutations write audit events with the request ID.

## Email delivery and configuration

Production requires `RESEND_API_KEY` and `EMAIL_FROM`. The dispatcher only
uses the Resend adapter when both values are present. In development, in-app
notification processing remains available without live email credentials.
Provider errors are stored as bounded, redacted delivery failures rather than
being logged as raw email payloads.

## Verification

- Prisma schema validation and client generation.
- Database package build.
- API typecheck, lint, test, and production build.
- Notification schema and mandatory-policy unit tests.
- Route-policy coverage runs as part of the API suite.

## Intentional deferrals

- Current business outbox events do not consistently include
  `recipientUserId`; the dispatcher safely rejects ambiguous events rather than
  guessing recipients. New publishers must include this field or use the
  future domain recipient resolver.
- SMS/push ports exist but no providers are enabled.
- No campaigns, audiences, digests, quiet hours, provider webhooks, Socket.IO
  fan-out, or legacy backend bridge.
- Template variable schemas are stored and validated at template creation;
  comprehensive per-template runtime type coercion and translation workflows
  are future work.

## Sprint summary

The platform now has one durable, auditable notification foundation that can
consume committed domain events without allowing delivery failures to mutate
commercial or logistics business records.
