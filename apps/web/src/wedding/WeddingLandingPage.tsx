import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CollectionSkeleton, MediaLightbox, OptimizedImage, type MediaLightboxItem } from "@hamd/ui/primitives";
import { WeddingInvitationCard } from "@hamd/ui/marketing";
import {
  DEFAULT_WEDDING_CAMPAIGN,
  formatWeddingWhen,
  type WeddingCampaignRecord,
} from "@hamd/constants";

import { useAuth } from "../auth/session/AuthProvider.js";
import { WeddingParticipation } from "./WeddingParticipation.js";
import {
  fetchWeddingCampaign,
  listWeddingComments,
  listWeddingGallery,
  postWeddingComment,
  type WeddingCommentDto,
  type WeddingGalleryItemDto,
} from "./wedding-api.js";

function countdownParts(targetIso: string, now: Date) {
  const delta = Date.parse(targetIso) - now.getTime();
  if (!Number.isFinite(delta) || delta <= 0) return null;
  const total = Math.floor(delta / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function WeddingLandingPage() {
  const auth = useAuth();
  const [campaign, setCampaign] = useState<WeddingCampaignRecord>(DEFAULT_WEDDING_CAMPAIGN);
  const [now, setNow] = useState(() => new Date());
  const [comments, setComments] = useState<WeddingCommentDto[]>([]);
  const [gallery, setGallery] = useState<WeddingGalleryItemDto[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);
  const [galleryAttempt, setGalleryAttempt] = useState(0);
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ items: MediaLightboxItem[]; index: number } | null>(
    null,
  );

  useEffect(() => {
    void fetchWeddingCampaign().then(setCampaign);

    void listWeddingComments().then(setComments).catch(() => setComments([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setGalleryLoading(true); setGalleryError(false);
    void listWeddingGallery().then(rows => { if (!cancelled) setGallery(rows); })
      .catch(() => { if (!cancelled) setGalleryError(true); })
      .finally(() => { if (!cancelled) setGalleryLoading(false); });
    return () => { cancelled = true; };
  }, [galleryAttempt]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = countdownParts(campaign.streamAt, now);
  const liveWindowOpen = now.getTime() >= Date.parse(campaign.streamAt);
  const productionLive = campaign.streamStatus === "live" && campaign.liveMode !== "test";
  const liveHref =
    auth.status === "authenticated"
      ? campaign.livePath
      : `/login?returnTo=${encodeURIComponent(campaign.livePath)}`;

  const lightboxItems = useMemo(
    () =>
      gallery.map((item) => ({
        src: item.src,
        kind: item.kind,
        alt: item.title || item.caption || campaign.title,
      })),
    [campaign.title, gallery],
  );

  return (
    <main className="hamd-wedding-page">
      <section className="hamd-wedding-page__hero">
        <WeddingInvitationCard campaign={campaign} now={now}>
          <div className="hamd-wedding-page__actions">
            {liveWindowOpen || productionLive ? (
              <Link className="hamd-btn hamd-btn--primary" to={liveHref}>
                {productionLive ? "Join Live Now" : "Open Live Room"}
              </Link>
            ) : (
              <a className="hamd-btn hamd-btn--primary" href="#wedding-details">Get Notified</a>
            )}
            {campaign.testBroadcastEligible && campaign.liveMode === "test" ? (
              <Link className="hamd-btn hamd-btn--secondary" to={liveHref}>
                Join Test Live
              </Link>
            ) : null}
            {campaign.galleryEnabled ? (
              <a className="hamd-btn hamd-btn--secondary" href="#gallery">
                View Gallery
              </a>
            ) : null}
          </div>
        </WeddingInvitationCard>
      </section>

      <section className="hamd-wedding-page__section" aria-labelledby="wedding-details">
        <WeddingParticipation />
        <h2 id="wedding-details">Event details</h2>
        <p>{formatWeddingWhen(campaign.eventAt)}</p>
        {campaign.venue ? (
          <p>
            {campaign.venue}
            {campaign.venueAddress ? ` · ${campaign.venueAddress}` : ""}
          </p>
        ) : (
          <p>Venue details will be shared by the host.</p>
        )}
        <p>Live celebration begins at {formatWeddingWhen(campaign.streamAt)}.</p>
        {parts ? (
          <div className="hamd-wedding-countdown" aria-label="Countdown to the celebration">
            {(
              [
                ["days", parts.days],
                ["hours", parts.hours],
                ["minutes", parts.minutes],
                ["seconds", parts.seconds],
              ] as const
            ).map(([label, value]) => (
              <div className="hamd-wedding-countdown__cell" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <p>{campaign.streamStatus === "ended" ? "The live celebration has concluded." : "The celebration window is open."}</p>
        )}
      </section>

      <section className="hamd-wedding-page__section" aria-labelledby="wedding-live">
        <h2 id="wedding-live">Live stream</h2>
        <p className="hamd-wedding-page__lede">
          {campaign.streamStatus === "live"
            ? "The celebration is live now."
            : `Live celebration begins at ${formatWeddingWhen(campaign.streamAt)}.`}
        </p>
        <div className="hamd-wedding-page__actions">
          {liveWindowOpen || productionLive ? (
            <Link className="hamd-btn hamd-btn--primary" to={liveHref}>
              {productionLive ? "Join Live Now" : "Open Live Room"}
            </Link>
          ) : (
            <a className="hamd-btn hamd-btn--primary" href="#wedding-details">Get Notified</a>
          )}
          {campaign.testBroadcastEligible && campaign.liveMode === "test" ? (
            <Link className="hamd-btn hamd-btn--secondary" to={liveHref}>
              Join Test Live
            </Link>
          ) : null}
        </div>
      </section>

      {campaign.galleryEnabled ? (
        <section className="hamd-wedding-page__section" id="gallery" aria-labelledby="wedding-gallery">
          <h2 id="wedding-gallery">Wedding gallery</h2>
          {galleryLoading ? <CollectionSkeleton label="Loading wedding gallery" gridClassName="hamd-wedding-gallery" aspectRatio="4 / 5" /> : galleryError ? <p role="alert">Unable to load wedding gallery. <button onClick={() => setGalleryAttempt(value => value + 1)}>Retry gallery</button></p> : gallery.length === 0 ? (
            <p>Photographs and clips appear here when the host publishes them.</p>
          ) : (
            <ul className="hamd-wedding-gallery">
              {gallery.map((item, index) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="hamd-wedding-gallery__tile"
                    onClick={() => setLightbox({ items: lightboxItems, index })}
                  >
                    {item.kind === "video" ? (
                      <video src={item.src} muted playsInline />
                    ) : (
                      <OptimizedImage src={item.src} alt={item.title || item.caption || "Wedding gallery image unavailable"} />
                    )}
                    {item.title ? <span className="hamd-sr-only">{item.title}</span> : null}
                  </button>
                  {item.kind === "video" && item.downloadable ? (
                    <a className="hamd-btn hamd-btn--ghost" href={item.src} download>
                      Download
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {campaign.commentsEnabled ? (
        <section className="hamd-wedding-page__section" aria-labelledby="wedding-messages">
          <h2 id="wedding-messages">Guest messages</h2>
          <ul className="hamd-wedding-comments__list">
            {comments.map((row) => (
              <li key={row.id} className="hamd-wedding-comments__item">
                <span className="hamd-wedding-comments__avatar" aria-hidden="true">
                  {row.displayName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <strong>{row.displayName}</strong>
                  <p>{row.message}</p>
                </div>
              </li>
            ))}
          </ul>
          {auth.status === "authenticated" ? (
            <form
              className="hamd-wedding-comments__composer"
              onSubmit={(event) => {
                event.preventDefault();
                setCommentError(null);
                void postWeddingComment(draft)
                  .then((row) => {
                    setComments((current) => [...current, row]);
                    setDraft("");
                  })
                  .catch((err: unknown) => {
                    setCommentError(err instanceof Error ? err.message : "Unable to post.");
                  });
              }}
            >
              <label className="hamd-sr-only" htmlFor="wedding-comment">
                Message
              </label>
              <input
                id="wedding-comment"
                value={draft}
                maxLength={500}
                onChange={(event) => setDraft(event.target.value)}
                required
              />
              <button type="submit" className="hamd-btn hamd-btn--primary">
                Send
              </button>
            </form>
          ) : (
            <p>
              <Link to={`/login?returnTo=${encodeURIComponent(campaign.sitePath)}`}>Sign in</Link> to
              leave a message.
            </p>
          )}
          {commentError ? <p role="alert">{commentError}</p> : null}
        </section>
      ) : null}

      <MediaLightbox
        open={Boolean(lightbox)}
        items={lightbox?.items ?? []}
        index={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) =>
          setLightbox((current) => (current ? { ...current, index } : current))
        }
      />
    </main>
  );
}
