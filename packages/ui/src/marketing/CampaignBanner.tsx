import {
  AnnouncementSlider,
  type AnnouncementSlide,
} from "./AnnouncementSlider.js";

export type CampaignBannerModel = {
  id: string;
  eyebrow: string;
  message: string;
  dismissible: boolean;
  showConfetti?: boolean;
  href?: string;
  ctaLabel?: string;
  theme?: AnnouncementSlide["theme"];
};

export type CampaignBannerProps = {
  campaign: CampaignBannerModel | null;
  className?: string;
  storagePrefix?: string;
  allowRestore?: boolean;
};

/**
 * Backwards-compatible single-campaign host.
 * Prefer `AnnouncementSlider` for multi-announcement surfaces.
 */
export function CampaignBanner({
  campaign,
  className,
  storagePrefix,
  allowRestore,
}: CampaignBannerProps) {
  if (!campaign) return null;
  const slide: AnnouncementSlide = {
    id: campaign.id,
    title: campaign.eyebrow,
    message: campaign.message,
    dismissible: campaign.dismissible,
    theme: campaign.theme ?? (campaign.showConfetti ? "celebration" : "default"),
    ...(campaign.showConfetti !== undefined
      ? { showConfetti: campaign.showConfetti }
      : {}),
    ...(campaign.href ? { href: campaign.href } : {}),
    ...(campaign.ctaLabel ? { ctaLabel: campaign.ctaLabel } : {}),
  };
  return (
    <AnnouncementSlider
      announcements={[slide]}
      {...(className ? { className } : {})}
      {...(storagePrefix ? { storagePrefix } : {})}
      {...(allowRestore !== undefined ? { allowRestore } : {})}
    />
  );
}
