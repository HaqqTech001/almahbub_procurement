# Product Details - Review

## Design

- Decision order matches docs/15: identity → gallery → Request CTA → sourcing facts → specs/docs → rails
- One primary action: **Request this product**
- Availability = “Available to source”; lead time marked indicative in copy
- Frequently sourced together avoids cart-bundle language
- **Score:** 96 - ship

## Accessibility

| Check | Result |
| --- | --- |
| Skip to procurement CTA | Pass |
| Breadcrumb nav | Pass |
| Gallery labelled + described | Pass |
| Preview `role="dialog"` + Escape | Pass |
| Spec tables with `scope="row"` | Pass |
| Save/Compare accessible names | Pass |
| Reduced motion disables zoom transform animation | Pass |
| Dark mode tokens | Pass |

## Performance

| Item | Notes |
| --- | --- |
| Lazy thumbnail images | Pass |
| Preview mounts only when open | Pass |
| Skeleton loading | Pass |
| `productDetailLazy` route split | Pass |
| CSS isolated + catalog.css only if rails needed | Pass |

## Engineering

- Reuses `CatalogProduct` / `ProductCard` / `availabilityLabel`
- Presentational props + optional handlers
- Tests cover gallery preview, all sections, CTA handlers, skeleton

## Technical debt

| Debt | Priority |
| --- | --- |
| Catalog API / media CDN not wired | High |
| 360/CAD assets not in scope | Medium |
| Spec search within long tables | Low |

## STOP

Product Details deliverables complete in `@hamd/ui`.
