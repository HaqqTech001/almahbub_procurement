import { useMemo, useState } from "react";
import { cx } from "../utils/cx.js";
import { useOptionalGuidance } from "./guidance-context.js";
import {
  completionPercent,
  filterToursByQuery,
} from "./types.js";

export type LearningCenterProps = {
  className?: string | undefined;
  title?: string | undefined;
};

/**
 * Help & Learning Center - search, launch tours, completion tracking.
 */
export function LearningCenter({
  className,
  title = "Help & Learning Center",
}: LearningCenterProps) {
  const guidance = useOptionalGuidance();
  const [query, setQuery] = useState("");
  const learningOpen = guidance?.learningOpen ?? false;
  const setLearningOpen = guidance?.setLearningOpen;
  const tours = guidance?.tours ?? [];
  const progress = guidance?.progress ?? [];
  const startTour = guidance?.startTour;
  const resetTour = guidance?.resetTour;
  const mode = guidance?.mode ?? "off";
  const role = guidance?.role;

  const published = useMemo(
    () => tours.filter((t) => t.status === "published"),
    [tours],
  );
  const filtered = useMemo(
    () => filterToursByQuery(published, query),
    [published, query],
  );
  const percent = completionPercent(progress, published);

  if (!guidance || !learningOpen || !setLearningOpen || !startTour || !resetTour) {
    return null;
  }

  return (
    <div className={cx("hamd-guide-learning", className)} role="presentation">
      <button
        type="button"
        className="hamd-guide-learning__backdrop"
        aria-label="Close learning center"
        onClick={() => setLearningOpen(false)}
      />
      <div
        className="hamd-guide-learning__panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="hamd-guide-learning__header">
          <div>
            <h2>{title}</h2>
            <p>
              Launch or replay walkthroughs
              {role ? ` for ${role.replace("_", " ")}` : ""}. Current mode:{" "}
              <strong>{mode}</strong>.
            </p>
          </div>
          <button
            type="button"
            className="hamd-guide-btn hamd-guide-btn--ghost"
            onClick={() => setLearningOpen(false)}
          >
            Close
          </button>
        </header>
        <div className="hamd-guide-learning__progress" aria-live="polite">
          <span>Completion {percent}%</span>
          <div className="hamd-guide-learning__meter" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
        <label className="hamd-guide-learning__search">
          <span className="visually-hidden">Search tours</span>
          <input
            data-guide="learning-search"
            type="search"
            placeholder="Search tours by keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <ul className="hamd-guide-learning__list">
          {filtered.map((tour) => {
            const row = progress.find((p) => p.tourId === tour.id);
            const status = row?.status ?? "not_started";
            return (
              <li key={tour.id}>
                <div>
                  <h3>{tour.title}</h3>
                  <p>{tour.description}</p>
                  <p className="hamd-guide-learning__meta">
                    ~{tour.estimatedMinutes} min · {tour.pageKey} ·{" "}
                    {status.replace("_", " ")}
                    {tour.version ? ` · v${tour.version}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="hamd-guide-btn hamd-guide-btn--primary"
                  data-guide="learning-launch"
                  disabled={mode === "off"}
                  onClick={() => {
                    if (status === "completed" || status === "skipped") {
                      resetTour(tour.id);
                    } else {
                      startTour(tour.id);
                    }
                    setLearningOpen(false);
                  }}
                >
                  {status === "completed" || status === "skipped"
                    ? "Replay"
                    : "Launch"}
                </button>
              </li>
            );
          })}
        </ul>
        {filtered.length === 0 ? (
          <p className="hamd-guide-learning__empty">No tours match that search.</p>
        ) : null}
      </div>
    </div>
  );
}
