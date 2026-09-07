# HAMD AI - Enterprise Procurement Assistant Architecture

**Product:** HAMD Genesis  
**Mission:** Embed accountable AI assistance throughout procurement workflows,
without turning HAMD into an ungoverned chatbot or allowing model output to
make commercial, financial, regulatory, or operational commitments.

## 1. Product definition

HAMD AI is a **contextual procurement copilot**. It assists users at the point
of work: catalog search, request intake, supplier review, quote comparison,
document handling, logistics tracking, support, knowledge, and reporting.

It operates through three modes:

1. **Explain:** summarize, translate, define, compare, and answer with cited
   permitted sources.
2. **Assist:** structure requirements, extract document fields, suggest
   search/filter terms, draft messages, flag missing information, and prepare
   a human-reviewable action.
3. **Recommend:** rank clearly qualified options, risks, and next questions
   using transparent criteria and confidence. It never executes a material
   action without an authorized human workflow.

## 2. Non-negotiable boundaries

HAMD AI must not:

- fabricate supplier capability, certificate, availability, stock, price, MOQ,
  lead time, customs rule, payment status, shipment location, or policy;
- issue/accept a quote, create/approve a purchase order, release/refund
  payment, change a bank account, approve a supplier, submit a customs filing,
  or modify permission without an explicit user action and existing policy;
- retrieve records beyond the requester’s organization, role, record
  relationship, and document access;
- present legal/import/tax guidance as professional advice or a guaranteed
  clearance outcome;
- train a model on customer data without explicit legal/privacy authorization;
- disguise model-generated content as a human staff message.

When evidence is missing, stale, inaccessible, or contradictory, AI says so,
asks a focused question, and offers escalation-not a plausible guess.

## 3. User experience

### Interaction surfaces

- **Global assistant:** a discoverable but non-intrusive entry for general
  authorized help, scoped by selected organization and current page context.
- **Inline assistance:** focused actions such as “Explain this quote,”
  “Compare these products,” “Summarize this shipment,” “Translate message,” or
  “What information is missing?”.
- **Workflow copilot panel:** contextual side panel in request/quote/supplier/
  shipment workspaces, with source links and reviewable outputs.
- **AI search:** natural-language search that returns normal HAMD records,
  filters, and citations-not an opaque answer alone.

### Response anatomy

Every material answer includes:

1. concise answer or recommendation;
2. confidence level and reason;
3. cited source records/documents with access-safe links;
4. assumptions, missing data, and freshness where relevant;
5. safe next actions: inspect source, revise input, create a draft, ask
   officer, or escalate.

### Confidence indicators

- **High:** direct current authoritative record/evidence supports the answer.
- **Moderate:** evidence is relevant but incomplete, inferred, or aging.
- **Low:** general guidance only, insufficient record context, or conflicting
  evidence.
- **Unavailable:** no permitted authoritative evidence; do not answer as fact.

Confidence is not a probability claim unless a separately validated model
provides calibrated probabilities. It is a user-facing evidence-quality label.

### Human escalation

Escalation creates a contextual support/procurement task containing user
question, allowed conversation excerpt, cited sources, model version, risk
flag, and requested response time. Human staff may reply through the normal
record-scoped message/support workflow. AI never claims a human has reviewed an
answer until a staff-authored event exists.

## 4. Capability architecture

| Capability | User value and UX | Data/retrieval/backend/API | Guardrails and future scale |
| --- | --- | --- | --- |
| Product discovery | Converts natural language/part number/use case into categories, facets, and products; explains why results match. | Catalog search index, attribute schema, synonyms, approved products; scoped AI search endpoint. | No paid-ranking bias; distinguish reference product from supplier offer; future visual search after evidence/relevance validation. |
| Product recommendation | Suggests suitable/alternate/compatible products and comparison questions. | Product relationships, specs, policy guidance, saved/history data only with consent. | Cite attributes/policy; never call a product “best” without criteria; future organization preference models. |
| Supplier suggestions | Creates a shortlist of eligible suppliers with evidence/risk/fit explanation. | Supplier lifecycle, capability, assessment, certificate, corridor, prior performance; policy-filtered query tool. | Only verified/allowed candidates; disclose missing evidence; no automatic award; future scoring evaluation and bias monitoring. |
| Budget estimation | Shows estimate range and cost drivers for planning. | Historical approved quote/cost ranges, corridor/quantity/category context, FX/landed-cost service. | Clearly label estimate/date/currency/exclusions; no quote/guarantee; no use where sparse or confidential data creates leakage. |
| Shipping suggestions | Suggests mode/route questions and tradeoffs between time, cost, and risk. | Approved corridor profiles, packaging, weight/volume, historical lane data, partner capability. | Does not book or promise ETA/customs result; escalates unavailable lane/compliance case. |
| Document summarization | Extracts/summarizes invoices, packing lists, certificates, RFQs, and contracts for review. | Authorized document versions, OCR output, page/chunk citations, document type schema. | Human verification for financial/compliance data; no automatic payment/approval update; sensitive document redaction. |
| Quotation explanation | Explains line costs, options, validity, risks, exclusions, and differences in plain language. | Issued quote version, cost components, terms, policy/approval context. | Read-only; quote remains authoritative; flags stale/expired quote. |
| Translation | Translates chat/doc excerpts while preserving original text and terminology. | Allowed message/document segments, terminology glossary, locale preference. | Display original + translation; label machine translation; no legal/commercial interpretation guarantee. |
| Conversation summary | Summarizes record-scoped chat/support and open decisions. | Authorized room messages/events, recency bounds, citations. | Never include internal notes to external participants; user can correct/expand source range. |
| Smart search | Answers “find my overdue shipments” or “quotes expiring this week” with filters/results. | Allowlisted query plans over authorized read models. | AI cannot formulate arbitrary raw SQL; result links remain permission checked. |
| Knowledge/FAQ/support | Answers policy/process questions and suggests approved knowledge articles. | Versioned audience-scoped knowledge base and public FAQ retrieval. | Cite article/version/freshness; default to human support if no authoritative answer. |
| Import regulations | Explains approved country/corridor guidance and document requirements. | Versioned compliance rules, approved external data, country profile, effective dates. | Prominent “not legal/customs advice”; cite source/effective date; hold/escalate restricted/uncertain cases. |
| Country recommendations | Suggests sourcing countries/corridors based on category/requirements. | Supplier/corridor capability, lead history, risk policy, category/product restrictions. | Explain tradeoffs and missing data; no geopolitical/legal claim without source. |
| Risk alerts | Highlights supplier, quote, document, policy, shipment, or anomaly risks. | Compliance screening, expiry, SLA, exception, data-quality, finance controls. | Risk is a signal, not verdict; show evidence/owner/next action; avoid automated punitive action without policy. |
| Procurement guidance | Guides intake, identifies missing specification, drafts RFQ/clarification, and prepares approval context. | Category template, request state, product data, policy, conversation context. | Draft-only behavior; requester/officer owns final submission and messages. |

## 5. Prompt architecture

### Prompt layers

1. **System policy:** HAMD identity, prohibited actions, disclosure, citation,
   privacy, safety, escalation, and tool-use constraints.
2. **Role/surface policy:** buyer, approver, procurement officer, finance,
   logistics, support, or administrator permissions and vocabulary.
3. **Task policy:** specific capability instruction, expected structured output,
   source requirement, confidence rubric, and refusal/escalation rules.
4. **Trusted context:** authorized record summary, selected source chunks,
   current workflow state, locale, date/time, and user question.
5. **User content:** explicitly delimited untrusted input. Documents, messages,
   webpages, and uploaded text are treated as data, never instructions.

### Prompt standards

- Require citations for claims about HAMD records, regulations, product data,
  suppliers, quotes, payments, or shipments.
- Use structured output schemas for extraction, recommended filters, draft
  messages, risk signals, and handoff tasks.
- Keep context minimal and task-specific. Do not send an entire organization
  history “just in case.”
- Version prompts, tool definitions, model routing policy, evaluation cases,
  and safety policies. Store evaluated prompt version with each response.
- Do not place secrets, raw credentials, hidden instructions, or privileged
  internal notes in prompt context.

## 6. Context, conversations, retrieval, and memory

### Context resolution

At request time, the AI Orchestrator resolves:

- authenticated user, active organization/membership, permissions, locale;
- current page/record context and permitted relationship graph;
- task type/risk level;
- relevant current record fields and allowed documents/messages;
- fresh policy/rule/knowledge versions;
- user-selected source scope and explicit consent for optional history.

Context is server-built from trusted identifiers. The client cannot provide
another user’s record IDs or claim authorization through prompt text.

### Conversation history

`ai_conversations` and `ai_messages` retain session history with scope,
retention class, user/organization ownership, model/prompt version, source
citations, tool calls, outcome, and feedback. Long conversations are summarized
through a cited, permission-aware summary; raw history is not endlessly
resubmitted.

### Retrieval augmented generation

1. Ingest only approved, versioned, access-classified knowledge and document
chunks.
2. Extract text/OCR, classify/document type, redact or block sensitive content
according to policy, chunk with record/version/page metadata.
3. Generate embeddings and store in a vector-capable retrieval index with
tenant/audience/access metadata.
4. Retrieve using mandatory filters before semantic ranking; keyword/full-text
hybrid retrieval improves exact procurement codes/specifications.
5. Rerank, enforce source quality/freshness, and pass limited cited chunks to
the model.
6. Return answer with citations, no-answer/escalation when retrieval quality is
below threshold.

No vector search result bypasses normal document/record authorization.

### AI memory

Use three distinct concepts:

- **Conversation memory:** bounded, user-visible, scoped to an AI
  conversation/record.
- **User preference memory:** explicit opt-in durable preferences such as
  default language, unit, preferred explanation level; user can inspect/delete.
- **Organization knowledge:** approved shared data such as policies, templates,
  and taxonomy; controlled by content governance, not inferred from chat.

Never create hidden long-term memory from private conversations, financial
details, or staff notes. Memory does not cross organizations.

## 7. Backend architecture

### Components

- **AI Gateway:** authenticated API boundary, quota/rate enforcement, request
  normalization, output safety.
- **AI Orchestrator:** selects task workflow/model/provider, builds trusted
  context, executes tools, applies guardrails, and produces cited result.
- **Policy Engine:** role/risk/task/model/provider/data-residency decisions.
- **Retrieval Service:** content ingestion, access-filtered hybrid/vector
  search, source citation metadata, freshness evaluation.
- **Tool Registry:** allowlisted read tools and draft-only action tools with
  typed input/output, authorization, audit, timeouts, and idempotency.
- **Human Handoff Service:** creates support/procurement work items from
  escalation.
- **Evaluation/Observability Service:** offline test sets, runtime quality/
  safety metrics, feedback review, cost/latency monitoring, incident controls.

### Tool policy

Read tools may search product, request, quote, shipment, document, knowledge,
policy, and reports only through service-layer authorization. Draft tools may
prepare a request field set, RFQ, message, support case, or report filter but
require a human review/submit action. Execute tools for finance, approvals,
supplier approval, order issue, admin/role changes, and regulatory filing are
out of scope until separately approved with strong control design.

## 8. Database architecture

Extend Phase 6 with:

| Entity | Purpose and safeguards |
| --- | --- |
| `ai_conversations` | Scoped conversation metadata: organization/user/record scope, status, retention, model policy; soft-delete/anonymize according to policy. |
| `ai_messages` | Immutable user/assistant/tool message events with prompt/model version, token/cost metadata, safe content/redaction state, confidence, and response outcome. |
| `ai_citations` | Links response/message to source record/document chunk/version/page and access proof. |
| `ai_memory_preferences` | Explicit user/organization opt-in preferences, scope, expiry, consent/version. |
| `knowledge_sources` | Approved source registry with owner, audience, version, freshness, ingestion state, and policy. |
| `knowledge_chunks` | Access-classified text/chunk metadata, checksum, embedding reference, source version/page, retention; embeddings use approved vector store/extension. |
| `ai_tool_runs` | Tool name/version, authorization result, safe input/output hash, timing, idempotency, error; no raw secret payloads. |
| `ai_evaluations` | Versioned evaluation set/run/result, reviewer, safety/quality dimensions. |
| `ai_feedback` | User correction/rating/escalation request with privacy and moderation state. |
| `ai_model_policies` | Approved provider/model/task/data-region/risk configuration, effective version, fallback policy. |
| `ai_usage_events` | Append-only latency/token/cost/outcome metrics; partitioned and retention-governed. |

Use row-level/organization access constraints, encrypted sensitive content
where required, source versioning, redaction flags, and retention/legal-hold
policy. Keep embeddings separate from raw confidential content where possible;
an embedding is still sensitive derived data and obeys deletion/tenant rules.

## 9. API and frontend architecture

### API surface

- `POST /api/v1/ai/conversations`: create scoped conversation.
- `POST /api/v1/ai/conversations/{id}/messages`: submit task/question; returns
  cited response or asynchronous job reference.
- `GET /api/v1/ai/conversations/{id}`: authorized history, sources, feedback
  state.
- `POST /api/v1/ai/messages/{id}/feedback`: correction, rating, escalation.
- `POST /api/v1/ai/escalations`: create human support/procurement handoff.
- Task-specific endpoints such as `/ai/catalog/search`,
  `/ai/quotations/{id}/explain`, `/ai/requests/{id}/guidance`, and
  `/ai/shipments/{id}/summary` may provide tightly scoped experience contracts
  while using the same orchestrator.
- Administrative APIs manage approved sources, ingestion, model policies,
  evaluation, feedback review, and usage/quality metrics.

All routes inherit Phase 8 API controls: validated schema, authentication,
tenant authorization, rate/quota, structured errors, audit, trace IDs,
idempotency for drafts/escalations, and no cache of user-sensitive answers.

### Frontend components

- `AiEntryPoint`: global/surface-aware launch with current scope label.
- `AiInlineAction`: workflow-specific assist/explain button.
- `AiConversationPanel`: cited answer, source list, confidence, feedback,
  stop/retry/escalate, and clear context boundary.
- `AiDraftReview`: displays proposed fields/message with differences and
  explicit human submit.
- `AiRecommendationCard`: rationale, constraints, evidence, confidence,
  alternative options, and safe action.
- `AiDisclosure`: visible model/automation disclosure and privacy/retention
  policy link.

Loading is honest: “Reviewing permitted request and quote data,” not simulated
human typing. Streaming content preserves layout and offers immediate stop.
Every AI screen supports keyboard, reduced motion, screen reader citations,
error/retry, empty/no-answer, offline fallback, and mobile layouts.

## 10. Security, privacy, rate limits, and caching

### Security

- Enforce tenant/record/document authorization before retrieval and before
  tool execution; recheck after tool redirects/relationship changes.
- Defend prompt injection by isolating untrusted content, constraining tools,
  rejecting instruction-like retrieved text, and requiring task-specific
  structured outputs.
- Apply content safety policy to inputs/outputs; use human review for
  sensitive/regulatory/financial topics.
- Log policy/tool/model decisions without logging secrets or unnecessary raw
  PII. Audit sensitive AI access and escalation.
- Set model/provider data usage, retention, region, and contractual controls
  before production data is sent.

### Privacy

- Data minimization, purpose limitation, source consent/access, retention,
  deletion, and user/organization controls apply to prompts, outputs,
  embeddings, and feedback.
- Do not use customer prompts/documents for training by default.
- Redact/tokenize sensitive fields before optional external model invocation
  where task quality permits.
- Display when AI accesses a record/document context and let users narrow
  source scope where safe.

### Rate limits and quotas

Apply user, organization, session, task, model, token/cost, and endpoint quotas.
Examples: tighter limit for document summarization and long-context analysis;
lower parallelism for expensive provider calls; separate support-safe quota for
critical help. Return `AI_QUOTA_EXCEEDED` with transparent retry/alternative
path, not a generic server failure.

### Caching

Cache only safe, non-sensitive, deterministic retrieval embeddings, approved
knowledge search results, catalog synonyms, and model capability metadata with
version/tenant keys. Do not cache personalized answers, financial summaries,
private documents, authorization decisions, or time-sensitive shipment/payment
results beyond their safe freshness policy.

## 11. Fallback and failure behavior

| Condition | Required behavior |
| --- | --- |
| No authoritative source | State that HAMD cannot verify the answer; ask a focused question or offer human help. |
| Low confidence/conflicting sources | Explain conflict, cite sources, do not recommend action as fact, escalate if material. |
| Provider outage/timeout | Preserve user input, show retry/background option, offer deterministic search/knowledge and human support. |
| Tool authorization failure | Do not reveal hidden record existence; explain unavailable access at a high level. |
| Unsafe/high-risk request | Decline unsafe action, state boundary concisely, offer permitted workflow/human route. |
| Model output validation failure | Suppress malformed result, log safely, retry with bounded fallback or return no-answer. |

## 12. Model provider strategy

HAMD must use a provider abstraction and task/model policy layer. Do not couple
business workflows to one vendor SDK or model identifier.

| Option | Best fit | Trade-offs / controls |
| --- | --- | --- |
| OpenAI | Broad general reasoning, tool use, multimodal/document tasks, mature ecosystem. | Review enterprise data retention/region terms, model lifecycle, cost, fallback, and evaluation. |
| Azure OpenAI | Organizations requiring Azure enterprise controls, private networking, regional governance, and Microsoft ecosystem alignment. | Service/model availability differs by region; operational setup and quotas may be more complex. |
| Anthropic | Strong long-context reasoning and safety-oriented workflows. | Validate tool/schema support, regional/data terms, cost, and comparable evaluations for HAMD tasks. |
| Google Gemini | Multimodal/document and Google Cloud ecosystem fit. | Validate availability, data boundaries, grounding/tooling, model/version stability. |
| Local/private models | High-control, limited/offline, data-residency, or narrow extraction/classification workloads. | Significant MLOps, hardware, evaluation, security, and quality burden; not assumed cheaper or safer by default. |

Select models per task through evaluation, not brand preference. Maintain
fallback routing, cost caps, latency budgets, provider health monitoring,
version pinning, canary evaluation, and ability to disable a model/task
immediately.

## 13. Evaluation and governance

Before each capability release, evaluate:

- factuality/citation correctness;
- retrieval relevance and access-control isolation;
- supplier/quote/finance/regulatory refusal and escalation behavior;
- prompt-injection/tool-abuse resistance;
- translation quality for procurement terms;
- bias/fairness in supplier/country recommendations;
- user comprehension, confidence labeling, and error recovery;
- latency, cost, availability, and fallback behavior.

Maintain representative, redacted test cases for product discovery, incomplete
request guidance, quotation explanation, document extraction, shipping delay,
supplier risk, import-regulation uncertainty, and tenant-access denial. Human
review owns go/no-go for high-impact task changes.

## 14. Roadmap

### Phase A - safe, high-value assistance

Knowledge/FAQ answers, catalog search assistance, request completeness checks,
quote explanation, contextual translation, conversation/document summarization,
and human handoff.

### Phase B - evidence-based recommendations

Supplier/corridor/product alternatives, budget/lead-time estimate ranges,
policy/risk signals, structured RFQ drafts, and operational task summaries.

### Phase C - governed optimization

Predictive ETA/exception support, spend insights, document intelligence,
organization-specific recommendation, and multi-provider routing informed by
continuous evaluation.

### Phase D - only with separate approval

Any agentic execution of low-risk, reversible tasks. Financial, approval,
supplier activation, legal/compliance, and external commitment actions remain
human-controlled unless a distinct policy, security, legal, and operations
review approves them.

## Final quality bar

HAMD AI is successful when it makes a user faster and better informed while
making the source of truth, confidence, authority, and human accountability
more visible-not less.
