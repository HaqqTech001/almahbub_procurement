# HAMD Genesis - Enterprise Product Catalog Architecture

**Brand:** Almahbub International  
**Powered by:** HAQQ TECH  
**Purpose:** A procurement-first intelligent catalog for discovery, comparison,
specification, sourcing, and collaboration-not an ecommerce store.

## 1. Strategic definition

HAMD Catalog helps buyers answer:

1. What is this product, technically and commercially?
2. Is it suitable for my requirement, destination, policy, and lead time?
3. What evidence supports that conclusion?
4. What is the safest next action: save, compare, ask AI, chat, or request
   procurement/quotation?

The catalog is a **reference and decision layer** connected to sourcing and
logistics. It does not promise that an item is in stock, purchasable, or priced
until an approved supplier/quotation/corridor context confirms it.

## 2. External best-practice findings

- Alibaba, Global Sources, and Made-in-China demonstrate the importance of
  structured RFQs, supplier verification/audit evidence, MOQs, lead time,
  certification, comparative supplier terms, and written specifications. Their
  weakness for HAMD’s model is that marketplace breadth can create search noise
  and inconsistent data.
- Amazon Business demonstrates guided buying: products/offers can be visibly
  preferred, restricted, or blocked by organization policy in search results,
  reducing non-compliant spend without obscuring the reason.
- Grainger demonstrates high-density industrial filters, detailed
  specifications, safety documents, alternate products, list/save behavior,
  and side-by-side comparison.
- McMaster-Carr demonstrates technical precision, controlled specifications,
  exact part discovery, trusted product data, and downloadable technical/CAD
  assets. HAMD should adopt precision, not its dense visual style wholesale.
- Apple, Tesla, and Samsung demonstrate clear product storytelling, controlled
  imagery, feature hierarchy, and comparison. HAMD should use these principles
  only for comprehension; procurement data and evidence take precedence over
  lifestyle presentation.

## 3. Catalog information architecture

### Primary discovery paths

1. Search by product name, part/model number, brand, manufacturer, synonym,
   use case, category, and natural-language requirement.
2. Browse category hierarchy and industry/country sourcing collections.
3. Open saved lists, purchase/request history, and shared organization lists.
4. Start a custom procurement request when the catalog is incomplete or the
   requirement is bespoke.

### Product identity layers

- **Category:** buyer-facing navigational class such as Industrial Pumps.
- **Product family:** conceptual product grouping, such as Centrifugal Pump.
- **Product:** curated reference product, brand/model/specification baseline.
- **Variant:** exact technical/configurable model or SKU.
- **Offer/supplier capability:** time-bound potential supply, MOQ, lead time,
  source country, verified evidence, and quotation context.

This separation prevents the common error of mixing a generic product identity
with a particular supplier’s availability or price.

## 4. Category architecture and taxonomy

### Taxonomy principles

- Use a controlled hierarchy with a maximum practical browse depth of three to
  five levels; deeper technical distinctions belong in attributes/facets.
- Support cross-category classification for products that serve several
  industries without duplicating product records.
- Align an internal procurement taxonomy with recognized commodity standards
  such as UNSPSC where enterprise reporting/integration requires it.
- Make category templates define required attributes, comparison fields,
  certification rules, media requirements, and request-intake prompts.

### Example hierarchy

`Industrial Equipment → Fluid Handling → Pumps → Centrifugal Pumps`  
`Electrical → Power Distribution → Circuit Protection → Circuit Breakers`  
`Construction Materials → Finishes → Tiles → Ceramic Tiles`

### Business value

Taxonomy creates consistent search, reporting, supplier matching, policy,
compliance, and request routing. A flat category list creates poor filters and
unusable analytics.

### Backend/database/API

Use `product_categories` with parent relation, immutable category code/slug,
localized labels, lifecycle status, and optional standard taxonomy mapping.
Use a category-attribute template relation, not arbitrary per-product fields.
API returns category tree, breadcrumb, facets, and category landing metadata.
Cache published tree with event-driven invalidation.

### Scalability and future

Use versioned taxonomy changes and product reclassification workflows. Future
features: industry collections, country-specific eligibility, semantic category
mapping, marketplace/punchout taxonomy translation.

## 5. Specifications and attribute engine

### Specification model

Every category defines:

- required attributes for product publication;
- comparable attributes for product comparison;
- filterable attributes/facets;
- unit type, valid range/enum, display order, help text, and localization;
- compliance/certification applicability;
- request-intake fields that must transfer into RFQ/quotation.

Examples: material, dimensions, tolerance, voltage, phase, flow rate,
temperature range, ingress protection, color/finish, compatible media, use
case, standard/certificate, package quantity, and warranty.

### UI

Product pages use grouped specification sections with plain-language labels and
technical definitions. Important attributes appear above the fold; long
specifications use anchored sections/search rather than an unstructured wall
of text. Values show unit and source/verification where it affects trust.

Comparison displays normalized comparable fields; when products differ in
attribute availability, show “Not provided” rather than blank or inferred.

### Backend/database/API

Use relational attribute definitions and typed values:

- `attribute_definitions`: key, type, unit family, validation, filterability,
  localization.
- `category_attribute_templates`: requirement/comparison/facet/order rules.
- `product_specifications`: product/variant attribute value, unit, source,
  verification state.

Product search indexes selected normalized attributes; retain a validated JSONB
source snapshot only where flexible vendor data must be preserved. API supports
facets, units, comparison schema, and specification source metadata.

### Risks and safeguards

Never present supplier-provided values as independently verified facts. Record
source, document proof, verification status, and last review. Do not use an AI
extracted specification without human confidence/review threshold.

## 6. Brands, manufacturers, origin, and certifications

### Brand and manufacturer system

Brands are buyer-facing identities; manufacturers are legal/operational
producers. They are separate because a brand may use multiple factories and a
manufacturer may make private-label products.

**UI:** product page identifies brand, manufacturer where disclosure is
permitted, model/part number, origin, verified evidence, and related products.
Do not expose a supplier relationship as a manufacturer claim without proof.

**Backend/database/API:** `brands`, `manufacturers`, product/variant links, and
source/verification metadata. API returns only permitted public attributes.

### Country of origin

Country of origin is a product/variant/supplier-offer claim with evidence and
time context; it is not merely the supplier’s location. Display it when it
affects buyer preference, customs, compliance, or lead time. “Origin varies by
supplier” is an honest valid state.

### Certifications

Display certificate standard, issuer, certificate number where disclosure is
approved, validity date, scope/model applicability, document/evidence link,
and verification state. A badge alone is insufficient.

**Business value:** reduces compliance risk and supports buyer trust.  
**Risk:** stale or forged certificates. Certificate expiry, issuer validation,
document review, and supplier/product scope checks are mandatory.

## 7. Product media and technical documents

### Images and videos

Use accurate, high-resolution but optimized product images with neutral
background, alternate angles, scale/detail where useful, alt text, and
approved source. Product video is optional and must communicate operation,
features, installation, or inspection-not autoplay decoration.

### 360 viewer and CAD - future

360 viewers are future capability for categories where spatial inspection
matters; they require accessible non-360 images/specification fallback,
performance budget, and verified assets. CAD/downloadable drawings follow the
McMaster-Carr principle of precision: version, format, source, model/variant
applicability, license, and checksum are explicit.

### Downloads

Support PDF brochures, data sheets, manuals, certificates, CAD, installation
guides, safety documents, and packaging drawings. Every document has version,
language, type, source, effective/expiry date, access policy, and product/
variant applicability. Downloads use signed access and virus-scanned private
storage where necessary.

## 8. Product discovery and recommendation

### Search and facets

Search must understand exact part numbers, typo tolerance, synonyms,
abbreviations, category terms, manufacturer/brand, and natural language. It
returns clear scope, matched terms, facet counts, and a recovery path for zero
results. Search ranking favors technical relevance, verified data completeness,
policy fit, and buyer context-not paid placement.

Facets derive from category templates: brand, manufacturer, origin,
certification, material, technical range, indicative lead time, MOQ,
availability confidence, and organization policy. Never show a facet whose
data is too sparse or untrustworthy to guide decisions.

### Related/recommended/frequently purchased together

- **Related products:** technical/category similarity with explanation.
- **Recommended products:** contextual fit based on request/policy/history,
  labeled with reason and confidence.
- **Frequently purchased together:** organization-safe aggregate relationship
  such as compatible accessory/consumable; never expose another customer’s
  purchases.
- **Alternates:** compatible or functionally equivalent substitutes with an
  explicit difference summary.

Recommendations are assistive; the buyer can inspect the evidence and must not
be steered toward an unverified supplier or a non-compliant item.

### AI recommendations

AI can interpret a requirement, identify missing specifications, propose
categories/attributes, summarize differences, recommend saved/approved
products, and draft an RFQ. It must cite product/specification sources,
explain uncertainty, respect organization policy, and never invent
availability, pricing, certification, or supplier capability.

## 9. Procurement-specific commercial context

### MOQ, lead time, packaging, shipping methods, and availability

These are **offer/capability** attributes, not universal product attributes.
They can vary by supplier, quantity, origin, packaging, Incoterm, route, and
time.

Show:

- MOQ/unit and whether negotiable;
- production/handling lead-time range with source/date;
- package type, units per package, dimensions/weight where known;
- eligible shipping modes/corridor conditions;
- supplier availability state and confidence, never a false “in stock” claim;
- whether price/lead time is indicative, negotiated, or confirmed in quote.

Backend separates product identity from supplier offer/capability. Database
links product/variant to supplier capability, currency, MOQ, lead-time range,
packaging profile, valid period, verification status, and evidence. API returns
only the context appropriate to public/client/operations viewer.

## 10. Core buyer features

### Request Procurement

**Business value:** turns product discovery into a governed managed-procurement
workflow.  
**UI:** primary action “Request Procurement”; prefills product/variant,
specifications, images/documents, desired quantity, and relevant questions.
User can correct data, add delivery/budget/requirements, and choose custom
sourcing if the catalog item is a reference only.  
**Backend/database/API:** creates a request draft with immutable product/
specification snapshot and `source_catalog_item` relationship; never assumes
catalog price equals quotation.  
**Scale/future:** templates, bulk/BOM import, policy checks, recurring
procurement, external catalog/punchout.

### Request Quotation

**Business value:** asks procurement to obtain comparable supplier options
without pretending the catalog is a checkout.  
**UI:** clear difference from a purchase: target quantity, delivery country,
required-by date, standards, target budget, packaging, and customization.
**Backend/database/API:** request/RFQ intake with category template validation,
document evidence, and SLA/assignment.  
**Risk:** low-quality request data; mitigate with guided requirements and
clarification state.

### Save, lists, and share

**Save product:** user-level bookmark and organization-aware saved list,
optionally with note/tag/alert.  
**Share:** generate permission-aware internal list/share link; external sharing
uses a sanitized public product page only, never supplier price/quote or
organization purchase data.  
**Backend/database/API:** saved-list/list-item/ACL entities, unique list-item
constraint, activity log, expiration/revocation for share links.  
**Future:** team collections, request templates, procurement projects, reorder
lists, approval/policy publishing.

### Compare

**Business value:** makes specification differences visible and lowers
procurement rework.  
**UI:** compare up to four variants/products within compatible category schema;
pin critical attributes, highlight differences, show source/verification,
export/share comparison, and move selected item into request/quote flow.
**Backend/database/API:** comparison service validates category compatibility,
returns normalized attributes and missing states; supports saved comparisons.
**Risk:** comparing non-equivalent products; require clear compatibility/delta
notice and avoid a deceptive “best” ranking.

### Chat with procurement officer

The product page opens a request-scoped conversation or creates a guided
enquiry-not an unbounded anonymous chat. Messages retain product snapshot,
attachments, internal/external visibility, and future quote linkage. Chat must
not become the authoritative record for commercial acceptance.

## 11. Data model and API recommendations

### Required database entities

Extend the Phase 6 model with:

- `product_families`, `product_variants`, `product_categories`;
- `attribute_definitions`, `category_attribute_templates`,
  `product_specifications`;
- `brands`, `manufacturers`, `product_origins`;
- `product_certifications`, `supplier_certifications`;
- `product_media`, `product_documents`, `media_assets`, `documents`;
- `supplier_product_capabilities`, `supplier_offers`,
  `packaging_profiles`, `shipping_eligibility`;
- `saved_lists`, `saved_list_items`, `product_shares`,
  `comparison_sets`, `comparison_items`;
- `product_relationships` with typed relation/reason/confidence;
- `catalog_policy_guidance` for preferred/restricted/blocked explainable
  organization policy;
- `search_synonyms`, `search_queries` (privacy-governed), and optional
  recommendation feedback events.

All product/specification/certification/offer relationships retain source,
verification, effective period, reviewer, and audit fields. Product records are
archived/versioned, not overwritten when published data changes materially.

### Required API groups

| API group | Core operations |
| --- | --- |
| Catalog discovery | category tree, search, facets, product/variant detail, compare schema, related/alternate/recommended collections. |
| Product governance | create/edit/version/publish/archive product, category, attribute, brand, manufacturer, origin, certification, media/document. |
| Commercial context | supplier capability/offer read and controlled update, MOQ/lead/packaging/shipping eligibility, policy guidance. |
| Buyer actions | create request from product, create RFQ enquiry, saved lists, comparison sets, internal shares, product questions/chat. |
| AI | requirement-to-category/attribute assistance, product comparison explanation, cited recommendation and feedback. |

Every API inherits Phase 8 requirements: authentication/authorization,
organization scope, validation, structured errors, pagination, allowlisted
filter/sort/search, rate limits, logs/audit, cache policy, idempotency for
material writes, and OpenAPI documentation.

## 12. UI architecture

### Search results

Show query/context, category breadcrumb, facet filters, clear-all controls,
result count, sort, compact/high-information product cards, policy guidance,
data completeness, save/compare/request actions, and safe empty/error/loading
states. On mobile, filters become an accessible sheet and comparison selection
remains visible.

### Product detail

Order content by decision importance:

1. product identity, model/variant, category/breadcrumb, policy guidance;
2. primary images/media and specification summary;
3. request procurement/quotation and save/compare actions;
4. sourcing suitability: MOQ, indicative lead time, origin, packaging,
   available shipping context, verification;
5. full specifications, certifications, downloads, related/alternate products;
6. AI help and procurement conversation entry.

Show “indicative,” “supplier-dependent,” “verified,” “requires confirmation,”
and “not provided” clearly. Do not bury risk/limitation below marketing media.

### Administration

Operations catalog management uses an editorial/product-data workflow:
draft → content/specification validation → evidence review → approval →
published → archived. Bulk import requires validation report, duplicate
resolution, preview, idempotent import job, rollback/audit, and data-quality
dashboard.

## 13. Scalability and performance

- Store transactional truth in PostgreSQL; use a dedicated search projection
  and search engine only when catalog scale/relevance requires it. Do not force
  every public search through complex transactional joins.
- Use cached published category/product projections, CDN media, responsive
  image formats, lazy non-critical galleries/video, and skeletons that do not
  hide errors.
- Index taxonomy, published status, SKU/model/slug, normalized brand/
  manufacturer, selected facets, and full-text/trigram fields. Rebuild search
  index through outbox events.
- Version and archive product data; preserve historical request/quote snapshots
  so past commercial records never change with catalog edits.
- Enforce media size/type/transcoding policy; 360/CAD/video are optional
  asynchronous assets with download/performance controls.

## 14. Future enhancements

- Supplier self-service catalog data with approval, verification, and change
  workflow.
- Contract-specific catalogs, negotiated prices, punchout, and external
  procurement-system search.
- CAD/BIM models, compatibility engine, BOM/replenishment, configuration
  wizard, sample ordering/approval, and product lifecycle/end-of-life alerts.
- Country/corridor regulatory guidance and duty/landed-cost simulation tied to
  verified HS classification.
- Multilingual catalog governance, translation review, and regional units.
- Visual similarity search only after privacy, relevance, and evidence quality
  standards are established.
- Privacy-preserving recommendations based on organization history and
  procurement outcomes, never opaque paid placement.

## 15. Product quality rules

- A product is publishable only when its category-required specifications,
  source/evidence, media/accessibility, lifecycle, and policy status pass.
- A supplier capability/offer is publishable only when verification, validity,
  origin, MOQ, lead time, and commercial disclosure policy pass.
- A recommendation must state why it appears and link to evidence.
- A user must always be able to convert discovery into a safe next step:
  save, compare, ask, chat, request, or exit-without being pushed into a false
  checkout flow.

## Reference practices consulted

- Alibaba supplier verification/RFQ/comparison:
  https://buyer.alibaba.com/page/HowItWorks/Page.html
- Amazon Business guided buying and integrated product search:
  https://docs.business.amazon.com/docs/product-search-api-overview
- Global Sources / Made-in-China supplier verification:
  https://a.globalsources.com/corp/Importers_Guide_to_Global_Sources_Services_EN.pdf
  and http://made-in-china.com/audited-suppliers/for-buyers/
- Grainger comparison/specification/discovery:
  https://procurement.sc.gov/files/attach/Grainger.com%20Guide_.pdf
- McMaster-Carr technical product information/CAD:
  https://www.mcmaster.com/help/api/
