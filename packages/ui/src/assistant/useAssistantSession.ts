import { useMemo, useState } from "react";
import {
  emptyAssistantFilters,
  filterAssistantSuggestions,
  type AssistantAskInput,
  type AssistantAskResult,
  type AssistantMessage,
  type AssistantSessionFilters,
  type AssistantSuggestion,
} from "./types.js";

export type UseAssistantSessionOptions = {
  onAsk?: (input: AssistantAskInput) => Promise<AssistantAskResult> | AssistantAskResult;
};

export function useAssistantSession(
  initialSuggestions: AssistantSuggestion[],
  initialMessages: AssistantMessage[],
  options: UseAssistantSessionOptions = {},
) {
  const [suggestions, setSuggestions] =
    useState<AssistantSuggestion[]>(initialSuggestions);
  const [messages, setMessages] = useState<AssistantMessage[]>(initialMessages);
  const [filters, setFilters] = useState<AssistantSessionFilters>(
    emptyAssistantFilters(),
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSuggestions[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const filtered = useMemo(
    () => filterAssistantSuggestions(suggestions, filters),
    [suggestions, filters],
  );

  const selected =
    filtered.find((s) => s.id === selectedId) ??
    filtered[0] ??
    suggestions.find((s) => s.id === selectedId) ??
    null;

  const ask = async (input: AssistantAskInput) => {
    setError(null);
    setBusy(true);
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.prompt,
      createdAt: new Date().toISOString(),
      ...(input.mode ? { mode: input.mode } : {}),
    };
    const memory = [
      ...messages.filter((m) => m.role !== "system"),
      userMessage,
    ];
    setMessages((prev) => [...prev, userMessage]);
    try {
      if (options.onAsk) {
        const result = await options.onAsk({
          ...input,
          memory,
        });
        setMessages((prev) => [...prev, result.message]);
        if (result.suggestions?.length) {
          setSuggestions((prev) => {
            const ids = new Set(result.suggestions!.map((s) => s.id));
            return [
              ...result.suggestions!,
              ...prev.filter((s) => !ids.has(s.id)),
            ];
          });
          setSelectedId(result.suggestions[0]!.id);
        }
        setAnnounce("Assistant response ready");
        return result;
      }
      const stub: AssistantAskResult = {
        message: {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content:
            "LLM/RAG/memory is not wired yet. Hosts should inject onAsk (with session memory). Showing guidance based on current suggestions.",
          createdAt: new Date().toISOString(),
          mode: input.mode ?? "assist",
          confidence: "unavailable",
        },
      };
      setMessages((prev) => [...prev, stub.message]);
      setAnnounce("Stub assistant response");
      return stub;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Assistant request failed.";
      setError(message);
      throw err;
    } finally {
      setBusy(false);
    }
  };

  return {
    suggestions,
    setSuggestions,
    messages,
    filters,
    setFilters,
    filtered,
    selected,
    select: setSelectedId,
    busy,
    error,
    announce,
    ask,
  };
}
