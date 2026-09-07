# Version 1 Known Issues

This document records technical debt and product gaps that motivated
**HAMD Genesis (Version 2)**. It is a preservation artifact, not a bug-fix backlog
for Version 1 feature work.

## Security & authentication

| Issue | Impact | V2 direction |
| --- | --- | --- |
| JWT stored in `localStorage` | XSS can exfiltrate sessions | httpOnly refresh cookies + short-lived access tokens |
| Coarse roles (`user` / `admin`) | No org-scoped RBAC | Organizations, memberships, permissions |
| Dual admin login path | Parallel auth stories | Unified identity |
| Incomplete CSRF posture for cookie-less JWT SPAs | Relies on Bearer header discipline | Cookie + CSRF strategy in V2 auth design |

## Architecture

| Issue | Impact | V2 direction |
| --- | --- | --- |
| Monolithic Express + Socket.IO process | Chat/AI/catalog/procurement coupled | Domain modules in `apps/api` |
| Marketing + buyer in one SPA | Wrong shell boundaries | `apps/web` + `apps/client` |
| Ops UI as chart-first admin skin | Weak queue/workbench UX | `apps/ops` + Record Workbench patterns |
| Outside pnpm workspace | Divergent tooling, Node engines, CI | Monorepo (`hamd-genesis`) |
| Hand-written MySQL schema bootstrap | Drift vs migrations; weak expand/contract discipline | Prisma + ordered Postgres migrations |

## Domain & workflow

| Issue | Impact | V2 direction |
| --- | --- | --- |
| Free-form status edits in admin | Bypassable workflow | Policy-gated transitions |
| `/requests` and `/orders` duplication | Ambiguous vocabulary | Single procurement-request domain |
| No first-class quotations / invoices / payments | Finance tracked informally | Dedicated V2 domains |
| Tracker model too thin for global logistics | Limited shipment truth | Shipment aggregate + milestones |
| Chat as system-adjacent SOP | Risk of treating chat as system of record | Separate collaboration platform later |

## Reliability & operations

| Issue | Impact | V2 direction |
| --- | --- | --- |
| Railway MySQL proxy fragility | `PROTOCOL_CONNECTION_LOST` observed in local/dev | Supabase Postgres for V2 |
| Render-oriented deploy assumptions | Opaque hosting config outside repo | Documented DevOps architecture |
| Limited automated tests in V1 apps | Regressions easy | Vitest + CI on Genesis packages |
| Debug email routes gated but present | Operational foot-guns | Stricter production env policy |

## Frontend quality

| Issue | Impact | V2 direction |
| --- | --- | --- |
| Forked shadcn/Radix stacks in two apps | Inconsistent UX | `@hamd/ui` + design tokens |
| Orphan/commented routes and duplicate pages | Maintenance noise | Clean host route tables |
| `window.confirm` / `alert` patterns | Poor a11y | Toast/dialog system |
| Product card / homepage not enterprise-grade | Weak brand/conversion | Phase 3 homepage + catalog blueprints implemented in UI library |

## Data model

| Issue | Impact | V2 direction |
| --- | --- | --- |
| Flat user table for all concerns | Credentials mixed with profile | Split credential/session models |
| Weak multi-tenant story | Hard to scale org clients | Organization-centric schema |
| Media/files loosely governed | Upload sprawl | Media/document platform (docs) |

## Why Version 2 was initiated

Version 1 successfully proved procurement request intake, basic catalog, chat,
and admin operations for Almahbub International. It cannot safely scale into an
enterprise multi-org platform with auditable workflows, hardened auth, and a
coherent three-shell product without a ground-up domain architecture.

HAMD Genesis addresses that by introducing:

1. PostgreSQL + Prisma enterprise schema  
2. Domain API modules with explicit policies/state machines  
3. Shared design system (`@hamd/ui`)  
4. Planned hosts: public web, client workspace, operations console  

Version 1 remains the **behavioral and field reference** until those hosts achieve
parity and cutover is approved.

## Related

- [`01-version-1-overview.md`](./01-version-1-overview.md)  
- [`03-feature-inventory.md`](./03-feature-inventory.md)  
- `docs/68-zero-omission-platform-modernization-audit.md`
