import { useId, useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import type {
  GuidanceAnalyticsSummary,
  GuidanceTour,
  GuidanceTourDraftInput,
  GuidanceTourStatus,
} from "./types.js";
import { GUIDANCE_AUDIENCES, GUIDANCE_PAGE_KEYS, GUIDANCE_TOUR_STATUSES } from "./types.js";

export type GuidanceAdminWorkspaceProps = {
  tours: readonly GuidanceTour[];
  analytics?: GuidanceAnalyticsSummary | undefined;
  title?: string | undefined;
  className?: string | undefined;
  loading?: boolean | undefined;
  onCreate?: (input: GuidanceTourDraftInput) => void | Promise<void>;
  onUpdate?: (
    tourId: string,
    input: GuidanceTourDraftInput & { status?: GuidanceTourStatus },
  ) => void | Promise<void>;
  onPublish?: (tourId: string) => void | Promise<void>;
  onUnpublish?: (tourId: string) => void | Promise<void>;
  onSchedule?: (tourId: string, scheduledFor: string) => void | Promise<void>;
  onResetUserProgress?: (userId: string) => void | Promise<void>;
};

function emptyDraft(): GuidanceTourDraftInput {
  return {
    key: "",
    title: "",
    description: "",
    audience: "all_authenticated",
    pageKey: "dashboard",
    mandatory: false,
    estimatedMinutes: 5,
    locale: "en",
    sortOrder: 0,
    steps: [
      {
        stepKey: "intro",
        title: "Introduction",
        body: "Describe this step for CMS editors.",
        sortOrder: 0,
      },
    ],
  };
}

function formatDate(value?: string | null): string {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

/**
 * Operations admin for CMS-driven tours - list first, then create or detail.
 */
export function GuidanceAdminWorkspace({
  tours,
  analytics,
  title = "Guidance Admin",
  className,
  loading,
  onCreate,
  onUpdate,
  onPublish,
  onUnpublish,
  onSchedule,
  onResetUserProgress,
}: GuidanceAdminWorkspaceProps) {
  const formId = useId();
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [resetUserId, setResetUserId] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [draft, setDraft] = useState<GuidanceTourDraftInput>(emptyDraft);

  const selected = useMemo(
    () => tours.find((t) => t.id === selectedId) ?? null,
    [selectedId, tours],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...tours];
    return tours.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.key.toLowerCase().includes(q) ||
        String(t.status).includes(q) ||
        String(t.pageKey).toLowerCase().includes(q),
    );
  }, [query, tours]);

  return (
    <div
      className={cx("hamd-guide-admin", loading && "is-loading", className)}
      aria-busy={loading || undefined}
    >
      <header className="hamd-guide-admin__header">
        <div>
          <h1>{title}</h1>
          <p>Published tours and onboarding guidance for authenticated users.</p>
        </div>
        {view === "list" ? (
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--primary"
            onClick={() => {
              setDraft(emptyDraft());
              setView("create");
            }}
          >
            Create Guidance
          </button>
        ) : (
          <button
            type="button"
            className="hamd-guide-btn"
            onClick={() => {
              setView("list");
              setSelectedId(null);
            }}
          >
            Back to list
          </button>
        )}
      </header>

      {analytics && view === "list" ? (
        <section className="hamd-guide-admin__analytics" aria-label="Onboarding analytics">
          <article>
            <strong>{analytics.totalUsers}</strong>
            <span>Users tracked</span>
          </article>
          <article>
            <strong>{analytics.welcomeCompleted}</strong>
            <span>Welcome completed</span>
          </article>
          <article>
            <strong>{analytics.toursCompleted}</strong>
            <span>Tours completed</span>
          </article>
          <article>
            <strong>{analytics.completionRate}%</strong>
            <span>Completion rate</span>
          </article>
        </section>
      ) : null}

      {view === "list" ? (
        <div className="hamd-guide-admin__board">
          <label className="hamd-guide-admin__search">
            <span className="visually-hidden">Search guidance</span>
            <input
              type="search"
              placeholder="Search title, type, or status"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ul className="hamd-guide-admin__records">
            {filtered.map((tour) => (
              <li key={tour.id}>
                <button
                  type="button"
                  className="hamd-guide-admin__record"
                  onClick={() => {
                    setSelectedId(tour.id);
                    setView("detail");
                  }}
                >
                  <span className="hamd-guide-admin__record-title">{tour.title}</span>
                  <span>{String(tour.pageKey).replaceAll("_", " ")}</span>
                  <span className="hamd-guide-admin__status">{tour.status}</span>
                  <span>{formatDate(tour.publishedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 ? (
            <p className="hamd-guide-admin__empty">No guidance records match this search.</p>
          ) : null}
        </div>
      ) : null}

      {view === "create" ? (
        <form
          id={formId}
          className="hamd-guide-admin__create"
          onSubmit={(e) => {
            e.preventDefault();
            void Promise.resolve(onCreate?.(draft)).then(() => {
              setView("list");
              setDraft(emptyDraft());
            });
          }}
        >
          <h2>Create Guidance</h2>
          <label>
            Key
            <input
              required
              value={draft.key}
              onChange={(e) => setDraft({ ...draft, key: e.target.value })}
            />
          </label>
          <label>
            Title
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </label>
          <label>
            Audience
            <select
              value={draft.audience}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  audience: e.target.value as GuidanceTourDraftInput["audience"],
                })
              }
            >
              {GUIDANCE_AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={draft.pageKey}
              onChange={(e) => setDraft({ ...draft, pageKey: e.target.value })}
            >
              {GUIDANCE_PAGE_KEYS.map((p) => (
                <option key={p} value={p}>
                  {p.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="hamd-guide-btn hamd-guide-btn--primary">
            Create draft
          </button>
        </form>
      ) : null}

      {view === "detail" && selected ? (
        <section className="hamd-guide-admin__detail" aria-label="Guidance detail">
          <h2>{selected.title}</h2>
          <p>
            {String(selected.pageKey).replaceAll("_", " ")} · {selected.status} ·{" "}
            {formatDate(selected.publishedAt)}
          </p>
          {selected.description ? <p>{selected.description}</p> : null}
          <ol className="hamd-guide-admin__steps">
            {selected.steps.map((s) => (
              <li key={s.id}>
                <strong>{s.title}</strong>
                <span>{s.body}</span>
              </li>
            ))}
          </ol>
          <div className="hamd-guide-admin__actions">
            {GUIDANCE_TOUR_STATUSES.includes(selected.status as GuidanceTourStatus) &&
            selected.status !== "published" ? (
              <button
                type="button"
                className="hamd-guide-btn hamd-guide-btn--primary"
                onClick={() => void onPublish?.(selected.id)}
              >
                Publish
              </button>
            ) : (
              <button
                type="button"
                className="hamd-guide-btn"
                onClick={() => void onUnpublish?.(selected.id)}
              >
                Unpublish
              </button>
            )}
            <label>
              Schedule
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="hamd-guide-btn"
              disabled={!scheduleAt}
              onClick={() =>
                void onSchedule?.(selected.id, new Date(scheduleAt).toISOString())
              }
            >
              Schedule
            </button>
            <button
              type="button"
              className="hamd-guide-btn"
              onClick={() =>
                void onUpdate?.(selected.id, {
                  key: selected.key,
                  title: selected.title,
                  description: selected.description,
                  audience: selected.audience as GuidanceTourDraftInput["audience"],
                  pageKey: selected.pageKey,
                  mandatory: selected.mandatory,
                  estimatedMinutes: selected.estimatedMinutes,
                  locale: selected.locale,
                  sortOrder: selected.sortOrder,
                  steps: selected.steps.map((s) => ({
                    stepKey: s.stepKey,
                    title: s.title,
                    body: s.body,
                    targetSelector: s.targetSelector,
                    placement: s.placement,
                    requireAction: s.requireAction,
                    actionEvent: s.actionEvent,
                    actionLabel: s.actionLabel,
                    imageHref: s.imageHref,
                    sortOrder: s.sortOrder,
                  })),
                })
              }
            >
              Save content
            </button>
          </div>
          <div className="hamd-guide-admin__reset">
            <h3>Reset user progress</h3>
            <label>
              User ID
              <input
                value={resetUserId}
                onChange={(e) => setResetUserId(e.target.value)}
                placeholder="User identifier"
              />
            </label>
            <button
              type="button"
              className="hamd-guide-btn"
              disabled={!resetUserId}
              onClick={() => void onResetUserProgress?.(resetUserId)}
            >
              Reset progress
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
