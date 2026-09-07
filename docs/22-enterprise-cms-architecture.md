# HAMD Enterprise CMS Architecture

**Purpose:** A governed publishing system that enables Almahbub International
to update public website content without source-code changes while preserving
performance, accessibility, SEO, security, brand consistency, and release
control.

## 1. Product principles

- Content is structured, versioned, localized, permissioned data-not arbitrary
  HTML/CSS/JavaScript.
- Public website pages are assembled from approved reusable section types and
  design-system components, not a free-form page builder that can break brand
  or accessibility standards.
- Publishing is a controlled release: draft, preview, review, schedule,
  publish, rollback, archive, restore.
- A published version is immutable. Editing creates a new draft version.
- CMS content cannot bypass product authorization, expose private supplier/
  customer data, or create an unreviewed commercial/legal claim.

## 2. Content model

| Content type | Purpose and structured fields |
| --- | --- |
| Pages | Route, title, summary, approved section composition, locale, lifecycle, SEO relation. |
| Blog posts | Author, title, body blocks, taxonomy, cover media, publish date, related content, SEO. |
| Hero sections | Eyebrow/title/body/CTA/media/approved layout/theme; no arbitrary visual script. |
| Testimonials | Attribution, customer consent, quote, service/country tags, evidence, publish state. |
| Partners | Partner identity, type, approved logo/description/route/region, verification/consent. |
| FAQs | Question, answer, category, audience, locale, sort, review date. |
| Case studies | Challenge/approach/outcome, approved metrics, consent/evidence, services/corridors. |
| Product categories/products | Catalog-owned data surfaced through CMS landing compositions; no duplicate product truth. |
| Countries/industries/services | Structured marketing/education profiles linked to approved corridor/catalog data. |
| Announcements/celebrations | Governed communications/Celebration Engine references, not duplicated display logic. |
| SEO metadata | Title, description, canonical, robots, social image, structured-data schema, redirects. |
| Media library | Approved image/video/document assets with source, rights, alt text, variants, scan status. |
| Navigation/footer | Versioned menus/links/groupings, audience/locale visibility, link validation. |
| Homepage sections | Approved reusable composition records/order, not code-defined one-off content. |

## 3. Publishing lifecycle

`draft → in_review → approved → scheduled → published → archived`

`rejected`, `cancelled`, and `superseded` are explicit states. Scheduled/
published content retains an immutable version. Publishing validates current
locale, links, assets, SEO, accessibility, route conflicts, audience, and
approval before becoming visible. Rollback republishes an earlier approved
version; it never edits history.

### Core actions

- **Create/edit:** author creates draft with structured validated blocks.
- **Duplicate:** clones draft content without publication history/slug conflict.
- **Preview:** short-lived, access-controlled preview of exact version, device,
  theme, locale, and reduced-motion state; preview is not indexable.
- **Review:** content/brand/SEO/accessibility reviewer checks change diff and
  flags.
- **Schedule:** UTC time plus locale/region policy; revalidates before publish.
- **Archive/restore:** removes public visibility while retaining history;
  restored version returns to draft/review, not immediate publish.

## 4. Admin UI

### CMS workspace

- Content list with type/status/locale/author/publish date/search/filter/saved
  view, ownership, review state, and bulk-safe archive/export.
- Structured editor with content outline, component-specific fields, preview
  panel, link/media picker, autosaved draft status, version diff, validation,
  localization tabs, and related-content selector.
- Review/publish screen with visual/device/theme preview, SEO analysis,
  accessibility checks, link check, audience/route impact, scheduled time, and
  approval/rollback controls.
- Media Library with filter by type/usage/rights/scan/locale, optimization
  status, alt-text coverage, crop focal point, and usage map.
- Navigation/footer manager with hierarchy, audience/locale, destination
  validation, and preview; it never permits a link to an unapproved private
  route.

All editor views support loading/empty/error/success/offline draft,
keyboard/screen-reader, dark mode, mobile review, reduced motion, role-based
controls, and non-destructive error recovery.

## 5. Database architecture

| Entity | Purpose and controls |
| --- | --- |
| `cms_content_items` | Canonical item: content type, locale, slug/path, lifecycle, owner, current version, schedule/publish/archive fields. Unique type/locale/path; audit and soft archive. |
| `cms_content_versions` | Immutable structured content document, version number, author, change summary, review/publish metadata, content hash. Unique item/version; published version immutable. |
| `cms_content_relations` | Typed relation to media, product/category, service, country, testimonial, case study, article, or campaign. Unique source/relation/target/order. |
| `cms_workflow_reviews` | Reviewer/decision/comment/time/policy snapshot; prevents author self-publishing broad public content. |
| `cms_previews` | Hashed short-lived preview token, content version, access scope, expiry; non-indexable. |
| `seo_metadata` | Entity/version/locale SEO record, canonical/robots/social/schema validation. Unique item/version/locale. |
| `cms_redirects` | Source path, destination, status, locale, lifecycle. Unique source/locale; loop and private-route validation. |
| `navigation_menus` / `navigation_items` | Versioned locale/audience menu hierarchy and destinations. Unique menu key/locale/version; cycle/order checks. |
| `media_assets` / `media_derivatives` | Asset object/rights/source/scan/alt/caption and optimized variants; private origin, signed access/transform policy. |
| `content_localizations` | Translation status/source locale/reviewer/fallback/version relation. Unique item/locale/version. |
| `cms_audit_events` | Immutable author/review/publish/rollback/preview/media/navigation events. |

Content uses validated structured JSONB blocks only where a section schema
requires flexibility; reusable fields/relationships remain relational. Search
indexes published title/summary/body projections by locale; assets use object
storage/CDN, never database blobs.

## 6. API architecture

All endpoints inherit Phase 8 validation, authentication, authorization,
structured errors, pagination/filter/sort/search, auditing, rate limits, and
OpenAPI documentation.

| Method / route | Purpose and policy |
| --- | --- |
| GET `/api/v1/content/pages/{path}` | Public published page projection by locale; CDN/cache with version invalidation. |
| GET `/api/v1/content/{type}` | Public safe list for blog/FAQ/services/etc.; published-only filters/search/pagination. |
| GET/POST `/api/v1/admin/cms/content` | List/create draft content; `cms:read/create`, type/schema/locale/path validation. |
| GET/PATCH `/api/v1/admin/cms/content/{id}` | Read/edit draft or create new version of published item; optimistic concurrency/audit. |
| POST `/api/v1/admin/cms/content/{id}/duplicate` | Clone to draft; slug/locale conflict handling. |
| POST `/api/v1/admin/cms/content/{id}/preview` | Issue short-lived preview; permission/audience/noindex policy. |
| POST `/api/v1/admin/cms/content/{id}/review` | Submit decision; reviewer/SoD policy/audit. |
| POST `/api/v1/admin/cms/content/{id}/publish` | Publish/schedule/archive/restore command; full validation/cache purge/outbox. |
| GET/POST `/api/v1/admin/cms/media` | Search/create signed-upload asset; MIME/size/rights/alt/scan policy. |
| GET/PATCH `/api/v1/admin/cms/navigation/{key}` | Read/edit versioned nav/footer; hierarchy/link/audience validation. |
| GET `/api/v1/admin/cms/seo-analysis/{id}` | SEO/accessibility/link analysis of specific draft/version. |

## 7. Permissions and security

- **Author:** drafts and edits owned/assigned content; cannot publish broad
  public content.
- **Reviewer:** content/brand/accessibility/SEO review; cannot modify author
  content silently.
- **Publisher:** approves/schedules/publishes/rolls back within scope; two-person
  approval for legal, marketing campaign, public celebration, or high-impact
  homepage/nav changes.
- **Media manager:** uploads/approves assets under rights/scan policy.
- **SEO manager:** manages metadata/redirects, with route/privacy controls.
- **Platform admin:** configures schemas/templates/workflow; requires MFA/audit.

Sanitize rich text, forbid scripts/inline event handlers/untrusted embeds, use
strict CSP, validate links/redirects, scan uploads, enforce media rights,
private preview tokens, rate-limit preview/upload, and audit every publish/
rollback/export. CMS cannot store secrets or bypass trusted product/supplier/
payment data boundaries.

## 8. SEO, accessibility, media optimization

- Enforce title/description/canonical/robots/social metadata, valid heading
  order, descriptive links, localized alternate/canonical relationships, image
  alt text, captions, structured data validation, and no duplicate/thin pages.
- SEO analysis produces suggestions/errors, not automated unverifiable claims
  or keyword stuffing.
- Media pipeline validates type/size, strips dangerous metadata as policy
  requires, scans, transcodes/resizes, generates responsive modern formats/
  poster images, preserves focal point, and lazy-loads non-critical media.
- Every public page meets WCAG 2.2 AA; CMS validations prevent contrast,
  heading, link, alt-text, video-caption, and unsafe component violations from
  publishing without approved exception.

## 9. Future AI content assistance

AI can propose outline, summarize approved sources, draft localized copy,
suggest metadata/alt text, flag broken links/content gaps, and prepare content
diffs. It always cites source material, respects locale/brand/claim policy,
marks generated content, requires human review, and cannot publish, invent
customer outcomes, make legal/commercial claims, or access private data without
authorization.

## 10. Release quality bar

The CMS is production-ready when a permitted editor can change approved content
without code, preview exact output, validate accessibility/SEO/media/security,
obtain review, schedule/publish/rollback safely, and later audit every version
and public release.
