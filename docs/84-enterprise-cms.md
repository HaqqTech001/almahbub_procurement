# Enterprise CMS

**Package:** `@hamd/ui/cms` (+ `@hamd/ui/cms.css`)  
**Rule:** Presentational admin workspace. Hosts inject create/save/transition/preview/media via props. Public render stays in `@hamd/ui/homepage`. Architecture: `docs/22-enterprise-cms-architecture.md`.

## Audit

| Asset | Decision |
| --- | --- |
| Architecture `docs/22` | **KEEP** |
| Genesis API / Prisma CMS module | **NEW** (host) - UI ready |
| Public homepage sections (`@hamd/ui/homepage`) | **KEEP** - consume published compositions |
| Free-form HTML page builder | **REJECT** - structured types only |

## Manage (mission coverage)

| Type | Fixture / UI |
| --- | --- |
| Homepage hero | `homepage_hero` |
| Homepage sections | `homepage_section` |
| Services | `service` |
| Industries | `industry` |
| Product categories | `product_category` (composition only; catalog owns product truth) |
| FAQs | `faq` |
| Testimonials | `testimonial` |
| Announcements | `announcement` |
| News | `news` |
| Career posts | `career_post` |
| Wedding banner | `wedding_banner` |
| Global notices | `global_notice` |
| SEO metadata | `seo_metadata` + per-record SEO tab |
| Footer | `footer` |

## Support (mission coverage)

| Capability | UI surface |
| --- | --- |
| Draft | Editor + `save_draft` |
| Preview | Preview tab + `onPreview` (not indexable) |
| Publish | Workflow actions (`approve` → `publish`) |
| Archive | `archive` / `restore` |
| Version history | Versions tab |
| Rollback | Rollback to prior version |
| Scheduling | Scheduling tab + `schedule` |
| Media library | Media tab + upload/open handlers |

Lifecycle (docs/22): `draft → in_review → approved → scheduled → published → archived` (+ reject / superseded / rollback).

## Import

```ts
import {
  CmsWorkspace,
  cmsContentFixture,
  cmsMediaFixture,
} from "@hamd/ui/cms";
import "@hamd/ui/cms.css";
```

Hosts own authorization, media scanning, publish validation, and revalidation. UI never calls backends directly.
