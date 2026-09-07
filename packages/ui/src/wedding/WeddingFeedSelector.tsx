import { WEDDING_FEED_LABELS, type WeddingBroadcastFeed } from "@hamd/constants";

import { cx } from "../utils/cx.js";

export type WeddingFeedSelectorProps = {
  feeds: readonly WeddingBroadcastFeed[];
  selectedId: string | null;
  onSelect: (identity: string) => void;
  mobileOpen?: boolean;
  onMobileOpen?: () => void;
  onMobileClose?: () => void;
};

export function WeddingFeedSelector({
  feeds,
  selectedId,
  onSelect,
  mobileOpen = false,
  onMobileOpen,
  onMobileClose,
}: WeddingFeedSelectorProps) {
  if (feeds.length < 2) return null;
  return (
    <div className="hamd-wedding-feeds">
      <div className="hamd-wedding-feeds__desktop" role="group" aria-label="Choose your view">
        {feeds.map((feed) => (
          <button
            key={feed.identity}
            type="button"
            className={cx("hamd-wedding-feeds__chip", selectedId === feed.identity && "is-active")}
            onClick={() => onSelect(feed.identity)}
          >
            {feed.label}
            <span>{feed.status === "live" ? "Live" : "Offline"}</span>
          </button>
        ))}
      </div>
      <button type="button" className="hamd-btn hamd-btn--secondary hamd-wedding-feeds__mobile-trigger" onClick={onMobileOpen}>
        Change View
      </button>
      {mobileOpen ? (
        <div className="hamd-wedding-feeds__sheet" role="dialog" aria-label="Choose your view">
          <header>
            <h2>Choose your view</h2>
            <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onMobileClose} aria-label="Close">
              Close
            </button>
          </header>
          <ul>
            {feeds.map((feed) => (
              <li key={feed.identity}>
                <button
                  type="button"
                  className={cx(selectedId === feed.identity && "is-active")}
                  onClick={() => {
                    onSelect(feed.identity);
                    onMobileClose?.();
                  }}
                >
                  {feed.label}
                  <span>{feed.status === "live" ? "Live" : "Offline"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <span className="hamd-sr-only">{WEDDING_FEED_LABELS.join(", ")}</span>
    </div>
  );
}
