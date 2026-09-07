/**
 * Announcement / campaign system - configuration-driven.
 * Disable, schedule, or swap campaigns without changing application code.
 *
 * Ops controls (no code deploy required when wired to CMS/env):
 * - Set `enabled: false` on a campaign, or empty `campaigns`
 * - Set `announcementSystem.enabled` to false
 * - Set env `VITE_CAMPAIGNS_ENABLED=false`
 * - Adjust `startAt` / `endAt` ISO windows for auto-expiry
 * - Set `VITE_PREVIEW_CAMPAIGNS=true` to preview outside the window (local only)
 *
 * Frontend contract maps to `@hamd/ui/marketing` AnnouncementSlide.
 * Published Genesis CMS announcements are loaded at runtime via
 * `loadPublicAnnouncementSlides` (`GET /api/v1/announcements`). This register
 * is only for dated celebration/maintenance overlays (e.g. wedding window).
 */

export type CampaignKind = "celebration" | "announcement" | "maintenance";
export type CampaignAnimation = "confetti" | "none";
export type CampaignTheme = "default" | "celebration" | "alert";
export type CampaignAccent = "sparkle" | "glow" | "sprinkle" | "hamd";

export type CampaignSlideLine = {
  /** Primary compact line shown in the strip. */
  line: string;
  /** Optional secondary whisper (kept empty for ultra-compact slides). */
  whisper?: string | undefined;
  accent?: CampaignAccent | undefined;
};

export type SiteCampaign = {
  id: string;
  kind: CampaignKind;
  /** When false, campaign never shows (config kill-switch). */
  enabled: boolean;
  /** ISO 8601 inclusive window - auto-expires after endAt */
  startAt: string;
  endAt: string;
  /** Hierarchy label (maps to AnnouncementSlide.title) when `slides` is omitted. */
  eyebrow: string;
  message: string;
  dismissible: boolean;
  animation: CampaignAnimation;
  href?: string | undefined;
  ctaLabel?: string | undefined;
  /** Optional category for future filtering. */
  category?: string | undefined;
  /** Higher shows first when sorting active slides. */
  priority?: number | undefined;
  theme?: CampaignTheme | undefined;
  mediaSrc?: string | undefined;
  mediaAlt?: string | undefined;
  /**
   * Compact celebration lines. When present, expands to multiple slider
   * entries (no CTA). Official wedding identity uses exact `Rowdotul HAMD'26`.
   */
  slides?: readonly CampaignSlideLine[] | undefined;
};

/** Global announcement system flags - CMS/env can override at runtime. */
export type AnnouncementSystemConfig = {
  /** Master switch for all site announcements. */
  enabled: boolean;
  storagePrefix: string;
};

export const announcementSystem: AnnouncementSystemConfig = {
  enabled: true,
  storagePrefix: "hamd.web.campaign.dismissed.",
};

/**
 * Campaign register. Replace this array (or load from CMS/API) without
 * touching Homepage composition. Wedding is one campaign expanded to
 * short celebration lines under the shared public shell.
 */
export const siteCampaigns: readonly SiteCampaign[] = [
  {
    id: "founder-wedding-september-2026",
    kind: "celebration",
    enabled: true,
    startAt: "2026-08-01T00:00:00+01:00",
    endAt: "2026-09-30T23:59:59+01:00",
    eyebrow: "Rowdotul HAMD'26",
    message:
      "Warm congratulations to our company owner on their wedding this September with gratitude from everyone at Almahbub.",
    dismissible: false,
    animation: "confetti",
    theme: "celebration",
    category: "celebration",
    priority: 100,
    slides: [
      { line: "Rowdotul HAMD'26", accent: "hamd" },
      { line: "Alhamdulillah", accent: "sparkle" },
      { line: "A beautiful union begins", accent: "glow" },
      { line: "Two hearts • One journey", accent: "glow" },
      { line: "With joy and blessings", accent: "sprinkle" },
      { line: "A new chapter begins" },
      { line: "The celebration continues", accent: "sparkle" },
      {
        line: "May Allah bless the union",
        whisper: "with barakah and lasting happiness",
        accent: "sparkle",
      },
      { line: "Rowdotul HAMD'26", accent: "hamd" },
    ],
  },
  {
    id: "sourcing-season-guidance-2026",
    kind: "announcement",
    enabled: true,
    startAt: "2026-08-01T00:00:00+01:00",
    endAt: "2026-09-30T23:59:59+01:00",
    eyebrow: "Sourcing season",
    message:
      "Plan Q4 procurement early. Submit requests with destination, quantity, and preferred corridors for clearer quotations.",
    dismissible: true,
    animation: "none",
    theme: "default",
    category: "operations",
    priority: 40,
    href: "/contact",
    ctaLabel: "Start a request",
  },
] as const;

function envCampaignsEnabled(): boolean {
  if (typeof import.meta === "undefined") return true;
  const value = import.meta.env?.VITE_CAMPAIGNS_ENABLED;
  if (value === undefined || value === "") return true;
  return String(value).toLowerCase() !== "false";
}

export function isAnnouncementSystemEnabled(
  config: AnnouncementSystemConfig = announcementSystem,
): boolean {
  return config.enabled && envCampaignsEnabled();
}

export type CampaignActivityOptions = {
  previewAll?: boolean | undefined;
  system?: AnnouncementSystemConfig | undefined;
};

export function isCampaignActive(
  campaign: SiteCampaign,
  now: Date = new Date(),
  options?: CampaignActivityOptions,
): boolean {
  const system = options?.system ?? announcementSystem;
  if (!isAnnouncementSystemEnabled(system)) return false;
  if (!campaign.enabled) return false;
  if (options?.previewAll) return true;

  const start = Date.parse(campaign.startAt);
  const end = Date.parse(campaign.endAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const t = now.getTime();
  return t >= start && t <= end;
}

export function getActiveCampaigns(
  now: Date = new Date(),
  options?: CampaignActivityOptions,
  register: readonly SiteCampaign[] = siteCampaigns,
): SiteCampaign[] {
  return register
    .filter((campaign) => isCampaignActive(campaign, now, options))
    .slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}
