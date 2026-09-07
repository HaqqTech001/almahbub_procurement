import type { ReactNode } from "react";

import { ROWDOTUL_HAMD_IDENTITY } from "@hamd/constants";

import { cx } from "../utils/cx.js";

export type WeddingPortalStatus =
  | "WAITING"
  | "CONNECTING"
  | "LIVE"
  | "TEST LIVE"
  | "ENDED";

export type WeddingLiveHeaderProps = {
  status: WeddingPortalStatus;
  viewerLabel?: string | undefined;
  themeControl: ReactNode;
  exitHref: string;
  exitLabel?: string | undefined;
};

export function WeddingLiveHeader({
  status,
  viewerLabel,
  themeControl,
  exitHref,
  exitLabel = "Exit Live",
}: WeddingLiveHeaderProps) {
  const live = status === "LIVE" || status === "TEST LIVE";
  return (
    <header className="hamd-wedding-portal__header">
      <p className="hamd-wedding-portal__brand">{ROWDOTUL_HAMD_IDENTITY}</p>
      <p
        className={cx(
          "hamd-wedding-portal__status",
          live && "hamd-wedding-portal__status--live",
          status === "TEST LIVE" && "hamd-wedding-portal__status--test",
        )}
      >
        {status}
      </p>
      <div className="hamd-wedding-portal__header-actions">
        {viewerLabel ? <span className="hamd-wedding-portal__viewers">{viewerLabel}</span> : null}
        {themeControl}
        <a className="hamd-btn hamd-btn--ghost hamd-wedding-portal__exit" href={exitHref}>
          {exitLabel}
        </a>
      </div>
    </header>
  );
}
