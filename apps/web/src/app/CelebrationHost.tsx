import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CelebrationExperienceModal } from "@hamd/ui/marketing";

import {
  DEFAULT_WEDDING_CAMPAIGN,
  WEDDING_MODAL_PUBLIC_DELAY_MS,
  isWeddingModalEligible,
  weddingModalDismissKey,
  type WeddingCampaignRecord,
} from "@hamd/constants";

import { useOptionalAuth } from "../auth/session/AuthProvider.js";
import { fetchWeddingCampaign } from "../wedding/wedding-api.js";

function readDismissed(campaignId: string): boolean {
  try {
    return window.sessionStorage.getItem(weddingModalDismissKey(campaignId)) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(campaignId: string): void {
  try {
    window.sessionStorage.setItem(weddingModalDismissKey(campaignId), "1");
  } catch {
    /* ignore */
  }
}

function isPublicCampaignRoute(pathname: string): boolean {
  if (pathname.startsWith("/rowdotul-hamd-26")) return false;
  if (pathname.startsWith("/app")) return false;
  if (pathname.startsWith("/ops")) return false;
  return !/^\/(login|register|forgot-password|reset-password|verify-email|otp|invite|unauthorized|session-expired|account-locked)(\/|$)/.test(
    pathname,
  );
}

function resolveCampaign(row: WeddingCampaignRecord | null): WeddingCampaignRecord {
  if (!row) return DEFAULT_WEDDING_CAMPAIGN;
  return {
    ...DEFAULT_WEDDING_CAMPAIGN,
    ...row,
    id: row.id || DEFAULT_WEDDING_CAMPAIGN.id,
    modalEnabled: row.modalEnabled !== false,
    modalStartsAt: row.modalStartsAt || DEFAULT_WEDDING_CAMPAIGN.modalStartsAt,
    modalEndsAt: row.modalEndsAt || DEFAULT_WEDDING_CAMPAIGN.modalEndsAt,
  };
}

function suppressionReason(
  pathname: string,
  campaign: WeddingCampaignRecord,
): string | null {
  if (!isPublicCampaignRoute(pathname)) return `route:${pathname}`;
  if (readDismissed(campaign.id)) return "session-dismissed";
  if (!campaign.modalEnabled) return "modalEnabled=false";
  if (!isWeddingModalEligible(campaign)) return "outside-display-window";
  return null;
}

function debugWedding(payload: Record<string, unknown>): void {
  if (typeof import.meta === "undefined" || !import.meta.env?.DEV) return;
  console.debug("[WeddingModal]", payload);
}

let publicModalStartedAt: number | null = null;
let publicModalTimerId: number | null = null;
const publicModalListeners = new Set<() => void>();

function ensurePublicModalTimer(onFire: () => void): () => void {
  publicModalListeners.add(onFire);
  const now = Date.now();
  if (publicModalStartedAt == null) publicModalStartedAt = now;
  const remaining = Math.max(0, WEDDING_MODAL_PUBLIC_DELAY_MS - (now - publicModalStartedAt));
  if (publicModalTimerId === -1) {
    onFire();
  } else if (publicModalTimerId == null) {
    debugWedding({ timerScheduled: true, remainingMs: remaining });
    publicModalTimerId = window.setTimeout(() => {
      publicModalTimerId = -1;
      debugWedding({ timerElapsed: true });
      for (const listener of [...publicModalListeners]) listener();
    }, remaining);
  }
  return () => {
    publicModalListeners.delete(onFire);
  };
}

export function resetCelebrationHostTimerForTests(): void {
  if (publicModalTimerId != null && publicModalTimerId > 0) {
    window.clearTimeout(publicModalTimerId);
  }
  publicModalTimerId = null;
  publicModalStartedAt = null;
  publicModalListeners.clear();
}

/**
 * Public promotional invitation. Mounted once at App level so Homepage,
 * Products, Services, and other public routes share one timer. Campaign
 * eligibility does not wait on catalogue or announcement APIs.
 */
export function CelebrationHost() {
  const auth = useOptionalAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [open, setOpen] = useState(false);
  const campaignRef = useRef<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    void fetchWeddingCampaign()
      .then((row) => {
        const next = resolveCampaign(row);
        campaignRef.current = next;
        setCampaign(next);
        debugWedding({
          campaignLoaded: true,
          campaignId: next.id,
          modalEnabled: next.modalEnabled,
          eventAt: next.eventAt,
        });
        if (publicModalTimerId === -1) {
          const reason = suppressionReason(pathRef.current, next);
          if (!reason) {
            setOpen(true);
            return;
          }
          if (reason === "modalEnabled=false" || (reason === "outside-display-window" && row?.modalEndsAt)) {
            debugWedding({ lateClose: reason, campaignId: next.id });
            setOpen(false);
          }
        }
      })
      .catch(() => {
        campaignRef.current = DEFAULT_WEDDING_CAMPAIGN;
        setCampaign(DEFAULT_WEDDING_CAMPAIGN);
        debugWedding({ campaignLoaded: false, usedDefault: true });
      });

    const releaseTimer = ensurePublicModalTimer(() => {
      const row = resolveCampaign(campaignRef.current);
      const reason = suppressionReason(pathRef.current, row);
      debugWedding({
        eligible: !reason,
        suppressionReason: reason,
        dismissed: readDismissed(row.id),
        pathname: pathRef.current,
        modalOpenAttempt: !reason,
      });
      if (reason) return;
      setOpen(true);
    });

    return releaseTimer;
  }, []);

  useEffect(() => {
    if (!isPublicCampaignRoute(location.pathname)) {
      setOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    if (readDismissed(campaign.id)) {
      debugWedding({ lateClose: "session-dismissed", campaignId: campaign.id });
      setOpen(false);
    }
  }, [campaign.id, open]);

  return (
    <CelebrationExperienceModal
      open={open}
      campaign={campaign}
      onNavigate={(href) => {
        writeDismissed(campaign.id);
        setOpen(false);
        const live = href.includes("/live");
        if (live && auth?.status !== "authenticated") {
          navigate(`/login?returnTo=${encodeURIComponent(href)}`);
          return;
        }
        navigate(href);
      }}
      onDismiss={() => {
        writeDismissed(campaign.id);
        setOpen(false);
      }}
    />
  );
}
