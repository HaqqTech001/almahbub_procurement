# Product Details

**Package:** `@hamd/ui/product-detail` (+ `@hamd/ui/product-detail.css`)  
**Doctrine:** Evidence-led B2B PDP - Request primary, never cart/stock (docs/15, docs/51).

## Audit

| Item | Decision |
| --- | --- |
| Catalog product identity + request handoff | **KEEP** |
| Homepage / catalog field vocabulary (MOQ, lead, availability to source) | **KEEP** |
| Product detail collage / ecommerce PDP patterns | **REPLACE** |
| Gallery zoom + preview | **NEW** |
| Specs / downloads / certificates / related rails | **REFACTOR → NEW** |

## Sections shipped

Gallery · Specifications · Manufacturer · Supplier · Country · MOQ · Lead Time · Availability · Downloads · Certificates · Related · Recommended · Frequently sourced together · Procurement CTA

## Gallery interactions

- Hover zoom (GPU `transform`, disabled under `prefers-reduced-motion`)
- Click / Enter → image preview dialog
- Thumbnail keyboard arrows
- Lazy thumbs; empty “Image not provided”

## Import

```ts
import { ProductDetailPage, productDetailFixture } from "@hamd/ui/product-detail";
import "@hamd/ui/product-detail.css";
import "@hamd/ui/catalog.css"; // rails reuse ProductCard
```

## Review

See [73-product-details-review.md](./73-product-details-review.md).
