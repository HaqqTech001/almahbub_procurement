/**
 * Admin-only dated campaigns (celebration / maintenance).
 * Kill-switch: enabled=false, empty campaigns, or VITE_CAMPAIGNS_ENABLED=false.
 */
export type CampaignKind = "celebration" | "announcement" | "maintenance";
export type CampaignAnimation = "confetti" | "none";
export type CampaignTheme = "default" | "celebration" | "alert";

export type OpsCampaign = {
  id: string;
  kind: CampaignKind;
  enabled: boolean;
  startAt: string;
  endAt: string;
  eyebrow: string;
  message: string;
  dismissible: boolean;
  animation: CampaignAnimation;
  theme?: CampaignTheme;
  audience: "ops";
  slides?: readonly { line: string; whisper?: string }[];
};

export const opsCampaignSystem = {
  enabled: true,
  storagePrefix: "hamd.ops.campaign.dismissed.",
};

export const opsCampaigns: readonly OpsCampaign[] = [
  {
    id: "founder-wedding-september-2026",
    kind: "celebration",
    enabled: true,
    startAt: "2026-08-01T00:00:00+01:00",
    endAt: "2026-09-30T23:59:59+01:00",
    eyebrow: "Rowdotul HAMD'26",
    message:
      "Warm congratulations to our company owner on their wedding this September with gratitude from everyone at Almahbub International.",
    dismissible: true,
    animation: "confetti",
    theme: "celebration",
    audience: "ops",
    slides: [
      { line: "Rowdotul HAMD'26" },
      { line: "Alhamdulillah" },
      { line: "A beautiful union begins" },
      { line: "May Allah bless the union", whisper: "with barakah and lasting happiness" },
    ],
  },
];

function envEnabled(): boolean {
  if (typeof import.meta === "undefined") return true;
  const value = import.meta.env?.VITE_CAMPAIGNS_ENABLED;
  if (value === undefined || value === "") return true;
  return String(value).toLowerCase() !== "false";
}

export function isOpsCampaignActive(
  campaign: OpsCampaign,
  now: Date = new Date(),
): boolean {
  if (!opsCampaignSystem.enabled || !envEnabled() || !campaign.enabled) {
    return false;
  }
  const start = Date.parse(campaign.startAt);
  const end = Date.parse(campaign.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

export function getActiveOpsCampaigns(now: Date = new Date()): OpsCampaign[] {
  return opsCampaigns.filter((campaign) => isOpsCampaignActive(campaign, now));
}
