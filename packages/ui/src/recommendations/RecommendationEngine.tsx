import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { OptimizedImage } from "../primitives/OptimizedImage.js";
import {
  RECOMMENDATION_KINDS,
  emptyRecommendationFilters,
  filterRecommendations,
  groupRecommendations,
  recommendationConfidenceLabel,
  recommendationKindLabel,
  type RecommendationContext,
  type RecommendationFeedback,
  type RecommendationFilters,
  type RecommendationItem,
} from "./types.js";

export type RecommendationEngineProps = {
  recommendations: RecommendationItem[];
  context?: RecommendationContext | undefined;
  title?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
  initialFilters?: RecommendationFilters | undefined;
  onOpen?: ((item: RecommendationItem) => void) | undefined;
  onAddToRequest?: ((item: RecommendationItem) => void | Promise<void>) | undefined;
  onFeedback?:
    | ((
        item: RecommendationItem,
        feedback: RecommendationFeedback,
      ) => void | Promise<void>)
    | undefined;
  onRefresh?: ((context?: RecommendationContext) => void | Promise<void>) | undefined;
};

export function RecommendationEngineSkeleton({
  className,
}: {
  className?: string | undefined;
}) {
  return (
    <div
      className={cx("hamd-rec", "hamd-rec--skeleton", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hamd-rec-skel hamd-rec-skel--toolbar" />
      <div className="hamd-rec-skel-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="hamd-rec-skel hamd-rec-skel--card" key={index} />
        ))}
      </div>
    </div>
  );
}

/**
 * Explainable recommendation workspace. Hosts inject ranking, refresh,
 * navigation, procurement actions, and feedback persistence.
 */
export function RecommendationEngine({
  recommendations,
  context,
  title = "Recommendation Engine",
  loading,
  className,
  initialFilters,
  onOpen,
  onAddToRequest,
  onFeedback,
  onRefresh,
}: RecommendationEngineProps) {
  const [filters, setFilters] = useState(
    initialFilters ?? emptyRecommendationFilters(),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const filtered = useMemo(
    () => filterRecommendations(recommendations, filters),
    [recommendations, filters],
  );
  const groups = useMemo(() => groupRecommendations(filtered), [filtered]);

  if (loading) return <RecommendationEngineSkeleton className={className} />;

  const run = async (
    id: string,
    action: () => void | Promise<void>,
    message: string,
  ) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      setAnnounce(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={cx("hamd-rec", className)} aria-label={title}>
      <header className="hamd-rec__header">
        <div>
          <h1>{title}</h1>
          <p>
            Explainable products, suppliers, categories, bundles, history,
            trends, and seasonal guidance. Recommendations are assistive and
            require human review.
          </p>
          {context?.requestId || context?.productId || context?.categoryId ? (
            <p className="hamd-rec__context">
              Context:{" "}
              {[context.requestId, context.productId, context.categoryId]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
        {onRefresh ? (
          <button
            type="button"
            className="hamd-rec-btn"
            onClick={() =>
              void run(
                "refresh",
                () => onRefresh(context),
                "Recommendations refreshed",
              )
            }
            disabled={busyId === "refresh"}
          >
            {busyId === "refresh" ? "Refreshing…" : "Refresh"}
          </button>
        ) : null}
      </header>

      <div className="hamd-rec-toolbar" aria-label="Recommendation filters">
        <label>
          Search
          <input
            type="search"
            placeholder="Search recommendations…"
            value={filters.query}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                query: event.target.value,
              }))
            }
          />
        </label>
        <label>
          Confidence
          <select
            value={filters.minimumConfidence}
            onChange={(event) =>
              setFilters((previous) => ({
                ...previous,
                minimumConfidence: event.target
                  .value as RecommendationFilters["minimumConfidence"],
              }))
            }
          >
            <option value="all">All confidence</option>
            <option value="low">Low or higher</option>
            <option value="moderate">Moderate or higher</option>
            <option value="high">High only</option>
          </select>
        </label>
        <div className="hamd-rec-kinds" role="group" aria-label="Recommendation type">
          <button
            type="button"
            className={cx("hamd-rec-chip", filters.kind === "all" && "is-active")}
            aria-pressed={filters.kind === "all"}
            onClick={() =>
              setFilters((previous) => ({ ...previous, kind: "all" }))
            }
          >
            All
          </button>
          {RECOMMENDATION_KINDS.map((kind) => (
            <button
              type="button"
              key={kind}
              className={cx(
                "hamd-rec-chip",
                filters.kind === kind && "is-active",
              )}
              aria-pressed={filters.kind === kind}
              onClick={() =>
                setFilters((previous) => ({ ...previous, kind }))
              }
            >
              {recommendationKindLabel(kind)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="hamd-rec-btn"
          onClick={() => setFilters(emptyRecommendationFilters())}
        >
          Clear filters
        </button>
      </div>

      {groups.length ? (
        <div className="hamd-rec-groups">
          {groups.map((group) => (
            <section
              className="hamd-rec-group"
              key={group.kind}
              aria-labelledby={`hamd-rec-${group.kind}`}
            >
              <header>
                <h2 id={`hamd-rec-${group.kind}`}>{group.label}</h2>
                <span>{group.items.length}</span>
              </header>
              <ul className="hamd-rec-grid">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <article className="hamd-rec-card" data-confidence={item.confidence}>
                      {item.imageSrc ? (
                        <OptimizedImage
                          src={item.imageSrc}
                          alt={item.imageAlt ?? ""}
                          width={320}
                          height={180}
                          sizes="(max-width: 768px) 100vw, 280px"
                        />
                      ) : null}
                      <div className="hamd-rec-card__body">
                        <div className="hamd-rec-card__eyebrow">
                          <span>{item.entityType}</span>
                          <span>{recommendationConfidenceLabel(item.confidence)}</span>
                        </div>
                        <h3>{item.title}</h3>
                        {item.summary ? <p>{item.summary}</p> : null}
                        <p className="hamd-rec-card__reason">
                          <strong>Why:</strong> {item.reason}
                        </p>
                        {item.confidenceReason ? (
                          <p className="hamd-rec-card__confidence">
                            {item.confidenceReason}
                          </p>
                        ) : null}
                        <dl>
                          {item.categoryName ? (
                            <div>
                              <dt>Category</dt>
                              <dd>{item.categoryName}</dd>
                            </div>
                          ) : null}
                          {item.supplierName ? (
                            <div>
                              <dt>Supplier</dt>
                              <dd>{item.supplierName}</dd>
                            </div>
                          ) : null}
                          {item.leadTime ? (
                            <div>
                              <dt>Lead time</dt>
                              <dd>{item.leadTime}</dd>
                            </div>
                          ) : null}
                          {item.seasonalWindow ? (
                            <div>
                              <dt>Window</dt>
                              <dd>{item.seasonalWindow}</dd>
                            </div>
                          ) : null}
                        </dl>
                        {item.badges?.length ? (
                          <ul className="hamd-rec-badges" aria-label="Recommendation attributes">
                            {item.badges.map((badge) => (
                              <li key={badge}>{badge}</li>
                            ))}
                          </ul>
                        ) : null}
                        {item.evidence?.length ? (
                          <p className="hamd-rec-card__evidence">
                            Evidence:{" "}
                            {item.evidence.map((evidence, index) => (
                              <span key={evidence.id}>
                                {index ? ", " : ""}
                                {evidence.href ? (
                                  <a href={evidence.href}>{evidence.label}</a>
                                ) : (
                                  evidence.label
                                )}
                              </span>
                            ))}
                          </p>
                        ) : null}
                        <div className="hamd-rec-card__actions">
                          {item.href ? (
                            <a href={item.href} onClick={() => onOpen?.(item)}>
                              Inspect
                            </a>
                          ) : (
                            <button type="button" onClick={() => onOpen?.(item)}>
                              Inspect
                            </button>
                          )}
                          {onAddToRequest &&
                          (item.entityType === "product" ||
                            item.entityType === "bundle") ? (
                            <button
                              type="button"
                              disabled={busyId === item.id}
                              onClick={() =>
                                void run(
                                  item.id,
                                  () => onAddToRequest(item),
                                  `${item.title} added for review`,
                                )
                              }
                            >
                              Add to request
                            </button>
                          ) : null}
                          {onFeedback ? (
                            <>
                              <button
                                type="button"
                                aria-label={`Mark ${item.title} helpful`}
                                onClick={() =>
                                  void run(
                                    `${item.id}:helpful`,
                                    () => onFeedback(item, "helpful"),
                                    "Feedback recorded",
                                  )
                                }
                              >
                                Helpful
                              </button>
                              <button
                                type="button"
                                aria-label={`Dismiss ${item.title}`}
                                onClick={() =>
                                  void run(
                                    `${item.id}:dismissed`,
                                    () => onFeedback(item, "dismissed"),
                                    "Recommendation dismissed",
                                  )
                                }
                              >
                                Dismiss
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="hamd-rec-empty" role="status">
          No recommendations match these filters.
        </p>
      )}

      {error ? (
        <p className="hamd-rec-toast" role="alert">
          {error}
        </p>
      ) : null}
      <div className="hamd-sr-only" role="status" aria-live="polite">
        {announce}
      </div>
    </section>
  );
}
