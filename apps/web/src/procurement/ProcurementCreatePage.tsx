import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  RequestCreateWizard,
  type ProcurementRequestRecord,
  type RequestWizardDraft,
  type RequestWizardSubmitPayload,
} from "@hamd/ui/procurement";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import {
  HostAlert,
  HostLoading,
  HostPage,
  HostStatus,
} from "../components/HostChrome.js";
import { CopilotPanel } from "../copilot/CopilotPanel.js";
import { guideRequestDraft } from "../copilot/copilot-api.js";
import {
  createAndMaybeSubmit,
  getProcurementRequest,
  listProcurementRequests,
  ProcurementApiError,
  requireProcurementToken,
} from "./procurement-api.js";
import {
  clearWizardDraft,
  loadWizardDraft,
  saveWizardDraft,
} from "./procurement-store.js";

/**
 * Hosted create wizard — persists drafts/submits via apps/api (RC5.2).
 */
export function ProcurementCreatePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const duplicateId = params.get("duplicate");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(duplicateId));
  const [duplicateFrom, setDuplicateFrom] = useState<
    ProcurementRequestRecord | undefined
  >();
  const [recent, setRecent] = useState<ProcurementRequestRecord[]>([]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const rows = await listProcurementRequests(token, { pageSize: 8 });
      setRecent(rows.slice(0, 8));
      if (duplicateId) {
        setDuplicateFrom(await getProcurementRequest(token, duplicateId));
      }
    } catch (err) {
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to load procurement data.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession, duplicateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const initial = useMemo(() => {
    if (duplicateFrom) return undefined;
    return loadWizardDraft<Partial<RequestWizardDraft>>() ?? undefined;
  }, [duplicateFrom]);

  const persist = async (payload: RequestWizardSubmitPayload) => {
    setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      const record = await createAndMaybeSubmit(token, payload);
      clearWizardDraft();
      const attachmentCount = payload.attachmentFiles?.length ?? 0;
      const attachmentNote =
        attachmentCount > 0
          ? ` ${attachmentCount} attachment${attachmentCount === 1 ? "" : "s"} uploaded.`
          : "";
      setMessage(
        payload.submit
          ? `${record.publicCode} submitted.${attachmentNote}`
          : `${record.publicCode} saved as draft.${attachmentNote}`,
      );
      navigate(`/app/requests?focus=${record.id}`);
    } catch (err) {
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to save procurement request.",
      );
      throw err;
    }
  };

  return (
    <HostPage className="hamd-web-procurement">
      {error ? <HostAlert>{error}</HostAlert> : null}
      {message ? <HostStatus tone="success">{message}</HostStatus> : null}
      {loading ? <HostLoading label="Loading…" /> : null}
      {!loading ? (
        <>
          <CopilotPanel
            title="AI request coach"
            description="Detect missing information, recommend suppliers, suggest quantities, and improve descriptions before you submit."
            actions={[
              {
                id: "missing",
                label: "Detect missing information",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "missing_information",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      currencyCode: draft.currencyCode,
                      destinationCountry: draft.destinationCountryCode,
                      budgetAmount: draft.budgetAmount,
                      priority: draft.priority,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "suppliers",
                label: "Recommend suppliers",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "recommend",
                    focus: "suppliers",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "quantities",
                label: "Suggest quantities",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "quantities",
                    draft: {
                      title: draft.title,
                      items: draft.items,
                    },
                  });
                },
              },
              {
                id: "descriptions",
                label: "Improve descriptions",
                run: async () => {
                  const token =
                    getAccessToken() ?? (await auth.ensureSession());
                  if (!token) throw new Error("Sign in required.");
                  const draft =
                    loadWizardDraft<Partial<RequestWizardDraft>>() ?? {};
                  return guideRequestDraft(token, {
                    mode: "assist",
                    focus: "descriptions",
                    draft: {
                      title: draft.title,
                      description: draft.notes,
                      items: draft.items,
                    },
                  });
                },
              },
            ]}
          />
          <RequestCreateWizard
            {...(initial ? { initial } : {})}
            {...(duplicateFrom ? { duplicateFrom } : {})}
            recentRequests={recent}
            onAutosave={async (draft) => {
              saveWizardDraft(draft);
            }}
            onSaveDraft={async (payload) => {
              await persist(payload);
            }}
            onSubmit={async (payload) => {
              clearWizardDraft();
              await persist(payload);
            }}
            onCancel={() => navigate("/app/requests")}
          />
        </>
      ) : null}
    </HostPage>
  );
}
