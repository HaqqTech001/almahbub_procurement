import { useCallback, useEffect, useState } from "react";

/** Request throttling is transient UI state, never a persisted account lock. */
export function useRequestCooldown(label = "Sign-in") {
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!until) return;
    const tick = () => { const time = Date.now(); setNow(time); if (time >= until) setUntil(0); };
    const timer = window.setInterval(tick, 250);
    window.addEventListener("focus", tick);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", tick); };
  }, [until]);
  const start = useCallback((seconds?: number) => {
    const time = Date.now();
    setNow(time);
    // Header-less 429s remain manually retryable; do not invent a server lock.
    setUntil(seconds && Number.isFinite(seconds) && seconds > 0 ? time + Math.ceil(seconds) * 1000 : 0);
  }, []);
  const remainingSeconds = Math.max(0, Math.ceil((until - now) / 1000));
  return { start, remainingSeconds, message: remainingSeconds > 0
    ? `${label} requests from this network are temporarily limited. Try again in ${remainingSeconds} seconds. Your account is not locked by this message.` : null };
}
