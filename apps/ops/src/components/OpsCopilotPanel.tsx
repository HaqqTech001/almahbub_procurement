import { useState } from "react";

import type { CopilotResponse } from "../api/copilot-api.js";
import { CopilotApiError } from "../api/copilot-api.js";
import { OpsAlert, OpsStatus } from "./OpsChrome.js";

export function OpsCopilotPanel({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: Array<{
    id: string;
    label: string;
    run: () => Promise<CopilotResponse>;
  }>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CopilotResponse | null>(null);

  return (
    <section className="hamd-ops-copilot" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="hamd-ops-copilot__actions">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="hamd-btn hamd-btn--secondary"
            disabled={busyId !== null}
            onClick={() => {
              void (async () => {
                setBusyId(action.id);
                setError(null);
                try {
                  setResult(await action.run());
                } catch (err) {
                  setResult(null);
                  setError(
                    err instanceof CopilotApiError
                      ? err.message
                      : err instanceof Error
                        ? err.message
                        : "Copilot failed.",
                  );
                } finally {
                  setBusyId(null);
                }
              })();
            }}
          >
            {busyId === action.id ? "Thinking…" : action.label}
          </button>
        ))}
      </div>
      {error ? <OpsAlert tone="danger">{error}</OpsAlert> : null}
      {result ? (
        <div className="hamd-ops-copilot__result">
          <OpsStatus tone="neutral">
            {result.confidence} · {result.provider}/{result.model}
          </OpsStatus>
          <p>{result.answer}</p>
          {result.nextActions.length > 0 ? (
            <ul>
              {result.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
