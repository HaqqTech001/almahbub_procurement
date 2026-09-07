import { useId, useState } from "react";

import { CopilotPanel } from "./CopilotPanel.js";
import type { CopilotResponse } from "./copilot-api.js";

export type RequestCoachAction = {
  id: string;
  label: string;
  run: () => Promise<CopilotResponse>;
};

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.6 9.4a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7v.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RequestCoach({
  actions,
}: {
  actions: RequestCoachAction[];
}) {
  const [open, setOpen] = useState(false);
  const labelId = useId();

  return (
    <div className="hamd-request-coach">
      {open ? (
        <div className="hamd-request-coach__panel" role="dialog" aria-label="Request guide">
          <button
            type="button"
            className="hamd-request-coach__close"
            aria-label="Close request guide"
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </button>
          <CopilotPanel
            title="Request guide"
            description="Help with this request only. You can continue without it."
            actions={actions}
            emptyHint="Choose a guide. You can keep filling the request at any time."
          />
        </div>
      ) : (
        <button
          type="button"
          className="hamd-request-coach__fab"
          aria-labelledby={labelId}
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          <span id={labelId} className="hamd-sr-only">
            Request guide
          </span>
          <HelpIcon />
        </button>
      )}
    </div>
  );
}
