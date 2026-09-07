# HAMD Database

The `@hamd/database` workspace owns the Prisma schema and ordered PostgreSQL
migrations for Almahbub International V2. It targets Supabase PostgreSQL and keeps the legacy
MySQL schema outside this boundary.

## Connection roles

- `MIGRATION_DATABASE_URL` is the Supabase Session Pooler URL used for Prisma
  migrations.
- `DATABASE_URL` is reserved for the application runtime pool.
- `SHADOW_DATABASE_URL` is an isolated Supabase project used only to calculate
  Prisma migration diffs. It must never point to the primary database.

All values belong in `database/.env`; never commit connection strings.

## Commands

```sh
pnpm --filter @hamd/database validate
pnpm --filter @hamd/database generate
pnpm --filter @hamd/database migrate:deploy
pnpm --filter @hamd/database studio
```

Create a migration by diffing the approved migration history against
`prisma/schema.prisma`, review the generated SQL, then place it in a timestamped
directory under `prisma/migrations/`. Always use the shadow database when
generating diffs.

## Migration safety

Production migrations are expand-only:

1. Add nullable columns, tables, or indexes.
2. Deploy compatible application code.
3. Backfill in a resumable job.
4. Validate counts and constraints.
5. Make constraints strict only in a later migration.
6. Remove old fields only after a measured deprecation window.

Prisma does not generate down migrations. Application rollback promotes the
prior compatible image; schema repair uses a forward migration. Before every
production migration, create a Supabase PITR/backup checkpoint and rehearse the
migration in staging.

## Seed policy

Production seeds are limited to idempotent reference data: permissions, role
templates, and approved lookup values. Never seed passwords, API keys, customer
data, or provider secrets. Development factories must use clearly synthetic
organizations, products, suppliers, and transactional records.

`prisma/seed/development.ts` is intentionally idempotent and currently seeds
only permission references and synthetic catalog examples. Run it only against a
development Supabase project, never against a production project.

## Backup and recovery

Enable Supabase point-in-time recovery before handling production customer data.
Keep a documented restore rehearsal at least quarterly. For a failed destructive
migration, stop writes, restore to an isolated project, validate reconciliation,
and perform a forward repair; do not run unreviewed SQL against production.
