# Quotation Management - Review

## Verdict

Ship `@hamd/ui/quotations` against the existing Genesis quotation API. Do not invent parallel statuses.

## KEEP / REFACTOR / REPLACE

| Decision | Scope |
| --- | --- |
| **KEEP** | API state machine, money fields, family/version model, history endpoint |
| **REFACTOR** | Host adapters map UI “Approve for issue” → `review`, “Reject” → `decline` |
| **NEW** | Presentational workspace + negotiation notes surface (persist via host) |

## Accessibility & performance

Skip link, labelled directory/detail, workflow action group, section tabs, form labels, live toasts. Client filter/pagination, `content-visibility` on list, lazy export via `quotationsLazy`.

## Stop line

Implementation and review complete for Quotation Management UI.
