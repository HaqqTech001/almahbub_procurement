import { ModuleSkeleton } from "@hamd/ui/module-layout";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/session/AuthProvider.js";
import { HostAlert } from "../components/HostChrome.js";
import { fetchWeddingParticipation, changeWeddingSubscription, changeWeddingWaiting,
  heartbeatWeddingWaiting, type WeddingParticipationState } from "./wedding-api.js";

export function WeddingParticipation({ onJoinInteraction }: { onJoinInteraction?: () => void } = {}) {
  const auth = useAuth();
  const location = useLocation();
  const [state, setState] = useState<WeddingParticipationState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const revision = useRef(0);
  useEffect(() => {
    if (auth.status !== "authenticated") { setState(null); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchWeddingParticipation().then((row) => { if (!cancelled) setState(row); })
      .catch(() => { if (!cancelled) setError("Wedding preferences are unavailable. You can continue into the wedding and retry here."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth.status, retry]);
  useEffect(() => {
    if (!state?.joined || auth.status !== "authenticated") return;
    let cancelled = false;
    const pulse = () => {
      if (document.visibilityState === "hidden") return;
      const started = revision.current;
      void heartbeatWeddingWaiting().then((row) => {
        if (!cancelled && started === revision.current) setState((previous) => previous ? { ...previous, joined: row.joined } : previous);
      })
        .catch(() => { /* Missed heartbeats expire naturally. */ });
    };
    pulse();
    const timer = window.setInterval(pulse, 30_000);
    document.addEventListener("visibilitychange", pulse);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener("visibilitychange", pulse); };
  }, [state?.joined, auth.status]);
  const change = async (kind: "subscription" | "waiting") => {
    if (!state || busy) return;
    if (kind === "waiting" && !state.joined) onJoinInteraction?.();
    revision.current += 1;
    setBusy(true); setError(null);
    try { setState(await (kind === "subscription"
      ? changeWeddingSubscription(!state.subscribed) : changeWeddingWaiting(!state.joined))); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save. Please try again."); }
    finally { setBusy(false); }
  };
  return <section className="hamd-wedding-page__section hamd-wedding-participation" aria-label="Wedding participation">
    <h2>Be part of Rowdotul HAMD'26</h2>
    {auth.status !== "authenticated" ? <p>
      <Link to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search + location.hash)}`}>Sign in to join the waiting room or subscribe for updates</Link>.
    </p> : <>
      {error ? <HostAlert action={error.includes("Verify your account email") ? <Link to="/verify-email">Verify email</Link> : undefined}>{error}</HostAlert> : null}
      {!state ? (error ? <div><button type="button" onClick={() => setRetry((value) => value + 1)} disabled={loading}>Retry preferences</button><Link className="hamd-btn hamd-btn--secondary" to="/rowdotul-hamd-26">Continue to wedding</Link></div> : <ModuleSkeleton variant="list" count={2} />) : <>
        <p role="status">{state.subscribed ? "You are subscribed to Rowdotul HAMD'26 updates." : "Subscribe for Rowdotul HAMD'26 updates using your verified account email."}</p>
        <button type="button" disabled={busy} onClick={() => void change("subscription")}>{state.subscribed ? "Unsubscribe from updates" : "Subscribe for updates"}</button>
        <p role="status">{state.joined ? "You joined the waiting room." : "Join the waiting room to let the hosts know you are attending."}</p>
        <button type="button" disabled={busy} onClick={() => void change("waiting")}>{state.joined ? "Leave waiting room" : "Join waiting room"}</button>
        <p>Joining the waiting room does not subscribe you to email updates.</p>
      </>}
    </>}
  </section>;
}
