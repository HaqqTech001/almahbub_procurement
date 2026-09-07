import type { AnnouncementSlide } from "@hamd/ui/marketing";

import { listAnnouncements } from "../api/parity-api.js";
import {
  announcementSystem,
  getActiveCampaigns,
} from "../content/campaigns.js";
import {
  toAnnouncementSlides,
  toCmsAnnouncementSlide,
} from "./announcement-slides.js";

function previewCampaignsEnabled(): boolean {
  return import.meta.env.VITE_PREVIEW_CAMPAIGNS === "true";
}

export function getDatedCampaignSlides(now = new Date()): AnnouncementSlide[] {
  return toAnnouncementSlides(
    getActiveCampaigns(now, {
      previewAll: previewCampaignsEnabled(),
      system: announcementSystem,
    }),
  );
}

/**
 * Homepage / public shell slides: published Ops CMS announcements first,
 * then any still-active dated campaigns (e.g. wedding window).
 * Draft and archived CMS rows never reach this helper - the public API
 * already filters to status=published.
 */
export async function loadPublicAnnouncementSlides(
  now = new Date(),
): Promise<AnnouncementSlide[]> {
  const campaignSlides = getDatedCampaignSlides(now);

  let cmsSlides: AnnouncementSlide[] = [];
  try {
    const rows = await listAnnouncements();
    cmsSlides = rows
      .filter((row) => row.status === "published")
      .map(toCmsAnnouncementSlide);
  } catch {
    cmsSlides = [];
  }

  const seen = new Set<string>();
  const merged: AnnouncementSlide[] = [];
  for (const slide of [...cmsSlides, ...campaignSlides]) {
    if (seen.has(slide.id)) continue;
    seen.add(slide.id);
    merged.push(slide);
  }
  return merged;
}
