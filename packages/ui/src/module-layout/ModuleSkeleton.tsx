import { cx } from "../utils/cx.js";

export type ModuleSkeletonProps = {
  variant?: "table" | "card" | "list" | "detail";
  count?: number;
  className?: string;
};

const SKELETON_COUNT = 6;

export function ModuleSkeleton({ variant = "table", count = SKELETON_COUNT, className }: ModuleSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cx("hamd-module-skeleton", className)} aria-busy="true" aria-live="polite">
        <div className="hamd-skeleton" style={{ height: "2.5rem", marginBottom: "var(--hamd-space-4, 1rem)" }} />
        <div className="hamd-module-table-wrap">
          <table className="hamd-module-table">
            <thead>
              <tr>
                {Array.from({ length: 5 }).map((_, index) => (
                  <th key={index}>
                    <div className="hamd-skeleton" style={{ height: "0.75rem", width: "60%" }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: count }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <td key={colIndex}>
                      <div
                        className="hamd-skeleton"
                        style={{
                          height: "0.875rem",
                          width: `${Math.max(30, Math.random() * 80 + 20)}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={cx("hamd-module-skeleton", className)} aria-busy="true" aria-live="polite">
        <div className="hamd-module-card-grid">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="hamd-module-card">
              <div className="hamd-skeleton" style={{ aspectRatio: "16 / 9" }} />
              <div className="hamd-module-card__body">
                <div className="hamd-skeleton hamd-skeleton--text" style={{ width: "40%" }} />
                <div className="hamd-skeleton hamd-skeleton--title" style={{ width: "80%" }} />
                <div className="hamd-skeleton hamd-skeleton--text" style={{ width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cx("hamd-module-skeleton", className)} aria-busy="true" aria-live="polite">
        <div className="hamd-module-list">
          {Array.from({ length: count }).map((_, index) => (
            <div key={index} className="hamd-module-list__row" style={{ cursor: "default" }}>
              <div className="hamd-module-list__row-primary">
                <div className="hamd-skeleton hamd-skeleton--text" style={{ width: `${Math.max(30, Math.random() * 60 + 20)}%` }} />
                <div className="hamd-skeleton hamd-skeleton--text" style={{ width: `${Math.max(40, Math.random() * 50 + 20)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cx("hamd-module-skeleton", className)} aria-busy="true" aria-live="polite">
      <div className="hamd-skeleton hamd-skeleton--heading" />
      <div className="hamd-skeleton hamd-skeleton--text" style={{ width: "70%" }} />
      <div className="hamd-skeleton hamd-skeleton--text" style={{ width: "50%" }} />
      <div className="hamd-skeleton" style={{ height: "12rem", marginTop: "var(--hamd-space-4, 1rem)" }} />
    </div>
  );
}
