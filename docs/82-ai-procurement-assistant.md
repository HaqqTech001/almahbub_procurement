# AI Procurement Assistant

**Package:** `@hamd/ui/assistant` (+ `@hamd/ui/assistant.css`)  
**Rule:** Presentational copilot. Hosts inject LLM/RAG via `onAsk`. Separate from `@hamd/ui/chat`.

## Audit

| Asset | Decision |
| --- | --- |
| Architecture `docs/16`, governance `docs/37` | **KEEP** |
| Genesis API / Prisma AI module | **LIVE (RC8)** - `/api/v1/ai/copilot/*` |
| Legacy keyword FAQ (`backend/routes/ai.js`) | **REPLACE** (RC7 knowledge + RC8 LLM) |
| Human chat (`@hamd/ui/chat`) | **KEEP** - do not merge |

## Mission coverage

Product suggestions · Supplier suggestions · Alternative products · Specification explanation · Budget suggestions · Lead time explanation · Document summary · Quotation summary · Procurement guidance

## RC8 status

| Capability | Status |
| --- | --- |
| LLM | **Active** - provider gateway (OpenAI / Anthropic / Gemini / Azure) |
| RAG | **Grounded context** - live domain records + citations (chunk index later) |
| Voice | **Future** |
| Vision | **Future** |

Modes: Explain · Assist · Recommend (never auto-commits commercial actions).

See [docs/106-rc8-ai-procurement-copilot.md](./106-rc8-ai-procurement-copilot.md).

## Import

```ts
import {
  AssistantWorkspace,
  assistantSuggestionsFixture,
  assistantMessagesFixture,
} from "@hamd/ui/assistant";
import "@hamd/ui/assistant.css";
```
