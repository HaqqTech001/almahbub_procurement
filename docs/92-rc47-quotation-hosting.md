# RC4.7 - Hosted Quotation Module

**Status:** COMPLETE (hosted in `apps/web` - there is no `apps/client`; `/app` is the buyer client workspace)  
**Date:** 2026-08-06

## Completed pages

| Route | Experience |
| --- | --- |
| `/app/quotations` | Directory + commercial detail (search, filters, sort, pagination, bulk reject, export, print) |
| `/app/quotations/:id` | Deep-linked detail selection |
| `/app/quotations/compare` | Side-by-side compare + future-ready AI hook (no mock AI) |
| `/app/quotations/history` | Cross-quotation audit timeline |

Nav: Workspace → Quotations.

## Completed API usage / enrichments

Existing production routes under `/api/v1/quotations`:

- `GET /` list
- `POST /` create
- `GET /:id` get
- `PATCH /:id` update draft
- `POST /:id/transitions` accept / decline / review / issue
- `POST /:id/revise` request revision
- `GET /:id/history` audit history (now includes actor display name)

Serialize enrichment: supplier name/country/status, procurement request code, attachments metadata, family version summaries, flattened commercial amounts.

## Features covered

List, details, compare, accept, reject, request revision, version history, supplier info, attachments (read), price breakdown, taxes, discounts, delivery terms, payment terms, lead time, warranty (via commercial terms), approval status, timeline / audit history, search/filter/sort/pagination/bulk/export/print, responsive + dark mode + a11y patterns from `@hamd/ui`.

## AI

`QuotationAiComparisonAdapter` / `runQuotationAiComparison` - future-ready. Hosts pass a real adapter later; UI never invents insights (`aiAdapter={null}` today).

## Remaining blockers

1. Negotiation notes and binary attachment upload still need dedicated APIs (honest errors; not mocked).
2. Create flow requires a real procurement request UUID in an allowed sourcing status, plus optional supplier UUID.
3. Warranty is not a separate DB column - shown from commercial terms.
4. Live browser smoke needs signed-in user with `quotation:*` permissions and seeded quotations.

## Regression risks

- Quotation repository include shape changed (supplier/request/family versions) - verify create/list/get against migrated DB.
- History endpoint payload now includes `actorName` (additive).
- `QuotationWorkspace` directory rows gained checkboxes/sort/toolbar - Storybook/tests still cover core workflows; timeouts may rise under load.
