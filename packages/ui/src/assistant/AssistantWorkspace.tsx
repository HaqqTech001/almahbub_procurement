import { useId, useState } from "react";
import { cx } from "../utils/cx.js";
import { useAssistantSession } from "./useAssistantSession.js";
import {
  ASSISTANT_CAPABILITY_DESCRIPTORS,
  ASSISTANT_MODES,
  ASSISTANT_SUGGESTION_KINDS,
  assistantConfidenceLabel,
  assistantModeLabel,
  assistantSuggestionKindLabel,
  emptyAssistantFilters,
  groupSuggestionsByKind,
  type AssistantAskInput,
  type AssistantAskResult,
  type AssistantCapability,
  type AssistantContext,
  type AssistantMessage,
  type AssistantMode,
  type AssistantSuggestion,
  type AssistantSuggestionKind,
} from "./types.js";

export type AssistantWorkspaceTab =
  | "guidance"
  | "suggestions"
  | "conversation"
  | "capabilities";

export type AssistantWorkspaceProps = {
  suggestions?: AssistantSuggestion[] | undefined;
  messages?: AssistantMessage[] | undefined;
  context?: AssistantContext | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  onAsk?:
    | ((input: AssistantAskInput) => Promise<AssistantAskResult> | AssistantAskResult)
    | undefined;
  onAcceptSuggestion?:
    | ((suggestion: AssistantSuggestion) => void | Promise<void>)
    | undefined;
  onOpenCitation?: ((href: string) => void) | undefined;
  onRequestCapability?:
    | ((capability: AssistantCapability) => void | Promise<void>)
    | undefined;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function AssistantWorkspaceSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-ai", "hamd-ai--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-ai-skel hamd-ai-skel--aside" />
      <div className="hamd-ai-skel hamd-ai-skel--main" />
    </div>
  );
}

/**
 * AI Procurement Assistant - explain / assist / recommend surfaces.
 * Presentational; hosts inject LLM/RAG via onAsk. Voice/Vision/Memory slots
 * are future-ready (session memory is local stub).
 */
export function AssistantWorkspace({
  suggestions = [],
  messages = [],
  context,
  title = "AI Procurement Assistant",
  loading,
  className,
  onAsk,
  onAcceptSuggestion,
  onOpenCitation,
  onRequestCapability,
}: AssistantWorkspaceProps) {
  const promptId = useId();
  const [tab, setTab] = useState<AssistantWorkspaceTab>("suggestions");
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<AssistantMode>("recommend");
  const [kind, setKind] = useState<AssistantSuggestionKind | "">("");
  const [toast, setToast] = useState("");

  const session = useAssistantSession(suggestions, messages, {
    ...(onAsk ? { onAsk } : {}),
  });

  if (loading) {
    return <AssistantWorkspaceSkeleton className={className} />;
  }

  const groups = groupSuggestionsByKind(session.filtered);
  const selected = session.selected;
  const memoryTurns = session.messages.filter((m) => m.role !== "system").length;

  const runAsk = async () => {
    const text = prompt.trim();
    if (!text) return;
    await session.ask({
      prompt: text,
      mode,
      ...(kind ? { kind } : {}),
      ...(context ? { context } : {}),
    });
    setPrompt("");
    setTab("conversation");
  };

  const tabs: { id: AssistantWorkspaceTab; label: string }[] = [
    { id: "suggestions", label: "Suggestions" },
    { id: "guidance", label: "Guidance" },
    { id: "conversation", label: "Conversation" },
    { id: "capabilities", label: "Future ready" },
  ];

  return (
    <div className={cx("hamd-ai", className)}>
      <a className="hamd-ai__skip" href="#hamd-ai-detail">
        Skip to assistant detail
      </a>

      <header className="hamd-ai__header">
        <div>
          <h1 className="hamd-ai__title">{title}</h1>
          <p className="hamd-ai__subtitle">
            Explain specs, suggest alternatives, recommend suppliers, summarize
            quotations &amp; documents, explain procurement steps, answer FAQs,
            and give budget / lead-time guidance - with RAG, Voice, Vision, and
            conversation memory stubs.
          </p>
          {context?.recordCode || context?.page ? (
            <p className="hamd-ai__context">
              Context:{" "}
              {[context.page, context.recordCode, context.recordType]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      </header>

      <form
        className="hamd-ai-ask"
        onSubmit={(e) => {
          e.preventDefault();
          void runAsk().catch(() => undefined);
        }}
      >
        <label htmlFor={promptId} className="hamd-sr-only">
          Ask the procurement assistant
        </label>
        <textarea
          id={promptId}
          rows={2}
          value={prompt}
          placeholder="Ask to explain specs, summarize a quote, answer an FAQ, or guide lead time…"
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="hamd-ai-ask__controls">
          <label>
            Mode
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as AssistantMode)}
            >
              {ASSISTANT_MODES.map((m) => (
                <option key={m} value={m}>
                  {assistantModeLabel(m)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Focus
            <select
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as AssistantSuggestionKind | "")
              }
            >
              <option value="">Any mission facet</option>
              {ASSISTANT_SUGGESTION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {assistantSuggestionKindLabel(k)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="hamd-ai-btn hamd-ai-btn--primary"
            disabled={session.busy || !prompt.trim()}
          >
            {session.busy ? "Thinking…" : "Ask assistant"}
          </button>
        </div>
      </form>

      <nav className="hamd-ai-tabs" aria-label="Assistant sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx("hamd-ai-tab", tab === t.id && "is-active")}
            aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="hamd-ai__layout">
        {tab === "suggestions" || tab === "guidance" ? (
          <>
            <aside
              className="hamd-ai__directory"
              aria-label="Assistant suggestions"
            >
              <div className="hamd-ai-filters">
                <input
                  type="search"
                  placeholder="Filter suggestions…"
                  value={session.filters.query}
                  onChange={(e) =>
                    session.setFilters((prev) => ({
                      ...prev,
                      query: e.target.value,
                    }))
                  }
                  aria-label="Filter suggestions"
                />
                <label>
                  Mode
                  <select
                    value={session.filters.mode}
                    onChange={(e) =>
                      session.setFilters((prev) => ({
                        ...prev,
                        mode: e.target.value as typeof prev.mode,
                      }))
                    }
                  >
                    <option value="all">All</option>
                    {ASSISTANT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {assistantModeLabel(m)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset className="hamd-ai-kinds">
                  <legend>Mission facets</legend>
                  {ASSISTANT_SUGGESTION_KINDS.filter((k) =>
                    tab === "guidance"
                      ? k === "procurement_guidance" ||
                        k === "specification_explanation" ||
                        k === "lead_time_explanation" ||
                        k === "document_summary" ||
                        k === "quotation_summary" ||
                        k === "budget_suggestion" ||
                        k === "faq_answer"
                      : true,
                  ).map((k) => (
                    <label key={k}>
                      <input
                        type="checkbox"
                        checked={session.filters.kinds.includes(k)}
                        onChange={() =>
                          session.setFilters((prev) => {
                            const has = prev.kinds.includes(k);
                            return {
                              ...prev,
                              kinds: has
                                ? prev.kinds.filter((x) => x !== k)
                                : [...prev.kinds, k],
                            };
                          })
                        }
                      />
                      <span>{assistantSuggestionKindLabel(k)}</span>
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="hamd-ai-btn"
                  onClick={() => session.setFilters(emptyAssistantFilters())}
                >
                  Clear filters
                </button>
              </div>

              <ul className="hamd-ai-list" role="list">
                {(tab === "guidance"
                  ? groups.filter((g) =>
                      [
                        "procurement_guidance",
                        "specification_explanation",
                        "lead_time_explanation",
                        "document_summary",
                        "quotation_summary",
                        "budget_suggestion",
                        "faq_answer",
                      ].includes(String(g.kind)),
                    )
                  : groups
                ).map((group) => (
                  <li key={group.kind} className="hamd-ai-group">
                    <h2 className="hamd-ai-group__title">{group.label}</h2>
                    <ul>
                      {group.items.map((row) => {
                        const active = selected?.id === row.id;
                        return (
                          <li key={row.id}>
                            <button
                              type="button"
                              className={cx(
                                "hamd-ai-row",
                                active && "is-active",
                              )}
                              aria-current={active ? "true" : undefined}
                              onClick={() => session.select(row.id)}
                            >
                              <span className="hamd-ai-row__title">
                                {row.title}
                              </span>
                              <span className="hamd-ai-row__meta">
                                {assistantModeLabel(row.mode)} ·{" "}
                                {assistantConfidenceLabel(row.confidence)}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </aside>

            <section
              id="hamd-ai-detail"
              className="hamd-ai__detail"
              aria-label="Suggestion detail"
            >
              {selected ? (
                <div className="hamd-ai-detail">
                  <p className="hamd-ai-detail__kind">
                    {assistantSuggestionKindLabel(selected.kind)}
                  </p>
                  <h2 className="hamd-ai-detail__title">{selected.title}</h2>
                  <p className="hamd-ai-detail__summary">{selected.summary}</p>
                  <dl className="hamd-ai-facts">
                    <div>
                      <dt>Mode</dt>
                      <dd>{assistantModeLabel(selected.mode)}</dd>
                    </div>
                    <div>
                      <dt>Confidence</dt>
                      <dd data-confidence={selected.confidence}>
                        {assistantConfidenceLabel(selected.confidence)}
                      </dd>
                    </div>
                  </dl>
                  {selected.confidenceReason ? (
                    <p className="hamd-ai-note">{selected.confidenceReason}</p>
                  ) : null}
                  {selected.assumptions?.length ? (
                    <div>
                      <h3>Assumptions</h3>
                      <ul className="hamd-ai-bullets">
                        {selected.assumptions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {selected.missingData?.length ? (
                    <div>
                      <h3>Missing data</h3>
                      <ul className="hamd-ai-bullets">
                        {selected.missingData.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div>
                    <h3>Citations</h3>
                    <ul className="hamd-ai-citations">
                      {selected.citations.map((c) => (
                        <li key={c.id}>
                          {c.href ? (
                            <button
                              type="button"
                              className="hamd-ai-linkish"
                              onClick={() => onOpenCitation?.(c.href!)}
                            >
                              {c.label}
                            </button>
                          ) : (
                            <span>{c.label}</span>
                          )}
                          {c.kind ? <em>{c.kind}</em> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {selected.nextActions?.length ? (
                    <div>
                      <h3>Safe next actions</h3>
                      <ul className="hamd-ai-bullets">
                        {selected.nextActions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="hamd-ai-detail__actions">
                    {onAcceptSuggestion ? (
                      <button
                        type="button"
                        className="hamd-ai-btn hamd-ai-btn--primary"
                        onClick={() => {
                          void Promise.resolve(onAcceptSuggestion(selected))
                            .then(() => setToast("Suggestion accepted for review"))
                            .catch((err) =>
                              session.error
                                ? undefined
                                : setToast(
                                    err instanceof Error
                                      ? err.message
                                      : "Accept failed",
                                  ),
                            );
                        }}
                      >
                        Accept for human review
                      </button>
                    ) : null}
                    {selected.href ? (
                      <button
                        type="button"
                        className="hamd-ai-btn"
                        onClick={() => onOpenCitation?.(selected.href!)}
                      >
                        Open related
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <p className="hamd-ai-empty" role="status">
                  No suggestions match these filters.
                </p>
              )}
            </section>
          </>
        ) : null}

        {tab === "conversation" ? (
          <section
            className="hamd-ai-conversation"
            aria-label="Assistant conversation"
            id="hamd-ai-detail"
          >
            <p className="hamd-ai-memory" role="status">
              Conversation memory (session stub): {memoryTurns} turn
              {memoryTurns === 1 ? "" : "s"} in this thread. Durable org memory
              requires a host-injected store.
            </p>
            <ol className="hamd-ai-messages">
              {session.messages.map((msg) => (
                <li
                  key={msg.id}
                  className="hamd-ai-message"
                  data-role={msg.role}
                >
                  <span className="hamd-ai-message__role">{msg.role}</span>
                  <p>{msg.content}</p>
                  <time dateTime={msg.createdAt}>
                    {formatWhen(msg.createdAt)}
                  </time>
                  {msg.confidence ? (
                    <span className="hamd-ai-pill" data-confidence={msg.confidence}>
                      {assistantConfidenceLabel(msg.confidence)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {tab === "capabilities" ? (
          <section
            className="hamd-ai-capabilities"
            aria-label="Future-ready capabilities"
            id="hamd-ai-detail"
          >
            <p className="hamd-ai-capabilities__intro">
              LLM, RAG, and conversation memory are host-injectable stubs. Voice
              and Vision are reserved - do not hardcode providers in UI.
            </p>
            <ul className="hamd-ai-capabilities__grid">
              {ASSISTANT_CAPABILITY_DESCRIPTORS.map((cap) => (
                <li
                  key={cap.id}
                  className="hamd-ai-cap-card"
                  data-availability={cap.availability}
                >
                  <div className="hamd-ai-cap-card__head">
                    <h2>{cap.label}</h2>
                    <span className="hamd-ai-pill" data-availability={cap.availability}>
                      {cap.availability === "future"
                        ? "Future"
                        : cap.availability === "stub"
                          ? "Stub"
                          : "Active"}
                    </span>
                  </div>
                  <p>{cap.description}</p>
                  {onRequestCapability ? (
                    <button
                      type="button"
                      className="hamd-ai-btn"
                      onClick={() => void onRequestCapability(cap.id)}
                    >
                      {cap.availability === "future"
                        ? "Notify when available"
                        : "Configure host provider"}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {session.error ? (
        <p className="hamd-ai-toast" role="alert">
          {session.error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {session.announce || toast}
      </div>
    </div>
  );
}
