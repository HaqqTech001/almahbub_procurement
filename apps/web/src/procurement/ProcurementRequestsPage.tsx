import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ProcurementWorkspace,
  type ProcurementCommand,
  type ProcurementDraftPatch,
  type ProcurementRequestRecord,
} from "@hamd/ui/procurement";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { HostAlert, HostLoading, HostPage } from "../components/HostChrome.js";
import { CopilotPanel } from "../copilot/CopilotPanel.js";
import { guideRequest } from "../copilot/copilot-api.js";
import {
  duplicateProcurementRequest,
  downloadProcurementDocument,
  listProcurementRequests,
  ProcurementApiError,
  requireProcurementToken,
  transitionProcurementRequest,
  updateProcurementRequest,
  uploadProcurementFiles,
} from "./procurement-api.js";

/**
 * Hosted procurement directory — production API (RC5.2).
 */
export function ProcurementRequestsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const focusId = params.get("focus");
  const [rows, setRows] = useState<ProcurementRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await requireProcurementToken(auth.ensureSession);
      setRows(await listProcurementRequests(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof ProcurementApiError
          ? err.message
          : "Unable to load procurement requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const withToken = async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    const token = await requireProcurementToken(auth.ensureSession);
    return fn(token);
  };

  const recent = useMemo(() => rows.slice(0, 5), [rows]);
  const focused = useMemo(
    () => rows.find((row) => row.id === focusId) ?? rows[0],
    [rows, focusId],
  );

  return (
    <HostPage className="hamd-web-procurement">
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <HostLoading label="Loading requests…" /> : null}

      {!loading && focused ? (
        <CopilotPanel
          title={`Request copilot · ${focused.publicCode}`}
          description="Detect gaps, recommend suppliers, suggest quantities, and improve line descriptions for the focused request."
          actions={[
            {
              id: "missing",
              label: "Detect missing information",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return guideRequest(token, focused.id, {
                  mode: "assist",
                  focus: "missing_information",
                });
              },
            },
            {
              id: "suppliers",
              label: "Recommend suppliers",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return guideRequest(token, focused.id, {
                  mode: "recommend",
                  focus: "suppliers",
                });
              },
            },
            {
              id: "quantities",
              label: "Suggest quantities",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return guideRequest(token, focused.id, {
                  mode: "assist",
                  focus: "quantities",
                });
              },
            },
            {
              id: "descriptions",
              label: "Improve descriptions",
              run: async () => {
                const token = getAccessToken() ?? (await auth.ensureSession());
                if (!token) throw new Error("Sign in required.");
                return guideRequest(token, focused.id, {
                  mode: "assist",
                  focus: "descriptions",
                });
              },
            },
          ]}
        />
      ) : null}

      {!loading && recent.length > 0 ? (
        <section
          className="hamd-web-procurement__recent"
          aria-labelledby="recent-requests-title"
        >
          <h2 id="recent-requests-title">Recent requests</h2>
          <ul>
            {recent.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="hamd-btn hamd-btn--ghost"
                  onClick={() => navigate(`/app/requests?focus=${row.id}`)}
                >
                  {row.publicCode} · {row.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ProcurementWorkspace
        requests={rows}
        loading={loading}
        createHref="/app/requests/new"
        canTransition={
          auth.permissions.includes("request:submit") ||
          auth.permissions.includes("request:cancel") ||
          auth.permissions.includes("request:manage") ||
          auth.permissions.includes("request:update")
        }
        onDuplicate={async (request) => {
          try {
            const copy = await withToken((token) =>
              duplicateProcurementRequest(token, request.id),
            );
            await refresh();
            navigate(`/app/requests?focus=${copy.id}`);
          } catch (err) {
            setError(
              err instanceof ProcurementApiError
                ? err.message
                : "Unable to duplicate request.",
            );
          }
        }}
        onAutosave={async (requestId, patch: ProcurementDraftPatch) => {
          await withToken((token) =>
            updateProcurementRequest(token, requestId, patch),
          );
          await refresh();
        }}
        onTransition={async (
          requestId,
          command: ProcurementCommand,
          meta,
        ) => {
          await withToken((token) =>
            transitionProcurementRequest(token, requestId, command, meta),
          );
          await refresh();
        }}
        onAddComment={async () => {
          throw new Error(
            "Comments are not yet available on the procurement API.",
          );
        }}
        onOpenAttachment={async (attachment) => {
          await withToken((token) =>
            downloadProcurementDocument(token, attachment.id, attachment.name),
          );
        }}
        onUploadAttachment={async (requestId, file) => {
          const current = rows.find((row) => row.id === requestId);
          if (!current) {
            throw new Error("Request not found.");
          }
          if (current.status !== "draft") {
            throw new Error(
              "Attachments can only be added while the request is still a draft.",
            );
          }
          if (current.attachments.length >= 5) {
            throw new Error("At most 5 attachments are allowed.");
          }
          await withToken(async (token) => {
            const uploaded = await uploadProcurementFiles(token, [file]);
            const documentIds = [
              ...current.attachments.map((attachment) => attachment.id),
              ...uploaded.map((doc) => doc.id),
            ].slice(0, 5);
            await updateProcurementRequest(token, requestId, {
              rowVersion: current.rowVersion,
              documentIds,
            });
          });
          await refresh();
        }}
      />
    </HostPage>
  );
}
