import { useState, type ReactNode } from "react";

import { HostAlert, HostStatus } from "../components/HostChrome.js";
import type { CopilotResponse } from "./copilot-api.js";
import { CopilotApiError } from "./copilot-api.js";

export type CopilotPanelProps = {
  title: string;
  description?: string;
  actions: Array<{
    id: string;
    label: string;
    run: () => Promise<CopilotResponse>;
  }>;
  emptyHint?: string;
  footer?: ReactNode;
};

/**
 * Compact workflow-embedded copilot panel - not a generic chatbot.
 */
export function CopilotPanel({
  title,
  description,
  actions,
  emptyHint = "Run a workflow action to get grounded guidance.",
  footer,
}: CopilotPanelProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResponse | null>(null);

  const run = async (action: CopilotPanelProps["actions"][number]) => {
    setBusyId(action.id);
    setError(null);
    try {
      setResult(await action.run());
    } catch (err) {
      setResult(null);
      if (err instanceof CopilotApiError && err.code === "AI_NOT_CONFIGURED") {
        setError(
          "This guide is temporarily unavailable. You can continue creating your request normally.",
        );
      } else {
        setError(
          "This guide is temporarily unavailable. You can continue creating your request normally.",
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="hamd-copilot-panel" aria-label={title}>
      <header className="hamd-copilot-panel__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="hamd-copilot-panel__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="hamd-btn hamd-btn--secondary"
            disabled={busyId !== null}
            onClick={() => void run(action)}
          >
            {busyId === action.id ? "Thinking…" : action.label}
          </button>
        ))}
      </div>
      {error ? <HostAlert tone="danger">{error}</HostAlert> : null}
      {!result && !error ? (
        <p className="hamd-copilot-panel__hint" role="status">
          {emptyHint}
        </p>
      ) : null}
      {result ? (
        <div className="hamd-copilot-panel__result">
          <HostStatus tone="neutral">
            {result.confidence} confidence · {result.provider}/{result.model}
          </HostStatus>
          <p className="hamd-copilot-panel__answer">{result.answer}</p>
          {result.missingData.length > 0 ? (
            <div>
              <h3>Missing information</h3>
              <ul>
                {result.missingData.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.nextActions.length > 0 ? (
            <div>
              <h3>Suggested actions</h3>
              <ul>
                {result.nextActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.citations.length > 0 ? (
            <div>
              <h3>Citations</h3>
              <ul>
                {result.citations.map((citation) => (
                  <li key={`${citation.kind}:${citation.id}`}>
                    {citation.href ? (
                      <a href={citation.href}>{citation.label}</a>
                    ) : (
                      citation.label
                    )}{" "}
                    <span>({citation.kind})</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      {footer}
    </section>
  );
}
