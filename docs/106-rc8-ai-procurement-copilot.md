# RC8 - AI Procurement Copilot

**Status:** Implemented  
**Rule:** Workflow-embedded assist only. Not a generic chatbot. No mock AI completions.

## Mission coverage

| Workflow | Host embeds | API |
| --- | --- | --- |
| Products | `apps/web` `/product/:slug` | `POST /api/v1/ai/copilot/products/advise` |
| Procurement requests | `/app/requests*`, create wizard | `…/requests/:id/guidance`, `…/requests/draft-guidance` |
| Quotations | detail + compare | `…/quotations/:id/explain`, `…/quotations/compare` |
| Orders | shipments + ops POs | `…/orders/advise` |

## Architecture

Provider gateway (`apps/api/src/modules/ai/providers/`):

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI

Workflows never import a vendor SDK. `AI_DEFAULT_PROVIDER` selects the active adapter; `none` uses the first configured key. If no key is set, endpoints return `503 AI_NOT_CONFIGURED` - they do **not** fabricate answers.

## Response contract

Every copilot response includes: `answer`, `confidence`, `citations`, `assumptions`, `missingData`, `nextActions`, `structured`, `provider`, `model`.

Grounding: prompts include live Prisma records (requests, quotations, shipments, POs, catalog/suppliers). The model is instructed not to invent commercial facts outside that context.

## Configuration

See `apps/api/.env.example`:

```
AI_DEFAULT_PROVIDER=none|openai|anthropic|gemini|azure_openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
```

Permission: `ai:use` (also granted via domain read / `ops:access`).

## Related

- [AI architecture](./16-hamd-ai-architecture.md)
- [AI governance](./37-ai-governance.md)
- [UI assistant package](./82-ai-procurement-assistant.md)
