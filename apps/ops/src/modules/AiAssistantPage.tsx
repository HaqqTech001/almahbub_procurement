import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ListModuleFrame, ModuleDetail } from "@hamd/ui/module-layout";
import { isCancelledRequest } from "@hamd/ui/auth";

import { useAuth } from "../auth/session/AuthProvider.js";
import { getAccessToken } from "../auth/session/token-store.js";
import { OpsAlert, OpsPage, OpsStatus } from "../components/OpsChrome.js";
import {
  createKnowledgeArticle,
  deleteKnowledgeArticle,
  listKnowledgeArticles,
  updateKnowledgeArticle,
  type KnowledgeArticleRow,
} from "../api/parity-api.js";

function formatWhen(iso: unknown): string {
  if (typeof iso !== "string") return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function AiAssistantPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id = "" } = useParams();
  const isNew = location.pathname.endsWith("/new");
  const isEdit = location.pathname.endsWith("/edit");
  const [rows, setRows] = useState<KnowledgeArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywords, setKeywords] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  const tokenOrThrow = useCallback(async () => {
    const token = getAccessToken() ?? (await auth.ensureSession());
    if (!token) throw new Error("Sign in required.");
    return token;
  }, [auth]);

  const refresh = useCallback(async () => {
    setError(null);
    const token = await tokenOrThrow();
    const next = await listKnowledgeArticles(token);
    setRows(Array.isArray(next) ? next : []);
  }, [tokenOrThrow]);

  useEffect(() => {
    void refresh()
      .catch((err) => {
        if (isCancelledRequest(err)) return;
        setError(err instanceof Error ? err.message : "Unable to load knowledge.");
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  const selected = useMemo(
    () => rows.find((row) => row.id === id) ?? null,
    [id, rows],
  );

  useEffect(() => {
    if (!selected || isNew) return;
    setQuestion(String(selected.question ?? ""));
    setAnswer(String(selected.answer ?? ""));
    setKeywords(Array.isArray(selected.keywords) ? selected.keywords.join(", ") : "");
    setActive(selected.active !== false);
  }, [isNew, selected]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? row.active !== false : row.active === false);
      const hay = `${row.question} ${row.answer}`.toLowerCase();
      return matchesStatus && (!q || hay.includes(q));
    });
  }, [query, rows, statusFilter]);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const token = await tokenOrThrow();
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        keywords: keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        active,
      };
      if (isNew) {
        const created = await createKnowledgeArticle(token, payload);
        setSuccess("Knowledge article created.");
        await refresh();
        navigate(`/ai-assistant/${created.id}`);
      } else if (id) {
        await updateKnowledgeArticle(token, id, payload);
        setSuccess("Knowledge article updated.");
        await refresh();
        navigate(`/ai-assistant/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save knowledge.");
    } finally {
      setBusy(false);
    }
  };

  if (isNew || isEdit) {
    return (
      <OpsPage className="hamd-entity-page">
        {error ? <OpsAlert>{error}</OpsAlert> : null}
        {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
        <ModuleDetail
          title={isNew ? "Create Knowledge" : "Edit Knowledge"}
          subtitle="Structured knowledge used by the AI assistant. This is not a public FAQ."
          actions={
            <>
              <Link className="hamd-btn hamd-btn--ghost" to={id ? `/ai-assistant/${id}` : "/ai-assistant"}>
                Cancel
              </Link>
              <button type="button" className="hamd-btn hamd-btn--primary" disabled={busy} onClick={() => void save()}>
                {busy ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <form
            className="hamd-form"
            style={{ display: "grid", gap: "0.85rem", maxWidth: "42rem" }}
            onSubmit={(event) => {
              event.preventDefault();
              void save();
            }}
          >
            <label>
              Topic
              <input value={question} onChange={(event) => setQuestion(event.target.value)} required />
            </label>
            <label>
              Content
              <textarea value={answer} onChange={(event) => setAnswer(event.target.value)} required rows={10} />
            </label>
            <label>
              Keywords
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="Comma-separated"
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />{" "}
              Active
            </label>
          </form>
        </ModuleDetail>
      </OpsPage>
    );
  }

  if (id && selected) {
    return (
      <OpsPage className="hamd-entity-page">
        {error ? <OpsAlert>{error}</OpsAlert> : null}
        {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
        <p>
          <Link to="/ai-assistant">← Knowledge</Link>
        </p>
        <ModuleDetail
          title={selected.question}
          subtitle={selected.active === false ? "Inactive" : "Active"}
          actions={
            <>
              <Link className="hamd-btn hamd-btn--secondary" to={`/ai-assistant/${selected.id}/edit`}>
                Edit Knowledge
              </Link>
              <button
                type="button"
                className="hamd-btn hamd-btn--ghost"
                onClick={() => {
                  void (async () => {
                    try {
                      const token = await tokenOrThrow();
                      await deleteKnowledgeArticle(token, selected.id);
                      await refresh();
                      navigate("/ai-assistant");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Unable to delete.");
                    }
                  })();
                }}
              >
                Delete
              </button>
            </>
          }
        >
          <p style={{ whiteSpace: "pre-wrap" }}>{selected.answer}</p>
          <p className="hamd-module-card__meta">
            Updated {formatWhen(selected.updatedAt)} · Hits {selected.hitCount ?? 0}
          </p>
        </ModuleDetail>
      </OpsPage>
    );
  }

  return (
    <OpsPage className="hamd-list-queue">
      {error ? <OpsAlert>{error}</OpsAlert> : null}
      {success ? <OpsStatus tone="success">{success}</OpsStatus> : null}
      <ListModuleFrame
        header={{
          title: "AI Assistant / Knowledge",
          description: "Topics the assistant can cite. Create, review, and keep answers current.",
          actions: (
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={() => navigate("/ai-assistant/new")}
            >
              Create Knowledge
            </button>
          ),
        }}
        toolbar={{
          search: {
            value: query,
            onChange: setQuery,
            placeholder: "Search knowledge",
          },
          filters: [
            {
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ],
            },
          ],
        }}
        loading={loading}
        error={error}
        onRetry={() => {
          setLoading(true);
          void refresh().finally(() => setLoading(false));
        }}
        empty={
          !loading && visible.length === 0
            ? {
                title: "No knowledge articles yet",
                description: "Create a topic the assistant can use.",
                action: (
                  <button
                    type="button"
                    className="hamd-btn hamd-btn--primary"
                    onClick={() => navigate("/ai-assistant/new")}
                  >
                    Create Knowledge
                  </button>
                ),
              }
            : null
        }
      >
        <ul className="hamd-module-list" role="list">
          {visible.map((row) => (
            <li key={row.id}>
              <Link className="hamd-module-list__row" to={`/ai-assistant/${row.id}`}>
                <span>
                  <strong>{row.question}</strong>
                  <span className="hamd-module-card__meta">
                    {row.active === false ? "Inactive" : "Active"} · Updated {formatWhen(row.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ListModuleFrame>
    </OpsPage>
  );
}
