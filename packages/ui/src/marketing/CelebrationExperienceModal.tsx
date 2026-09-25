import { useEffect, useId, useRef, type ReactNode } from "react";

import {
  ROWDOTUL_HAMD_IDENTITY,
  formatWeddingWhen,
  isWeddingProductionLive,
  weddingModalActions,
  type WeddingCampaignRecord,
} from "@hamd/constants";

import { cx } from "../utils/cx.js";

export { ROWDOTUL_HAMD_IDENTITY };

export type CelebrationSlide = {
  line: string;
  whisper?: string | undefined;
};

export type CelebrationExperienceModalProps = {
  open: boolean;
  campaign: WeddingCampaignRecord;
  now?: Date | undefined;
  onDismiss: () => void;
  onNavigate?: ((href: string) => void) | undefined;
  /** @deprecated Invitation uses campaign; kept so older hosts type-check during migration. */
  message?: string | undefined;
  slides?: readonly CelebrationSlide[] | undefined;
  autoplayMs?: number | undefined;
  ctaLabel?: string | undefined;
  dismissible?: boolean | undefined;
  closeLabel?: string | undefined;
  backLabel?: string | undefined;
  className?: string | undefined;
};

function BotanicalCorner({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <path
        d="M8 112c18-8 28-28 26-48 14 10 22 28 18 46 12-16 34-22 50-14-18-22-16-48 4-64-24 4-42 22-46 46C48 54 28 40 12 42c12 14 14 36-4 70z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="28" cy="36" r="3.2" fill="currentColor" opacity="0.55" />
      <circle cx="52" cy="22" r="2.2" fill="currentColor" opacity="0.4" />
      <path
        d="M70 18c8 6 10 16 4 24-8-2-14-10-12-20 4 2 8 2 8-4z"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

function openDialog(node: HTMLDialogElement): void {
  if (typeof node.showModal === "function") {
    if (!node.open) node.showModal();
    return;
  }
  node.setAttribute("open", "");
}

function closeDialog(node: HTMLDialogElement | null): void {
  if (!node) return;
  if (typeof node.close === "function") {
    node.close();
    return;
  }
  node.removeAttribute("open");
}

/**
 * Premium digital invitation for Rowdotul HAMD'26.
 * One composition — not a rotating announcement slider.
 */
export function CelebrationExperienceModal({
  open,
  campaign,
  now,
  onDismiss,
  onNavigate,
  dismissible = true,
  closeLabel = "Close invitation",
  backLabel,
  className,
}: CelebrationExperienceModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const clock = now ?? new Date();
  const actions = weddingModalActions(campaign, clock);
  const names = campaign.coupleNames.trim() || campaign.title;
  const eventWhen = formatWeddingWhen(campaign.eventAt, clock);

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;
    if (open) {
      openDialog(node);
      closeRef.current?.focus();
    } else {
      closeDialog(node);
    }
    const onKey = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        dismissRef.current();
      }
    };
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [dismissible, open]);

  const go = (href: string) => {
    onDismiss();
    if (onNavigate) {
      onNavigate(href);
      return;
    }
    window.location.assign(href);
  };

  return (
    <dialog
      ref={dialogRef}
      className={cx("hamd-wedding-modal", className)}
      aria-labelledby={titleId}
      hidden={!open}
      aria-hidden={open ? undefined : true}
      onCancel={(event) => {
        if (!dismissible) event.preventDefault();
        else onDismiss();
      }}
      onClick={(event) => {
        if (!dismissible) return;
        if (event.target === event.currentTarget) onDismiss();
      }}
    >
      <article className="hamd-wedding-modal__card">
        <div className="hamd-wedding-modal__ornament" aria-hidden="true">
          <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--tl" />
          <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--tr" />
          <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--bl" />
          <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--br" />
          <span className="hamd-wedding-modal__ribbon" />
        </div>
        {dismissible ? (
          <div className="hamd-wedding-modal__chrome">
            {backLabel ? (
              <button type="button" className="hamd-btn hamd-btn--ghost hamd-wedding-modal__back" onClick={onDismiss}>
                {backLabel}
              </button>
            ) : null}
            <button
              ref={closeRef}
              type="button"
              className="hamd-wedding-modal__close"
              onClick={onDismiss}
              aria-label={closeLabel}
            >
              <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                <path
                  d="M5 5l10 10M15 5L5 15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : null}
        <p className="hamd-wedding-modal__campaign">{ROWDOTUL_HAMD_IDENTITY}</p>
        {campaign.invitationHeading ? (
          <p className="hamd-wedding-modal__blessing">{campaign.invitationHeading}</p>
        ) : null}
        {campaign.familyLine ? (
          <p className="hamd-wedding-modal__family">{campaign.familyLine}</p>
        ) : null}
        <h1 className="hamd-wedding-modal__names" id={titleId}>
          {names}
        </h1>
        {campaign.invitationBody ? (
          <p className="hamd-wedding-modal__invite">{campaign.invitationBody}</p>
        ) : null}
        {eventWhen ? (
          <p className="hamd-wedding-modal__meta">
            <span className="hamd-wedding-modal__meta-label">Date</span>
            <span>{eventWhen}</span>
          </p>
        ) : null}
        {campaign.venue.trim() ? (
          <p className="hamd-wedding-modal__meta">
            <span className="hamd-wedding-modal__meta-label">Venue</span>
            <span>
              {campaign.venue}
              {campaign.venueAddress.trim() ? ` · ${campaign.venueAddress}` : ""}
            </span>
          </p>
        ) : null}
        <div className="hamd-wedding-modal__actions">
          {isWeddingProductionLive(campaign) ? (
            <span className="hamd-wedding-live-pill">Live</span>
          ) : null}
          {actions.primary.href.includes("/live") ? null : (
            <button
              type="button"
              className="hamd-btn hamd-btn--primary"
              onClick={() => go(actions.primary.href)}
            >
              {actions.primary.label}
            </button>
          )}
          {actions.secondary && !actions.secondary.href.includes("/live") ? (
            <button
              type="button"
              className="hamd-btn hamd-btn--secondary"
              onClick={() => go(actions.secondary!.href)}
            >
              {actions.secondary.label}
            </button>
          ) : null}
        </div>
        {dismissible ? <button type="button" className="hamd-btn hamd-btn--ghost" onClick={onDismiss}>Continue browsing</button> : null}
      </article>
    </dialog>
  );
}

export function WeddingInvitationCard({
  campaign,
  now,
  children,
}: {
  campaign: WeddingCampaignRecord;
  now?: Date;
  children?: ReactNode;
}) {
  const names = campaign.coupleNames.trim() || campaign.title;
  const eventWhen = formatWeddingWhen(campaign.eventAt, now);
  return (
    <div className="hamd-wedding-invite">
      <div className="hamd-wedding-invite__ornament" aria-hidden="true">
        <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--tl" />
        <BotanicalCorner className="hamd-wedding-modal__flora hamd-wedding-modal__flora--tr" />
      </div>
      <p className="hamd-wedding-modal__campaign">{ROWDOTUL_HAMD_IDENTITY}</p>
      {campaign.invitationHeading ? (
        <p className="hamd-wedding-modal__blessing">{campaign.invitationHeading}</p>
      ) : null}
      {campaign.familyLine ? (
        <p className="hamd-wedding-modal__family">{campaign.familyLine}</p>
      ) : null}
      <h1 className="hamd-wedding-invite__names">{names}</h1>
      {campaign.invitationBody ? (
        <p className="hamd-wedding-modal__invite">{campaign.invitationBody}</p>
      ) : null}
      {eventWhen ? <p className="hamd-wedding-invite__when">{eventWhen}</p> : null}
      {campaign.venue.trim() ? (
        <p className="hamd-wedding-invite__venue">
          {campaign.venue}
          {campaign.venueAddress.trim() ? ` · ${campaign.venueAddress}` : ""}
        </p>
      ) : null}
      {children}
    </div>
  );
}
