import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../styles/launch-countdown.css";

const LAUNCH_AT = new Date("2026-09-24T21:00:00+01:00").getTime();

type Remaining = {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function remaining(now: number): Remaining {
  const total = Math.max(0, LAUNCH_AT - now);
  const secondsTotal = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(secondsTotal / 86400),
    hours: Math.floor((secondsTotal % 86400) / 3600),
    minutes: Math.floor((secondsTotal % 3600) / 60),
    seconds: secondsTotal % 60,
  };
}

function isExcludedPath(pathname: string): boolean {
  if (pathname.startsWith("/app")) return true;
  if (pathname.startsWith("/rowdotul-hamd-26")) return true;
  return /^\/(login|register|forgot-password|reset-password|verify-email|otp|invite|unauthorized|session-expired|account-locked)(\/|$)/.test(
    pathname,
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="hamd-launch__unit">
      <span className="hamd-launch__number">{String(value).padStart(2, "0")}</span>
      <span className="hamd-launch__label">{label}</span>
    </div>
  );
}

export function LaunchCountdownGate() {
  const location = useLocation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Date.now() >= LAUNCH_AT) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const left = useMemo(() => remaining(now), [now]);

  if (left.total <= 0 || isExcludedPath(location.pathname)) return null;

  const totalWindow = 48 * 60 * 60 * 1000;
  const progress = Math.max(0, Math.min(1, 1 - left.total / totalWindow));

  return (
    <div className="hamd-launch" role="dialog" aria-modal="true" aria-labelledby="hamd-launch-title">
      <div className="hamd-launch__aurora hamd-launch__aurora--one" aria-hidden="true" />
      <div className="hamd-launch__aurora hamd-launch__aurora--two" aria-hidden="true" />
      <div className="hamd-launch__grain" aria-hidden="true" />

      <main className="hamd-launch__panel">
        <div className="hamd-launch__brand">
          <span className="hamd-launch__brand-mark" aria-hidden="true">A</span>
          <span>
            <strong>Almahbub International</strong>
            <small>Global Procurement & Integrated Export</small>
          </span>
        </div>

        <p className="hamd-launch__eyebrow">A new chapter goes live</p>
        <h1 id="hamd-launch-title">
          Built for global sourcing.
          <span>Launching very soon.</span>
        </h1>
        <p className="hamd-launch__lead">
          A refined procurement and export experience connecting businesses to
          products, suppliers and Nigerian agricultural supply.
        </p>

        <div className="hamd-launch__countdown" aria-label="Countdown to launch">
          <TimeUnit value={left.days} label="Days" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.hours} label="Hours" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.minutes} label="Minutes" />
          <span className="hamd-launch__separator" aria-hidden="true">:</span>
          <TimeUnit value={left.seconds} label="Seconds" />
        </div>

        <div className="hamd-launch__date">
          <span>24 September 2026</span>
          <span className="hamd-launch__dot" aria-hidden="true" />
          <span>9:00 PM WAT</span>
        </div>

        <div className="hamd-launch__progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <p className="hamd-launch__note">
          The website opens automatically when the countdown reaches zero.
        </p>
      </main>
    </div>
  );
}
