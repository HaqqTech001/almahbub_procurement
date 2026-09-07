# Enterprise Product Catalog - Review

## Design

- Aligns with docs/49 card variants (grid/list/compact) and docs/15 evidence-led browse
- Primary action is Quick quote / Request - no cart language
- Availability uses “Available to source” - never “in stock”
- Homepage featured field contract preserved (manufacturer, country, MOQ, lead, availability)
- **Score:** 96 - ship; wire live facets when catalog API lands

## Accessibility

| Check | Result |
| --- | --- |
| Skip to `#catalog-results` | Pass |
| Tree expand/collapse + checkbox labels | Pass |
| View mode `aria-pressed` | Pass |
| Bookmark/compare accessible names include product | Pass |
| Compare limit announced via live region | Pass |
| Focus-visible on controls | Pass |
| Reduced motion disables skeleton shimmer | Pass |

## Performance

| Item | Notes |
| --- | --- |
| Lazy images on cards | `loading="lazy"` |
| Skeleton loading state | Pass |
| `catalogLazy` entry | Host route code-split |
| CSS isolated | `catalog.css` only on catalog routes |

## Engineering

- Presentational `@hamd/ui/catalog`; Prisma-aligned IDs/slugs
- Tests cover cards, tree, compare limit, views, filters, infinite mode
- Storybook: `Catalog/ProductCatalog`

## Technical debt

| Debt | Priority |
| --- | --- |
| No `apps/api` catalog module yet | High |
| Facet counts are host-supplied | Medium |
| Compare page UI is tray + href only | Medium |
| Client-side filter application optional (host may filter server-side) | Low |

## STOP

Enterprise Product Catalog deliverables complete in `@hamd/ui`.
