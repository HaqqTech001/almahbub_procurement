import type { ReactNode, Ref } from "react";

import { cx } from "../utils/cx.js";

export type WeddingViewingPanelProps = {
  videoRef: Ref<HTMLVideoElement>;
  overlay?: ReactNode;
  className?: string;
};

/** 16:9 live viewing surface. Video stays mounted across portal states. */
export function WeddingViewingPanel({ videoRef, overlay, className }: WeddingViewingPanelProps) {
  return (
    <div className={cx("hamd-wedding-portal__stage", className)}>
      <video ref={videoRef} autoPlay playsInline controls controlsList="nodownload noplaybackrate" />
      {overlay ? <div className="hamd-wedding-portal__overlay">{overlay}</div> : null}
    </div>
  );
}
