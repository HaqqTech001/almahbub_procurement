import type { AnnouncementSlide } from "@hamd/ui/marketing";

import type { AnnouncementRow } from "../api/parity-api.js";
import type { SiteCampaign } from "../content/campaigns.js";

/** Map config campaigns → AnnouncementSlider contract (expands slide lines). */
export function toAnnouncementSlides(
  campaigns: readonly SiteCampaign[],
): AnnouncementSlide[] {
  const out: AnnouncementSlide[] = [];

  for (const campaign of campaigns) {
    const baseTheme =
      campaign.theme ??
      (campaign.kind === "celebration"
        ? "celebration"
        : campaign.kind === "maintenance"
          ? "alert"
          : "default");

    if (campaign.slides?.length) {
      campaign.slides.forEach((slide, index) => {
        out.push({
          id: `${campaign.id}__${index + 1}`,
          title: slide.line,
          message: slide.whisper?.trim() ?? "",
          dismissible: campaign.dismissible,
          publishedAt: campaign.startAt,
          expiresAt: campaign.endAt,
          showConfetti:
            campaign.animation === "confetti" &&
            (slide.accent === "hamd" ||
              slide.accent === "sprinkle" ||
              index === 0),
          theme: baseTheme,
          ...(campaign.category ? { category: campaign.category } : {}),
          ...(campaign.priority !== undefined
            ? { priority: campaign.priority }
            : {}),
          ...(slide.accent ? { accent: slide.accent } : {}),
        });
      });
      continue;
    }

    out.push({
      id: campaign.id,
      title: campaign.eyebrow,
      message: campaign.message,
      dismissible: campaign.dismissible,
      publishedAt: campaign.startAt,
      expiresAt: campaign.endAt,
      showConfetti: campaign.animation === "confetti",
      theme: baseTheme,
      ...(campaign.category ? { category: campaign.category } : {}),
      ...(campaign.priority !== undefined ? { priority: campaign.priority } : {}),
      ...(campaign.href ? { href: campaign.href } : {}),
      ...(campaign.ctaLabel ? { ctaLabel: campaign.ctaLabel } : {}),
      ...(campaign.mediaSrc ? { mediaSrc: campaign.mediaSrc } : {}),
      ...(campaign.mediaAlt ? { mediaAlt: campaign.mediaAlt } : {}),
    });
  }

  return out;
}

/** @deprecated Prefer `toAnnouncementSlides` - kept for single-campaign callers. */
export function toAnnouncementSlide(campaign: SiteCampaign): AnnouncementSlide {
  return (
    toAnnouncementSlides([campaign])[0] ?? {
      id: campaign.id,
      title: campaign.eyebrow,
      message: campaign.message,
      dismissible: campaign.dismissible,
    }
  );
}

/** Map published Ops CMS announcements → AnnouncementSlider contract. */
export function toCmsAnnouncementSlide(row: AnnouncementRow): AnnouncementSlide {
  const message = (row.summary ?? row.body).trim();
  const image = (row.media ?? []).find((item) => item.kind === "image");
  return {
    id: `cms-announcement-${row.id}`,
    title: row.title,
    message: message.slice(0, 400),
    dismissible: true,
    publishedAt: row.publishedAt ?? row.createdAt,
    expiresAt: row.expiresAt ?? undefined,
    href: `/announcements/${encodeURIComponent(row.slug)}`,
    ctaLabel: "Read more",
    theme: "default",
    priority: row.pinned ? 90 : 70,
    ...(image
      ? {
          mediaSrc: image.href,
          mediaAlt: row.title,
        }
      : {}),
  };
}
