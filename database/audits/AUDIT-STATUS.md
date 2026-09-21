# Live catalogue audit status — 2026-09-17

The configured API database connection could not complete the read-only export. Prisma attempts timed out or exited with an unsettled transaction; a separate, bounded PostgreSQL-driver attempt also timed out. No live snapshot was obtained. No database rows, statuses, images or schema were changed.

| Requested result | Verified result |
| --- | --- |
| Total products | Unavailable — live connection required |
| Valid products with media / can safely remain | Unavailable |
| Products needing images | Unavailable |
| Currently archived / proposed archives | Unavailable |
| Duplicate products | Unavailable |
| Delete candidates | Unavailable |
| Broken/stale media rows | Unavailable |
| Confirmed safe deletions | None established; nothing deleted |

Actual examples from each group cannot be reported without reading the active records. Test fixtures and seed catalogue entries have not been presented as live results.

The read-only export, classification, media validation, CSV/JSON/Markdown report workflow and public-grid filtering are implemented. Run the commands in README.md from an environment that can reach the configured database to produce the actual counts and examples. Review that report before approving any Ops archive changes.
