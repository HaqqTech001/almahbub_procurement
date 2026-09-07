import type { ReactNode } from "react";
import { WeddingInvitationCard } from "../marketing/CelebrationExperienceModal.js";
import type { WeddingCampaignRecord } from "@hamd/constants";
import { formatWeddingDate } from "@hamd/constants";

import { cx } from "../utils/cx.js";

export type WeddingWaitingStageProps = {
  campaign: WeddingCampaignRecord;
  children?: ReactNode;
  className?: string;
};

export function WeddingWaitingStage({ campaign, children, className }: WeddingWaitingStageProps) {
  const date = formatWeddingDate(campaign.eventAt);
  return (
    <div className={cx("hamd-wedding-waiting", className)}>
      <WeddingInvitationCard campaign={campaign} />
      {date ? <p className="hamd-wedding-waiting__date">{date}</p> : null}
      {children}
    </div>
  );
}
