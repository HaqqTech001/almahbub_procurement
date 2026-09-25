import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WeddingInvitationCard } from "@hamd/ui/marketing";
import { DEFAULT_WEDDING_CAMPAIGN, formatWeddingWhen, type WeddingCampaignRecord } from "@hamd/constants";
import { useAuth } from "../auth/session/AuthProvider.js";
import { WeddingParticipation } from "./WeddingParticipation.js";
import { fetchWeddingCampaign } from "./wedding-api.js";
import "../styles/wedding-experience.css";

const WEDDING_REHEARSAL_ENABLED = import.meta.env.DEV;

function remaining(targetIso: string, now: Date) {
  const ms = Math.max(0, Date.parse(targetIso) - now.getTime());
  const total = Math.ceil(ms / 1000);
  return {
    total,
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
  const [rehearsalStartedAt] = useState(() => Date.now());

  useEffect(() => { void fetchWeddingCampaign().then(setCampaign); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 500);
    return () => window.clearInterval(timer);
  }, []);

  const target = WEDDING_REHEARSAL_ENABLED
    ? new Date(rehearsalStartedAt + 60_000).toISOString()
    : campaign.streamAt;
  const left = remaining(target, now);
  const rehearsalReachedLive = WEDDING_REHEARSAL_ENABLED && left.total === 0;
  const productionLive = campaign.streamStatus === "live" && campaign.liveMode !== "test";
  const liveWindowOpen = now.getTime() >= Date.parse(campaign.streamAt);
  const countdownFinished = !WEDDING_REHEARSAL_ENABLED && now.getTime() >= Date.parse(campaign.streamAt);
  const showLiveState = rehearsalReachedLive || productionLive || countdownFinished;
  const concluded = !WEDDING_REHEARSAL_ENABLED && campaign.streamStatus === "ended";
  const finalSeconds = !showLiveState && left.total <= 30;
  const critical = !showLiveState && left.total <= 10;
  const liveHref = auth.status === "authenticated"
    ? campaign.livePath
    : `/login?returnTo=${encodeURIComponent(campaign.livePath)}`;

  return (
    <main className="hamd-wedding-x">
      <section className="hamd-wedding-x__welcome">
        <WeddingInvitationCard campaign={campaign} now={now} />
      </section>

      <section className={`hamd-wedding-x__stage ${finalSeconds ? "is-final" : ""} ${critical ? "is-critical" : ""}`} aria-live="polite">
        {WEDDING_REHEARSAL_ENABLED ? <span className="hamd-wedding-x__rehearsal">REHEARSAL · production time unaffected</span> : null}

        {concluded ? (
          <div className="hamd-wedding-x__state">
            <p className="hamd-wedding-x__kicker">Alhamdulillah</p>
            <h1>The celebration has concluded</h1>
            <p>Thank you for sharing this beautiful moment with us.</p>
            <div className="hamd-wedding-x__actions">
              <Link className="hamd-wedding-x__primary" to="/rowdotul-hamd-26/gallery">View Gallery</Link>
            </div>
          </div>
        ) : showLiveState ? (
          <div className="hamd-wedding-x__state hamd-wedding-x__state--live">
            <span className="hamd-wedding-x__live-pill">● LIVE NOW</span>
            <p className="hamd-wedding-x__kicker">Alhamdulillah · It&apos;s time</p>
            <h1>Rowdotul HAMD&apos;26 is live</h1>
            <p>{rehearsalReachedLive ? "Rehearsal reached zero successfully. This is the same next-state transition guests will see." : "The wedding celebration is streaming now."}</p>
            <div className="hamd-wedding-x__actions">
              <Link className="hamd-wedding-x__primary" to={liveHref}>Enter Live Stream</Link>
              <Link className="hamd-wedding-x__secondary" to="/rowdotul-hamd-26/gallery">View Gallery</Link>
            </div>
          </div>
        ) : finalSeconds ? (
          <div className="hamd-wedding-x__final">
            <p>The wedding begins in</p>
            <strong>{left.total}</strong>
            <span>Moments to our forever</span>
          </div>
        ) : (
          <div className="hamd-wedding-x__state">
            <p className="hamd-wedding-x__kicker">The wedding begins in</p>
            <div className="hamd-wedding-x__countdown" aria-label="Countdown to the celebration">
              {([["days", left.days], ["hours", left.hours], ["minutes", left.minutes], ["seconds", left.seconds]] as const).map(([label, value]) => (
                <div key={label}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>
              ))}
            </div>
            <div className="hamd-wedding-x__actions">
              <a className="hamd-wedding-x__primary" href="#participation">Get Notified</a>
              {(liveWindowOpen || campaign.testBroadcastEligible) ? <Link className="hamd-wedding-x__secondary" to={liveHref}>Open Live Room</Link> : null}
            </div>
          </div>
        )}
      </section>

      <nav className="hamd-wedding-x__quick" aria-label="Wedding navigation">
        <a href="#details">Event Details</a>
        <Link to="/rowdotul-hamd-26/gallery">Gallery</Link>
        <a href="#participation">Guest Messages</a>
        <button type="button" onClick={() => void navigator.share?.({ title: "Rowdotul HAMD'26", url: window.location.href })}>Share</button>
      </nav>

      <section className="hamd-wedding-x__details" id="details">
        <p className="hamd-wedding-x__kicker">Rowdotul HAMD&apos;26</p>
        <h2>Event Details</h2>
        <div className="hamd-wedding-x__detail-grid">
          <article><span>◈</span><strong>Date & time</strong><p>{formatWeddingWhen(campaign.eventAt)}</p></article>
          <article><span>⌖</span><strong>Venue</strong><p>{campaign.venue || "Venue details will be shared by the host."}{campaign.venueAddress ? ` · ${campaign.venueAddress}` : ""}</p></article>
          <article><span>▶</span><strong>Live celebration</strong><p>{formatWeddingWhen(campaign.streamAt)}</p></article>
        </div>
      </section>

      <section className="hamd-wedding-x__gallery-preview">
        <div><p className="hamd-wedding-x__kicker">Memories</p><h2>A gallery made for the moments</h2><p>Photos and videos now have their own dedicated experience instead of crowding the wedding home page.</p></div>
        <Link className="hamd-wedding-x__primary" to="/rowdotul-hamd-26/gallery">Open Wedding Gallery</Link>
      </section>

      <section id="participation" className="hamd-wedding-x__participation"><WeddingParticipation /></section>
    </main>
  );
}
