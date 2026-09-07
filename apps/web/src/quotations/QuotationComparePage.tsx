import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  QuotationCompareView,
  type QuotationAiComparisonAdapter,
  type QuotationRecord,
} from "@hamd/ui/quotations";

import {
  HostAlert,
  HostBackLink,
  HostLoading,
  HostPage,
} from "../components/HostChrome.js";
import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { compareQuotations } from "../copilot/copilot-api.js";
import {
  listQuotations,
  QuotationApiError,
  requireQuotationToken,
} from "./quotation-api.js";

export function QuotationComparePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [rows, setRows] = useState<QuotationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await requireQuotationToken(auth.ensureSession);
      setRows(await listQuotations(token, { pageSize: 100 }));
    } catch (err) {
      setError(
        err instanceof QuotationApiError
          ? err.message
          : "Unable to load quotations for comparison.",
      );
    } finally {
      setLoading(false);
    }
  }, [auth.ensureSession]);

  useEffect(() => {
    void load();
  }, [load]);

  const preselected = (params.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const aiAdapter = useMemo<QuotationAiComparisonAdapter>(
    () => ({
      compare: async (request) => {
        const token = getAccessToken() ?? (await auth.ensureSession());
        if (!token) throw new Error("Sign in required.");
        const result = await compareQuotations(token, {
          quotationIds: [...request.quotationIds],
          focus: request.focus ?? "overall",
        });
        const structured = result.structured as {
          insights?: Array<{
            quotationId: string;
            strengths?: string[];
            risks?: string[];
            summary?: string;
            score?: number;
          }>;
          recommendationQuotationId?: string | null;
          narrative?: string;
        };
        const insights = (structured.insights ?? []).map((insight) => ({
          quotationId: insight.quotationId,
          strengths: insight.strengths ?? [],
          risks: insight.risks ?? [],
          summary: insight.summary ?? result.answer,
          ...(insight.score !== undefined ? { score: insight.score } : {}),
        }));
        return {
          generatedAt: new Date().toISOString(),
          model: `${result.provider}/${result.model}`,
          recommendationQuotationId:
            structured.recommendationQuotationId ?? null,
          insights:
            insights.length > 0
              ? insights
              : request.quotationIds.map((quotationId) => ({
                  quotationId,
                  strengths: [],
                  risks: result.missingData,
                  summary: result.answer,
                })),
          narrative: structured.narrative ?? result.answer,
        };
      },
    }),
    [auth],
  );

  return (
    <HostPage className="hamd-web-quotations">
      <HostBackLink to="/app/quotations">← Back to quotations</HostBackLink>
      {error ? <HostAlert>{error}</HostAlert> : null}
      {loading ? <HostLoading label="Loading quotations for comparison…" /> : null}
      {!loading && !error ? (
        <QuotationCompareView
          quotations={rows}
          {...(preselected.length > 0 ? { selectedIds: preselected } : {})}
          aiAdapter={aiAdapter}
          onSelectionChange={(ids) => {
            navigate(
              ids.length
                ? `/app/quotations/compare?ids=${ids.join(",")}`
                : "/app/quotations/compare",
              { replace: true },
            );
          }}
        />
      ) : null}
    </HostPage>
  );
}
