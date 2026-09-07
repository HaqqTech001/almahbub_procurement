# Enterprise Product Catalog

**Package:** `@hamd/ui/catalog` (+ `@hamd/ui/catalog.css`)  
**Doctrine:** Discovery → evidence → Request / Quick quote. Never cart or live stock.

## Audit

| Item | Decision |
| --- | --- |
| Category browse → request handoff | **KEEP** (business logic) |
| Homepage featured/categories `/catalog` hrefs | **KEEP** (IA consistency) |
| Evidence fields (MOQ, lead, manufacturer, origin, availability) | **REFACTOR → NEW** |
| Compare ≤4, bookmarks, recommendations, related | **REFACTOR → NEW** |
| Legacy “Services” mashup / cart metaphors | **REPLACE** |

## Features shipped

- Category tree (expand/collapse + multi-select)
- Manufacturers, Brands, Suppliers, Origin, Availability facets
- Smart filters + clear all
- Sorting (relevance, name, newest, lead time, MOQ)
- Pagination **or** infinite scroll (`scrollMode`)
- Bookmarks + Compare (limit 4) + sticky compare tray
- Recommendations, Recently viewed, Related products rails
- Quick quote (primary) + Details
- Views: **Grid** · **List** · **Compact**
- Skip link, ARIA, dark mode, responsive, reduced motion skeletons

## Import

```ts
import { ProductCatalog, catalogFixture, catalogLazy } from "@hamd/ui/catalog";
import "@hamd/ui/catalog.css";
```

Hosts own fetching; inject `filters` / `products` / pagination callbacks.

## Review

See [72-enterprise-product-catalog-review.md](./72-enterprise-product-catalog-review.md).
